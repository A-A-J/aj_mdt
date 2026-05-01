local QBCore = exports['qb-core']:GetCoreObject()

local function OfficerName(src)
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return 'Unknown' end
    local c = Player.PlayerData.charinfo or {}
    return ((c.firstname or '') .. ' ' .. (c.lastname or ''))
end

local function HasPermission(src)
    return true -- يعتمد على config الأساسي
end

RegisterNetEvent('aj_mdt:addLaw', function(data)
    local src = source
    if not HasPermission(src) then return end
    MySQL.insert('INSERT INTO aj_mdt_laws (title_ar,title_en,type,fine,jail,created_by) VALUES (?,?,?,?,?,?)', {
        data.title_ar, data.title_en or '', data.type, data.fine or 0, data.jail or 0, OfficerName(src)
    })
end)

RegisterNetEvent('aj_mdt:updateLaw', function(data)
    local src = source
    if not HasPermission(src) then return end
    MySQL.update('UPDATE aj_mdt_laws SET title_ar=?, title_en=?, fine=?, jail=?, updated_by=? WHERE id=?', {
        data.title_ar, data.title_en or '', data.fine or 0, data.jail or 0, OfficerName(src), data.id
    })
end)

RegisterNetEvent('aj_mdt:deleteLaw', function(id)
    local src = source
    if not HasPermission(src) then return end
    MySQL.query('DELETE FROM aj_mdt_laws WHERE id = ?', { id })
end)
