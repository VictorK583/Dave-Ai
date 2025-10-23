const { setAntitag, getAntitag, removeAntitag } = require('../library/lib/index');

let daveplug = async (m, { dave, daveshown, isAdmins, reply, text, xprefix, command }) => {
    try {
        if (!m.isGroup) return reply("This command only works in groups.");
        if (!daveshown && !isAdmins) return reply("Only group admins can use this command.");

        const args = text ? text.trim().split(' ') : [];
        const action = args[0]?.toLowerCase();

        if (!action) {
            return reply(
                `🛡️ *ANTITAG SETUP*\n\n` +
                `${xprefix}antitag on\n` +
                `${xprefix}antitag off\n` +
                `${xprefix}antitag set delete | kick\n` +
                `${xprefix}antitag get`
            );
        }

        // React: processing
        await dave.sendMessage(m.chat, { react: { text: '⚙️', key: m.key } });

        switch (action) {
            case 'on': {
                const config = await getAntitag(m.chat, 'on');
                if (config.enabled) return reply("✅ Antitag is already *ON*.");

                const result = await setAntitag(m.chat, 'on', 'delete');
                reply(result ? "✅ Antitag has been turned *ON*." : "❌ Failed to turn on Antitag.");
                break;
            }

            case 'off': {
                await removeAntitag(m.chat);
                reply("❎ Antitag has been turned *OFF*.");
                break;
            }

            case 'set': {
                const setAction = args[1];
                if (!['delete', 'kick'].includes(setAction))
                    return reply(`Invalid action.\nUse: ${xprefix}antitag set delete | kick`);

                const result = await setAntitag(m.chat, 'on', setAction);
                reply(result ? `⚙️ Antitag action set to *${setAction.toUpperCase()}*.` : "❌ Failed to set Antitag action.");
                break;
            }

            case 'get': {
                const config = await getAntitag(m.chat, 'on');
                reply(
                    `🧩 *ANTITAG CONFIGURATION*\n\n` +
                    `Status: ${config.enabled ? '🟢 ON' : '🔴 OFF'}\n` +
                    `Action: ${config.action.toUpperCase()}`
                );
                break;
            }

            default:
                reply(`❔ Unknown command.\nUse *${xprefix}antitag* for help.`);
        }

        // React: done
        await dave.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

    } catch (error) {
        console.error('Antitag Command Error:', error);
        await dave.sendMessage(m.chat, { react: { text: '⚠️', key: m.key } });
        reply("⚠️ Error processing antitag command.");
    }
};

// Tag detection handler (called from message handler)
daveplug.detectTag = async (dave, m) => {
    try {
        const config = await getAntitag(m.chat, 'on');
        if (!config?.enabled) return;

        const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentions.length < 3) return;

        const group = await dave.groupMetadata(m.chat);
        const threshold = Math.ceil(group.participants.length * 0.5);

        if (mentions.length >= threshold) {
            if (config.action === 'delete') {
                await dave.sendMessage(m.chat, {
                    delete: { remoteJid: m.chat, fromMe: false, id: m.key.id, participant: m.sender }
                });
                await dave.sendMessage(m.chat, { text: `🚫 Tagall Detected! Message Deleted.` });
            } else if (config.action === 'kick') {
                await dave.sendMessage(m.chat, {
                    delete: { remoteJid: m.chat, fromMe: false, id: m.key.id, participant: m.sender }
                });
                await dave.groupParticipantsUpdate(m.chat, [m.sender], "remove");
                await dave.sendMessage(m.chat, {
                    text: `🚫 Antitag Triggered!\n@${m.sender.split('@')[0]} removed for tagging all members.`,
                    mentions: [m.sender]
                });
            }
        }
    } catch (e) {
        console.error('Tag Detection Error:', e);
    }
};

daveplug.help = ['antitag'];
daveplug.tags = ['group'];
daveplug.command = ['antitag'];

module.exports = daveplug;