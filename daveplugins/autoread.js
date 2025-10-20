let daveplug = async (m, { dave, daveshown, args, reply }) => {
  try {
    if (!daveshown) return reply('Only the owner can use this command.');

    const mode = args[0]?.toLowerCase();
    if (!mode || !['on', 'off'].includes(mode)) {
      return reply('Usage: .autoread <on|off>');
    }

    global.AUTO_READ = mode === 'on';

    reply(`Auto-read has been turned ${global.AUTO_READ ? 'ON' : 'OFF'} (temporary until restart).`);
    console.log(`Auto-read mode: ${global.AUTO_READ ? 'ENABLED' : 'DISABLED'}`);
  } catch (err) {
    console.error('Autoread error:', err);
    reply('Failed to change autoread mode.');
  }
};

daveplug.help = ['autoread <on/off>'];
daveplug.tags = ['owner'];
daveplug.command = ['autoread'];

module.exports = daveplug;