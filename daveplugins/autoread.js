const fs = require('fs');
const path = require('path');
const settingsPath = path.join(process.cwd(), 'settings.js');

let daveplug = async (m, { dave, daveshown, args, reply }) => {
  try {
    if (!daveshown) return reply('Owner only command.');

    const mode = args[0]?.toLowerCase();
    if (!mode || !['on', 'off'].includes(mode))
      return reply('Usage: .autoread <on|off>');

    const state = mode === 'on';
    global.AUTO_READ = state;

    try {
      let currentSettings = {};
      if (fs.existsSync(settingsPath)) {
        currentSettings = require(settingsPath);
      }

      // Update only AUTO_READ
      currentSettings.AUTO_READ = global.AUTO_READ;

      fs.writeFileSync(settingsPath, `module.exports = ${JSON.stringify(currentSettings, null, 2)};`);
    } catch (err) {
      console.error('Error saving settings:', err.message);
      return reply('⚠️ Failed to save settings, but global variable was updated.');
    }

    reply(`✅ Auto-read has been turned ${mode.toUpperCase()}`);

  } catch (err) {
    console.error('Autoread error:', err.message);
    reply('❌ An error occurred while processing the command.');
  }
};

daveplug.help = ['autoread <on|off>'];
daveplug.tags = ['owner'];
daveplug.command = ['autoread'];

module.exports = daveplug;