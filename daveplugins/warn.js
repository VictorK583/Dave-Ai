const fs = require('fs');
const path = require('path');

let daveplug = async (m, { daveshown, dave, reply, xprefix, isAdmins }) => {
    if (!m.isGroup) return reply("this command only works in groups")
    if (!isAdmins && !daveshown) return reply("only group admins can use this command")

    let target = m.mentionedJid?.[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : null

    if (!target) {
        return reply(`example: ${xprefix}warn @user or reply to a message`)
    }

    // prevent warning owner or bot
    const targetNumber = target.replace('@s.whatsapp.net', '')
    const botJid = dave.user.id.split(':')[0] + '@s.whatsapp.net'
    
    if (global.owner && global.owner.includes(targetNumber)) {
        return reply("you cant warn the bot owner")
    }
    if (target === m.sender) {
        return reply("you cant warn yourself")
    }
    if (target === botJid) {
        return reply("i cant warn myself")
    }

    const settings = global.settings
    settings.warnings = settings.warnings || {
        enabled: true,
        maxWarnings: 3,
        chats: {}
    }

    if (!settings.warnings.chats[m.chat]) {
        settings.warnings.chats[m.chat] = {}
    }

    settings.warnings.chats[m.chat][target] = (settings.warnings.chats[m.chat][target] || 0) + 1

    const warningCount = settings.warnings.chats[m.chat][target]

    global.saveSettings(settings)
    global.settings = settings

    reply(`warning\n\nuser: @${target.split('@')[0]}\nwarnings: ${warningCount}/${settings.warnings.maxWarnings}\nwarned by: @${m.sender.split('@')[0]}`, { 
        mentions: [target, m.sender] 
    })

    // auto-kick after max warnings
    if (warningCount >= settings.warnings.maxWarnings) {
        try {
            await dave.groupParticipantsUpdate(m.chat, [target], 'remove')
            delete settings.warnings.chats[m.chat][target]
            global.saveSettings(settings)
            global.settings = settings
            
            reply(`user kicked\n\n@${target.split('@')[0]} has been removed from the group after ${settings.warnings.maxWarnings} warnings`, { 
                mentions: [target] 
            })
        } catch (kickErr) {
            console.error('kick error:', kickErr)
            reply(`failed to kick @${target.split('@')[0]} after ${settings.warnings.maxWarnings} warnings. check bot permissions`, { 
                mentions: [target] 
            })
        }
    }
}

daveplug.help = ['warn']
daveplug.tags = ['group']
daveplug.command = ['warn', 'warning']

module.exports = daveplug;