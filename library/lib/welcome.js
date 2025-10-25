const {
  generateWAMessageFromContent,
  generateWAMessage,
  prepareWAMessageMedia,
  downloadContentFromMessage,
  proto,
  delay
} = require('@whiskeysockets/baileys');
const fs = require('fs');
const chalk = require('chalk');
// Remove the loadSettings import since we're using globals

module.exports.welcome = async (iswel, isleft, dave, anu) => {
  try {
    // ✅ Use global settings instead of loading from file
    const settings = global.settings || {};
    const metadata = await dave.groupMetadata(anu.id);
    const participants = anu.participants || [];
    const num = participants[0];
    const groupName = metadata.subject;
    const groupDesc = metadata.desc || '';
    const memberCount = metadata.participants.length;

    // ✅ Use global settings directly
    const isWelcomeEnabled = global.welcome || settings.welcome || false;
    const isLeftEnabled = settings.goodbye || false; // Note: goodbye setting not in your globals

    const mentionedJid = [`${num}`];
    let avatarUrl, ppgroup;

    try {
      avatarUrl = await dave.profilePictureUrl(num, 'image');
    } catch {
      avatarUrl = 'https://i.ibb.co/Z2Fyf4t/default-avatar.png';
    }

    try {
      ppgroup = await dave.profilePictureUrl(anu.id, 'image');
    } catch {
      ppgroup = 'https://url.bwmxmd.online/Adams.gpfw8239.jpg';
    }

    // ✅ Welcome Message - use global botname
    if (anu.action === 'add' && (iswel || isWelcomeEnabled)) {
      const text =
        settings.text_welcome ||
        `👋 Welcome @${num.split('@')[0]}!\nTo *${groupName}* 🎉`;

      await dave.sendMessage(anu.id, {
        text,
        contextInfo: {
          mentionedJid,
          externalAdReply: {
            title: 'Hello! Welcome!',
            body: `${global.botname || 'DaveAI'}`,
            thumbnailUrl: ppgroup,
            sourceUrl: 'https://github.com/gifteddevsmd/Dave-AI',
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      });
    }

    // ✅ Goodbye Message - use global botname
    if (anu.action === 'remove' && (isleft || isLeftEnabled)) {
      const text =
        settings.text_left ||
        `👋 Goodbye @${num.split('@')[0]}!\nFrom *${groupName}* 😢`;

      await dave.sendMessage(anu.id, {
        text,
        contextInfo: {
          mentionedJid,
          externalAdReply: {
            title: 'Goodbye! See you soon!',
            body: `${global.botname || 'DaveAI'}`,
            thumbnailUrl: ppgroup,
            sourceUrl: 'https://whatsapp.com/channel/0029VbApvFQ2Jl84lhONkc3k',
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      });
    }
  } catch (err) {
    console.error('Error in welcome handler:', err);
  }
};

// ✅ Auto reload on save
let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.greenBright(`Update File => ${__filename}`));
  delete require.cache[file];
  require(file);
});