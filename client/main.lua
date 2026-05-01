local QBCore = exports['qb-core']:GetCoreObject()

local function HasPermission()
    local Player = QBCore.Functions.GetPlayerData()
    if not Player or not Player.job then return false end

    local job = Player.job.name
    local cfg = Config.AuthorizedJobs[job]

    return cfg and cfg.permissions and cfg.permissions.access
end

local function CloseMdt()
    SetNuiFocus(false, false)
    SetNuiFocusKeepInput(false)
    SendNUIMessage({ action = 'forceClose' })
end

RegisterCommand('mdt', function()
    if HasPermission() then
        SetNuiFocus(true, true)
        SetNuiFocusKeepInput(false)
        SendNUIMessage({
            action = 'open',
            config = {
                locale = Config.Locale
            }
        })
    end
end)

RegisterNUICallback('close', function(_, cb)
    CloseMdt()
    cb({ ok = true })
end)

RegisterNUICallback('getData', function(_, cb)
    QBCore.Functions.TriggerCallback('aj_mdt:getAllData', function(data)
        cb(data or {})
    end)
end)

RegisterNUICallback('getCitizenProfile', function(data, cb)
    QBCore.Functions.TriggerCallback('aj_mdt:getCitizenProfile', function(result)
        cb(result or {})
    end, data.citizenid)
end)

RegisterNUICallback('smartSearchPeople', function(data, cb)
    QBCore.Functions.TriggerCallback('aj_mdt:smartSearchPeople', function(result)
        cb(result or {})
    end, data.query, data.onlyPolice)
end)

RegisterNUICallback('getLawsByType', function(data, cb)
    QBCore.Functions.TriggerCallback('aj_mdt:getLawsByType', function(result)
        cb(result or {})
    end, data.caseType)
end)

RegisterNUICallback('addCase', function(data, cb)
    TriggerServerEvent('aj_mdt:addCase', data)
    Wait(350)
    QBCore.Functions.TriggerCallback('aj_mdt:getAllData', function(result)
        cb(result or {})
    end)
end)

RegisterNUICallback('updateCase', function(data, cb)
    TriggerServerEvent('aj_mdt:updateCase', data)
    Wait(350)
    QBCore.Functions.TriggerCallback('aj_mdt:getAllData', function(result)
        cb(result or {})
    end)
end)

RegisterNUICallback('executeCase', function(data, cb)
    TriggerServerEvent('aj_mdt:executeCase', data.id)
    Wait(350)
    QBCore.Functions.TriggerCallback('aj_mdt:getAllData', function(result)
        cb(result or {})
    end)
end)

RegisterNUICallback('deleteCase', function(data, cb)
    TriggerServerEvent('aj_mdt:deleteCase', data.id)
    Wait(350)
    QBCore.Functions.TriggerCallback('aj_mdt:getAllData', function(result)
        cb(result or {})
    end)
end)

RegisterNUICallback('addWanted', function(data, cb)
    TriggerServerEvent('aj_mdt:addWanted', data)
    Wait(250)
    QBCore.Functions.TriggerCallback('aj_mdt:getAllData', function(result)
        cb(result or {})
    end)
end)

RegisterNUICallback('addVehicleFlag', function(data, cb)
    TriggerServerEvent('aj_mdt:addVehicle', data)
    Wait(250)
    QBCore.Functions.TriggerCallback('aj_mdt:getAllData', function(result)
        cb(result or {})
    end)
end)
