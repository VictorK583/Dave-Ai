const fs = require('fs');
const path = './library/database/anticall.json';

// Ensure the JSON file exists with default OFF
if (!fs.existsSync(path)) {
    fs.writeFileSync(path, JSON.stringify({ anticall: false }, null, 2));
}

// Load current state from JSON
let db = JSON.parse(fs.readFileSync(path, 'utf8'));
global.anticall = db.anticall || false; // default OFF

let daveplug = async (m, { dave, daveshown, args, reply }) => {
    try {
        if (!daveshown) return reply('Only the owner can use this command!');

        const mode = args[0]?.toLowerCase();
        if (!mode || !['on', 'off'].includes(mode)) {
            return reply('Usage: .anticall <on|off>');
        }

        const state = mode === 'on';

        // Update global runtime variable
        global.anticall = state;

        // Save to JSON for persistence
        fs.writeFileSync(path, JSON.stringify({ anticall: state }, null, 2));

        reply(`✅ Anti-call feature has been turned *${mode.toUpperCase()}*`);
    } catch (error) {
        console.error('anticall error:', error.message);
        reply('❌ An error occurred while updating anticall mode.');
    }
};

daveplug.help = ['anticall <on|off>'];
daveplug.tags = ['owner'];
daveplug.command = ['anticall'];

module.exports = daveplug;