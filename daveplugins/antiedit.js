const processedEdits = new Map();
const EDIT_COOLDOWN = 5000;

let daveplug = async (m, { daveshown, dave, args, reply }) => {
    if (!daveshown) return reply('❌ This command is owner only.');

    const mode = args[0]?.toLowerCase();
    if (!mode || !['on', 'off', 'private'].includes(mode)) {
        return reply(
            '*📝 ANTIEDIT USAGE*\n\n' +
            '`.antiedit on` - Enable in chats\n' +
            '`.antiedit private` - Send alerts to bot owner\n' +
            '`.antiedit off` - Disable'
        );
    }

    global.antiedit = mode;

    if (mode === 'on') return reply('✅ _Antiedit enabled in all chats_');
    if (mode === 'private') return reply('✅ _Antiedit enabled - alerts will be sent privately_');
    return reply('❌ _Antiedit disabled_');
};

// Event listener for Baileys
daveplug.before = async (m, { dave }) => {
    if (!daveplug._listenerRegistered) {
        dave.ev.on('messages.update', async (updates) => {
            try {
                if (!global.antiedit || global.antiedit === 'off') return;

                const now = Date.now();

                for (const update of updates) {
                    const { key, update: updateData } = update;
                    
                    // Baileys message.update structure validation
                    if (!key?.remoteJid || !key?.id) continue;
                    if (!updateData?.message) continue;

                    const chat = key.remoteJid;
                    const sender = key.participant || key.remoteJid;
                    const senderKey = `${chat}-${sender}`;

                    // Skip bot's own messages
                    const botNumber = dave.user.id.split(':')[0];
                    if (sender.includes(botNumber)) continue;

                    // Baileys edit detection - check multiple paths
                    let editedMsg = null;
                    let originalMsg = null;

                    // Method 1: editedMessage wrapper (most common)
                    if (updateData.message.editedMessage) {
                        editedMsg = updateData.message.editedMessage.message;
                        originalMsg = updateData.message.editedMessage.message; // New content
                    }
                    
                    // Method 2: protocolMessage with REVOKE type
                    else if (updateData.message.protocolMessage) {
                        const proto = updateData.message.protocolMessage;
                        if (proto.type === 1 && proto.editedMessage) { // Type 1 = MESSAGE_EDIT
                            editedMsg = proto.editedMessage;
                        }
                    }

                    if (!editedMsg) continue;

                    // Cooldown check
                    if (processedEdits.has(senderKey)) {
                        const last = processedEdits.get(senderKey);
                        if (now - last.timestamp < EDIT_COOLDOWN) continue;
                    }

                    const getContent = (msg) => {
                        if (!msg) return '[Unable to retrieve content]';
                        const type = Object.keys(msg)[0];
                        const content = msg[type];

                        switch (type) {
                            case 'conversation': 
                                return content;
                            case 'extendedTextMessage': 
                                return content.text + (content.contextInfo?.quotedMessage ? ' _(with quote)_' : '');
                            case 'imageMessage': 
                                return `📷 Image: ${content.caption || '_No caption_'}`;
                            case 'videoMessage': 
                                return `🎥 Video: ${content.caption || '_No caption_'}`;
                            case 'documentMessage': 
                                return `📄 Document: ${content.fileName || '_No filename_'}`;
                            case 'audioMessage':
                                return `🎵 Audio message`;
                            case 'stickerMessage':
                                return `🎨 Sticker`;
                            default: 
                                return `[${type.replace('Message', '')}]`;
                        }
                    };

                    const editedContent = getContent(editedMsg);
                    const senderName = sender.split('@')[0];
                    const chatType = chat.endsWith('@g.us') ? 'Group' : 'Private';

                    // Get group name if in group
                    let chatName = chatType;
                    if (chat.endsWith('@g.us')) {
                        try {
                            const groupMeta = await dave.groupMetadata(chat).catch(() => null);
                            chatName = groupMeta?.subject || 'Unknown Group';
                        } catch {}
                    }

                    const notificationMessage =
                        `⚠️ *MESSAGE EDITED*\n\n` +
                        `👤 *Sender:* @${senderName}\n` +
                        `✏️ *New Message:* ${editedContent}\n` +
                        `📍 *Chat:* ${chatName}\n` +
                        `🕐 *Time:* ${new Date().toLocaleTimeString()}`;

                    const sendTo = global.antiedit === 'private' 
                        ? dave.user.id.split(':')[0] + '@s.whatsapp.net'
                        : chat;

                    await dave.sendMessage(sendTo, { 
                        text: notificationMessage, 
                        mentions: [sender] 
                    }).catch(err => {
                        console.error('Failed to send antiedit alert:', err.message);
                    });

                    processedEdits.set(senderKey, { timestamp: now });
                    
                    console.log(`📝 Antiedit: ${senderName} edited message in ${chatName}`);
                }

                // Cleanup old entries
                for (const [key, data] of processedEdits) {
                    if (now - data.timestamp > 60000) processedEdits.delete(key);
                }

            } catch (err) {
                console.error('ANTIEDIT ERROR:', err);
            }
        });

        daveplug._listenerRegistered = true;
        console.log('✅ Antiedit listener registered (Baileys messages.update)');
    }
};

daveplug.help = ['antiedit'];
daveplug.tags = ['owner', 'security'];
daveplug.command = ['antiedit'];

module.exports = daveplug;