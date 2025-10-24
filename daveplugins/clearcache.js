const fs = require('fs');
const path = require('path');

let daveplug = async (m, { dave, daveshown, reply }) => {
    try {
        if (!daveshown) return reply("Owner only command!");

        // Add processing reaction
        await dave.sendMessage(m.chat, {
            react: { text: '...', key: m.key }
        });

        const cacheDirs = [
            path.join(process.cwd(), "trash_baileys"),
            path.join(process.cwd(), "temp"),
            path.join(process.cwd(), "cache"),
            path.join(process.cwd(), ".cache")
        ];

        let cleared = 0;

        for (const dir of cacheDirs) {
            if (fs.existsSync(dir)) {
                fs.rmSync(dir, { recursive: true, force: true });
                cleared++;
            }
        }

        // Delete leftover temporary files but skip JSONs
        const files = fs.readdirSync(process.cwd());
        for (const file of files) {
            if (
                (file.endsWith(".tmp") || file.endsWith(".dat") || file.endsWith(".cache")) &&
                !file.endsWith(".json")
            ) {
                fs.unlinkSync(path.join(process.cwd(), file));
                cleared++;
            }
        }

        // Add success reaction
        await dave.sendMessage(m.chat, {
            react: { text: '✓', key: m.key }
        });

        await reply(`Cache Cleared Successfully!\n\nCleared: ${cleared} cache folders/files\nJSON files kept safe`);

    } catch (err) {
        console.error("Clear Cache Command Error:", err);
        
        // Add error reaction
        await dave.sendMessage(m.chat, {
            react: { text: '✗', key: m.key }
        });
        
        await reply(`Failed to clear cache.\n${err.message}`);
    }
};

daveplug.help = ['clearcache'];
daveplug.tags = ['system'];
daveplug.command = ['clearcache', 'cc'];

module.exports = daveplug;