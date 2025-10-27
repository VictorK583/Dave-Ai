const fs = require('fs')
const path = require('path')
const os = require('os')
const chalk = require('chalk')
const settings = require('../../settings');

const more = String.fromCharCode(8206)
const readmore = more.repeat(4001)

// Format time function
function formatTime(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60))
    seconds = seconds % (24 * 60 * 60)
    const hours = Math.floor(seconds / (60 * 60))
    seconds = seconds % (60 * 60)
    const minutes = Math.floor(seconds / 60)
    seconds = Math.floor(seconds % 60)

    let time = ''
    if (days > 0) time += `${days}d `
    if (hours > 0) time += `${hours}h `
    if (minutes > 0) time += `${minutes}m `
    if (seconds > 0 || time === '') time += `${seconds}s`

    return time.trim()
}

// Host Detection Function
function detectHost() {
    const env = process.env

    if (env.RENDER || env.RENDER_EXTERNAL_URL) return 'Render'
    if (env.DYNO || env.HEROKU_APP_DIR || env.HEROKU_SLUG_COMMIT) return 'Heroku'
    if (env.VERCEL || env.VERCEL_ENV || env.VERCEL_URL) return 'Vercel'
    if (env.PORTS || env.CYPHERX_HOST_ID) return "CypherXHost"
    if (env.RAILWAY_ENVIRONMENT || env.RAILWAY_PROJECT_ID) return 'Railway'
    if (env.REPL_ID || env.REPL_SLUG) return 'Replit'

    const hostname = os.hostname().toLowerCase()
    if (!env.CLOUD_PROVIDER && !env.DYNO && !env.VERCEL && !env.RENDER) {
        if (hostname.includes('vps') || hostname.includes('server')) return 'VPS'
        return 'Panel'
    }

    return 'Dave Host'
}

