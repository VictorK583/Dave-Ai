const fs = require('fs');
const path = require('path');

let daveplug = async (m, { dave, daveshown, args, reply }) => {
    try {
        if (!daveshown) return reply('This command is only available for the owner!');

        const mode = args[0]?.toLowerCase();
        if (!mode) return reply('Usage: .autoreact <on|off>');
        if (!['on', 'off'].includes(mode)) return reply('Invalid mode. Use: on or off');

        global.AREACT = mode === 'on';

        try {
            const settingsPath = path.join(process.cwd(), 'settings.js');
            let settings = {};

            // Load existing settings if file exists
            if (fs.existsSync(settingsPath)) {
                settings = require(settingsPath);
            }

            // Update only the AREACT key
            settings.AREACT = global.AREACT;

            // Save back to settings.js
            fs.writeFileSync(
                settingsPath,
                `module.exports = ${JSON.stringify(settings, null, 2)};`,
                'utf8'
            );
        } catch (error) {
            console.error('Error saving settings:', error.message);
            return reply('Failed to save settings!');
        }

        reply(`✅ Auto-react has been turned ${mode.toUpperCase()}`);
    } catch (error) {
        console.error('Autoreact error:', error.message);
        reply('An error occurred while processing the command');
    }
};

daveplug.help = ['autoreact <on|off>'];
daveplug.tags = ['owner'];
daveplug.command = ['autoreact'];

module.exports = daveplug;