local QBCore = exports['qb-core']:GetCoreObject()

local function OfficerName(src)
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return 'Unknown' end
    local c = Player.PlayerData.charinfo or {}
    return ((c.firstname or '') .. ' ' .. (c.lastname or '')):gsub('^%s+', ''):gsub('%s+$', '')
end

local function HasPermission(src)
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player or not Player.PlayerData or not Player.PlayerData.job then return false end

    local job = Player.PlayerData.job
    local jobCfg = Config.AuthorizedJobs and Config.AuthorizedJobs[job.name]
    if not jobCfg then return false end

    local permissions = {}
    for key, value in pairs(jobCfg.permissions or {}) do permissions[key] = value end

    local gradeLevel = job.grade and (job.grade.level or job.grade.grade or job.grade) or 0
    gradeLevel = tonumber(gradeLevel) or 0
    local gradeCfg = jobCfg.grades and jobCfg.grades[gradeLevel]
    if gradeCfg and gradeCfg.permissions then
        for key, value in pairs(gradeCfg.permissions) do permissions[key] = value end
    end

    return permissions.manage_laws == true
end

local function ValidLaw(data)
    if type(data) ~= 'table' then return false end
    if not data.title_ar or tostring(data.title_ar) == '' then return false end
    if data.type ~= 'قضية' and data.type ~= 'مخالفة' then return false end
    return true
end

RegisterNetEvent('aj_mdt:addLaw', function(data)
    local src = source
    if not HasPermission(src) or not ValidLaw(data) then return end
    MySQL.insert('INSERT INTO aj_mdt_laws (title_ar,title_en,type,fine,jail,created_by) VALUES (?,?,?,?,?,?)', {
        tostring(data.title_ar), tostring(data.title_en or ''), data.type, tonumber(data.fine) or 0, tonumber(data.jail) or 0, OfficerName(src)
    })
end)

RegisterNetEvent('aj_mdt:updateLaw', function(data)
    local src = source
    if not HasPermission(src) or not ValidLaw(data) or not data.id then return end
    MySQL.update('UPDATE aj_mdt_laws SET title_ar=?, title_en=?, type=?, fine=?, jail=?, updated_by=? WHERE id=?', {
        tostring(data.title_ar), tostring(data.title_en or ''), data.type, tonumber(data.fine) or 0, tonumber(data.jail) or 0, OfficerName(src), tonumber(data.id)
    })
end)

RegisterNetEvent('aj_mdt:deleteLaw', function(id)
    local src = source
    if not HasPermission(src) or not id then return end
    MySQL.query('DELETE FROM aj_mdt_laws WHERE id = ?', { tonumber(id) })
end)
