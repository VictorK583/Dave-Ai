const { setAntitag, getAntitag, removeAntitag } = require('../library/lib/index');

let daveplug = async (m, { dave, daveshown, isAdmins, reply, text, xprefix }) => {
    try {
        if (!m.isGroup) return reply("this command only works in groups")
        if (!daveshown && !isAdmins) return reply("only group admins can use this command")

        const args = text ? text.trim().split(' ') : []
        const action = args[0]

        if (!action) {
            return reply(
`antitag setup

${xprefix}antitag on
${xprefix}antitag off
${xprefix}antitag set delete | kick
${xprefix}antitag get`
            )
        }

        const settings = global.settings
        settings.antitag = settings.antitag || {}

        switch (action) {
            case 'on':
                if (settings.antitag[m.chat]?.enabled) return reply("antitag is already on")
                settings.antitag[m.chat] = { enabled: true, mode: 'delete' }
                global.saveSettings(settings)
                global.settings = settings
                reply("antitag has been turned on")
                break

            case 'off':
                if (!settings.antitag[m.chat]) return reply("antitag is already off")
                delete settings.antitag[m.chat]
                global.saveSettings(settings)
                global.settings = settings
                reply("antitag has been turned off")
                break

            case 'set':
                if (args.length < 2) return reply(`usage: ${xprefix}antitag set delete | kick`)
                const setAction = args[1].toLowerCase()
                if (!['delete', 'kick'].includes(setAction)) return reply("invalid action. choose delete or kick")
                if (!settings.antitag[m.chat]) return reply("antitag is not enabled. turn it on first")
                settings.antitag[m.chat].mode = setAction
                global.saveSettings(settings)
                global.settings = settings
                reply(`antitag action set to ${setAction}`)
                break

            case 'get':
                const status = settings.antitag[m.chat]
                if (!status) return reply("antitag is off")
                reply(`antitag configuration\nstatus: on\naction: ${status.mode || 'delete'}`)
                break

            default:
                reply(`usage: ${xprefix}antitag on | off | set | get`)
        }

    } catch (error) {
        console.error('antitag command error:', error)
        reply("error processing antitag command")
    }
}

daveplug.help = ['antitag']
daveplug.tags = ['group']
daveplug.command = ['antitag']

module.exports = daveplug