// Get dynamic menu data
function getMenuData() {
    try {
        // Try to read additional data files
        let messageData = {}
        let userData = []

        try {
            messageData = JSON.parse(fs.readFileSync('./messageCount.json', 'utf8'))
        } catch (e) {
            messageData = { isPublic: true }
        }

        try {
            userData = JSON.parse(fs.readFileSync('./library/database/users.json', 'utf8'))
        } catch (e) {
            userData = []
        }

        const uptimeInSeconds = process.uptime()
        const uptimeFormatted = formatTime(uptimeInSeconds)
        const currentMode = messageData.isPublic ? 'Public' : 'Private'
        const hostName = detectHost()
        const ramUsage = (process.memoryUsage().rss / 1024 / 1024).toFixed(2)
        const totalUsers = Array.isArray(userData) ? userData.length : 0

        // Count commands dynamically
        let totalCommands = 0
        try {
            // Count plugin files
            const pluginsDir = path.join(__dirname, '../../daveplugins')
            if (fs.existsSync(pluginsDir)) {
                const files = fs.readdirSync(pluginsDir)
                totalCommands += files.filter(file => file.endsWith('.js') && file !== 'menu.js').length
            }
            
            // Count case commands from dave.js
            const daveJsPath = path.join(__dirname, '../../dave.js')
            if (fs.existsSync(daveJsPath)) {
                const daveContent = fs.readFileSync(daveJsPath, 'utf8')
                
                // Count case statements with both single and double quotes, and handle different formats
                const caseRegex = /case\s+['"`]([^'"`]+)['"`]\s*:\s*{/g
                const caseMatches = [...daveContent.matchAll(caseRegex)]
                const uniqueCaseCommands = new Set(caseMatches.map(match => match[1]))
                
                totalCommands += uniqueCaseCommands.size
            }
        } catch (e) {
            console.error('Error counting commands:', e)
            totalCommands = 100 // fallback
        }

        return {
            uptime: uptimeFormatted,
            mode: currentMode,
            host: hostName,
            ram: ramUsage,
            users: totalUsers,
            cmds: totalCommands
        }
    } catch (error) {
        console.error('Error reading menu data:', error)
        return {
            uptime: formatTime(process.uptime()),
            mode: 'Public',
            host: detectHost(),
            ram: '0',
            users: 0,
            cmds: 100
        }
    }
}

// Get dynamic data
const menuData = getMenuData()

const Menu = `
╭━━━〔 *${global.botname}* 〕━━━╮
┃ ✦ Owner    : *${global.ownername}*
┃ ✦ Version  : *1.0.0*
┃ ✦ BotType  : *${global.typebot}*
┃ ✦ Prefix   : *${global.xprefix}*
┃ ✦ Mode     : *${menuData.mode}*
┃ ✦ Host     : *${menuData.host}*
┃ ✦ Uptime   : *${menuData.uptime}*
┃ ✦ RAM      : *${menuData.ram} MB*
┃ ✦ Users    : *${menuData.users}*
┃ ✦ Commands : *${menuData.cmds}*
╰━━━━━━━━━━━━━━━━━━━━━━━╯

╰┈➤ *ꜱᴛɪᴄᴋᴇʀꜱ*
> ${global.xprefix}sticker
> ${global.xprefix}smeme
> ${global.xprefix}stickerwm
> ${global.xprefix}stickermeme
> ${global.xprefix}trigger
> ${global.xprefix}wasted
> ${global.xprefix}wm
> ${global.xprefix}enhance
> ${global.xprefix}tohd

╰┈➤ *ꜰᴜɴ & ᴍᴇᴍᴇꜱ*
> ${global.xprefix}trash
> ${global.xprefix}wanted
> ${global.xprefix}hitler
> ${global.xprefix}meme
> ${global.xprefix}trigger
> ${global.xprefix}wasted

╰┈➤ *ʙᴜɢ ᴀɴᴅʀᴏɪᴅ*
> ${global.xprefix}daveandroid
> ${global.xprefix}daveandroid2
> ${global.xprefix}systemuicrash
> ${global.xprefix}xsysui

╰┈➤ *ʙᴜɢ ɪᴏꜱ*
> ${global.xprefix}xios
> ${global.xprefix}xios2

╰┈➤ *ʙᴜɢ ɢʀᴏᴜᴘ ᴄʜᴀᴛ*
> ${global.xprefix}dave-group

╰┈➤ *ᴏᴡɴᴇʀ ᴍᴇɴᴜ*
> ${global.xprefix}join
> ${global.xprefix}shutdown
> ${global.xprefix}restart
> ${global.xprefix}autoread [on/off]
> ${global.xprefix}autotyping [on/off]
> ${global.xprefix}autorecording [on/off]
> ${global.xprefix}autoreact [on/off]
> ${global.xprefix}autobio [on/off]
> ${global.xprefix}autoswview [on/off]
> ${global.xprefix}mode [private/public]
> ${global.xprefix}block
> ${global.xprefix}unblock
> ${global.xprefix}backup
> ${global.xprefix}addowner
> ${global.xprefix}delowner
> ${global.xprefix}setprefix
> ${global.xprefix}setnamabot
> ${global.xprefix}setbiobot
> ${global.xprefix}setppbot
> ${global.xprefix}delppbot
> ${global.xprefix}onlygroup [on/off]
> ${global.xprefix}onlypc [on/off]
> ${global.xprefix}unavailable [on/off]
> ${global.xprefix}anticall [on/off/status]
> ${global.xprefix}listgc
> ${global.xprefix}listowner
> ${global.xprefix}clearchat
> ${global.xprefix}on
> ${global.xprefix}off
> ${global.xprefix}anticall whitelist
> ${global.xprefix}areact charts
> ${global.xprefix}antiedit
> ${global.xprefix}setpp
> ${global.xprefix}disp-1
> ${global.xprefix}disp-7
> ${global.xprefix}disp-90
> ${global.xprefix}disp-off
> ${global.xprefix}antidelete 
> ${global.xprefix}vv

╰┈➤ *ɢʀᴏᴜᴘ ᴍᴇɴᴜ*
> ${global.xprefix}closetime
> ${global.xprefix}opentime
> ${global.xprefix}kick
> ${global.xprefix}add
> ${global.xprefix}promote
> ${global.xprefix}demote
> ${global.xprefix}setdesc
> ${global.xprefix}setppgc
> ${global.xprefix}tagall
> ${global.xprefix}hidetag
> ${global.xprefix}group [option]
> ${global.xprefix}linkgc
> ${global.xprefix}revoke
> ${global.xprefix}listonline
> ${global.xprefix}welcome [on/off]
> ${global.xprefix}antilink [on/off]
> ${global.xprefix}antilinkgc [on/off]
> ${global.xprefix}warning
> ${global.xprefix}unwarning
> ${global.xprefix}kill
> ${global.xprefix}close
> ${global.xprefix}open
> ${global.xprefix}vcf
> ${global.xprefix}vcf2

╰┈➤ *ᴍᴀɪɴ ᴍᴇɴᴜ*
> ${global.xprefix}menu
> ${global.xprefix}buypremium
> ${global.xprefix}runtime
> ${global.xprefix}script
> ${global.xprefix}donate
> ${global.xprefix}owner
> ${global.xprefix}dev
> ${global.xprefix}request
> ${global.xprefix}Quran
> ${global.xprefix}Bible

╰┈➤ *ᴄᴏɴᴠᴇʀᴛ ᴍᴇɴᴜ*
> ${global.xprefix}take
> ${global.xprefix}toimage
> ${global.xprefix}toaudio
> ${global.xprefix}tovn
> ${global.xprefix}togif
> ${global.xprefix}tourl
> ${global.xprefix}url
> ${global.xprefix}tourl2
> ${global.xprefix}toqr
> ${global.xprefix}tovideo
> ${global.xprefix}emojimix
> ${global.xprefix}hd
> ${global.xprefix}remini
> ${global.xprefix}hdvideo
> ${global.xprefix}readmore

╰┈➤ *ᴅᴏᴡɴʟᴏᴀᴅ ᴍᴇɴᴜ*
> ${global.xprefix}play
> ${global.xprefix}ytmp3
> ${global.xprefix}ytmp4
> ${global.xprefix}fb
> ${global.xprefix}igdl
> ${global.xprefix}tiktok
> ${global.xprefix}mediafire
> ${global.xprefix}snackvideo
> ${global.xprefix}capcut
> ${global.xprefix}playdoc
> ${global.xprefix}apk
> ${global.xprefix}instagram/ig
> ${global.xprefix}gitclone

╰┈➤ *ᴀɪ / ᴄʜᴀᴛɢᴘᴛ*
> ${global.xprefix}ai
> ${global.xprefix}ai2
> ${global.xprefix}gpt
> ${global.xprefix}gemma
> ${global.xprefix}mistral
> ${global.xprefix}gemini
> ${global.xprefix}luminai
> ${global.xprefix}openai
> ${global.xprefix}dave

╰┈➤ *ɪᴍᴀɢᴇ ᴀɪ*
> ${global.xprefix}imagebing
> ${global.xprefix}edit-ai
> ${global.xprefix}toanime
> ${global.xprefix}toreal
> ${global.xprefix}remove-wm
> ${global.xprefix}editanime
> ${global.xprefix}faceblur
> ${global.xprefix}removebg

╰┈➤ *sᴇᴀʀᴄʜ ᴛᴏᴏʟs*
> ${global.xprefix}pinterest
> ${global.xprefix}yts
> ${global.xprefix}lyrics
> ${global.xprefix}dictionary
> ${global.xprefix}weather
> ${global.xprefix}google
> ${global.xprefix}playstore
> ${global.xprefix}playstation
> ${global.xprefix}animesearch
> ${global.xprefix}whatsong
> ${global.xprefix}getpastebin
> ${global.xprefix}getpp
> ${global.xprefix}movie

╰┈➤ *ᴜꜱᴇʀ ɪɴꜰᴏ*
> ${global.xprefix}whois
> ${global.xprefix}profile

╰┈➤ *ꜱᴘᴏʀᴛꜱ*
> ${global.xprefix}fixtures
> ${global.xprefix}epl
> ${global.xprefix}laliga
> ${global.xprefix}bundesliga
> ${global.xprefix}serie-a
> ${global.xprefix}ligue-1

╰┈➤ *ᴅᴇᴠᴇʟᴏᴘᴇʀ ᴍᴇɴᴜ*
> ${global.xprefix}githubstalk
> ${global.xprefix}getfile
> ${global.xprefix}setvar
> ${global.xprefix}getvar
> ${global.xprefix}update
> ${global.xprefix}enc
> ${global.xprefix}tojs
> ${global.xprefix}listcase
> ${global.xprefix}pair

╰┈➤ *ᴇᴍᴀɪʟ & ᴜᴛɪʟꜱ*
> ${global.xprefix}sendemail
> ${global.xprefix}tempmail
> ${global.xprefix}myip
> ${global.xprefix}trackip
> ${global.xprefix}ocr
> ${global.xprefix}ssweb
> ${global.xprefix}trt

╰┈➤ *ᴄʜᴀɴɴᴇʟ & ꜱᴛᴀᴛᴜꜱ*
> ${global.xprefix}reactch
> ${global.xprefix}idch
> ${global.xprefix}uploadstatus
> ${global.xprefix}save
> ${global.xprefix}viewonce
> ${global.xprefix}rvo

╰┈➤ *ɢᴀᴍᴇꜱ & ꜰᴜɴ*
> ${global.xprefix}truth
> ${global.xprefix}dare
> ${global.xprefix}brat
> ${global.xprefix}neko
> ${global.xprefix}shinobu
> ${global.xprefix}megumin
> ${global.xprefix}bully
> ${global.xprefix}cuddle
> ${global.xprefix}cry
> ${global.xprefix}hug
> ${global.xprefix}awoo
> ${global.xprefix}kiss
> ${global.xprefix}lick
> ${global.xprefix}pat
> ${global.xprefix}smug
> ${global.xprefix}bonk
> ${global.xprefix}yeet
> ${global.xprefix}blush
> ${global.xprefix}smile
> ${global.xprefix}wave
> ${global.xprefix}highfive
> ${global.xprefix}handhold
> ${global.xprefix}nom
> ${global.xprefix}bite
> ${global.xprefix}glomp
> ${global.xprefix}slap
> ${global.xprefix}kill
> ${global.xprefix}happy
> ${global.xprefix}wink
> ${global.xprefix}poke
> ${global.xprefix}dance
> ${global.xprefix}cringe
> ${global.xprefix}trap
> ${global.xprefix}blowjob
> ${global.xprefix}hentai
> ${global.xprefix}boobs
> ${global.xprefix}ass
> ${global.xprefix}pussy
> ${global.xprefix}thighs
> ${global.xprefix}lesbian
> ${global.xprefix}lewdneko
> ${global.xprefix}cum
> ${global.xprefix}woof
> ${global.xprefix}8ball
> ${global.xprefix}goose
> ${global.xprefix}gecg
> ${global.xprefix}feed
> ${global.xprefix}avatar
> ${global.xprefix}fox_girl
> ${global.xprefix}lizard
> ${global.xprefix}spank
> ${global.xprefix}meow
> ${global.xprefix}tickle

╰┈➤ *ᴛᴇxᴛ ᴇꜰꜰᴇᴄᴛꜱ & ʟᴏɢᴏꜱ*
> ${global.xprefix}glitchtext
> ${global.xprefix}writetext
> ${global.xprefix}advancedglow
> ${global.xprefix}blackpinklogo
> ${global.xprefix}effectclouds
> ${global.xprefix}galaxystyle
> ${global.xprefix}lighteffect
> ${global.xprefix}sandsummer
> ${global.xprefix}underwater
> ${global.xprefix}glossysilver
> ${global.xprefix}typographytext
> ${global.xprefix}pixelglitch
> ${global.xprefix}neonglitch
> ${global.xprefix}flagtext
> ${global.xprefix}flag3dtext
> ${global.xprefix}deletingtext
> ${global.xprefix}blackpinkstyle
> ${global.xprefix}glowingtext
> ${global.xprefix}underwatertext
> ${global.xprefix}logomaker
> ${global.xprefix}cartoonstyle
> ${global.xprefix}papercutstyle
> ${global.xprefix}watercolortext
> ${global.xprefix}gradienttext
> ${global.xprefix}summerbeach
> ${global.xprefix}luxurygold
> ${global.xprefix}multicoloredneon
> ${global.xprefix}galaxywallpaper
> ${global.xprefix}1917style
> ${global.xprefix}makingneon
> ${global.xprefix}royaltext
> ${global.xprefix}freecreate

╰┈➤ *ꜱᴘᴀᴍ & ᴛᴏᴏʟꜱ*
> ${global.xprefix}nglspam
> ${global.xprefix}sendchat

> *${global.botname}*
> Total: ${menuData.cmds} Commands | Enjoy premium performance
`

module.exports = Menu

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright(`Update ${__filename}`))
    delete require.cache[file]
    require(file)
})