const processedEdits = new Map();
const EDIT_COOLDOWN = 5000; // 5 seconds cooldown per sender

let daveplug = async (m, { daveshown, dave, args, reply }) => {
    if (!daveshown) return reply('❌ This command is owner only.');

    const mode = args[0]?.toLowerCase();
    if (!mode || !['on', 'off', 'private'].includes(mode)) {
        return reply(
            'Usage: .antiedit <on|off|private>\n\n' +
            'on - Enable in chats\n' +
            'private - Send alerts to bot owner\noff - Disable'
        );
    }

    global.antiedit = mode;

    if (mode === 'on') return reply('✅ Antiedit enabled in all chats');
    if (mode === 'private') return reply('✅ Antiedit enabled - alerts will be sent privately to bot owner');
    return reply('✅ Antiedit disabled');
};

// Initialize event listener
daveplug.init = (dave, store) => {
    dave.ev.on('messages.update', async (updates) => {
        try {
            if (!global.antiedit || global.antiedit === 'off') return;

            const now = Date.now();

            for (const update of updates) {
                const { key, update: updateData } = update;
                if (!key?.id || !updateData.message) continue;

                const chat = key.remoteJid;
                const sender = key.participant || key.remoteJid;
                const senderKey = `${chat}-${sender}`;

                const editedMsg = updateData.message?.editedMessage?.message
                               || updateData.message?.protocolMessage?.editedMessage?.message
                               || updateData.message?.editedMessage;
                if (!editedMsg) continue;

                const originalMsg = await store.loadMessage(chat, key.id) || {};

                const getContent = (msg) => {
                    if (!msg) return '[Deleted]';
                    const type = Object.keys(msg)[0];
                    const content = msg[type];

                    switch (type) {
                        case 'conversation': return content;
                        case 'extendedTextMessage': return content.text + (content.contextInfo?.quotedMessage ? ' (with quoted message)' : '');
                        case 'imageMessage': return `Image: ${content.caption || 'No caption'}`;
                        case 'videoMessage': return `Video: ${content.caption || 'No caption'}`;
                        case 'documentMessage': return `Document: ${content.fileName || 'No filename'}`;
                        default: return `[${type.replace('Message','')}]`;
                    }
                };

                const originalContent = getContent(originalMsg.message);
                const editedContent = getContent(editedMsg);

                if (originalContent === editedContent) continue;

                // Skip if sender recently triggered
                if (processedEdits.has(senderKey)) {
                    const last = processedEdits.get(senderKey);
                    if (now - last.timestamp < EDIT_COOLDOWN && last.edited === editedContent) continue;
                }

                const notificationMessage =
                    `💡 ANTIEDIT ALERT\n\n` +
                    `Sender: @${sender.split('@')[0]}\n` +
                    `Original: ${originalContent}\n` +
                    `Edited: ${editedContent}\n` +
                    `Chat: ${chat.endsWith('@g.us') ? 'Group' : 'Private'}`;

                const sendTo = global.antiedit === 'private' ? dave.user.id : chat;

                await dave.sendMessage(sendTo, { text: notificationMessage, mentions: [sender] }).catch(() => {});

                // Save last edit for this sender
                processedEdits.set(senderKey, { timestamp: now, edited: editedContent });
            }

            // Cleanup old entries
            for (const [key, data] of processedEdits) {
                if (now - data.timestamp > 60000) processedEdits.delete(key);
            }

        } catch (err) {
            console.error('[ANTIEDIT ERROR]', err);
        }
    });
};

daveplug.help = ['antiedit'];
daveplug.tags = ['owner', 'security'];
daveplug.command = ['antiedit'];

module.exports = daveplug;