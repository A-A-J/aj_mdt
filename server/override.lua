local QBCore = exports['qb-core']:GetCoreObject()

-- EXECUTE CASE EVENT
RegisterNetEvent('aj_mdt:executeCase', function(caseId)
    local src = source

    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end

    local job = Player.PlayerData.job.name
    local cfg = Config.AuthorizedJobs[job]

    if not cfg or not cfg.permissions or not cfg.permissions.execute_case then
        return
    end

    MySQL.update('UPDATE aj_mdt_cases SET status = ? WHERE id = ?', {
        'منفذة', caseId
    })

    MySQL.insert('INSERT INTO aj_mdt_logs (citizenid, officer_name, action, description) VALUES (?, ?, ?, ?)', {
        Player.PlayerData.citizenid,
        (Player.PlayerData.charinfo.firstname .. ' ' .. Player.PlayerData.charinfo.lastname),
        'execute_case',
        'Executed case #' .. caseId
    })
end)
