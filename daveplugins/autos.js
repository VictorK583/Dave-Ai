const fs = require('fs');
const path = './settings.js';

let daveplug = async (m, { dave, daveshown, args, reply }) => {
  try {
    if (!daveshown) return reply('Owner only command.');

    const feature = args[0]?.toLowerCase();
    const mode = args[1]?.toLowerCase();

    if (!feature || !mode)
      return reply('Usage:\n.autostatus <view|react> <on|off>');

    if (!['view', 'react'].includes(feature))
      return reply('Invalid feature. Use: view or react');

    if (!['on', 'off'].includes(mode))
      return reply('Invalid mode. Use: on or off');

    const state = mode === 'on';

    // Initialize globals if they don't exist
    if (typeof global.AUTOVIEWSTATUS === 'undefined') global.AUTOVIEWSTATUS = true;
    if (typeof global.AUTOREACTSTATUS === 'undefined') global.AUTOREACTSTATUS = false;

    if (feature === 'view') global.AUTOVIEWSTATUS = state;
    if (feature === 'react') global.AUTOREACTSTATUS = state;

    // Prepare settings content
    const settingsContent = `
// Auto-generated settings
global.AUTOVIEWSTATUS = ${global.AUTOVIEWSTATUS};
global.AUTOREACTSTATUS = ${global.AUTOREACTSTATUS};
module.exports = { AUTOVIEWSTATUS: global.AUTOVIEWSTATUS, AUTOREACTSTATUS: global.AUTOREACTSTATUS };
`;

    // Write to settings.js (creates if missing)
    fs.writeFileSync(path, settingsContent, 'utf8');

    // Confirmation message
    reply(`✅ Auto-status settings updated:\n\n👀 View: ${global.AUTOVIEWSTATUS ? 'ON' : 'OFF'}\n❤️ React: ${global.AUTOREACTSTATUS ? 'ON' : 'OFF'}`);

  } catch (err) {
    console.error('Autostatus error:', err.message);
    reply('An error occurred while processing the command.');
  }
};

daveplug.help = ['autostatus <view|react> <on|off>'];
daveplug.tags = ['owner'];
daveplug.command = ['autostatus', 'autosview', 'autostatusreact'];

module.exports = daveplug;