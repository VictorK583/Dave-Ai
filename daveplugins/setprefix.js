const fs = require('fs');
const path = require('path');

const settingsPath = path.join(process.cwd(), 'settings.js');
let settings = require(settingsPath);

let daveplug = async (m, { dave, daveshown, args, reply }) => {
    if (!daveshown) return reply('This command is only available for the owner!');

    const newPrefix = args[0];
    if (!newPrefix) return reply('Usage: .setprefix <new prefix>');
    if (newPrefix.length > 1) return reply('Prefix must be one character only');

    global.xprefix = newPrefix; // update global prefix
    settings.xprefix = newPrefix;

    try {
        // Convert settings object to JS module string
        const settingsContent = 'module.exports = ' + JSON.stringify(settings, null, 2) + ';';
        fs.writeFileSync(settingsPath, settingsContent, 'utf-8');
        reply(`✅ Prefix has been changed to: ${newPrefix}`);
    } catch (err) {
        console.error('Error saving settings:', err);
        reply('❌ Failed to save prefix in settings');
    }
};

daveplug.help = ['setprefix <new prefix>'];
daveplug.tags = ['owner'];
daveplug.command = ['setprefix'];

module.exports = daveplug;