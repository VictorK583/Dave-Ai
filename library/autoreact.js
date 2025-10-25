

const emojis = [
  '💜','💝','💖','💗','💓','💞','💕','💟','❣️','💔',
  '❤️','🧡','💛','💚','💙','🤎','🖤','🤍','❤️‍🔥','🩹',
  '💯','🔰','⭕️','✅','❌','〽️','💐'
];

/**
 * Send a reaction to a message (works for chats & statuses)
 * @param {string} emoji - Emoji to react with
 * @param {import('@whiskeysockets/baileys').WAMessage} mek - The message object
 * @param {import('@whiskeysockets/baileys').MakeWASocket} dave - The bot socket instance
 */
async function doReact(emoji, mek, dave) {
  try {
    if (!mek || !mek.key) return;

    const chatId = mek.key.remoteJid;
    const participant = mek.key.participant || mek.participant || null;

    const react = {
      react: {
        text: emoji,
        key: mek.key,
      },
    };

    // ✅ Handle status reactions separately
    if (chatId === 'status@broadcast' && participant) {
      await dave.sendMessage(
        'status@broadcast',
        react,
        { statusJidList: [participant] }
      );
    } else {
      await dave.sendMessage(chatId, react);
    }
  } catch (error) {
    console.error('Error sending auto reaction:', error.message);
  }
}

module.exports = { emojis, doReact };