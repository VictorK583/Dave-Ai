const axios = require('axios');

let daveplug = async (m, { daveshown, text, dave, reply, isBotAdmins, isAdmins, xprefix, command, args }) => {
    if (!m.isGroup) return reply("This command only works in groups.");
    if (!isBotAdmins) return reply("I need admin rights to remove someone.");
    if (!daveshown && !isAdmins) return reply("Only group admins can use this command.");

    // Identify target user
    if (!m.quoted && (!m.mentionedJid || !m.mentionedJid[0]) && !args[0]) {
        return reply(`Usage:\n${xprefix + command} @user\nor reply to a message.`);
    }

    let target = m.mentionedJid?.[0]
        ? m.mentionedJid[0]
        : m.quoted
        ? m.quoted.sender
        : `${text.replace(/[^0-9]/g, '')}@s.whatsapp.net`;

    // Prevent kicking the owner or the bot itself
    if (global.owner && global.owner.includes(target.replace('@s.whatsapp.net', ''))) {
        return reply("You can’t remove the bot owner.");
    }

    if (target === dave.user.id) {
        return reply("You can’t remove me from the group.");
    }

    try {
        await dave.groupParticipantsUpdate(m.chat, [target], 'remove');
        await reply("User removed successfully.");
    } catch (err) {
        console.error('Kick Error:', err);
        await reply("Failed to remove user. Please check bot admin permissions.");
    }
};

daveplug.help = ['kick', 'remove'];
daveplug.tags = ['group'];
daveplug.command = ['kick', 'remove'];

module.exports = daveplug;