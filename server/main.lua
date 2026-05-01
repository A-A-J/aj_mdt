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

-- Vehicles from QBCore player_vehicles + MDT flags
QBCore.Functions.CreateCallback('aj_mdt:getVehicles', function(source, cb)
    local result = MySQL.query.await([[
        SELECT
            pv.id,
            pv.citizenid,
            pv.vehicle,
            pv.plate,
            pv.garage,
            pv.state,
            p.charinfo,
            vf.violation,
            vf.created_at AS flag_created_at
        FROM player_vehicles pv
        LEFT JOIN players p ON p.citizenid = pv.citizenid
        LEFT JOIN aj_mdt_vehicle_flags vf ON vf.plate = pv.plate
        ORDER BY pv.id DESC
    ]], {})

    local data = {}

    for _, v in pairs(result) do
        local ownerName = 'Unknown'

        if v.charinfo then
            local ok, charinfo = pcall(json.decode, v.charinfo)
            if ok and charinfo then
                ownerName = (charinfo.firstname or '') .. ' ' .. (charinfo.lastname or '')
            end
        end

        table.insert(data, {
            id = v.id,
            citizenid = v.citizenid,
            plate = v.plate,
            vehicle = v.vehicle,
            garage = v.garage,
            state = v.state,
            owner_name = ownerName,
            violation = v.violation or 'لا يوجد',
            is_flagged = v.violation ~= nil,
            flag_created_at = v.flag_created_at
        })
    end

    cb(data)
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
