// ==================== MODULES ==================== //
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
if (fs.existsSync('.env')) require('dotenv').config({ path: __dirname + '/.env' });

// ==================== SETTINGS FILE ==================== //
const settingsPath = path.join(__dirname, 'library/database/settings.json');

// Load settings from JSON file
function loadSettings() {
  try {
    if (!fs.existsSync(settingsPath)) {
      const defaultSettings = {
        // Bot Info
        botname: process.env.BOT_NAME || '𝘿𝙖𝙫𝙚𝘼𝙄',
        ownername: process.env.OWNER_NAME || 'GIFTED DAVE',
        owner: process.env.OWNER_NUMBER || '254104260236',
        xprefix: process.env.PREFIX || '.',
        
        // Features
        autoread: { enabled: false },
        autorecord: { enabled: false },
        autotyping: { enabled: false },
        autoviewstatus: process.env.AUTOVIEWSTATUS !== 'false',
        autoreactstatus: process.env.AUTOREACTSTATUS === 'true',
        welcome: process.env.WELCOME === 'true',
        anticall: process.env.ANTI_CALL === 'true',
        antidelete: { enabled: true },
        
        // Sticker Info
        packname: process.env.PACK_NAME || '𝘿𝙖𝙫𝙚𝘼𝙄',
        author: process.env.AUTHOR || '𝘿𝙖𝙫𝙚𝘼𝙄',
        
        // Auto Reactions
        areact: { enabled: false, chats: {} },
        
        // Group Settings
        antilinkgc: { enabled: false },
        
        // Security Features
        antitag: {},
        antibadword: {},
        antidemote: {},
        antipromote: {},
        antibot: {}
      };
      
      const dir = path.dirname(settingsPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2));
      return defaultSettings;
    }
    
    return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  } catch (error) {
    console.error('Error loading settings:', error);
    return {};
  }
}

// Save settings to JSON file
function saveSettings(settings) {
  try {
    const dir = path.dirname(settingsPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

// Load initial settings
const settings = loadSettings();

// ==================== BOT INFO ==================== //
global.SESSION_ID = process.env.SESSION_ID || '.';
global.botname = settings.botname;
global.ownername = settings.ownername;
global.owner = settings.owner;
global.creator = `${global.owner}@s.whatsapp.net`;
global.error = ['6666'];

// ==================== LINKS & SOCIALS ==================== //
global.websitex = 'https://whatsapp.com/channel/0029VbApvFQ2Jl84lhONkc3k';
global.wagc = 'https://chat.whatsapp.com/LfTFxkUQ1H7Eg2D0vR3n6g?mode=ac_t';
global.socialm = 'IG: @gifted_dave';
global.location = 'Kenya';
global.themeemoji = '🪀';
global.wm = '𝘿𝙖𝙫𝙚𝘼𝙄';
global.botscript = global.websitex;

// ==================== STICKER INFO ==================== //
global.packname = settings.packname;
global.author = settings.author;
global.caption = '𝘿𝙖𝙫𝙚𝘼𝙄';
global.footer = '𝘿𝙖𝙫𝙚𝘼𝙄';

// ==================== AUTO STATUS FEATURES ==================== //
global.AUTOVIEWSTATUS = settings.autoviewstatus;
global.AUTOREACTSTATUS = settings.autoreactstatus;

// ==================== AUTO READ FEATURE ==================== //
global.AUTO_READ = settings.autoread.enabled;

// ==================== BOT SETTINGS ==================== //
global.xprefix = settings.xprefix; // Using xprefix as you specified
global.premium = [global.owner];
global.hituet = 0;

global.welcome = settings.welcome;
global.anticall = settings.anticall;
global.adminevent = true;
global.groupevent = true;
global.connect = true;

// ==================== ANTI-DELETE SETTINGS ==================== //
global.antidelete = settings.antidelete.enabled;

// ==================== AUTO REACTIONS ==================== //
global.AREACT = settings.areact.enabled;
global.areact = settings.areact.chats;

// ==================== BOT CONFIG ==================== //
global.botversion = '1.0.0';
global.typebot = 'Plugin × Case';
global.session = 'davesession';
global.updateZipUrl = 'https://github.com/gifteddevsmd/Dave-Ai/archive/refs/heads/main.zip';

// ==================== THUMBNAIL / MENU ==================== //
global.thumb = 'https://files.catbox.moe/cp8oat.jpg';
global.menuImage = global.thumb;

// ==================== LEGACY / OTHER TOGGLES ==================== //
global.statusview = global.AUTOVIEWSTATUS;
global.antilinkgc = settings.antilinkgc.enabled;
global.autoTyping = settings.autotyping.enabled;
global.autoRecord = settings.autorecord.enabled;
global.autoai = false;
global.autoreact = false;
global.autostatusview = true;

// ==================== MESSAGES ==================== //
global.mess = {
  success: '✅ Done.',
  admin: 'Admin only.',
  premium: 'Premium user only.',
  botAdmin: 'Make me admin first.',
  owner: 'Owner only.',
  OnlyGrup: 'Group only.',
  private: 'Private chat only.',
  wait: 'Processing...',
  error: 'Error occurred.'
};

// ==================== GLOBAL SETTINGS ACCESS ==================== //
global.settings = settings;
global.loadSettings = loadSettings;
global.saveSettings = saveSettings;

// ==================== FILE WATCHER ==================== //
let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright(`Update detected: '${__filename}'`));
  delete require.cache[file];
  require(file);
});

// ==================== EXPORT FUNCTIONS ==================== //
module.exports = { 
  loadSettings, 
  saveSettings 
};