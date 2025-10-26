const fs = require('fs');
const path = require('path');

// ==================== SETTINGS FILE PATH ==================== //
const settingsPath = path.join(__dirname, 'library/database/settings.json');

// ==================== LOAD SETTINGS ==================== //
function loadSettings() {
  if (!fs.existsSync(settingsPath)) {
    console.error('⚠️ settings.json file not found! Creating a new one...');
    const defaultSettings = {
      botname: "𝘿𝙖𝙫𝙚𝘼𝙄",
      ownername: "GIFTED DAVE",
      owner: "254104260236",
      xprefix: ".",
      packname: "𝘿𝙖𝙫𝙚𝘼𝙄",
      author: "𝘿𝙖𝙫𝙚𝘼𝙄",

      autoread: { enabled: false },
      autorecord: { enabled: false },
      autotyping: { enabled: false },
      autoviewstatus: true,
      autoreactstatus: false,
      welcome: false,
      goodbye: false,
      anticall: false,

      antidelete: { enabled: true },
      areact: {
        enabled: false,
        chats: {},
        emojis: ["😂", "🔥", "😎", "👍", "💀", "❤️", "🤖", "🥵", "🙌", "💯"],
        mode: "random"
      },
      antilinkgc: { enabled: false },
      antilink: {},
      antitag: {},
      antibadword: {},
      antipromote: { enabled: false, mode: "revert" },
      antidemote: { enabled: false, mode: "revert" },
      antibot: {},
      autolike: { enabled: false },

      // ✅ Show CONNECTED message on bot startup
      showConnectMsg: true
    };

    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2));
    return defaultSettings;
  }

  return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
}

// ==================== SAVE SETTINGS ==================== //
function saveSettings(settings) {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

// ==================== GLOBAL EXPORT ==================== //
global.settings = loadSettings();
global.loadSettings = loadSettings;
global.saveSettings = saveSettings;

// ==================== FILE WATCHER (AUTO RELOAD) ==================== //
fs.watchFile(__filename, () => {
  fs.unwatchFile(__filename);
  console.log(`♻️ Reloaded '${path.basename(__filename)}'`);
  delete require.cache[__filename];
  require(__filename);
});

module.exports = { loadSettings, saveSettings };