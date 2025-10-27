const fs = require('fs');
const path = require('path');

let daveplug = async (m, { dave, reply }) => {
  try {
    // === Load Menu Settings ===
    const settingsFile = path.join(__dirname, '../library/database/menuSettings.json');
    if (!fs.existsSync(settingsFile)) {
      fs.writeFileSync(settingsFile, JSON.stringify({ mode: 'text' }, null, 2));
    }
    const { mode = 'text', imageUrl, videoUrl } = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));

    // === User Tracking ===
    const usersFile = path.join(__dirname, '../library/database/users.json');
    if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, JSON.stringify([]));
    let users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    if (!users.includes(m.sender)) {
      users.push(m.sender);
      fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    }

    // === Command Count ===
    const pluginsDir = path.join(__dirname);
    let totalCommands = 0;
    if (fs.existsSync(pluginsDir)) {
      const files = fs.readdirSync(pluginsDir);
      totalCommands = files.filter(file => file.endsWith('.js') && file !== 'menu.js').length;
    }

    // === System Info ===
    const uptime = process.uptime();
    const uptimeFormatted = new Date(uptime * 1000).toISOString().substr(11, 8);
    const ramUsage = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
    const totalUsers = users.length;
    const host = detectHost();

    // === Real Ping Measurement ===
    const start = Date.now();
    await dave.sendMessage(m.chat, { react: { text: '🔥', key: m.key } });
    const ping = Date.now() - start;

    // === Load Menu Template ===
    delete require.cache[require.resolve('../library/listmenu/menulist')];
    const menuTemplate = require('../library/listmenu/menulist');

    // === Replace Dynamic Data in Menu ===
    const menuText = menuTemplate
      .replace(/{prefix}/g, global.xprefix || '.')
      .replace(/{uptime}/g, uptimeFormatted)
      .replace(/{ram}/g, `${ramUsage} MB`)
      .replace(/{users}/g, totalUsers)
      .replace(/{cmds}/g, totalCommands)
      .replace(/{ping}/g, `${ping} ms`)
      .replace(/{host}/g, host)
      .replace(/{botname}/g, '𝘿𝙖𝙫𝙚𝘼𝙄');

    // === Display Mode Switch ===
    switch (mode) {
      case 'text':
        await dave.sendMessage(m.chat, { text: menuText }, { quoted: m });
        break;

      case 'image':
        await dave.sendMessage(m.chat, {
          image: { url: imageUrl || 'https://files.catbox.moe/nxzaly.jpg' },
          caption: menuText,
          contextInfo: {
            forwardingScore: 1,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363400480173280@newsletter',
              newsletterName: 'Dave Official',
              serverMessageId: -1
            }
          }
        }, { quoted: m });
        break;

      case 'video':
        await dave.sendMessage(m.chat, {
          video: { url: videoUrl || 'https://files.catbox.moe/ddmjyy.mp4' },
          caption: menuText,
          gifPlayback: true,
          contextInfo: {
            forwardingScore: 1,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363400480173280@newsletter',
              newsletterName: 'Dave Official',
              serverMessageId: -1
            }
          }
        }, { quoted: m });
        break;

      default:
        await reply(`Invalid menu mode. Use *${global.xprefix}setmenu text/image/video* to change it.`);
    }

  } catch (err) {
    console.error('Menu Error:', err);
    await reply('Failed to load menu. Check your settings or JSON structure.');
  }
};

// === Helper Function ===
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

// === Plugin Metadata ===
daveplug.help = ['menu'];
daveplug.tags = ['menu'];
daveplug.command = ['menu'];

module.exports = daveplug;