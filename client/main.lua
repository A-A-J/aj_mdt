local QBCore = exports['qb-core']:GetCoreObject()

local function IsPolice()
    local Player = QBCore.Functions.GetPlayerData()
    return Player and Player.job and Config.PoliceJobs[Player.job.name]
end

RegisterCommand('mdt', function()
    if IsPolice() then
        SetNuiFocus(true, true)
        SendNUIMessage({ action = 'open' })
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

RegisterNUICallback('addCase', function(data, cb)
    TriggerServerEvent('aj_mdt:addCase', data)
    Wait(250)
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
