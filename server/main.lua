local QBCore = exports['qb-core']:GetCoreObject()

local function GetJobConfig(src)
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player or not Player.PlayerData or not Player.PlayerData.job then return nil, nil, nil end

    local job = Player.PlayerData.job
    local jobCfg = Config.AuthorizedJobs and Config.AuthorizedJobs[job.name]
    if not jobCfg then return nil, Player, job end

    return jobCfg, Player, job
end

local function BuildPermissions(src)
    local jobCfg, _, job = GetJobConfig(src)
    local permissions = {}
    if not jobCfg then return permissions end

    for key, value in pairs(jobCfg.permissions or {}) do permissions[key] = value end

    local gradeLevel = job and job.grade and (job.grade.level or job.grade.grade or job.grade) or 0
    gradeLevel = tonumber(gradeLevel) or 0
    local gradeCfg = jobCfg.grades and jobCfg.grades[gradeLevel]
    if gradeCfg and gradeCfg.permissions then
        for key, value in pairs(gradeCfg.permissions) do permissions[key] = value end
    end

    return permissions
end

local function HasPermission(src, permission)
    return BuildPermissions(src)[permission] == true
end

local function OfficerName(src)
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return 'Unknown Officer' end
    local c = Player.PlayerData.charinfo or {}
    return ((c.firstname or '') .. ' ' .. (c.lastname or '')):gsub('^%s+', ''):gsub('%s+$', '')
end

local function OfficerCitizenId(src)
    local Player = QBCore.Functions.GetPlayer(src)
    return Player and Player.PlayerData and Player.PlayerData.citizenid or nil
end

local function SafeJson(value)
    if not value then return {} end
    if type(value) == 'table' then return value end
    local ok, decoded = pcall(json.decode, value)
    if ok and decoded then return decoded end
    return {}
end

local function Json(value)
    local ok, encoded = pcall(json.encode, value or {})
    return ok and encoded or '{}'
end

local function TableExists(name)
    local result = MySQL.scalar.await('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?', { name })
    return tonumber(result or 0) > 0
end

local function NormalizeCases(cases)
    for _, case in pairs(cases or {}) do
        case.officers = SafeJson(case.officers)
        case.suspects = SafeJson(case.suspects)
        case.violations = SafeJson(case.violations)
    end
    return cases or {}
end

local function IsCaseOpen(status)
    return status == 'غير منفذة' or status == 'not_executed' or status == 'open'
end

local function BuildCaseRequiredList(cases)
    local list, seen = {}, {}
    for _, case in pairs(cases or {}) do
        if IsCaseOpen(case.status) then
            local suspects = SafeJson(case.suspects)
            for _, suspect in pairs(suspects) do
                local key = suspect.citizenid or suspect.name
                if key and not seen[key] then
                    seen[key] = true
                    list[#list + 1] = {
                        id = 'case_' .. tostring(case.id) .. '_' .. tostring(key),
                        case_id = case.id,
                        citizenid = suspect.citizenid,
                        name = suspect.name or suspect.citizenid or 'Unknown',
                        reason = case.title or 'قضية غير منفذة',
                        danger = 'case',
                        created_by = case.officer_name,
                        created_at = case.created_at,
                        source = 'case',
                        case_status = case.status
                    }
                end
            end
        end
    end
    return list
end

local function AddLog(src, action, description, targetType, targetId, oldData, newData)
    local officerCid = OfficerCitizenId(src)
    local officerName = OfficerName(src)

    if TableExists('aj_mdt_audit_logs') then
        MySQL.insert('INSERT INTO aj_mdt_audit_logs (citizenid, officer_name, action, target_type, target_id, old_data, new_data, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', {
            officerCid,
            officerName,
            action,
            targetType or nil,
            targetId and tostring(targetId) or nil,
            oldData and Json(oldData) or nil,
            newData and Json(newData) or nil,
            description
        })
    end

    if TableExists('aj_mdt_logs') then
        MySQL.insert('INSERT INTO aj_mdt_logs (citizenid, officer_name, action, description) VALUES (?, ?, ?, ?)', {
            officerCid,
            officerName,
            action,
            description
        })
    end
