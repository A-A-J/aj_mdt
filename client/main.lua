local QBCore = exports['qb-core']:GetCoreObject()

local function HasPermission()
    local Player = QBCore.Functions.GetPlayerData()
    if not Player or not Player.job then return false end

    local job = Player.job.name
    local cfg = Config.AuthorizedJobs[job]

    return cfg and cfg.permissions and cfg.permissions.access
end

RegisterCommand('mdt', function()
    if HasPermission() then
        SetNuiFocus(true, true)
        SendNUIMessage({
            action = 'open',
            config = {
                locale = Config.Locale
            }
        })
    end
end)

RegisterNUICallback('close', function(_, cb)
    SetNuiFocus(false, false)
    cb({ ok = true })
end)

RegisterNUICallback('getData', function(_, cb)
    QBCore.Functions.TriggerCallback('aj_mdt:getAllData', function(data)
        cb(data)
    end)
end)

RegisterNUICallback('getCitizenProfile', function(data, cb)
    QBCore.Functions.TriggerCallback('aj_mdt:getCitizenProfile', function(result)
        cb(result)
    end, data.citizenid)
end)

RegisterNUICallback('smartSearchPeople', function(data, cb)
    QBCore.Functions.TriggerCallback('aj_mdt:smartSearchPeople', function(result)
        cb(result)
    end, data.query, data.onlyPolice)
end)

RegisterNUICallback('getLawsByType', function(data, cb)
    QBCore.Functions.TriggerCallback('aj_mdt:getLawsByType', function(result)
        cb(result)
    end, data.caseType)
end)

RegisterNUICallback('addCase', function(data, cb)
    TriggerServerEvent('aj_mdt:addCase', data)
    Wait(350)
    QBCore.Functions.TriggerCallback('aj_mdt:getAllData', function(result)
        cb(result)
    end)
end)

RegisterNUICallback('addWanted', function(data, cb)
    TriggerServerEvent('aj_mdt:addWanted', data)
    Wait(250)
    QBCore.Functions.TriggerCallback('aj_mdt:getAllData', function(result)
        cb(result)
    end)
end)

RegisterNUICallback('addVehicleFlag', function(data, cb)
    TriggerServerEvent('aj_mdt:addVehicle', data)
    Wait(250)
    QBCore.Functions.TriggerCallback('aj_mdt:getAllData', function(result)
        cb(result)
    end)
end)
