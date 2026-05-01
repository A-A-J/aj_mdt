local QBCore = exports['qb-core']:GetCoreObject()

local function Refresh(src)
    local citizens = QBCore.Functions.GetPlayers()
    TriggerClientEvent('aj_mdt:refresh', src)
end

RegisterNUICallback('addLaw', function(data, cb)
    TriggerServerEvent('aj_mdt:addLaw', data)
    cb('ok')
end)

RegisterNUICallback('updateLaw', function(data, cb)
    TriggerServerEvent('aj_mdt:updateLaw', data)
    cb('ok')
end)

RegisterNUICallback('deleteLaw', function(data, cb)
    TriggerServerEvent('aj_mdt:deleteLaw', data.id)
    cb('ok')
end)
