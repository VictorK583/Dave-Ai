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

        global.AREACT = mode === 'on'

        reply(`Auto React has been turned ${global.AREACT ? 'ON' : 'OFF'} (resets on restart).`)
        console.log(`Auto React mode: ${global.AREACT ? 'ENABLED' : 'DISABLED'}`)
    } catch (err) {
        console.error('Error in autoreact command:', err)
        reply('Failed to change autoreact mode.')
    }
}

daveplug.help = ['autoreact <on/off>']
daveplug.tags = ['owner']
daveplug.command = ['autoreact']

module.exports = daveplug