const fs = require('fs');
const path = require('path');

/**
 * Read or create Antitag configuration from JSON database
 */
async function getAntitag(chatId, defaultState = 'off') {
    try {
        const filePath = path.join(__dirname, '../../database/antitag.json');
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
        }

        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (!data[chatId]) {
            data[chatId] = { enabled: defaultState === 'on', action: 'delete' };
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        }

        return data[chatId];
    } catch (error) {
        console.error('Error reading antitag settings:', error);
        return { enabled: false, action: 'delete' };
    }
}

/**
 * Detects tag-all behavior and takes configured action (delete or kick)
 */
async function handleTagDetection(dave, m) {
    try {
        const antitagSetting = await getAntitag(m.chat, 'on');
        if (!antitagSetting || !antitagSetting.enabled) return;

        // Extract mentioned JIDs
        const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

        // Only act if tagging multiple users
        if (mentions.length >= 3) {
            const groupMetadata = await dave.groupMetadata(m.chat);
            const participants = groupMetadata.participants || [];
            const mentionThreshold = Math.ceil(participants.length * 0.5);

            if (mentions.length >= mentionThreshold) {
                const action = antitagSetting.action || 'delete';

                if (action === 'delete') {
                    await dave.sendMessage(m.chat, {
                        delete: {
                            remoteJid: m.chat,
                            fromMe: false,
                            id: m.key.id,
                            participant: m.sender
                        }
                    });

                    await dave.sendMessage(m.chat, { text: `🚫 Tagall Detected and Message Deleted!` });

                } else if (action === 'kick') {
                    await dave.sendMessage(m.chat, {
                        delete: {
                            remoteJid: m.chat,
                            fromMe: false,
                            id: m.key.id,
                            participant: m.sender
                        }
                    });

                    await dave.groupParticipantsUpdate(m.chat, [m.sender], 'remove');

                    await dave.sendMessage(m.chat, {
                        text: `🚫 Antitag Detected!\n@${m.sender.split('@')[0]} has been removed for tagging all members.`,
                        mentions: [m.sender]
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error in tag detection:', error);
    }
}

module.exports = {
    handleTagDetection,
    getAntitag
};