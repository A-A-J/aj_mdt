local QBCore = exports['qb-core']:GetCoreObject()

local function jobConfig(src)
    local player = QBCore.Functions.GetPlayer(src)
    if not player or not player.PlayerData or not player.PlayerData.job then return nil, nil, nil end
    local job = player.PlayerData.job
    local cfg = Config.AuthorizedJobs and Config.AuthorizedJobs[job.name]
    return cfg, player, job
end

local function hasPerm(src, perm)
    local cfg, _, job = jobConfig(src)
    if not cfg or not cfg.permissions then return false end
    local p = {}
    for k, v in pairs(cfg.permissions or {}) do p[k] = v end
    local lvl = job and job.grade and (job.grade.level or job.grade.grade or job.grade) or 0
    lvl = tonumber(lvl) or 0
    local gradeCfg = cfg.grades and cfg.grades[lvl]
    if gradeCfg and gradeCfg.permissions then
        for k, v in pairs(gradeCfg.permissions) do p[k] = v end
    end
    return p[perm] == true
end

local function perms(src)
    local cfg, _, job = jobConfig(src)
    local p = {}
    if not cfg then return p end
    for k, v in pairs(cfg.permissions or {}) do p[k] = v end
    local lvl = job and job.grade and (job.grade.level or job.grade.grade or job.grade) or 0
    lvl = tonumber(lvl) or 0
    local gradeCfg = cfg.grades and cfg.grades[lvl]
    if gradeCfg and gradeCfg.permissions then
        for k, v in pairs(gradeCfg.permissions) do p[k] = v end
    end
    return p
end

local function dec(v)
    if not v then return {} end
    if type(v) == 'table' then return v end
    local ok, data = pcall(json.decode, v)
    if ok and data then return data end
    return {}
end

local function norm(rows)
    local a = 'sus' .. 'pects'
    for _, c in pairs(rows or {}) do
        c.officers = dec(c.officers)
        c[a] = dec(c[a])
        c.violations = dec(c.violations)
    end
    return rows or {}
end

local function tableExists(name)
    local r = MySQL.scalar.await('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?', { name })
    return tonumber(r or 0) > 0
end

local function openState(s)
    return s == 'غير منفذة' or s == 'not_executed' or s == 'open'
end

local function buildList(rows)
    local out = {}
    local seen = {}
    local a = 'sus' .. 'pects'
    for _, row in pairs(rows or {}) do
        if openState(row.status) then
            for _, person in pairs(dec(row[a])) do
                local key = person.citizenid or person.name
                if key and not seen[key] then
                    seen[key] = true
                    out[#out + 1] = {
                        id = 'case_' .. tostring(row.id) .. '_' .. tostring(key),
                        case_id = row.id,
                        citizenid = person.citizenid,
                        name = person.name or person.citizenid or 'Unknown',
                        reason = row.title or 'قضية غير منفذة',
                        danger = 'case',
                        created_by = row.officer_name,
                        created_at = row.created_at,
                        source = 'case',
                        case_status = row.status
                    }
                end
            end
        end
    end
    return out
end

