const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

async function downloadMediaMessage(message, mediaType) {
    const stream = await downloadContentFromMessage(message, mediaType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
    const tempDir = path.join(process.cwd(), 'temp');
    fs.mkdirSync(tempDir, { recursive: true });
    const filePath = path.join(tempDir, `${Date.now()}.${mediaType}`);
    fs.writeFileSync(filePath, buffer);
    return filePath;
}

let daveplug = async (m, { dave, daveshown, isAdmins, reply, quoted, text, xprefix, command }) => {
    if (!m.isGroup) return reply("This command only works in groups.");
    if (!daveshown && !isAdmins) return reply("Only group admins can use this command.");

    try {
        await dave.sendMessage(m.chat, { react: { text: '...', key: m.key } });

        const groupMetadata = await dave.groupMetadata(m.chat);
        const participants = groupMetadata.participants;
        const adminParticipants = participants.filter(p => p.admin).map(p => p.id);

        if (adminParticipants.length === 0) return reply("No admins found in this group.");

        if (quoted) {
            let messageContent = {};
            let filePath;

            try {
                if (quoted.message?.imageMessage) {
                    filePath = await downloadMediaMessage(quoted.message.imageMessage, 'image');
                    messageContent = {
                        image: { url: filePath },
                        caption: text || quoted.message.imageMessage.caption || '',
                        mentions: adminParticipants
                    };
                } else if (quoted.message?.videoMessage) {
                    filePath = await downloadMediaMessage(quoted.message.videoMessage, 'video');
                    messageContent = {
                        video: { url: filePath },
                        caption: text || quoted.message.videoMessage.caption || '',
                        mentions: adminParticipants
                    };
                } else if (quoted.message?.conversation || quoted.message?.extendedTextMessage) {
                    messageContent = {
                        text: quoted.message.conversation || quoted.message.extendedTextMessage.text,
                        mentions: adminParticipants
                    };
                } else if (quoted.message?.documentMessage) {
                    filePath = await downloadMediaMessage(quoted.message.documentMessage, 'document');
                    messageContent = {
                        document: { url: filePath },
                        fileName: quoted.message.documentMessage.fileName,
                        caption: text || '',
                        mentions: adminParticipants
                    };
                } else {
                    return reply("Unsupported message type for tagging.");
                }

                await dave.sendMessage(m.chat, messageContent);
                if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);

            } catch {
                // fallback to text tagging if sending media fails
                await dave.sendMessage(m.chat, {
                    text: text || "Admins tagged (media fallback).",
                    mentions: adminParticipants
                });
            }

        } else {
            await dave.sendMessage(m.chat, {
                text: text || "Hey admins!",
                mentions: adminParticipants
            });
        }

        await dave.sendMessage(m.chat, { react: { text: '✓', key: m.key } });

    } catch (err) {
        console.error('Tag Command Error:', err);
        await dave.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
        await reply("Failed to tag admins. Please try again.");
    }
};

daveplug.help = ['tag', 'hey'];
daveplug.tags = ['group'];
daveplug.command = ['tag', 'hey'];

module.exports = daveplug;