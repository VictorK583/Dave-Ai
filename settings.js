// ==================== MODULES ==================== //
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
if (fs.existsSync('.env')) require('dotenv').config({ path: __dirname + '/.env' });

// ==================== SETTINGS FILE ==================== //
const settingsPath = path.join(__dirname, 'library/database/settings.json');

// ==================== LOAD SETTINGS ==================== //
function loadSettings() {
  try {
    let settings = {};

    if (!fs.existsSync(settingsPath)) {
      const defaultSettings = {
        botname: process.env.BOT_NAME || '𝘿𝙖𝙫𝙚𝘼𝙄',
        ownername: process.env.OWNER_NAME || 'GIFTED DAVE',
        owner: process.env.OWNER_NUMBER || '254104260236',
        packname: process.env.PACK_NAME || '𝘿𝙖𝙫𝙚𝘼𝙄',
        author: process.env.AUTHOR || '𝘿𝙖𝙫𝙚𝘼𝙄',
        antidelete: { enabled: true },
        autoread: { enabled: false },
        autotyping: { enabled: false },
        autorecord: { enabled: false },
        autoviewstatus: process.env.AUTOVIEWSTATUS !== 'false',
        autoreactstatus: process.env.AUTOREACTSTATUS === 'true',
        welcome: process.env.WELCOME === 'true',
        anticall: process.env.ANTI_CALL === 'true'
      };

      const dir = path.dirname(settingsPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2));
      settings = defaultSettings;
    } else {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }

    return settings;
  } catch (error) {
    console.error('Error loading settings:', error);
    return {};
  }
}

function saveSettings(settings) {
  try {
    const dir = path.dirname(settingsPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

// ==================== GLOBAL SETTINGS ==================== //
const settings = loadSettings();

global.settings = settings;
global.loadSettings = loadSettings;
global.saveSettings = saveSettings;

// ==================== BASIC GLOBALS ==================== //
global.botname = settings.botname;
global.ownername = settings.ownername;
global.owner = settings.owner;
global.creator = `${global.owner}@s.whatsapp.net`;
global.SESSION_ID = process.env.SESSION_ID || '.';

// ✅ Keep only this simple fallback for prefix
global.xprefix = '.';

// ==================== WATCHER ==================== //
let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.yellowBright(`♻️ Reloaded: '${path.basename(__filename)}'`));
  delete require.cache[file];
  require(file);
});