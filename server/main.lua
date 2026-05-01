local QBCore = exports['qb-core']:GetCoreObject()

-- Placeholder for MDT logic

QBCore.Functions.CreateCallback('aj_mdt:getDashboard', function(source, cb)
    cb({
        cases = {},
        wanted = {},
        officers = {}
    })
end)
