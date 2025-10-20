let daveplug = async (m, { dave, daveshown, args, reply }) => {
  try {
    if (!daveshown) return reply('Only the owner can use this command.');

    const feature = args[0]?.toLowerCase();
    const mode = args[1]?.toLowerCase();

    if (!feature || !mode)
      return reply('Usage: .autostatus <view|react> <on|off>');

    if (!['view', 'react'].includes(feature))
      return reply('Invalid feature. Use: view or react');

    if (!['on', 'off'].includes(mode))
      return reply('Invalid mode. Use: on or off');

    const state = mode === 'on';

    // Initialize globals if not already defined
    if (typeof global.AUTOVIEWSTATUS === 'undefined') global.AUTOVIEWSTATUS = false;
    if (typeof global.AUTOREACTSTATUS === 'undefined') global.AUTOREACTSTATUS = false;

    // Apply changes
    if (feature === 'view') global.AUTOVIEWSTATUS = state;
    if (feature === 'react') global.AUTOREACTSTATUS = state;

    reply(
      `Auto-status updated:\n` +
      `View status: ${global.AUTOVIEWSTATUS ? 'ON' : 'OFF'}\n` +
      `React status: ${global.AUTOREACTSTATUS ? 'ON' : 'OFF'}\n\n` +
      `(Temporary — resets on restart)`
    );

    console.log(`AUTOVIEWSTATUS: ${global.AUTOVIEWSTATUS}, AUTOREACTSTATUS: ${global.AUTOREACTSTATUS}`);
  } catch (err) {
    console.error('Autostatus error:', err);
    reply('An error occurred while processing the command.');
  }
};

daveplug.help = ['autostatus <view|react> <on|off>'];
daveplug.tags = ['owner'];
daveplug.command = ['autostatus', 'autosview', 'autostatusreact'];

module.exports = daveplug;