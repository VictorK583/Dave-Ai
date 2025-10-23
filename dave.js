require("./settings");
const { downloadContentFromMessage, proto, generateWAMessage, getContentType, prepareWAMessageMedia, generateWAMessageFromContent, GroupSettingChange, jidDecode, WAGroupMetadata, emitGroupParticipantsUpdate, emitGroupUpdate, generateMessageID, jidNormalizedUser, generateForwardMessageContent, WAGroupInviteMessageGroupMetadata, GroupMetadata, Headers, delay, WA_DEFAULT_EPHEMERAL, WADefault, getAggregateVotesInPollMessage, generateWAMessageContent, areJidsSameUser, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, makeWaconnet, makeInMemoryStore, MediaType, WAMessageStatus, downloadAndSaveMediaMessage, AuthenticationState, initInMemoryKeyStore, MiscMessageGenerationOptions, useSingleFileAuthState, BufferJSON, WAMessageProto, MessageOptions, WAFlag, WANode, WAMetric, ChatModification, MessageTypeProto, WALocationMessage, ReconnectMode, WAContextInfo, ProxyAgent, waChatKey, MimetypeMap, MediaPathMap, WAContactMessage, WAContactsArrayMessage, WATextMessage, WAMessageContent, WAMessage, BaileysError, WA_MESSAGE_STATUS_TYPE, MediaConnInfo, URL_REGEX, WAUrlInfo, WAMediaUpload, mentionedJid, processTime, Browser, MessageType, Presence, WA_MESSAGE_STUB_TYPES, Mimetype, relayWAMessage, Browsers, DisconnectReason, WAconnet, getStream, WAProto, isBaileys, AnyMessageContent, templateMessage, InteractiveMessage, Header } = require("@whiskeysockets/baileys");

const fs = require("fs");
const axios = require("axios");
const chalk = require("chalk");
const path = require("path");
const crypto = require("crypto");
const { Sticker } = require("wa-sticker-formatter");
const FormData = require("form-data");

if (!global.db) global.db = {};

try {
  const dbContent = fs.readFileSync("./library/database/database.json", "utf8");
  global.db.data = JSON.parse(dbContent);
} catch (error) {
  console.log("Database file not found, creating empty database...");
  global.db.data = {};
}

global.db.data = { sticker: {}, database: {}, game: {}, others: {}, users: {}, chats: {}, settings: {}, ...(global.db.data || {}) };

const { addPremiumUser, delPremiumUser } = require("./library/lib/premiun");

