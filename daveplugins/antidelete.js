const fs = require('fs');
const path = require('path');

let daveplug = async (m, { command, xprefix, q, daveshown, reply, args, mess }) => {
    if (!daveshown) return reply(mess.owner);

    // Use global settings
    const settings = global.settings;

    if (!args || args.length < 1) {
        const status = settings.antidelete.enabled ? 'ON' : 'OFF';
        return reply(
            `Antidelete Status: ${status}\n\n` +
            `Usage:\n` +
            `• ${xprefix + command} on - Enable antidelete\n` +
            `• ${xprefix + command} off - Disable antidelete\n\n` +
            `When enabled, deleted messages will be recovered and resent.`
        );
    }

    let option = q.toLowerCase();

    if (option === 'on') {
        if (settings.antidelete.enabled) return reply('Antidelete is already enabled');
        
        settings.antidelete.enabled = true;
        global.saveSettings(settings);
        global.settings = settings;
        reply('Antidelete is now ON. Deleted messages will be recovered and resent.');
    } else if (option === 'off') {
        if (!settings.antidelete.enabled) return reply('Antidelete is already disabled');
        
        settings.antidelete.enabled = false;
        global.saveSettings(settings);
        global.settings = settings;
        reply('Antidelete is now OFF. Deleted messages will not be recovered.');
    } else {
        reply(`Invalid option. Use ${xprefix + command} on/off`);
    }
};

daveplug.help = ['antidelete'];
daveplug.tags = ['owner'];
daveplug.command = ['antidelete', 'antidel'];

module.exports = daveplug;