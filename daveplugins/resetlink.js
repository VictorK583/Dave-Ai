let daveplug = async (m, { daveshown, dave, reply, isAdmins, xprefix, command }) => {
  if (!m.isGroup) return reply("This command only works in groups.");
  if (!daveshown && !isAdmins) return reply("Only group admins can use this command.");

  try {
    // Check if bot is admin manually
    const groupMetadata = await dave.groupMetadata(m.chat);
    const botNumber = dave.user.id.split(':')[0] + '@s.whatsapp.net';
    const botIsAdmin = groupMetadata.participants.some(p => p.id === botNumber && p.admin);

    if (!botIsAdmin) return reply("I need admin rights to reset the group link.");

    // Processing indicator
    await dave.sendMessage(m.chat, { react: { text: '...', key: m.key } });

    // Reset the group link
    const newCode = await dave.groupRevokeInvite(m.chat);

    // Success message
    await reply(
      `Group link has been successfully reset.\n\nNew Link:\nhttps://chat.whatsapp.com/${newCode}\n\nNote: The old invite link is now invalid.`
    );

    await dave.sendMessage(m.chat, { react: { text: '✓', key: m.key } });

  } catch (err) {
    console.error('Reset Link Error:', err);
    if (err.message.includes('not authorized')) {
      await reply("Bot doesn't have permission to reset the group link.");
    } else {
      await reply("An unexpected error occurred while resetting the link.");
    }
  }
};

daveplug.help = ['resetlink'];
daveplug.tags = ['group'];
daveplug.command = ['resetlink', 'newlink', 'revokelink'];

module.exports = daveplug;