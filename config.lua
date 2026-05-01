Config = {}

Config.Locale = 'ar' -- ar / en

-- Job based access and permissions
-- Supported permissions:
-- access: open MDT and read data
-- create_case: create cases
-- create_wanted: add manual wanted records
-- flag_vehicle: add vehicle flags
-- manage_laws: reserved for future laws management
Config.AuthorizedJobs = {
    ['police'] = {
        label = 'Police',
        permissions = {
            access = true,
            create_case = true,
            create_wanted = true,
            flag_vehicle = true,
            manage_laws = false
        }
    },

    ['judge'] = {
        label = 'Judge',
        permissions = {
            access = true,
            create_case = true,
            create_wanted = false,
            flag_vehicle = false,
            manage_laws = true
        }
    }
}

-- Backward compatibility for older checks and police-only filters
Config.PoliceJobs = {
    ['police'] = true
}
