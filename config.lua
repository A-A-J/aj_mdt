Config = {}

Config.Locale = 'ar' -- ar / en

-- Job based access and permissions
-- Supported permissions:
-- access: open MDT and read data
-- create_case: create cases
-- edit_case: edit case records and linked violations
-- execute_case: mark a case as executed
-- create_wanted: legacy/manual list control (currently disabled by case-based system)
-- flag_vehicle: add vehicle flags
-- delete_case: delete case records
-- delete_wanted: legacy delete control (currently disabled by case-based system)
-- edit_profile: edit citizen profile image only
-- view_logs: view latest system actions
-- manage_laws: manage laws guide (reserved)
Config.AuthorizedJobs = {
    ['police'] = {
        label = 'Police',
        permissions = {
            access = true,
            create_case = true,
            edit_case = false,
            execute_case = true,
            create_wanted = false,
            flag_vehicle = true,
            delete_case = false,
            delete_wanted = false,
            edit_profile = false,
            view_logs = false,
            manage_laws = false
        },
        grades = {
            [4] = {
                permissions = {
                    edit_case = true,
                    delete_case = true,
                    view_logs = true,
                    edit_profile = true
                }
            }
        }
    },

    ['judge'] = {
        label = 'Judge',
        permissions = {
            access = true,
            create_case = true,
            edit_case = true,
            execute_case = true,
            create_wanted = false,
            flag_vehicle = false,
            delete_case = true,
            delete_wanted = false,
            edit_profile = true,
            view_logs = true,
            manage_laws = true
        }
    }
}

-- Backward compatibility for older checks and police-only filters
Config.PoliceJobs = {
    ['police'] = true
}
