const fs = require('fs');
const path = require('path');

const settingsPath = path.join(process.cwd(), 'settings.js');

let daveplug = async (m, { dave, daveshown, args, reply }) => {
    if (!daveshown) return reply('This command is only for the owner.');

    const mode = args[0]?.toLowerCase();
    if (!mode || !['on', 'off'].includes(mode)) {
        return reply('Usage: .autoreact <on|off>');
    }

    global.AREACT = mode === 'on';

    try {
        let settings = {};

        // Load existing settings if file exists
        if (fs.existsSync(settingsPath)) {
            settings = require(settingsPath);
        }

        // Update only AREACT key
        settings.AREACT = global.AREACT;

        // Save back to settings.js
        fs.writeFileSync(
            settingsPath,
            `module.exports = ${JSON.stringify(settings, null, 2)};`,
            'utf8'
        );

        reply(`✅ Auto-react has been turned ${mode.toUpperCase()}`);
        console.log(`🔧 AREACT is now ${global.AREACT}`);
    } catch (err) {
        console.error('Failed to save autoreact settings:', err.message);
        reply('Failed to save settings!');
    }
};

daveplug.help = ['autoreact <on|off>'];
daveplug.tags = ['owner'];
daveplug.command = ['autoreact'];

module.exports = daveplug;