const axios = require('axios');

let daveplug = async (m, { daveshown, text, dave, reply, isAdmins, isBotAdmins, xprefix, command }) => {
    if (!m.isGroup) return reply("This command only works in groups.");
    
    // Check if bot is admin
    if (!isBotAdmins) return reply("I need to be admin to demote someone.");
    
    // Check if user is admin or owner
    if (!daveshown && !isAdmins) return reply("Only group admins or the owner can use this command.");
    
    if (!text && !m.quoted && !m.mentionedJid[0]) {
        return reply(`Example: ${xprefix + command} @user or reply to a message.`);
    }

    // Determine target user
    let users = m.mentionedJid[0]
        ? m.mentionedJid[0]
        : m.quoted
        ? m.quoted.sender
        : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';

    try {
        await dave.groupParticipantsUpdate(m.chat, [users], 'demote');
        reply("User has been demoted successfully.");
    } catch (err) {
        console.error(err);
        reply("Failed to demote the user. Make sure I have admin rights.");
    }
};

daveplug.help = ['demote'];
daveplug.tags = ['group'];
daveplug.command = ['demote'];

module.exports = daveplug;