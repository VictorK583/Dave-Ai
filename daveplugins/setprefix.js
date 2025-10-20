let daveplug = async (m, { dave, daveshown, args, reply }) => {
    if (!daveshown) return reply('This command is only available for the owner!');

    const newPrefix = args[0];
    if (!newPrefix) return reply('Usage: .setprefix <new prefix>');
    if (newPrefix.length > 1) return reply('Prefix must be one character only');

    global.xprefix = newPrefix; // Temporarily update global prefix
    reply(`Prefix has been changed to: ${newPrefix}\n\n⚠️ It will reset to default after restart.`);
};

daveplug.help = ['setprefix <new prefix>'];
daveplug.tags = ['owner'];
daveplug.command = ['setprefix'];

module.exports = daveplug;