local QBCore = exports['qb-core']:GetCoreObject()

-- Citizens from QBCore
QBCore.Functions.CreateCallback('aj_mdt:getCitizens', function(source, cb)
    local result = MySQL.query.await('SELECT citizenid, charinfo FROM players', {})
    local data = {}

    for _, v in pairs(result) do
        local charinfo = json.decode(v.charinfo)
        table.insert(data, {
            citizenid = v.citizenid,
            name = charinfo.firstname .. ' ' .. charinfo.lastname,
            phone = charinfo.phone or 'N/A'
        })
    end

    cb(data)
end)

-- Cases
QBCore.Functions.CreateCallback('aj_mdt:getCases', function(source, cb)
    local result = MySQL.query.await('SELECT * FROM aj_mdt_cases ORDER BY id DESC', {})
    cb(result)
end)

RegisterNetEvent('aj_mdt:addCase', function(data)
    local Player = QBCore.Functions.GetPlayer(source)

    MySQL.insert('INSERT INTO aj_mdt_cases (title, citizen_name, officer_name, status) VALUES (?, ?, ?, ?)', {
        data.title,
        data.citizen,
        Player.PlayerData.charinfo.firstname .. ' ' .. Player.PlayerData.charinfo.lastname,
        'open'
    })
end)

-- Wanted
QBCore.Functions.CreateCallback('aj_mdt:getWanted', function(source, cb)
    local result = MySQL.query.await('SELECT * FROM aj_mdt_wanted ORDER BY id DESC', {})
    cb(result)
end)

RegisterNetEvent('aj_mdt:addWanted', function(data)
    local Player = QBCore.Functions.GetPlayer(source)

    MySQL.insert('INSERT INTO aj_mdt_wanted (name, reason, created_by) VALUES (?, ?, ?)', {
        data.name,
        data.reason,
        Player.PlayerData.charinfo.firstname .. ' ' .. Player.PlayerData.charinfo.lastname
    })
end)

-- Vehicles
QBCore.Functions.CreateCallback('aj_mdt:getVehicles', function(source, cb)
    local result = MySQL.query.await('SELECT * FROM aj_mdt_vehicle_flags ORDER BY id DESC', {})
    cb(result)
end)

RegisterNetEvent('aj_mdt:addVehicle', function(data)
    local Player = QBCore.Functions.GetPlayer(source)

    MySQL.insert('INSERT INTO aj_mdt_vehicle_flags (plate, owner_name, violation, created_by) VALUES (?, ?, ?, ?)', {
        data.plate,
        data.owner,
        data.violation,
        Player.PlayerData.charinfo.firstname .. ' ' .. Player.PlayerData.charinfo.lastname
    })
end)