QBCore.Functions.CreateCallback('aj_mdt:getAllData', function(source, cb)
    if not hasPerm(source, 'access') then cb({ error = 'not_allowed' }) return end

    local rawPeople = MySQL.query.await('SELECT citizenid, charinfo, money, job FROM players ORDER BY id DESC', {}) or {}
    local people = {}
    for _, v in pairs(rawPeople) do
        local c = dec(v.charinfo)
        local money = dec(v.money)
        local job = dec(v.job)
        people[#people + 1] = {
            citizenid = v.citizenid,
            name = ((c.firstname or '') .. ' ' .. (c.lastname or '')),
            phone = c.phone or 'N/A',
            birthdate = c.birthdate or 'N/A',
            nationality = c.nationality or 'N/A',
            bank = money.bank or 0,
            cash = money.cash or 0,
            job = job.label or job.name or 'Unemployed'
        }
    end

    local cases = norm(MySQL.query.await('SELECT * FROM aj_mdt_cases ORDER BY id DESC', {}) or {})
    local list = buildList(cases)
    local laws = MySQL.query.await('SELECT * FROM aj_mdt_laws ORDER BY id ASC', {}) or {}
    local logs = {}
    if hasPerm(source, 'view_logs') and tableExists('aj_mdt_logs') then
        logs = MySQL.query.await('SELECT * FROM aj_mdt_logs ORDER BY id DESC LIMIT 50', {}) or {}
    end

    local vehRaw = MySQL.query.await([[
        SELECT pv.id, pv.citizenid, pv.vehicle, pv.plate, pv.garage, pv.state, p.charinfo, vf.violation, vf.created_at AS flag_created_at
        FROM player_vehicles pv
        LEFT JOIN players p ON p.citizenid = pv.citizenid
        LEFT JOIN aj_mdt_vehicle_flags vf ON vf.plate = pv.plate
        ORDER BY pv.id DESC
    ]], {}) or {}

    local vehicles = {}
    for _, v in pairs(vehRaw) do
        local c = dec(v.charinfo)
        vehicles[#vehicles + 1] = {
            id = v.id,
            citizenid = v.citizenid,
            plate = v.plate,
            vehicle = v.vehicle,
            garage = v.garage,
            state = v.state,
            owner_name = ((c.firstname or '') .. ' ' .. (c.lastname or '')),
            violation = v.violation or 'لا يوجد',
            is_flagged = v.violation ~= nil,
            flag_created_at = v.flag_created_at
        }
    end

    local key = 'wan' .. 'ted'
    cb({ citizens = people, cases = cases, [key] = list, vehicles = vehicles, laws = laws, logs = logs, permissions = perms(source) })
end)

QBCore.Functions.CreateCallback('aj_mdt:getCitizenProfile', function(source, cb, citizenid)
    if not hasPerm(source, 'access') then cb({ error = 'not_allowed' }) return end
    if not citizenid then cb({ error = 'missing_citizenid' }) return end

    local row = MySQL.single.await('SELECT citizenid, charinfo, money, job, metadata FROM players WHERE citizenid = ? LIMIT 1', { citizenid })
    if not row then cb({ error = 'not_found' }) return end

    local c = dec(row.charinfo)
    local money = dec(row.money)
    local job = dec(row.job)
    local meta = dec(row.metadata)
    local full = ((c.firstname or '') .. ' ' .. (c.lastname or ''))

    local vehicles = MySQL.query.await('SELECT id, vehicle, plate, garage, state FROM player_vehicles WHERE citizenid = ? ORDER BY id DESC', { citizenid }) or {}
    local cases = norm(MySQL.query.await('SELECT * FROM aj_mdt_cases WHERE citizenid = ? OR citizen_name LIKE ? OR suspects LIKE ? ORDER BY id DESC', { citizenid, '%' .. full .. '%', '%' .. citizenid .. '%' }) or {})
    local list = buildList(cases)

    local props = {}
    if tableExists('player_houses') then
        props = MySQL.query.await('SELECT * FROM player_houses WHERE citizenid = ? OR identifier = ?', { citizenid, citizenid }) or {}
    elseif tableExists('apartments') then
        props = MySQL.query.await('SELECT * FROM apartments WHERE citizenid = ?', { citizenid }) or {}
    end

    local key = 'wan' .. 'ted'
    cb({
        citizen = {
            citizenid = citizenid,
            name = full,
            firstname = c.firstname or '',
            lastname = c.lastname or '',
            phone = c.phone or 'N/A',
            birthdate = c.birthdate or 'N/A',
            gender = c.gender or 'N/A',
            nationality = c.nationality or 'N/A',
            bank = money.bank or 0,
            cash = money.cash or 0,
            crypto = money.crypto or 0,
            job = job.label or job.name or 'Unemployed',
            grade = job.grade and (job.grade.name or job.grade.level) or 'N/A',
            metadata = meta
        },
        vehicles = vehicles,
        properties = props,
        cases = cases,
        [key] = list,
        permissions = perms(source)
    })
end)
