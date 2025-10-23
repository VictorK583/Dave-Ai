let daveplug = async (m, { daveshown, dave, reply, isBotAdmins, isAdmins, prefix, command }) => {
  if (!m.isGroup) return reply("This command only works in groups.");
  if (!isBotAdmins) return reply("I need admin rights to reset group link.");
  if (!daveshown && !isAdmins) return reply("Only group admins can use this command.");

  try {
    // Add processing reaction
    await dave.sendMessage(m.chat, {
      react: { text: '🔄', key: m.key }
    });

    // Reset the group link
    const newCode = await dave.groupRevokeInvite(m.chat);
    
    // Add success reaction
    await dave.sendMessage(m.chat, {
      react: { text: '✅', key: m.key }
    });
    
    // Send success message with new link
    await reply(`✅ *Group Link Reset Successfully!*\n\n📌 *New Group Link:*\nhttps://chat.whatsapp.com/${newCode}\n\n🔒 *Note:* The previous link has been revoked and is no longer valid.`);

  } catch (err) {
    console.error('Reset Link Error:', err);
    
    // Specific error handling
    if (err.message.includes('not authorized')) {
      await reply("Bot doesn't have permission to reset group link!");
    } else if (err.message.includes('group invite')) {
      await reply("Failed to reset group link. Please try again.");
    } else {
      await reply("An error occurred while resetting the group link.");
    }
  }
};

daveplug.help = ['resetlink'];
daveplug.tags = ['group'];
daveplug.command = ['resetlink', 'newlink', 'revokelink'];

module.exports = daveplug;