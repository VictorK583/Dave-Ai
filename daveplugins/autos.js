let daveplug = async (m, { dave, daveshown, args, command, reply }) => {
  try {
    if (!daveshown) return reply('Only the owner can use this command.');

    let feature, mode;

    // Determine feature & mode based on command & args
    if (command === 'autostatusreact' || command === 'autoreactstatus') {
      feature = 'react';
      mode = args[0]?.toLowerCase();
    } else if (command === 'autostatusview' || command === 'autosview' || command === 'autoviewstatus') {
      feature = 'view';
      mode = args[0]?.toLowerCase();
    } else if (command === 'autostatus') {
      feature = args[0]?.toLowerCase();
      mode = args[1]?.toLowerCase();
    } else {
      return reply('Unknown command');
    }

    if (!feature || !mode)
      return reply('Usage:\n.autostatus <view|react> <on|off>\n.autoreactstatus <on|off>\n.autostatusreact <on|off>\n.autostatusview <on|off>\n.autoviewstatus <on|off>');

    if (!['view', 'react'].includes(feature))
      return reply('Invalid feature. Use: view or react');

    if (!['on', 'off'].includes(mode))
      return reply('Invalid mode. Use: on or off');

    const settings = global.settings
    const state = mode === 'on';

    // Apply changes to settings
    if (feature === 'view') {
        if (settings.autoviewstatus === state) return reply(`auto view status is already ${state ? 'enabled' : 'disabled'}`)
        settings.autoviewstatus = state
        global.saveSettings(settings)
        global.settings = settings
        return reply(`auto view status has been turned ${state ? 'on' : 'off'}`)
    }
    if (feature === 'react') {
        if (settings.autoreactstatus === state) return reply(`auto react status is already ${state ? 'enabled' : 'disabled'}`)
        settings.autoreactstatus = state
        global.saveSettings(settings)
        global.settings = settings
        return reply(`auto react status has been turned ${state ? 'on' : 'off'}`)
    }
  } catch (err) {
    console.error('Autostatus error:', err);
    reply('An error occurred while processing the command.');
  }
};

daveplug.help = [
  'autostatus <view|react> <on|off>',
  'autostatusreact <on|off>',
  'autoreactstatus <on|off>',
  'autostatusview <on|off>',
  'autoviewstatus <on|off>'
];
daveplug.tags = ['owner'];
daveplug.command = [
  'autostatus',
  'autostatusreact',
  'autoreactstatus',
  'autostatusview',
  'autosview',
  'autoviewstatus'
];

module.exports = daveplug;