end

local function BuildCitizenRow(v)
    local charinfo = SafeJson(v.charinfo)
    local money = SafeJson(v.money)
    local job = SafeJson(v.job)
    return {
        citizenid = v.citizenid,
        name = ((charinfo.firstname or '') .. ' ' .. (charinfo.lastname or '')),
        phone = charinfo.phone or 'N/A',
        birthdate = charinfo.birthdate or 'N/A',
        nationality = charinfo.nationality or 'N/A',
        bank = money.bank or 0,
        cash = money.cash or 0,
        job = job.label or job.name or 'Unemployed',
        image_url = v.image_url
    }
end

QBCore.Functions.CreateCallback('aj_mdt:getAllData', function(source, cb)
    if not HasPermission(source, 'access') then cb({ error = 'not_allowed' }) return end

    local citizensRaw = MySQL.query.await([[
        SELECT p.citizenid, p.charinfo, p.money, p.job, ci.image_url
        FROM players p
        LEFT JOIN aj_mdt_citizen_images ci ON ci.citizenid = p.citizenid
        ORDER BY p.id DESC
    ]], {}) or {}

    local citizens = {}
    for _, v in pairs(citizensRaw) do citizens[#citizens + 1] = BuildCitizenRow(v) end

    local cases = NormalizeCases(MySQL.query.await('SELECT * FROM aj_mdt_cases ORDER BY id DESC', {}) or {})
    local laws = MySQL.query.await('SELECT * FROM aj_mdt_laws ORDER BY id ASC', {}) or {}
    local logs = {}

    if HasPermission(source, 'view_logs') then
        if TableExists('aj_mdt_audit_logs') then
            logs = MySQL.query.await('SELECT * FROM aj_mdt_audit_logs ORDER BY id DESC LIMIT 100', {}) or {}
        elseif TableExists('aj_mdt_logs') then
            logs = MySQL.query.await('SELECT * FROM aj_mdt_logs ORDER BY id DESC LIMIT 50', {}) or {}
        end
    end

    local vehiclesRaw = MySQL.query.await([[
        SELECT pv.id, pv.citizenid, pv.vehicle, pv.plate, pv.garage, pv.state, p.charinfo, vf.id AS flag_id, vf.owner_name AS flag_owner_name, vf.violation, vf.created_at AS flag_created_at
        FROM player_vehicles pv
        LEFT JOIN players p ON p.citizenid = pv.citizenid
        LEFT JOIN aj_mdt_vehicle_flags vf ON vf.plate = pv.plate
        ORDER BY pv.id DESC
    ]], {}) or {}

    local vehicles = {}
    for _, v in pairs(vehiclesRaw) do
        local charinfo = SafeJson(v.charinfo)
        vehicles[#vehicles + 1] = {
            id = v.id,
            flag_id = v.flag_id,
            citizenid = v.citizenid,
            plate = v.plate,
            vehicle = v.vehicle,
            garage = v.garage,
            state = v.state,
            owner_name = v.flag_owner_name or ((charinfo.firstname or '') .. ' ' .. (charinfo.lastname or '')),
            violation = v.violation or 'لا يوجد',
            is_flagged = v.violation ~= nil,
            flag_created_at = v.flag_created_at
        }
    end

    cb({ citizens = citizens, cases = cases, wanted = BuildCaseRequiredList(cases), vehicles = vehicles, laws = laws, logs = logs, permissions = BuildPermissions(source) })
end)

QBCore.Functions.CreateCallback('aj_mdt:getCitizenProfile', function(source, cb, citizenid)
    if not HasPermission(source, 'access') then cb({ error = 'not_allowed' }) return end
    if not citizenid then cb({ error = 'missing_citizenid' }) return end

    local player = MySQL.single.await([[
        SELECT p.citizenid, p.charinfo, p.money, p.job, p.metadata, ci.image_url
        FROM players p
        LEFT JOIN aj_mdt_citizen_images ci ON ci.citizenid = p.citizenid
        WHERE p.citizenid = ?
        LIMIT 1
    ]], { citizenid })
    if not player then cb({ error = 'not_found' }) return end

    local charinfo = SafeJson(player.charinfo)
    local money = SafeJson(player.money)
    local job = SafeJson(player.job)
    local metadata = SafeJson(player.metadata)
    local fullName = ((charinfo.firstname or '') .. ' ' .. (charinfo.lastname or ''))

    local vehicles = MySQL.query.await('SELECT id, vehicle, plate, garage, state FROM player_vehicles WHERE citizenid = ? ORDER BY id DESC', { citizenid }) or {}
    local cases = NormalizeCases(MySQL.query.await('SELECT * FROM aj_mdt_cases WHERE citizenid = ? OR citizen_name LIKE ? OR suspects LIKE ? ORDER BY id DESC', { citizenid, '%' .. fullName .. '%', '%' .. citizenid .. '%' }) or {})

    local properties = {}
    if TableExists('player_houses') then
        properties = MySQL.query.await('SELECT * FROM player_houses WHERE citizenid = ? OR identifier = ?', { citizenid, citizenid }) or {}
    elseif TableExists('apartments') then
        properties = MySQL.query.await('SELECT * FROM apartments WHERE citizenid = ?', { citizenid }) or {}
    end

    cb({
        citizen = {
            citizenid = citizenid,
            name = fullName,
            firstname = charinfo.firstname or '',
            lastname = charinfo.lastname or '',
            phone = charinfo.phone or 'N/A',
            birthdate = charinfo.birthdate or 'N/A',
            gender = charinfo.gender or 'N/A',
            nationality = charinfo.nationality or 'N/A',
            bank = money.bank or 0,
            cash = money.cash or 0,
            crypto = money.crypto or 0,
            job = job.label or job.name or 'Unemployed',
            grade = job.grade and (job.grade.name or job.grade.level) or 'N/A',
            image_url = player.image_url,
            metadata = metadata
        },
        vehicles = vehicles,
        properties = properties,
        cases = cases,
        wanted = BuildCaseRequiredList(cases),
        permissions = BuildPermissions(source)
    })
end)

QBCore.Functions.CreateCallback('aj_mdt:smartSearchPeople', function(source, cb, query, onlyPolice)
    if not HasPermission(source, 'access') then cb({}) return end
    query = tostring(query or '')
    if #query < 1 then cb({}) return end

    local result = MySQL.query.await('SELECT citizenid, charinfo, job FROM players WHERE citizenid LIKE ? OR charinfo LIKE ? LIMIT 12', { '%' .. query .. '%', '%' .. query .. '%' }) or {}
    local data = {}
    for _, v in pairs(result) do
        local charinfo = SafeJson(v.charinfo)
        local job = SafeJson(v.job)
        if (not onlyPolice) or (job and Config.PoliceJobs[job.name]) then
            data[#data + 1] = { citizenid = v.citizenid, name = (charinfo.firstname or '') .. ' ' .. (charinfo.lastname or ''), phone = charinfo.phone or 'N/A', job = job.label or job.name or 'Unemployed' }
        end
    end
    cb(data)
end)

QBCore.Functions.CreateCallback('aj_mdt:getLawsByType', function(source, cb, caseType)
    if not HasPermission(source, 'access') then cb({}) return end
    local result = MySQL.query.await('SELECT * FROM aj_mdt_laws WHERE type = ? OR ? = "all" ORDER BY id ASC', { caseType or 'مخالفة', caseType or 'all' }) or {}
    cb(result)
end)

RegisterNetEvent('aj_mdt:addCase', function(data)
    local src = source
    if not HasPermission(src, 'create_case') then return end
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    local suspects = data.suspects or {}
    local mainSuspect = suspects[1] or {}
    local insertData = {
        title = data.title or 'Untitled Case',
        citizenid = mainSuspect.citizenid or data.citizenid or nil,
        citizen_name = mainSuspect.name or data.citizen or nil,
        officer_citizenid = Player.PlayerData.citizenid,
        officer_name = OfficerName(src),
        status = data.status or 'غير منفذة',
        case_type = data.caseType or 'قضية',
        content = data.content or '',
        description = data.extra or data.description or '',
        officers = data.officers or {},
        suspects = data.suspects or {},
        violations = data.violations or {},
        action_taken = data.action or nil,
        extra_details = data.extra or nil
    }
    local id = MySQL.insert.await([[
        INSERT INTO aj_mdt_cases (title, citizenid, citizen_name, officer_citizenid, officer_name, status, case_type, content, description, officers, suspects, violations, action_taken, extra_details)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ]], { insertData.title, insertData.citizenid, insertData.citizen_name, insertData.officer_citizenid, insertData.officer_name, insertData.status, insertData.case_type, insertData.content, insertData.description, Json(insertData.officers), Json(insertData.suspects), Json(insertData.violations), insertData.action_taken, insertData.extra_details })
    AddLog(src, 'create_case', 'Created case: ' .. tostring(insertData.title), 'case', id, nil, insertData)
end)

RegisterNetEvent('aj_mdt:updateCase', function(data)
    local src = source
    if not HasPermission(src, 'edit_case') then return end
    if not data or not data.id then return end
    local old = MySQL.single.await('SELECT * FROM aj_mdt_cases WHERE id = ? LIMIT 1', { data.id })
    local suspects = data.suspects or {}
    local mainSuspect = suspects[1] or {}
    local newData = {
        title = data.title or 'Untitled Case',
        citizenid = mainSuspect.citizenid or data.citizenid or nil,
        citizen_name = mainSuspect.name or data.citizen or nil,
        status = data.status or 'غير منفذة',
        case_type = data.caseType or 'قضية',
        content = data.content or '',
        description = data.extra or data.description or '',
        officers = data.officers or {},
        suspects = data.suspects or {},
        violations = data.violations or {},
        action_taken = data.action or nil,
        extra_details = data.extra or nil
    }
    MySQL.update([[UPDATE aj_mdt_cases SET title = ?, citizenid = ?, citizen_name = ?, status = ?, case_type = ?, content = ?, description = ?, officers = ?, suspects = ?, violations = ?, action_taken = ?, extra_details = ? WHERE id = ?]], {
        newData.title, newData.citizenid, newData.citizen_name, newData.status, newData.case_type, newData.content, newData.description, Json(newData.officers), Json(newData.suspects), Json(newData.violations), newData.action_taken, newData.extra_details, data.id
    })
    AddLog(src, 'edit_case', 'Edited case #' .. tostring(data.id), 'case', data.id, old, newData)
end)

RegisterNetEvent('aj_mdt:executeCase', function(caseId)
    local src = source
    if not HasPermission(src, 'execute_case') then return end
    local old = MySQL.single.await('SELECT * FROM aj_mdt_cases WHERE id = ? LIMIT 1', { caseId })
    MySQL.update('UPDATE aj_mdt_cases SET status = ? WHERE id = ?', { 'منفذة', caseId })
    AddLog(src, 'execute_case', 'Executed case #' .. tostring(caseId), 'case', caseId, old, { status = 'منفذة' })
end)

RegisterNetEvent('aj_mdt:deleteCase', function(caseId)
    local src = source
    if not HasPermission(src, 'delete_case') then return end
    local old = MySQL.single.await('SELECT * FROM aj_mdt_cases WHERE id = ? LIMIT 1', { caseId })
    MySQL.query('DELETE FROM aj_mdt_cases WHERE id = ?', { caseId })
    AddLog(src, 'delete_case', 'Deleted case #' .. tostring(caseId), 'case', caseId, old, nil)
end)

RegisterNetEvent('aj_mdt:addWanted', function(_) return end)
RegisterNetEvent('aj_mdt:deleteWanted', function(_) return end)

RegisterNetEvent('aj_mdt:addVehicle', function(data)
    local src = source
    if not HasPermission(src, 'flag_vehicle') then return end
    local plate = tostring(data.plate or '-')
    local old = MySQL.single.await('SELECT * FROM aj_mdt_vehicle_flags WHERE plate = ? LIMIT 1', { plate })
    local newData = { plate = plate, owner_name = data.owner or nil, violation = data.violation or '-', created_by = OfficerName(src) }
    if old then
        MySQL.update('UPDATE aj_mdt_vehicle_flags SET owner_name = ?, violation = ?, created_by = ? WHERE plate = ?', { newData.owner_name, newData.violation, newData.created_by, plate })
    else
        MySQL.insert('INSERT INTO aj_mdt_vehicle_flags (plate, owner_citizenid, owner_name, violation, created_by) VALUES (?, ?, ?, ?, ?)', { plate, data.citizenid or nil, newData.owner_name, newData.violation, newData.created_by })
    end
    AddLog(src, 'flag_vehicle', 'Flagged vehicle: ' .. plate, 'vehicle', plate, old, newData)
end)

RegisterNetEvent('aj_mdt:updateVehicleFlag', function(data)
    local src = source
    if not HasPermission(src, 'flag_vehicle') then return end
    if not data or not data.plate then return end
    local old = MySQL.single.await('SELECT * FROM aj_mdt_vehicle_flags WHERE plate = ? LIMIT 1', { data.plate })
    local newData = { owner_name = data.owner or nil, violation = data.violation or '-', created_by = OfficerName(src), plate = data.plate }
    MySQL.update('UPDATE aj_mdt_vehicle_flags SET owner_name = ?, violation = ?, created_by = ? WHERE plate = ?', { newData.owner_name, newData.violation, newData.created_by, data.plate })
    AddLog(src, 'edit_vehicle_flag', 'Edited vehicle flag: ' .. tostring(data.plate), 'vehicle', data.plate, old, newData)
end)

RegisterNetEvent('aj_mdt:deleteVehicleFlag', function(plate)
    local src = source
    if not HasPermission(src, 'flag_vehicle') then return end
    if not plate then return end
    local old = MySQL.single.await('SELECT * FROM aj_mdt_vehicle_flags WHERE plate = ? LIMIT 1', { plate })
    MySQL.query('DELETE FROM aj_mdt_vehicle_flags WHERE plate = ?', { plate })
    AddLog(src, 'delete_vehicle_flag', 'Deleted vehicle flag: ' .. tostring(plate), 'vehicle', plate, old, nil)
end)

RegisterNetEvent('aj_mdt:saveCitizenImage', function(data)
    local src = source
    if not HasPermission(src, 'edit_profile') then return end
    if not data or not data.citizenid or not data.imageUrl then return end
    local old = MySQL.single.await('SELECT * FROM aj_mdt_citizen_images WHERE citizenid = ? LIMIT 1', { data.citizenid })
    MySQL.insert([[INSERT INTO aj_mdt_citizen_images (citizenid, image_url, updated_by) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE image_url = VALUES(image_url), updated_by = VALUES(updated_by)]], {
        data.citizenid,
        data.imageUrl,
        OfficerName(src)
    })
    AddLog(src, 'save_citizen_image', 'Saved citizen image: ' .. tostring(data.citizenid), 'citizen', data.citizenid, old, { citizenid = data.citizenid, image_url = data.imageUrl })
end)
