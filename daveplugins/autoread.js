let daveplug = async (m, { dave, daveshown, args, reply }) => {
  try {
    if (!daveshown) return reply('Only the owner can use this command.');

    const mode = args[0]?.toLowerCase();
    if (!mode || !['on', 'off'].includes(mode)) {
      return reply('Usage: .autoread <on|off>');
    }

    const settings = global.settings
    
    if (mode === 'on') {
        if (settings.autoread.enabled) return reply('Auto read is already enabled')
        settings.autoread.enabled = true
    } else {
        if (!settings.autoread.enabled) return reply('Auto read is already disabled')
        settings.autoread.enabled = false
    }

    global.saveSettings(settings)
    global.settings = settings

    reply(`Auto read has been turned ${settings.autoread.enabled ? 'ON' : 'OFF'}`)
  } catch (err) {
    console.error('Autoread error:', err);
    reply('Failed to change autoread mode.');
  }
};

daveplug.help = ['autoread <on/off>'];
daveplug.tags = ['owner'];
daveplug.command = ['autoread'];

module.exports = daveplug;