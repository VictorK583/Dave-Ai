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
            return reply(`📞 Anticall is currently *${global.anticallSettings.enabled ? 'ENABLED' : 'DISABLED'}*.\n` +
                         `📋 Whitelist: ${global.anticallSettings.whitelist.join(', ') || 'None'}\n` +
                         `✉️ Message: ${global.anticallSettings.message}`);
        }

        global.anticallSettings.enabled = sub === 'on';
        return reply(`📞 Anticall is now *${global.anticallSettings.enabled ? 'ENABLED' : 'DISABLED'}*.`);
    }

    // Whitelist management
    if (sub === 'whitelist') {
        const action = args[1]?.toLowerCase();
        const jid = normalizeJid(args[2]);

        if (!action) return reply(`💡 Usage: .anticall whitelist add/remove/list <number>`);

        if (action === 'add') {
            if (!jid) return reply(`💡 Please provide a valid number.`);
            if (!global.anticallSettings.whitelist.includes(jid)) {
                global.anticallSettings.whitelist.push(jid);
                return reply(`✅ Added ${jid} to anticall whitelist.`);
            } else return reply(`ℹ️ ${jid} is already whitelisted.`);
        }

        if (action === 'remove') {
            if (!jid) return reply(`💡 Please provide a valid number.`);
            if (global.anticallSettings.whitelist.includes(jid)) {
                global.anticallSettings.whitelist = global.anticallSettings.whitelist.filter(n => n !== jid);
                return reply(`✅ Removed ${jid} from anticall whitelist.`);
            } else return reply(`ℹ️ ${jid} is not in the whitelist.`);
        }

        if (action === 'list') {
            const list = global.anticallSettings.whitelist.join('\n') || 'None';
            return reply(`📋 Anticall Whitelist:\n${list}`);
        }

        return reply(`💡 Usage: .anticall whitelist add/remove/list <number>`);
    }

    // Custom rejection message
    if (sub === 'message') {
        if (!input) return reply(`💡 Usage: .anticall message <your text>`);
        global.anticallSettings.message = input;
        return reply(`✉️ Custom anticall message set:\n${global.anticallSettings.message}`);
    }

    return reply(`💡 Unknown subcommand. Type .anticall for help.`);
};

// Event handler for incoming calls
daveplug.init = (dave) => {
    const antiCallNotified = new Set();

    dave.ev.on('call', async (calls) => {
        if (!global.anticallSettings?.enabled) return;

        for (const call of calls) {
            const callerJid = call.from || call.peerJid || call.chatId;
            if (!callerJid) continue;

            if (callerJid === dave.user.id || global.owner.includes(callerJid.split('@')[0])) continue;
            if (global.anticallSettings.whitelist.includes(callerJid)) continue;

            // Reject call
            if (typeof dave.rejectCall === 'function' && call.id) {
                await dave.rejectCall(call.id, callerJid).catch(() => {});
            } else if (typeof dave.sendCallOfferAck === 'function' && call.id) {
                await dave.sendCallOfferAck(call.id, callerJid, 'reject').catch(() => {});
            }

            // Notify once per 30s
            if (!antiCallNotified.has(callerJid)) {
                antiCallNotified.add(callerJid);
                setTimeout(() => antiCallNotified.delete(callerJid), 30000);

                await dave.sendMessage(callerJid, { text: global.anticallSettings.message }).catch(() => {});
            }

            // Optional block after 2s
            setTimeout(async () => {
                try { await dave.updateBlockStatus(callerJid, 'block'); } catch {}
            }, 2000);
        }
    });
};

daveplug.help = ['anticall'];
daveplug.tags = ['owner', 'moderation'];
daveplug.command = ['anticall'];

module.exports = daveplug;