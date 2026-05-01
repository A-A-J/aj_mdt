-- ADD SMART SEARCH + CASE SAVE

QBCore.Functions.CreateCallback('aj_mdt:smartSearchPeople', function(source, cb, query, onlyPolice)
    local result = MySQL.query.await('SELECT citizenid, charinfo, job FROM players WHERE citizenid LIKE ? OR charinfo LIKE ? LIMIT 10', {
        '%'..query..'%', '%'..query..'%'
    })

    local data = {}
    for _, v in pairs(result) do
        local c = json.decode(v.charinfo)
        local job = json.decode(v.job)

        if (not onlyPolice) or (job and Config.PoliceJobs[job.name]) then
            table.insert(data, {
                citizenid = v.citizenid,
                name = c.firstname .. ' ' .. c.lastname
            })
        end
    end

    cb(data)
end)

QBCore.Functions.CreateCallback('aj_mdt:getLawsByType', function(source, cb, caseType)
    local result = MySQL.query.await('SELECT * FROM aj_mdt_laws WHERE type = ?', { caseType })
    cb(result)
end)

RegisterNetEvent('aj_mdt:addCase', function(data)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)

    MySQL.insert('INSERT INTO aj_mdt_cases (title, content, case_type, status, officers, suspects, violations, action_taken, extra_details, officer_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', {
        data.title,
        data.content,
        data.caseType,
        data.status,
        json.encode(data.officers),
        json.encode(data.suspects),
        json.encode(data.violations),
        data.action,
        data.extra,
        Player.PlayerData.charinfo.firstname .. ' ' .. Player.PlayerData.charinfo.lastname
    })
end)
