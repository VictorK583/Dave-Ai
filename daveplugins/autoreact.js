const fs = require('fs')

let daveplug = async (m, { dave, daveshown, args, reply }) => {
    try {
        if (!daveshown) {
            return reply('Only the owner can use this command.')
        }

        const mode = args[0] ? args[0].toLowerCase() : ''
        if (!['on', 'off'].includes(mode)) {
            return reply('Usage: .autoreact on or .autoreact off')
        }

        const settings = global.settings
        
        if (mode === 'on') {
            if (settings.areact.enabled) return reply('Auto react is already enabled')
            settings.areact.enabled = true
        } else {
            if (!settings.areact.enabled) return reply('Auto react is already disabled')
            settings.areact.enabled = false
        }

        global.saveSettings(settings)
        global.settings = settings

        reply(`Auto react has been turned ${settings.areact.enabled ? 'ON' : 'OFF'}`)
    } catch (err) {
        console.error('Error in autoreact command:', err)
        reply('Failed to change autoreact mode.')
    }
}

daveplug.help = ['autoreact <on/off>']
daveplug.tags = ['owner']
daveplug.command = ['autoreact']

module.exports = daveplug