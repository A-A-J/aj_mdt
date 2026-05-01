local QBCore = exports['qb-core']:GetCoreObject()

local function HasPermission()
    local Player = QBCore.Functions.GetPlayerData()
    if not Player or not Player.job then return false end

    local job = Player.job.name
    local cfg = Config.AuthorizedJobs[job]

    return cfg and cfg.permissions and cfg.permissions.access
end

local function GetOfficerInfo()
    local Player = QBCore.Functions.GetPlayerData()
    Player = Player or {}

    local charinfo = Player.charinfo or {}
    local job = Player.job or {}
    local metadata = Player.metadata or {}
    local grade = job.grade or {}

    local firstName = charinfo.firstname or ''
    local lastName = charinfo.lastname or ''
    local fullName = (firstName .. ' ' .. lastName):gsub('^%s+', ''):gsub('%s+$', '')

    if fullName == '' then
        fullName = Player.name or 'Officer'
    end

    local image = metadata.mugshot or metadata.image or metadata.photo or metadata.profilepic or metadata.profile_picture or ''
    local jobLabel = job.label or job.name or 'Officer'
    local gradeLabel = grade.name or grade.label or grade.level or grade.grade or ''

    return {
        name = fullName,
        citizenid = Player.citizenid or '',
        image = image,
        job = jobLabel,
        grade = tostring(gradeLabel or '')
    }
end

local function CloseMdt()
    SetNuiFocus(false, false)
    SetNuiFocusKeepInput(false)
    SendNUIMessage({ action = 'forceClose' })
end

local function RefreshData(cb)
    QBCore.Functions.TriggerCallback('aj_mdt:getAllData', function(result)
        cb(result or {})
    end)
end

RegisterCommand('mdt', function()
    if HasPermission() then
        SetNuiFocus(true, true)
        SetNuiFocusKeepInput(false)
        SendNUIMessage({
            action = 'open',
            officer = GetOfficerInfo(),
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
    RefreshData(cb)
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
    RefreshData(cb)
end)

RegisterNUICallback('updateCase', function(data, cb)
    TriggerServerEvent('aj_mdt:updateCase', data)
    Wait(350)
    RefreshData(cb)
end)

RegisterNUICallback('executeCase', function(data, cb)
    TriggerServerEvent('aj_mdt:executeCase', data.id)
    Wait(350)
    RefreshData(cb)
end)

RegisterNUICallback('deleteCase', function(data, cb)
    TriggerServerEvent('aj_mdt:deleteCase', data.id)
    Wait(350)
    RefreshData(cb)
end)

RegisterNUICallback('addWanted', function(data, cb)
    TriggerServerEvent('aj_mdt:addWanted', data)
    Wait(250)
    RefreshData(cb)
end)

RegisterNUICallback('addVehicleFlag', function(data, cb)
    TriggerServerEvent('aj_mdt:addVehicle', data)
    Wait(250)
    RefreshData(cb)
end)

RegisterNUICallback('updateVehicleFlag', function(data, cb)
    TriggerServerEvent('aj_mdt:updateVehicleFlag', data)
    Wait(250)
    RefreshData(cb)
end)

RegisterNUICallback('deleteVehicleFlag', function(data, cb)
    TriggerServerEvent('aj_mdt:deleteVehicleFlag', data.plate)
    Wait(250)
    RefreshData(cb)
end)

RegisterNUICallback('saveCitizenImage', function(data, cb)
    TriggerServerEvent('aj_mdt:saveCitizenImage', data)
    Wait(250)
    RefreshData(cb)
end)

RegisterNUICallback('addLaw', function(data, cb)
    TriggerServerEvent('aj_mdt:addLaw', data)
    Wait(250)
    RefreshData(cb)
end)

RegisterNUICallback('updateLaw', function(data, cb)
    TriggerServerEvent('aj_mdt:updateLaw', data)
    Wait(250)
    RefreshData(cb)
end)

RegisterNUICallback('deleteLaw', function(data, cb)
    TriggerServerEvent('aj_mdt:deleteLaw', data.id)
    Wait(250)
    RefreshData(cb)
end)
