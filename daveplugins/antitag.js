const { setAntitag, getAntitag, removeAntitag } = require('../lib/index');

let daveplug = async (m, { dave, daveshown, isAdmins, reply, text, prefix, command }) => {
    try {
        if (!m.isGroup) return reply("This command only works in groups.");
        if (!daveshown && !isAdmins) return reply("Only group admins can use this command.");

        const args = text ? text.trim().split(' ') : [];
        const action = args[0];

        if (!action) {
            return await reply(`ANTITAG SETUP\n\n${prefix}antitag on\n${prefix}antitag set delete | kick\n${prefix}antitag off\n${prefix}antitag get`);
        }

        // Add processing reaction
        await dave.sendMessage(m.chat, {
            react: { text: '...', key: m.key }
        });

        switch (action) {
            case 'on':
                const existingConfig = await getAntitag(m.chat, 'on');
                if (existingConfig?.enabled) {
                    await reply("Antitag is already on");
                    return;
                }
                const result = await setAntitag(m.chat, 'on', 'delete');
                await reply(result ? "Antitag has been turned ON" : "Failed to turn on Antitag");
                break;

            case 'off':
                await removeAntitag(m.chat, 'on');
                await reply("Antitag has been turned OFF");
                break;

            case 'set':
                if (args.length < 2) {
                    await reply(`Please specify an action: ${prefix}antitag set delete | kick`);
                    return;
                }
                const setAction = args[1];
                if (!['delete', 'kick'].includes(setAction)) {
                    await reply("Invalid action. Choose delete or kick.");
                    return;
                }
                const setResult = await setAntitag(m.chat, 'on', setAction);
                await reply(setResult ? `Antitag action set to ${setAction}` : "Failed to set Antitag action");
                break;

            case 'get':
                const status = await getAntitag(m.chat, 'on');
                const actionConfig = await getAntitag(m.chat, 'on');
                await reply(`Antitag Configuration:\nStatus: ${status ? 'ON' : 'OFF'}\nAction: ${actionConfig ? actionConfig.action : 'Not set'}`);
                break;

            default:
                await reply(`Use ${prefix}antitag for usage.`);
        }

        // Add success reaction
        await dave.sendMessage(m.chat, {
            react: { text: '✓', key: m.key }
        });

    } catch (error) {
        console.error('Antitag Command Error:', error);
        
        // Add error reaction
        await dave.sendMessage(m.chat, {
            react: { text: '✗', key: m.key }
        });
        
        await reply("Error processing antitag command");
    }
};

// Tag detection handler - this should be called from your main message handler
daveplug.detectTag = async (dave, m) => {
    try {
        const antitagSetting = await getAntitag(m.chat, 'on');
        if (!antitagSetting || !antitagSetting.enabled) return;

        // Check if message contains mentions
        const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || 
                        [];

        // Check if it's a group message and has multiple mentions
        if (mentions.length > 0 && mentions.length >= 3) {
            // Get group participants to check if it's tagging most/all members
            const groupMetadata = await dave.groupMetadata(m.chat);
            const participants = groupMetadata.participants || [];
            
            // If mentions are more than 50% of group members, consider it as tagall
            const mentionThreshold = Math.ceil(participants.length * 0.5);
            
            if (mentions.length >= mentionThreshold) {
                
                const action = antitagSetting.action || 'delete';
                
                if (action === 'delete') {
                    // Delete the message
                    await dave.sendMessage(m.chat, {
                        delete: {
                            remoteJid: m.chat,
                            fromMe: false,
                            id: m.key.id,
                            participant: m.sender
                        }
                    });
                    
                    // Send warning
                    await dave.sendMessage(m.chat, {
                        text: `Tagall Detected!`
                    });

                } else if (action === 'kick') {
                    // First delete the message
                    await dave.sendMessage(m.chat, {
                        delete: {
                            remoteJid: m.chat,
                            fromMe: false,
                            id: m.key.id,
                            participant: m.sender
                        }
                    });

                    // Then kick the user
                    await dave.groupParticipantsUpdate(m.chat, [m.sender], "remove");

                    // Send notification
                    await dave.sendMessage(m.chat, {
                        text: `Antitag Detected!\n\n@${m.sender.split('@')[0]} has been kicked for tagging all members.`,
                        mentions: [m.sender]
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error in tag detection:', error);
    }
};

daveplug.help = ['antitag'];
daveplug.tags = ['group'];
daveplug.command = ['antitag'];

module.exports = daveplug;