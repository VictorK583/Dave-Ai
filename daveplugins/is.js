const { exec } = require('child_process');

let daveplug = async (m, { dave, daveshown, reply, text }) => {
    try {
        if (!daveshown) return reply("Owner only command!");

        const dir = text ? text.trim() : '.';

        // Add processing reaction
        await dave.sendMessage(m.chat, {
            react: { text: '...', key: m.key }
        });

        exec(`ls ${dir}`, (err, stdout, stderr) => {
            if (err) {
                // Add error reaction
                dave.sendMessage(m.chat, {
                    react: { text: '✗', key: m.key }
                }).catch(() => {});
                return reply(`Error:\n${stderr || err.message}`);
            }
            
            if (!stdout) {
                // Add success reaction
                dave.sendMessage(m.chat, {
                    react: { text: '✓', key: m.key }
                }).catch(() => {});
                return reply('Directory is empty.');
            }

            // Add success reaction
            dave.sendMessage(m.chat, {
                react: { text: '✓', key: m.key }
            }).catch(() => {});

            // Send directory listing
            reply(`Directory listing:\n\n${stdout}`);
        });

    } catch (err) {
        console.error('LS Command Error:', err);
        
        // Add error reaction
        await dave.sendMessage(m.chat, {
            react: { text: '✗', key: m.key }
        });
        
        await reply(`Error listing directory: ${err.message}`);
    }
};

daveplug.help = ['ls'];
daveplug.tags = ['system'];
daveplug.command = ['ls', 'dir'];

module.exports = daveplug;