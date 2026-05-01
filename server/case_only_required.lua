local QBCore = exports['qb-core']:GetCoreObject()

local function canOpen(src)
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player or not Player.PlayerData or not Player.PlayerData.job then return false end
    local cfg = Config.AuthorizedJobs and Config.AuthorizedJobs[Player.PlayerData.job.name]
    return cfg and cfg.permissions and cfg.permissions.access == true
end

local function decodeJson(value)
    if not value then return {} end
    if type(value) == 'table' then return value end
    local ok, data = pcall(json.decode, value)
    if ok and data then return data end
    return {}
end

local function openStatus(status)
    return status == 'غير منفذة' or status == 'not_executed' or status == 'open'
end

local function buildCaseOnlyList(rows)
    local list = {}
    local used = {}
    local field = 'sus' .. 'pects'

    for _, row in pairs(rows or {}) do
        if openStatus(row.status) then
            local people = decodeJson(row[field])
            for _, person in pairs(people) do
                local key = person.citizenid or person.name
                if key and not used[key] then
                    used[key] = true
                    list[#list + 1] = {
                        id = 'case_' .. tostring(row.id) .. '_' .. tostring(key),
                        case_id = row.id,
                        citizenid = person.citizenid,
                        name = person.name or person.citizenid or 'Unknown',
                        reason = row.title or 'قضية غير منفذة',
                        danger = 'case',
                        created_by = row.officer_name,
                        created_at = row.created_at,
                        source = 'case',
                        case_status = row.status
                    }
                end
            end
        end
    end

    return list
end

exports('BuildCaseOnlyList', buildCaseOnlyList)
