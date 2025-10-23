const axios = require('axios');
const fs = require('fs');

let daveplug = async (m, { dave, replymenu, menu }) => {
    try {
        // Calculate ping (but fake it higher)
        const start = Date.now();
        await dave.sendMessage(m.chat, {
            react: { text: '🔥', key: m.key }
        });
        const end = Date.now();
        let ping = end - start;

        // Force realistic ping range (fake higher if too low)
        if (ping < 80) ping = Math.floor(Math.random() * 200) + 100; // random 100–300ms

        delete require.cache[require.resolve('./library/listmenu/menulist')];
        const menuModule = require('./library/listmenu/menulist');

        // Load dynamic data
        let data = JSON.parse(fs.readFileSync('./library/database/messageCount.json'));
        const uptimeFormatted = formatTime(process.uptime());
        const currentMode = data.isPublic ? 'Public' : 'Private';
        const hostName = detectHost();

        // Replace ping dynamically (always show)
        const dynamicMenu = menuModule.replace('*300 ms*', `*${ping} ms*`);

        // Send image with menu caption
        await dave.sendMessage(
            m.chat,
            {
                image: { url: global.menuImage || 'https://files.catbox.moe/na6y1b.jpg' },
                caption: dynamicMenu,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363400480173280@newsletter',
                        newsletterName: 'Dave Official',
                        serverMessageId: -1
                    }
                }
            },
            { quoted: m }
        );

        await dave.sendMessage(m.chat, {
            react: { text: '🔥', key: m.key }
        });
    } catch (error) {
        console.error('Menu image error:', error);
        replymenu(`${menu}\n`);
        await dave.sendMessage(m.chat, {
            react: { text: '🔥', key: m.key }
        });
    }
};

// Helper functions
function formatTime(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    seconds %= 24 * 60 * 60;
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);

    let time = '';
    if (days > 0) time += `${days}d `;
    if (hours > 0) time += `${hours}h `;
    if (minutes > 0) time += `${minutes}m `;
    if (seconds > 0 || time === '') time += `${seconds}s`;
    return time.trim();
}

function detectHost() {
    const env = process.env;
    if (env.RENDER || env.RENDER_EXTERNAL_URL) return 'Render';
    if (env.DYNO || env.HEROKU_APP_DIR) return 'Heroku';
    if (env.VERCEL || env.VERCEL_ENV) return 'Vercel';
    if (env.PORTS || env.CYPHERX_HOST_ID) return 'CypherXHost';
    if (env.RAILWAY_ENVIRONMENT) return 'Railway';
    if (env.REPL_ID) return 'Replit';
    return 'VPS/Panel';
}

daveplug.help = ['menu'];
daveplug.tags = ['menu'];
daveplug.command = ['menu'];

module.exports = daveplug;