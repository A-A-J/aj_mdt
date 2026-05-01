fx_version 'cerulean'
game 'gta5'

name 'aj_mdt'
author 'A-A-J / ChatGPT'
description 'QBCore Arabic/English MDT NUI for FiveM'
version '0.1.0'

lua54 'yes'

ui_page 'web/index.html'

shared_scripts {
    'config.lua'
}

client_scripts {
    'client/main.lua',
    'client/laws.lua'
}

server_scripts {
    '@oxmysql/lib/MySQL.lua',
    'server/main.lua',
    'server/laws.lua'
}

files {
    'web/index.html',
    'web/style.css',
    'web/app.js',
    'web/laws.js',
    'web/laws.css'
}
