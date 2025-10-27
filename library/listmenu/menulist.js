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
            const pluginsDir = path.join(__dirname, '../plugins')
            if (fs.existsSync(pluginsDir)) {
                const files = fs.readdirSync(pluginsDir)
                totalCommands = files.filter(file => file.endsWith('.js') && file !== 'menu.js').length
            }
        } catch (e) {
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

// Menu template with EXACT placeholders that match your menu.js
const Menu = `
╭━━━〔 *{botname}* 〕━━━╮
┃ ✦ Owner    : *${global.ownername || 'Dave Owner'}*
┃ ✦ Version  : *1.0.0*
┃ ✦ BotType  : *${global.typebot || 'Multi-Device'}*
┃ ✦ Prefix   : *{xprefix}*
┃ ✦ Mode     : *${menuData.mode}*
┃ ✦ Host     : *{host}*
┃ ✦ Speed    : *{ping} ms*
┃ ✦ Uptime   : *{uptime}*
┃ ✦ RAM      : *{ram} MB*
┃ ✦ Users    : *{users}*
┃ ✦ Commands : *{cmds}*
╰━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━━━━━━━━━━━━━━━━━━━━━╮
│    *MENU SETTINGS*    │
╰━━━━━━━━━━━━━━━━━━━━━━━╯
> {xprefix}setmenu text
> {xprefix}setmenu image  
> {xprefix}setmenu video
> {xprefix}setmenuimage <url>
> {xprefix}setmenuvideo <url>

╭━━━━━━━━━━━━━━━━━━━━━━━╮
│     *BUG COMMANDS*    │
╰━━━━━━━━━━━━━━━━━━━━━━━╯
> {xprefix}daveandroid
> {xprefix}daveandroid2
> {xprefix}systemuicrash
> {xprefix}xsysui
> {xprefix}xios
> {xprefix}xios2
> {xprefix}dave-group

╭━━━━━━━━━━━━━━━━━━━━━━━╮
│     *OWNER MENU*      │
╰━━━━━━━━━━━━━━━━━━━━━━━╯
> {xprefix}join
> {xprefix}shutdown
> {xprefix}restart
> {xprefix}autoread [on/off]
> {xprefix}autotyping [on/off]
> {xprefix}autorecording [on/off]
> {xprefix}autoreact [on/off]
> {xprefix}autobio [on/off]
> {xprefix}autoswview [on/off]
> {xprefix}mode [private/public]
> {xprefix}block
> {xprefix}unblock
> {xprefix}backup
> {xprefix}addowner
> {xprefix}delowner
> {xprefix}setprefix
> {xprefix}setnamabot
> {xprefix}setbiobot
> {xprefix}setppbot
> {xprefix}delppbot
> {xprefix}onlygroup [on/off]
> {xprefix}onlypc [on/off]
> {xprefix}unavailable [on/off]
> {xprefix}anticall [on/off/status]
> {xprefix}listgc
> {xprefix}listowner
> {xprefix}clearchat
> {xprefix}on
> {xprefix}off
> {xprefix}anticall whitelist
> {xprefix}areact charts
> {xprefix}antiedit
> {xprefix}setpp
> {xprefix}disp-1
> {xprefix}disp-7
> {xprefix}disp-90
> {xprefix}disp-off
> {xprefix}antidelete 
> {xprefix}vv

╭━━━━━━━━━━━━━━━━━━━━━━━╮
│     *GROUP MENU*      │
╰━━━━━━━━━━━━━━━━━━━━━━━╯
> {xprefix}closetime
> {xprefix}opentime
> {xprefix}kick
> {xprefix}add
> {xprefix}promote
> {xprefix}demote
> {xprefix}setdesc
> {xprefix}setppgc
> {xprefix}tagall
> {xprefix}hidetag
> {xprefix}group [option]
> {xprefix}linkgc
> {xprefix}revoke
> {xprefix}listonline
> {xprefix}welcome [on/off]
> {xprefix}antilink [on/off]
> {xprefix}antilinkgc [on/off]
> {xprefix}warning
> {xprefix}unwarning
> {xprefix}kill
> {xprefix}close
> {xprefix}open
> {xprefix}vcf
> {xprefix}vcf2

╭━━━━━━━━━━━━━━━━━━━━━━━╮
│      *MAIN MENU*      │
╰━━━━━━━━━━━━━━━━━━━━━━━╯
> {xprefix}menu
> {xprefix}buypremium
> {xprefix}runtime
> {xprefix}script
> {xprefix}donate
> {xprefix}owner
> {xprefix}dev
> {xprefix}request
> {xprefix}Quran
> {xprefix}Bible

╭━━━━━━━━━━━━━━━━━━━━━━━╮
│    *CONVERT MENU*     │
╰━━━━━━━━━━━━━━━━━━━━━━━╯
> {xprefix}sticker
> {xprefix}smeme
> {xprefix}take
> {xprefix}toimage
> {xprefix}toaudio
> {xprefix}tovn
> {xprefix}togif
> {xprefix}tourl
> {xprefix}url
> {xprefix}tourl2
> {xprefix}toqr
> {xprefix}tovideo
> {xprefix}emojimix
> {xprefix}stickerwm
> {xprefix}stickermeme
> {xprefix}hd
> {xprefix}remini
> {xprefix}hdvideo
> {xprefix}readmore

╭━━━━━━━━━━━━━━━━━━━━━━━╮
│   *DOWNLOAD MENU*     │
╰━━━━━━━━━━━━━━━━━━━━━━━╯
> {xprefix}play
> {xprefix}ytmp3
> {xprefix}ytmp4
> {xprefix}fb
> {xprefix}igdl
> {xprefix}tiktok
> {xprefix}mediafire
> {xprefix}snackvideo
> {xprefix}capcut
> {xprefix}playdoc
> {xprefix}apk
> {xprefix}instagram/ig

╭━━━━━━━━━━━━━━━━━━━━━━━╮
│    *AI / CHATGPT*     │
╰━━━━━━━━━━━━━━━━━━━━━━━╯
> {xprefix}ai
> {xprefix}ai2
> {xprefix}gpt
> {xprefix}gemma
> {xprefix}mistral
> {xprefix}gemini
> {xprefix}luminai
> {xprefix}openai
> {xprefix}dave

╭━━━━━━━━━━━━━━━━━━━━━━━╮
│     *IMAGE AI*        │
╰━━━━━━━━━━━━━━━━━━━━━━━╯
> {xprefix}imagebing
> {xprefix}edit-ai
> {xprefix}toanime
> {xprefix}toreal
> {xprefix}remove-wm
> {xprefix}editanime
> {xprefix}faceblur
> {xprefix}removebg

╭━━━━━━━━━━━━━━━━━━━━━━━╮
│   *SEARCH TOOLS*      │
╰━━━━━━━━━━━━━━━━━━━━━━━╯
> {xprefix}pinterest
> {xprefix}yts
> {xprefix}lyrics
> {xprefix}dictionary
> {xprefix}weather
> {xprefix}google
> {xprefix}playstore
> {xprefix}playstation
> {xprefix}animesearch
> {xprefix}whatsong
> {xprefix}getpastebin
> {xprefix}getpp

╭━━━━━━━━━━━━━━━━━━━━━━━╮
│       *SPORTS*        │
╰━━━━━━━━━━━━━━━━━━━━━━━╯
> {xprefix}fixtures
> {xprefix}epl
> {xprefix}laliga
> {xprefix}bundesliga
> {xprefix}serie-a
> {xprefix}ligue-1

╭━━━━━━━━━━━━━━━━━━━━━━━╮
│   *DEVELOPER MENU*    │
╰━━━━━━━━━━━━━━━━━━━━━━━╯
> {xprefix}githubstalk
> {xprefix}gitclone
> {xprefix}getfile
> {xprefix}setvar
> {xprefix}getvar
> {xprefix}update
> {xprefix}enc
> {xprefix}tojs
> {xprefix}listcase
> {xprefix}pair

╭━━━━━━━━━━━━━━━━━━━━━━━╮
│   *EMAIL & UTILS*     │
╰━━━━━━━━━━━━━━━━━━━━━━━╯
> {xprefix}sendemail
> {xprefix}tempmail
> {xprefix}myip
> {xprefix}trackip
> {xprefix}ocr
> {xprefix}ssweb
> {xprefix}trt

╭━━━━━━━━━━━━━━━━━━━━━━━╮
│ *CHANNEL & STATUS*    │
╰━━━━━━━━━━━━━━━━━━━━━━━╯
> {xprefix}reactch
> {xprefix}idch
> {xprefix}uploadstatus
> {xprefix}save
> {xprefix}viewonce
> {xprefix}rvo

╭━━━━━━━━━━━━━━━━━━━━━━━╮
│   *GAMES & FUN*       │
╰━━━━━━━━━━━━━━━━━━━━━━━╯
> {xprefix}truth
> {xprefix}dare
> {xprefix}meme
> {xprefix}brat
> {xprefix}neko
> {xprefix}shinobu
> {xprefix}megumin
> {xprefix}bully
> {xprefix}cuddle
> {xprefix}cry
> {xprefix}hug
> {xprefix}awoo
> {xprefix}kiss
> {xprefix}lick
> {xprefix}pat
> {xprefix}smug
> {xprefix}bonk
> {xprefix}yeet
> {xprefix}blush
> {xprefix}smile
> {xprefix}wave
> {xprefix}highfive
> {xprefix}handhold
> {xprefix}nom
> {xprefix}bite
> {xprefix}glomp
> {xprefix}slap
> {xprefix}kill
> {xprefix}happy
> {xprefix}wink
> {xprefix}poke
> {xprefix}dance
> {xprefix}cringe
> {xprefix}trap
> {xprefix}blowjob
> {xprefix}hentai
> {xprefix}boobs
> {xprefix}ass
> {xprefix}pussy
> {xprefix}thighs
> {xprefix}lesbian
> {xprefix}lewdneko
> {xprefix}cum
> {xprefix}woof
> {xprefix}8ball
> {xprefix}goose
> {xprefix}gecg
> {xprefix}feed
> {xprefix}avatar
> {xprefix}fox_girl
> {xprefix}lizard
> {xprefix}spank
> {xprefix}meow
> {xprefix}tickle

╭━━━━━━━━━━━━━━━━━━━━━━━╮
│  *TEXT EFFECTS*       │
╰━━━━━━━━━━━━━━━━━━━━━━━╯
> {xprefix}glitchtext
> {xprefix}writetext
> {xprefix}advancedglow
> {xprefix}typographytext
> {xprefix}pixelglitch
> {xprefix}neonglitch
> {xprefix}flagtext
> {xprefix}flag3dtext
> {xprefix}deletingtext
> {xprefix}blackpinkstyle
> {xprefix}glowingtext
> {xprefix}underwatertext
> {xprefix}logomaker
> {xprefix}cartoonstyle
> {xprefix}papercutstyle
> {xprefix}watercolortext
> {xprefix}effectclouds
> {xprefix}blackpinklogo
> {xprefix}gradienttext
> {xprefix}summerbeach
> {xprefix}luxurygold
> {xprefix}multicoloredneon
> {xprefix}sandsummer
> {xprefix}galaxywallpaper
> {xprefix}1917style
> {xprefix}makingneon
> {xprefix}royaltext
> {xprefix}freecreate
> {xprefix}galaxystyle
> {xprefix}lighteffects

╭━━━━━━━━━━━━━━━━━━━━━━━╮
│   *SPAM & TOOLS*      │
╰━━━━━━━━━━━━━━━━━━━━━━━╯
> {xprefix}nglspam
> {xprefix}sendchat

╭━━━━━━━━━━━━━━━━━━━━━━━╮
│      *FOOTER*         │
╰━━━━━━━━━━━━━━━━━━━━━━━╯
*{botname}*
*Premium Performance* | 🚀 *Lightning Fast*

*Tip: Use {xprefix}setmenu text/image/video to change display mode!*
`

module.exports = Menu

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright(`Update ${__filename}`))
    delete require.cache[file]
    require(file)
})