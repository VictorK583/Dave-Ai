let daveplug = async (m, { daveshown, dave, args, q, reply }) => {
    if (!daveshown) return reply('❌ This command is owner only.');

    // Initialize in-memory settings
    if (!global.anticallSettings) {
        global.anticallSettings = {
            enabled: false,
            whitelist: [],
            message: '📵 *Calls Not Allowed*\nYour call was automatically rejected. Please send a text message instead.'
        };
    }

    const sub = args[0]?.toLowerCase();
    const input = args.slice(1).join(' ');

    // Helper: normalize number to JID
    const normalizeJid = (number) => {
        if (!number) return null;
        let num = number.replace(/\D/g, '');
        if (num.startsWith('0')) num = '254' + num.slice(1);
        return num + '@s.whatsapp.net';
    };

    if (!sub) {
        return reply(
            `*📞 ANTICALL COMMANDS 📞*\n\n` +
            `.anticall on/off/status\n` +
            `.anticall whitelist add/remove/list <number>\n` +
            `.anticall message <your text>`
        );
    }

    // Toggle anticall
    if (['on', 'off', 'status'].includes(sub)) {
        if (sub === 'status') {
            const wl = global.anticallSettings.whitelist.map(j => j.split('@')[0]).join(', ') || 'None';
            return reply(
                `📞 *Anticall Status*\n\n` +
                `Status: *${global.anticallSettings.enabled ? 'ENABLED ✅' : 'DISABLED ❌'}*\n` +
                `Whitelist: ${wl}\n` +
                `Message: ${global.anticallSettings.message}`
            );
        }

        global.anticallSettings.enabled = sub === 'on';
        return reply(`📞 Anticall is now *${global.anticallSettings.enabled ? 'ENABLED ✅' : 'DISABLED ❌'}*.`);
    }

    // Whitelist management
    if (sub === 'whitelist') {
        const action = args[1]?.toLowerCase();
        const jid = normalizeJid(args[2]);

        if (!action) return reply(`💡 Usage: .anticall whitelist add/remove/list <number>`);

        if (action === 'add') {
            if (!jid) return reply(`❌ Please provide a valid number.`);
            if (!global.anticallSettings.whitelist.includes(jid)) {
                global.anticallSettings.whitelist.push(jid);
                return reply(`✅ Added ${jid.split('@')[0]} to anticall whitelist.`);
            } else {
                return reply(`ℹ️ ${jid.split('@')[0]} is already whitelisted.`);
            }
        }

        if (action === 'remove') {
            if (!jid) return reply(`❌ Please provide a valid number.`);
            if (global.anticallSettings.whitelist.includes(jid)) {
                global.anticallSettings.whitelist = global.anticallSettings.whitelist.filter(n => n !== jid);
                return reply(`✅ Removed ${jid.split('@')[0]} from anticall whitelist.`);
            } else {
                return reply(`ℹ️ ${jid.split('@')[0]} is not in the whitelist.`);
            }
        }

        if (action === 'list') {
            const list = global.anticallSettings.whitelist.map(j => j.split('@')[0]).join('\n') || 'None';
            return reply(`📋 *Anticall Whitelist:*\n${list}`);
        }

        return reply(`💡 Usage: .anticall whitelist add/remove/list <number>`);
    }

    // Custom rejection message
    if (sub === 'message') {
        if (!input) return reply(`❌ Usage: .anticall message <your text>`);
        global.anticallSettings.message = input;
        return reply(`✅ Custom anticall message set:\n\n${global.anticallSettings.message}`);
    }

    return reply(`❌ Unknown subcommand. Type .anticall for help.`);
};

// Event handler using before hook - BAILEYS SPECIFIC
daveplug.before = async (m, { dave }) => {
    // Register call listener only once
    if (!daveplug._callListenerRegistered) {
        const antiCallNotified = new Set();

        // Baileys uses 'CB:call' event, not 'call'
        dave.ev.on('CB:call', async (callData) => {
            try {
                if (!global.anticallSettings?.enabled) return;

                // Baileys call data structure
                const calls = Array.isArray(callData) ? callData : [callData];

                for (const call of calls) {
                    // Baileys call structure: { from, id, status, isVideo, isGroup }
                    const callerJid = call.from;
                    if (!callerJid) continue;

                    // Skip owner and bot itself
                    const callerNumber = callerJid.split('@')[0];
                    const botNumber = dave.user.id.split(':')[0];
                    
                    if (callerJid === dave.user.id || callerNumber === botNumber) continue;
                    if (global.owner?.includes(callerNumber)) continue;
                    
                    // Skip whitelisted
                    if (global.anticallSettings.whitelist.includes(callerJid)) continue;

                    console.log(`🚫 Anticall: Rejecting ${call.isVideo ? 'video' : 'voice'} call from ${callerNumber}`);

                    // Baileys call rejection
                    if (call.id) {
                        await dave.rejectCall(call.id, callerJid).catch(err => {
                            console.error('Reject call failed:', err.message);
                        });
                    }

                    // Notify caller once per 30s
                    if (!antiCallNotified.has(callerJid)) {
                        antiCallNotified.add(callerJid);
                        setTimeout(() => antiCallNotified.delete(callerJid), 30000);

                        await dave.sendMessage(callerJid, { 
                            text: global.anticallSettings.message 
                        }).catch(err => {
                            console.error('Send message failed:', err.message);
                        });
                    }

                    // Optional: Block after 2s
                    setTimeout(async () => {
                        try {
                            await dave.updateBlockStatus(callerJid, 'block');
                            console.log(`🔒 Blocked ${callerNumber} for calling`);
                        } catch (err) {
                            console.error('Block failed:', err.message);
                        }
                    }, 2000);
                }
            } catch (err) {
                console.error('ANTICALL ERROR:', err);
            }
        });

        daveplug._callListenerRegistered = true;
        console.log('✅ Anticall listener registered (Baileys CB:call)');
    }
};

daveplug.help = ['anticall'];
daveplug.tags = ['owner', 'moderation'];
daveplug.command = ['anticall'];

module.exports = daveplug;