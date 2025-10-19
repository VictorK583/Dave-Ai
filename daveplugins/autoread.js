const fs = require('fs');
const path = require('path');
const settingsPath = path.join(__dirname, '../settings.js');

let daveplug = async (m, { dave, daveshown, args, reply }) => {
  try {
    if (!daveshown) return reply('Only the owner can use this command.');

    const mode = args[0]?.toLowerCase();
    if (!mode || !['on', 'off'].includes(mode)) {
      return reply('Usage: .autoread <on|off>');
    }

    global.AUTO_READ = mode === 'on';

    // Safely update settings.js
    try {
      let content = fs.readFileSync(settingsPath, 'utf8');

      if (/AUTO_READ\s*=/.test(content)) {
        // Update existing AUTO_READ value
        content = content.replace(/AUTO_READ\s*=\s*(true|false)/, `AUTO_READ = ${global.AUTO_READ}`);
      } else {
        // Append if missing
        content += `\n\nglobal.AUTO_READ = ${global.AUTO_READ}`;
      }

      fs.writeFileSync(settingsPath, content);
    } catch (err) {
      console.error('Error saving settings:', err.message);
      return reply('Failed to update settings file.');
    }

    reply(`Auto-read has been turned *${mode.toUpperCase()}*`);
  } catch (err) {
    console.error('Autoread error:', err.message);
    reply('An error occurred while processing the command.');
  }
};

daveplug.help = ['autoread <on|off>'];
daveplug.tags = ['owner'];
daveplug.command = ['autoread'];

module.exports = daveplug;