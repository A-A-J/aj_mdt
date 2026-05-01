local QBCore = exports['qb-core']:GetCoreObject()

local function IsPolice(src)
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player or not Player.PlayerData or not Player.PlayerData.job then return false end
    return Config.PoliceJobs[Player.PlayerData.job.name] == true
end

local function OfficerName(src)
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return 'Unknown Officer' end
    local c = Player.PlayerData.charinfo
    return (c.firstname or '') .. ' ' .. (c.lastname or '')
end

local function SafeJson(value)
    if not value then return {} end
    local ok, decoded = pcall(json.decode, value)
    if ok and decoded then return decoded end
    return {}
end

QBCore.Functions.CreateCallback('aj_mdt:getAllData', function(source, cb)
    if not IsPolice(source) then cb({ error = 'not_allowed' }) return end

    local citizensRaw = MySQL.query.await('SELECT citizenid, charinfo, money, job FROM players ORDER BY id DESC', {})
    local citizens = {}

    for _, v in pairs(citizensRaw or {}) do
        local charinfo = SafeJson(v.charinfo)
        local money = SafeJson(v.money)
        local job = SafeJson(v.job)
        table.insert(citizens, {
            citizenid = v.citizenid,
            name = ((charinfo.firstname or '') .. ' ' .. (charinfo.lastname or '')),
            phone = charinfo.phone or 'N/A',
            birthdate = charinfo.birthdate or 'N/A',
            nationality = charinfo.nationality or 'N/A',
            bank = money.bank or 0,
            cash = money.cash or 0,
            job = job.label or job.name or 'Unemployed'
        })
    end

    local cases = MySQL.query.await('SELECT * FROM aj_mdt_cases ORDER BY id DESC', {}) or {}
    local wanted = MySQL.query.await('SELECT * FROM aj_mdt_wanted ORDER BY id DESC', {}) or {}
    local laws = MySQL.query.await('SELECT * FROM aj_mdt_laws ORDER BY id ASC', {}) or {}

    local vehiclesRaw = MySQL.query.await([[
        SELECT pv.id, pv.citizenid, pv.vehicle, pv.plate, pv.garage, pv.state, p.charinfo, vf.violation, vf.created_at AS flag_created_at
        FROM player_vehicles pv
        LEFT JOIN players p ON p.citizenid = pv.citizenid
        LEFT JOIN aj_mdt_vehicle_flags vf ON vf.plate = pv.plate
        ORDER BY pv.id DESC
    ]], {}) or {}

    local vehicles = {}
    for _, v in pairs(vehiclesRaw) do
        local charinfo = SafeJson(v.charinfo)
        table.insert(vehicles, {
            id = v.id,
            citizenid = v.citizenid,
            plate = v.plate,
            vehicle = v.vehicle,
            garage = v.garage,
            state = v.state,
            owner_name = ((charinfo.firstname or '') .. ' ' .. (charinfo.lastname or '')),
            violation = v.violation or 'لا يوجد',
            is_flagged = v.violation ~= nil,
            flag_created_at = v.flag_created_at
        })
    end

    cb({ citizens = citizens, cases = cases, wanted = wanted, vehicles = vehicles, laws = laws })
end)

RegisterNetEvent('aj_mdt:addCase', function(data)
    local src = source
    if not IsPolice(src) then return end
    MySQL.insert('INSERT INTO aj_mdt_cases (title, citizenid, citizen_name, officer_citizenid, officer_name, status, description) VALUES (?, ?, ?, ?, ?, ?, ?)', {
        data.title or 'Untitled Case', data.citizenid or nil, data.citizen or nil,
        QBCore.Functions.GetPlayer(src).PlayerData.citizenid, OfficerName(src), 'open', data.description or nil
    })
end)

RegisterNetEvent('aj_mdt:addWanted', function(data)
    local src = source
    if not IsPolice(src) then return end
    MySQL.insert('INSERT INTO aj_mdt_wanted (citizenid, name, reason, danger, created_by) VALUES (?, ?, ?, ?, ?)', {
        data.citizenid or nil, data.name or 'Unknown', data.reason or '-', data.danger or 'medium', OfficerName(src)
    })
end)

RegisterNetEvent('aj_mdt:addVehicle', function(data)
    local src = source
    if not IsPolice(src) then return end
    MySQL.insert('INSERT INTO aj_mdt_vehicle_flags (plate, owner_citizenid, owner_name, violation, created_by) VALUES (?, ?, ?, ?, ?)', {
        data.plate or '-', data.citizenid or nil, data.owner or nil, data.violation or '-', OfficerName(src)
    })
end)