module.exports = async (dave, m) => {
  try {
    const from = m.key.remoteJid;
    
    let body = m.mtype === "interactiveResponseMessage" ? (m.message.interactiveResponseMessage.nativeFlowResponseMessage && JSON.parse(m.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson || "{}").id) || "" : m.mtype === "conversation" ? m.message.conversation || "" : m.mtype == "imageMessage" ? m.message.imageMessage.caption || "" : m.mtype == "videoMessage" ? m.message.videoMessage.caption || "" : m.mtype == "extendedTextMessage" ? m.message.extendedTextMessage.text || "" : m.mtype == "buttonsResponseMessage" ? m.message.buttonsResponseMessage.selectedButtonId || "" : m.mtype == "listResponseMessage" ? m.message.listResponseMessage.singleSelectReply.selectedRowId || "" : m.mtype == "templateButtonReplyMessage" ? m.message.templateButtonReplyMessage.selectedId || "" : m.mtype == "messageContextInfo" ? m.message.buttonsResponseMessage?.selectedButtonId || m.message.listResponseMessage?.singleSelectReply?.selectedRowId || m.text || "" : "";

    m.text = m.text || body || "";

    const { smsg, fetchJson: fetchJsonLib, getBuffer, fetchBuffer, getGroupAdmins, TelegraPh, isUrl, hitungmundur, sleep, clockString, checkBandwidth, runtime, tanggal, getRandom } = require("./library/lib/function");
    
    const budy = typeof m.text === "string" ? m.text : "";
    const prefixMatch = body.match(/^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^]/);
    const prefix = prefixMatch ? prefixMatch[0] : global.xprefix || "";
    const usedPrefix = prefix || global.xprefix || "";
    const isCmd = body.startsWith(usedPrefix);
    const command = isCmd ? body.slice(usedPrefix.length).trim().split(" ").shift().toLowerCase() : "";
    const args = body.trim().split(/ +/).slice(1);
    const text = args.join(" ");
    const sender = m.key.fromMe ? (dave.user.id.split(":")[0] + "@s.whatsapp.net") || dave.user.id : m.key.participant || m.key.remoteJid;
    const botNumber = dave.user.id.split(":")[0];
    const senderNumber = sender.split("@")[0];
    const daveshown = (m && m.sender && [botNumber, ...(global.owner || [])].map((v) => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net").includes(m.sender)) || false;
    
    const premuser = JSON.parse(fs.readFileSync("./library/database/premium.json"));
    const isNumber = (x) => typeof x === "number" && !isNaN(x);
    const formatJid = (num) => num.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
    const isPremium = daveshown || (premuser && premuser.map((u) => formatJid(u.id)).includes(m.sender));
    const pushname = m.pushName || `${senderNumber}`;
    const isBot = botNumber.includes(senderNumber);
    const quoted = m.quoted ? m.quoted : m;
    const mime = (quoted.msg || quoted).mimetype || "";
    const isGroup = !!m.isGroup;
    const groupMetadata = m.isGroup ? await dave.groupMetadata(from).catch((e) => {}) : "";
    const participants = m.isGroup ? groupMetadata.participants : [];
    const groupAdmins = m.isGroup ? await getGroupAdmins(participants) : [];
    const isBotAdmins = m.isGroup ? groupAdmins.includes(botNumber) : false;
    const isAdmins = m.isGroup ? groupAdmins.includes(m.sender) : false;
    
    const db = global.db || { data: {} };
    const setting = db.data.settings?.[botNumber] || {};
    
    if (typeof setting !== "object") db.data.settings[botNumber] = {};
    if (setting) {
      if (!("anticall" in setting)) setting.anticall = false;
      if (!isNumber(setting.status)) setting.status = 0;
      if (!("autobio" in setting)) setting.autobio = false;
      if (!("autoread" in setting)) setting.autoread = false;
      if (!("online" in setting)) setting.online = true;
      if (!("autotyping" in setting)) setting.autoTyping = false;
      if (!("autorecording" in setting)) setting.autoRecord = false;
      if (!("autorecordtype" in setting)) setting.autorecordtype = false;
      if (!("onlygrub" in setting)) setting.onlygrub = false;
      if (!("onlypc" in setting)) setting.onlypc = false;
    } else {
      db.data.settings[botNumber] = { anticall: false, status: 0, stock: 10, autobio: false, autoTyping: true, auto_ai_grup: false, goodbye: false, onlygrub: false, onlypc: false, online: false, welcome: true, autoread: false, menuType: "externalImage" };
    }

    console.log(chalk.black(chalk.bgWhite(!command ? "[ MESSAGE ]" : "[ COMMAND ]")), chalk.black(chalk.bgGreen(new Date())), chalk.black(chalk.bgBlue(budy || m.mtype)) + "\n" + chalk.magenta("=> From"), chalk.green(pushname), chalk.yellow(m.sender) + "\n" + chalk.blueBright("=> In"), chalk.green(m.isGroup ? pushname : "Private Chat", m.chat));

    const fkontak = { key: { fromMe: false, participant: `0@s.whatsapp.net`, ...(from ? { remoteJid: "status@broadcast" } : {}) }, message: { contactMessage: { displayName: `𝘿𝙖𝙫𝙚𝘼𝙄`, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:XL;Vinzx,;;;\nFN:${pushname},\nitem1.TEL;waid=${sender.split("@")[0]}:${sender.split("@")[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`, jpegThumbnail: { url: "https://files.catbox.moe/yqbio5.jpg" } } } };

    let chats = db.data.chats?.[from];
    if (typeof chats !== "object") db.data.chats[from] = {};
    if (chats) {
      if (!("antilink" in chats)) chats.antilink = false;
      if (!("antilinkgc" in chats)) chats.antilinkgc = false;
      if (!("welcome" in chats)) chats.welcome = false;
      if (!("goodbye" in chats)) chats.goodbye = false;
      if (!("warn" in chats)) chats.warn = {};
    } else {
      db.data.chats[from] = { antilinkgc: false, antilink: false, welcome: false, goodbye: false, warn: {} };
    }

    // Anti-link protection
    if (db.data.chats[m.chat]?.antilinkgc && budy.match(`chat.whatsapp.com`)) {
      if (!isAdmins && !m.key.fromMe && !daveshown) {
        await dave.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: m.key.id, participant: m.key.participant } });
        dave.sendMessage(from, { text: `\`\`\`「 GC Link Detected 」\`\`\`\n\n@${m.sender.split("@")[0]} has sent a link and successfully deleted`, contextInfo: { mentionedJid: [m.sender] } }, { quoted: m });
      }
    }

    if (db.data.chats[m.chat]?.antilink && budy.match("http") && budy.match("https")) {
      if (!isAdmins && !m.key.fromMe && !daveshown) {
        await dave.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: m.key.id, participant: m.key.participant } });
        dave.sendMessage(from, { text: `\`\`\`「 Link Detected 」\`\`\`\n\n@${m.sender.split("@")[0]} has sent a link and successfully deleted`, contextInfo: { mentionedJid: [m.sender] } }, { quoted: m });
      }
    }

    // Auto-read messages
    if (!m.key.fromMe && db.data.settings[botNumber]?.autoread) {
      const readkey = { remoteJid: m.chat, id: m.key.id, participant: m.isGroup ? m.key.participant : undefined };
      await dave.readMessages([readkey]);
    }

    dave.sendPresenceUpdate("available", m.chat);

    if (db.data.settings[botNumber]?.autoTyping && m.message) {
      dave.sendPresenceUpdate("composing", m.chat);
    }

    if (db.data.settings[botNumber]?.autoRecord && m.message) {
      dave.sendPresenceUpdate("recording", m.chat);
    }

    if (db.data.settings[botNumber]?.autorecordtype) {
      let presenceModes = ["recording", "composing"];
      let selectedPresence = presenceModes[Math.floor(Math.random() * presenceModes.length)];
      dave.sendPresenceUpdate(selectedPresence, m.chat);
    }

    if (db.data.settings[botNumber]?.autobio) {
      let s = db.data.settings[botNumber];
      if (new Date() * 1 - s.status > 1000) {
        let uptime = await runtime(process.uptime());
        await dave.updateProfileStatus(`✳️𝘿𝙖𝙫𝙚𝘼𝙄 || Runtime : ${uptime}`);
        s.status = new Date() * 1;
      }
    }

    if (!m.isGroup && !daveshown && db.data.settings[botNumber]?.onlygrub && command) {
      return m.reply?.(`Hello buddy! Because We Want to Reduce Spam, Please Use Bot in the Group Chat !\n\nIf you have issue please chat owner wa.me/${global.owner}`);
    }

    if (!daveshown && db.data.settings[botNumber]?.onlypc && m.isGroup && command) {
      return m.reply?.("Hello buddy! if you want to use this bot, please chat the bot in private chat");
    }

    if (!dave.public && daveshown && !m.key.fromMe) return;
    
    if (db.data.settings[botNumber]?.online && command) {
      dave.sendPresenceUpdate("unavailable", from);
    }

    // Reply functions
    async function reply(textt) {
      dave.sendMessage(m.chat, { text: textt, contextInfo: { mentionedJid: [sender], externalAdReply: { title: "𝘿𝙖𝙫𝙚𝘼𝙄", body: "made by dave", thumbnailUrl: "https://n.uguu.se/BacqcVGE.jpg", sourceUrl: null, renderLargerThumbnail: false } } }, { quoted: m });
    }

    const trashpic = fs.readFileSync("./library/media/porno.jpg");
    async function replymenu(teks) {
      dave.sendMessage(m.chat, { image: trashpic, caption: teks, sourceUrl: "https://github.com/giftdee", contextInfo: { forwardingScore: 9, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: "120363400480173280@newsletter", newsletterName: "𝘿𝙖𝙫𝙚𝘼𝙄" } } }, { quoted: fkontak });
    }

    // React function
    const reaction = async (jidss, emoji) => {
      dave.sendMessage(jidss, { react: { text: emoji, key: m.key } });
    };

    if (m.isGroup && body.includes(`@254104260236`)) {
      reaction(m.chat, "❓");
    }

    // Main command handler
    if (!dave.isPublic && !daveshown) return;

    const example = (teks) => `\n *invalid format!*\n`;

    // Plugins loader
    const pluginsLoader = async (directory) => {
      let plugins = [];
      const folders = fs.readdirSync(directory);
      folders.forEach((file) => {
        const filePath = path.join(directory, file);
        if (filePath.endsWith(".js")) {
          try {
            const resolvedPath = require.resolve(filePath);
            if (require.cache[resolvedPath]) delete require.cache[resolvedPath];
            const plugin = require(filePath);
            plugins.push(plugin);
          } catch (error) {
            console.log(`Error loading plugin at ${filePath}:`, error);
          }
        }
      });
      return plugins;
    };

    // Load plugins
    let pluginsDisable = true;
    const plugins = await pluginsLoader(path.resolve(__dirname, "daveplugins"));
    const trashdex = { daveshown, reply, replymenu, command, isCmd, text, botNumber, prefix, fetchJson: fetchJsonLib, example, dave, m, sleep, fkontak, addPremiumUser, args, delPremiumUser, isPremium, trashpic, isAdmins, groupAdmins, isBotAdmins, quoted, from, groupMetadata, downloadAndSaveMediaMessage };
    
    for (let plugin of plugins) {
      if (plugin.command && plugin.command.find((e) => e == command)) {
        pluginsDisable = false;
        if (typeof plugin !== "function") return;
        await plugin(m, trashdex);
      }
    }
    if (!pluginsDisable) return;

    // Command switch cases
    switch (command) {
      case 'script':
      case 'repo': {
        const botInfo = `╭─ ⌬ Bot Info\n│ • Name    : ${botname}\n│ • Owner   : ${ownername}\n│ • Version : ${botversion}\n│ • Repo    : gitHub.com/gifteddevsmd/Dave-Ai/fork\n│ • Runtime : ${runtime(process.uptime())}\n╰─────────────`;
        reply(botInfo);
        break;
      }

      case 'ping': {
        const start = Date.now();
        const sentMsg = await m.reply('Pinging...');
        const latency = Date.now() - start;
        await dave.sendMessage(m.chat, { text: `Pong! Latency: ${latency}ms` }, { edit: sentMsg.key });
        break;
      }

      case 'uptime':
      case 'runtime': {
        const uptime = process.uptime();
        const days = Math.floor(uptime / (24 * 3600));
        const hours = Math.floor((uptime % (24 * 3600)) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        dave.sendMessage(m.chat, { text: `𝘿𝙖𝙫𝙚𝘼𝙄 Runtime: ${days}d ${hours}h ${minutes}m ${seconds}s` });
        break;
      }

      case 'dave': {
        if (!text) return reply("Hello, how may I help you 🤷?");
        try {
          const url = `https://api.dreaded.site/api/aichat?query=${encodeURIComponent(text)}`;
          const response = await fetch(url);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data = await response.json();
          const aiReply = data.result || data.response || null;
          if (!aiReply) return reply("❌ No response from AI. Try again later.");
          const MAX_LENGTH = 4000;
          const finalReply = aiReply.length > MAX_LENGTH ? aiReply.slice(0, MAX_LENGTH) + "..." : aiReply;
          reply(`*𝘿𝙖𝙫𝙚𝘼𝙄:*\n\n${finalReply}`);
        } catch (error) {
          console.error('GPT Error:', error);
          reply("❌ An error occurred while communicating with the AI.");
        }
        break;
      }

      default:
        // Handle eval and exec commands
        if (budy.startsWith('=>') && daveshown) {
          try {
            reply(util.format(eval(`(async () => { return ${budy.slice(3)} })()`)));
          } catch (e) {
            reply(String(e));
          }
        }

        if (budy.startsWith('>') && daveshown) {
          let kode = budy.trim().split(/ +/)[0];
          let teks;
          try {
            teks = await eval(`(async () => { ${kode == ">>" ? "return" : ""} ${text}})()`);
          } catch (e) {
            teks = e;
          } finally {
            await reply(require('util').format(teks));
          }
        }

        if (budy.startsWith('$') && daveshown) {
          const { exec } = require("child_process");
          exec(budy.slice(2), (err, stdout) => {
            if (err) return reply(`${err}`);
            if (stdout) return reply(stdout);
          });
        }
    }

  } catch (err) {
    let error = err.stack || err.message || util.format(err);
    console.log('====== ERROR REPORT ======');
    console.log(error);
    console.log('==========================');

    await dave.sendMessage(`${error}@s.whatsapp.net`, {
      text: `⚠️ *ERROR!*\n\n📌 *Message:* ${err.message || '-'}\n📂 *Stack Trace:*\n${error}`,
      contextInfo: { forwardingScore: 9999999, isForwarded: true }
    }, { quoted: m });
  }
}

// File watcher for updates
let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(`Update File 📁 : ${__filename}`);
  delete require.cache[file];
  require(file);
});