const fs = require('fs');
const path = require('path');

const settingsPath = path.join(__dirname, 'library/database/settings.json');

function loadSettings() {
    if (!fs.existsSync(settingsPath)) {
        console.error('⚠️ settings.json not found, creating a new one...');
        const defaultSettings = {
            botname: "𝘿𝙖𝙫𝙚𝘼𝙄",
            ownername: "GIFTED DAVE",
            owner: ["254104260236"], // make this an array
            xprefix: ".",
            packname: "𝘿𝙖𝙫𝙚𝘼𝙄",
            author: "𝘿𝙖𝙫𝙚𝘼𝙄",
            themeemoji: "🪀",
            footer: "𝘿𝙖𝙫𝙚𝘼𝙄",
            thumb: "https://files.catbox.moe/cp8oat.jpg",
            websitex: "https://whatsapp.com/channel/0029VbApvFQ2Jl84lhONkc3k",
            wagc: "https://chat.whatsapp.com/CaPeB0sVRTrL3aG6asYeAC",
            socialm: "IG: @_gifted_dave",
            location: "Kenya",
            autoread: { enabled: false },
            autorecord: { enabled: false },
            autotyping: { enabled: false },
            autoviewstatus: true,
            autoreactstatus: false,
            autolike: { enabled: false },
            welcome: false,
            goodbye: false,
            anticall: false,
            autobio: true,
            antidelete: { enabled: true },
            antilinkgc: { enabled: false },
            antilink: { enabled: false },
            antitag: {},
            antibadword: {},
            antipromote: { enabled: false, mode: "revert" },
            antidemote: { enabled: false, mode: "revert" },
            antibot: {},
            areact: {
                enabled: false,
                chats: {},
                emojis: ["😂","🔥","😎","👍","💀","❤️","🤖","🥵","🙌","💯"],
                mode: "random"
            },
            warnings: { enabled: true, maxWarnings: 3, chats: {} },
            online: true,
            public: true,
            onlygroup: false,
            onlypc: false,
            mess: {
                success: "✅ Done.",
                admin: "Admin only.",
                premium: "Premium user only.",
                botAdmin: "Make me admin first.",
                owner: "Owner only.",
                OnlyGrup: "Group only.",
                private: "Private chat only.",
                wait: "Processing...",
                error: "Error occurred."
            }
        };

        fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
        fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2));
        return defaultSettings;
    }
    return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
}

// Save function
function saveSettings(settings) {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

// Attach to global
global.settings = loadSettings();
global.saveSettings = saveSettings;
global.owner = global.settings.owner; // now global.owner is available
global.mess = global.settings.mess;   // now global.mess is available
global.xprefix = global.settings.xprefix;

module.exports = { loadSettings, saveSettings };