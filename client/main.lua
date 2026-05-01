local QBCore = exports['qb-core']:GetCoreObject()

RegisterCommand('mdt', function()
    local Player = QBCore.Functions.GetPlayerData()
    if Player and Config.PoliceJobs[Player.job.name] then
        SetNuiFocus(true, true)
        SendNUIMessage({ action = 'open' })
    end
end)

RegisterNUICallback('close', function()
    SetNuiFocus(false, false)
end)
