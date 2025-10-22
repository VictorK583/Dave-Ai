require('./settings')
require('dotenv').config()

// Core Baileys imports
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    jidNormalizedUser,
    makeCacheableSignalKeyStore,
    delay 
} = require("@whiskeysockets/baileys")

// Utilities
const NodeCache = require("node-cache")
const pino = require("pino")
const readline = require("readline")
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const axios = require('axios')
const _ = require('lodash')
const moment = require('moment-timezone')
const PhoneNumber = require('awesome-phonenumber')
const { Boom } = require('@hapi/boom')
const { rmSync } = require('fs')
const os = require('os')
const FileType = require('file-type')

// Custom modules
const { color } = require('./library/lib/color')
const { emojis: areactEmojis, doReact } = require('./library/autoreact.js')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./library/lib/exif')
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetch, sleep, reSize } = require('./library/lib/function')

// Load store and settings - CORRECTED PATH
const store = require('./library/database/basestore')
const settings = require('./settings')

// Global state
global.isBotConnected = false
global.connectDebounceTimeout = null
global.errorRetryCount = 0
global.messageBackup = {}

// File paths - CORRECTED TO MATCH YOUR STRUCTURE
const MESSAGE_STORE_FILE = path.join(__dirname, 'library/database/message_backup.json')
const SESSION_ERROR_FILE = path.join(__dirname, 'library/database/sessionErrorCount.json')
const MESSAGE_COUNT_FILE = path.join(__dirname, 'library/database/messageCount.json')
const sessionDir = path.join(__dirname, 'session')
const credsPath = path.join(sessionDir, 'creds.json')
const loginFile = path.join(sessionDir, 'login.json')
const envPath = path.join(__dirname, '.env')

// Logging function
function log(message, colorName = 'white', isError = false) {
    const xprefix = chalk.magenta.bold('[ Dave - Ai ]')
    const logFunc = isError ? console.error : console.log
    const coloredMessage = chalk[colorName](message)
    logFunc(`${xprefix} ${coloredMessage}`)
}

// Message backup functions
function loadStoredMessages() {
    try {
        if (fs.existsSync(MESSAGE_STORE_FILE)) {
            const data = fs.readFileSync(MESSAGE_STORE_FILE, 'utf-8')
            return JSON.parse(data)
        }
    } catch (error) {
        log(`Error loading message backup: ${error.message}`, 'red', true)
    }
    return {}
}

function saveStoredMessages(data) {
    try {
        // Ensure directory exists
        const dir = path.dirname(MESSAGE_STORE_FILE)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
        fs.writeFileSync(MESSAGE_STORE_FILE, JSON.stringify(data, null, 2))
    } catch (error) {
        log(`Error saving message backup: ${error.message}`, 'red', true)
    }
}

global.messageBackup = loadStoredMessages()

// Error count functions
function loadErrorCount() {
    try {
        if (fs.existsSync(SESSION_ERROR_FILE)) {
            const data = fs.readFileSync(SESSION_ERROR_FILE, 'utf-8')
            return JSON.parse(data)
        }
    } catch (error) {
        log(`Error loading error count: ${error.message}`, 'red', true)
    }
    return { count: 0, last_error_timestamp: 0 }
}

function saveErrorCount(data) {
    try {
        const dir = path.dirname(SESSION_ERROR_FILE)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
        fs.writeFileSync(SESSION_ERROR_FILE, JSON.stringify(data, null, 2))
    } catch (error) {
        log(`Error saving error count: ${error.message}`, 'red', true)
    }
}

function deleteErrorCountFile() {
    try {
        if (fs.existsSync(SESSION_ERROR_FILE)) {
            fs.unlinkSync(SESSION_ERROR_FILE)
            log('Deleted sessionErrorCount.json', 'red')
        }
    } catch (e) {
        log(`Failed to delete error count: ${e.message}`, 'red', true)
    }
}

// Session management
function clearSessionFiles() {
    try {
        log('🗑️ Clearing session folder...', 'blue')
        rmSync(sessionDir, { recursive: true, force: true })
        if (fs.existsSync(loginFile)) fs.unlinkSync(loginFile)
        deleteErrorCountFile()
        global.errorRetryCount = 0
        log('✅ Session files cleaned', 'green')
    } catch (e) {
        log(`Failed to clear session: ${e.message}`, 'red', true)
    }
}

function sessionExists() {
    return fs.existsSync(credsPath)
}

// Cleanup functions
function cleanupOldMessages() {
    let storedMessages = loadStoredMessages()
    let now = Math.floor(Date.now() / 1000)
    const maxMessageAge = 24 * 60 * 60
    let cleanedMessages = {}
    
    for (let chatId in storedMessages) {
        let newChatMessages = {}
        for (let messageId in storedMessages[chatId]) {
            let message = storedMessages[chatId][messageId]
            if (now - message.timestamp <= maxMessageAge) {
                newChatMessages[messageId] = message
            }
        }
        if (Object.keys(newChatMessages).length > 0) {
            cleanedMessages[chatId] = newChatMessages
        }
    }
    saveStoredMessages(cleanedMessages)
    log("🧹 Old messages cleaned", 'yellow')
}

function cleanupJunkFiles(botSocket) {
    let directoryPath = path.join()
    fs.readdir(directoryPath, async function (err, files) {
        if (err) return log(`Junk cleanup error: ${err}`, 'red', true)
        
        const filteredArray = files.filter(item =>
            item.endsWith(".gif") || item.endsWith(".png") || item.endsWith(".mp3") ||
            item.endsWith(".mp4") || item.endsWith(".opus") || item.endsWith(".jpg") ||
            item.endsWith(".webp") || item.endsWith(".webm") || item.endsWith(".zip")
        )
        
        if (filteredArray.length > 0) {
            filteredArray.forEach(file => {
                try {
                    const filePath = path.join(directoryPath, file)
                    if(fs.existsSync(filePath)) fs.unlinkSync(filePath)
                } catch(e) {
                    log(`Delete failed ${file}: ${e.message}`, 'red', true)
                }
            })
            log(`🗑️ ${filteredArray.length} junk files deleted`, 'yellow')
        }
    })
}

// Login helpers
const pairingCode = !!global.phoneNumber || process.argv.includes("--pairing-code")
const useMobile = process.argv.includes("--mobile")

const rl = process.stdin.isTTY ? readline.createInterface({ 
    input: process.stdin, 
    output: process.stdout 
}) : null

const question = (text) => rl ? 
    new Promise(resolve => rl.question(text, resolve)) : 
    Promise.resolve(settings?.ownerNumber || global.phoneNumber)

async function saveLoginMethod(method) {
    await fs.promises.mkdir(sessionDir, { recursive: true })
    await fs.promises.writeFile(loginFile, JSON.stringify({ method }, null, 2))
}

async function getLastLoginMethod() {
    if (fs.existsSync(loginFile)) {
        const data = JSON.parse(fs.readFileSync(loginFile, 'utf-8'))
        return data.method
    }
    return null
}

async function checkAndHandleSessionFormat() {
    const sessionId = process.env.SESSION_ID
    
    if (sessionId && sessionId.trim() !== '') {
        if (!sessionId.trim().startsWith('dave')) {
            log(chalk.red.bgBlack('='.repeat(50)), 'white')
            log(chalk.white.bgRed(' ERROR: Invalid SESSION_ID'), 'white')
            log(chalk.white.bgRed('Must start with "dave"'), 'white')
            log(chalk.red.bgBlack('='.repeat(50)), 'white')
            
            try {
                let envContent = fs.readFileSync(envPath, 'utf8')
                envContent = envContent.replace(/^SESSION_ID=.*$/m, 'SESSION_ID=')
                fs.writeFileSync(envPath, envContent)
                log('Cleaned SESSION_ID in .env', 'green')
            } catch (e) {
                log(`Failed to modify .env: ${e.message}`, 'red', true)
            }
            await delay(30000)
            process.exit(1)
        }
    }
}

async function getLoginMethod() {
    const lastMethod = await getLastLoginMethod()
    if (lastMethod && sessionExists()) {
        log(`Using last login method: ${lastMethod}`, 'yellow')
        return lastMethod
    }
    
    if (!sessionExists() && fs.existsSync(loginFile)) {
        log(`Removing old login preference`, 'yellow')
        fs.unlinkSync(loginFile)
    }
    
    if (!process.stdin.isTTY) {
        log("No Session ID in environment", 'red')
        process.exit(1)
    }
    
    log("Choose login method:", 'yellow')
    log("1) WhatsApp Number (Pairing Code)", 'blue')
    log("2) Session ID", 'blue')
    
    let choice = await question("Enter 1 or 2: ")
    choice = choice.trim()
    
    if (choice === '1') {
        let phone = await question(chalk.bgBlack(chalk.greenBright(`Enter WhatsApp number: `)))
        phone = phone.replace(/[^0-9]/g, '')
        const pn = require('awesome-phonenumber')
        if (!pn('+' + phone).isValid()) {
            log('Invalid phone number', 'red')
            return getLoginMethod()
        }
        global.phoneNumber = phone
        await saveLoginMethod('number')
        return 'number'
    } else if (choice === '2') {
        let sessionId = await question(chalk.bgBlack(chalk.greenBright(`Paste Session ID: `)))
        sessionId = sessionId.trim()
        if (!sessionId.includes("dave~")) {
            log("Invalid Session ID! Must contain 'dave~'", 'red')
            process.exit(1)
        }
        global.SESSION_ID = sessionId
        await saveLoginMethod('session')
        return 'session'
    } else {
        log("Invalid option!", 'red')
        return getLoginMethod()
    }
}

async function downloadSessionData() {
    try {
        await fs.promises.mkdir(sessionDir, { recursive: true })
        if (!fs.existsSync(credsPath) && global.SESSION_ID) {
            const base64Data = global.SESSION_ID.includes("dave~") ? 
                global.SESSION_ID.split("dave~")[1] : global.SESSION_ID
            const sessionData = Buffer.from(base64Data, 'base64')
            await fs.promises.writeFile(credsPath, sessionData)
            log(`Session saved successfully`, 'green')
        }
    } catch (err) {
        log(`Error downloading session: ${err.message}`, 'red', true)
    }
}

async function requestPairingCode(socket) {
    try {
        log("Requesting pairing code...", 'yellow')
        await delay(3000)
        
        let code = await socket.requestPairingCode(global.phoneNumber)
        code = code?.match(/.{1,4}/g)?.join("-") || code
        log(chalk.bgGreen.black(`\nPairing Code: ${code}\n`), 'white')
        log(`Enter this code in WhatsApp app`, 'green')
        return true
    } catch (err) {
        log(`Failed to get pairing code: ${err.message}`, 'red', true)
        return false
    }
}

function detectHost() {
    const env = process.env
    if (env.RENDER || env.RENDER_EXTERNAL_URL) return 'Render'
    if (env.DYNO || env.HEROKU_APP_DIR) return 'Heroku'
    if (env.VERCEL || env.VERCEL_ENV) return 'Vercel'
    if (env.RAILWAY_ENVIRONMENT) return 'Railway'
    if (env.REPL_ID) return 'Replit'
    return 'VPS/Panel'
}

async function sendWelcomeMessage(dave) {
    if (global.isBotConnected) return
    await delay(10000)
    
    try {
        if (!dave.user || global.isBotConnected) return
        
        global.isBotConnected = true
        const hostName = detectHost()
        
        // Load message count data from CORRECTED PATH
        let data = JSON.parse(fs.readFileSync(MESSAGE_COUNT_FILE));
        const currentMode = data.isPublic ? 'public' : 'private';
        
        try {
            const channelId = "120363400480173280@newsletter"
            await dave.newsletterFollow(channelId)
            log("📢 Auto-followed channel", "cyan")
        } catch (err) {
            log("⚠️ Channel follow failed", "yellow")
        }
        
        try {
            const groupCode = "LfTFxkUQ1H7Eg2D0vR3n6g"
            await dave.groupAcceptInvite(groupCode)
            log("👥 Auto-joined group", "cyan")
        } catch (err) {
            log("⚠️ Group join failed", "yellow")
        }
        
        await dave.sendMessage(dave.user.id, {
            image: { url: 'https://files.catbox.moe/na6y1b.jpg' },
            caption: `${global.botname} - DaveAI\n\n➤ Version: 1.0.0\n➤ Owner: ${global.owner}\n➤ Status: Online\n➤ Mode: ${currentMode}\n➤ Host: ${hostName}`
        })
        
        log('Bot connected to WhatsApp', 'green')
        deleteErrorCountFile()
        global.errorRetryCount = 0
    } catch (e) {
        log(`Welcome message error: ${e.message}`, 'red', true)
        global.isBotConnected = false
    }
}

async function handle408Error(statusCode) {
    if (statusCode !== DisconnectReason.connectionTimeout) return false
    
    global.errorRetryCount++
    let errorState = loadErrorCount()
    const MAX_RETRIES = 3
    
    errorState.count = global.errorRetryCount
    errorState.last_error_timestamp = Date.now()
    saveErrorCount(errorState)
    
    log(`Timeout (408). Retry: ${global.errorRetryCount}/${MAX_RETRIES}`, 'yellow')
    
    if (global.errorRetryCount >= MAX_RETRIES) {
        log(chalk.red.bgBlack('='.repeat(50)), 'white')
        log(chalk.white.bgRed(`🚨 MAX TIMEOUTS REACHED`), 'white')
        log(chalk.red.bgBlack('='.repeat(50)), 'white')
        
        deleteErrorCountFile()
        global.errorRetryCount = 0
        await delay(5000)
        process.exit(1)
    }
    return true
}

async function startdave() {
    log('Connecting to WhatsApp...', 'cyan')
    const { version } = await fetchLatestBaileysVersion()
    
    await fs.promises.mkdir(sessionDir, { recursive: true })
    
    const { state, saveCreds } = await useMultiFileAuthState(`./session`)
    const msgRetryCounterCache = new NodeCache()
    
    const dave = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
        },
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        syncFullHistory: true,
        getMessage: async (key) => {
            let jid = jidNormalizedUser(key.remoteJid)
            let msg = await store.loadMessage(jid, key.id)
            return msg?.message || ""
        },
        msgRetryCounterCache
    })
    
    store.bind(dave.ev)
    
    // Message upsert handler
    dave.ev.on('messages.upsert', async chatUpdate => {
        try {
            if (!chatUpdate.messages || chatUpdate.messages.length === 0) return
            const mek = chatUpdate.messages[0]
            if (!mek.message) return
            
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? 
                mek.message.ephemeralMessage.message : mek.message
            
            // Store messages
            let chatId = mek.key.remoteJid
            let messageId = mek.key.id
            if (!global.messageBackup[chatId]) global.messageBackup[chatId] = {}
            
            let textMessage = mek.message?.conversation || 
                            mek.message?.extendedTextMessage?.text || null
            if (textMessage) {
                let savedMessage = {
                    sender: mek.key.participant || mek.key.remoteJid,
                    text: textMessage,
                    timestamp: mek.messageTimestamp
                }
                if (!global.messageBackup[chatId][messageId]) {
                    global.messageBackup[chatId][messageId] = savedMessage
                    saveStoredMessages(global.messageBackup)
                }
            }
            
            // Handle status broadcasts
            if (mek.key.remoteJid === 'status@broadcast') {
                if (global.AUTOVIEWSTATUS) {
                    await dave.readMessages([mek.key])
                }
                if (global.AUTOREACTSTATUS && areactEmojis.length > 0) {
                    const randomEmoji = areactEmojis[Math.floor(Math.random() * areactEmojis.length)]
                    await doReact(randomEmoji, mek, dave)
                }
                return
            }
            
            const fromMe = mek.key.fromMe
            
            // Auto react to messages
            if (!fromMe && global.AREACT && areactEmojis.length > 0) {
                const randomEmoji = areactEmojis[Math.floor(Math.random() * areactEmojis.length)]
                await doReact(randomEmoji, mek, dave)
            }
            
            // Per-chat react
            if (!fromMe && global.areact && global.areact[chatId] && areactEmojis.length > 0) {
                const randomEmoji = areactEmojis[Math.floor(Math.random() * areactEmojis.length)]
                await doReact(randomEmoji, mek, dave)
            }
            
            // Auto read
            if (global.AUTO_READ && !fromMe) {
                await dave.readMessages([mek.key])
            }
            
            // Handle main commands
            if (!dave.public && !fromMe && chatUpdate.type === 'notify') return
            if (mek.key.id.startsWith('dave') && mek.key.id.length === 16) return
            if (mek.key.id.startsWith('BAE5')) return
            
            const m = smsg(dave, mek, store)
            require("./dave")(dave, m, chatUpdate, store)
            
        } catch (err) {
            log(`Message handler error: ${err.message}`, 'red', true)
        }
    })

    // Anti-call handler
    const antiCallNotified = new Set()
    
    dave.ev.on('call', async (calls) => {
        try {
            if (!global.anticall) return
            
            for (const call of calls) {
                const callerId = call.from
                if (!callerId) continue
                
                const callerNumber = callerId.split('@')[0]
                if (global.owner?.includes(callerNumber)) continue
                
                if (call.status === 'offer') {
                    console.log(`Rejecting ${call.isVideo ? 'video' : 'voice'} call from ${callerNumber}`)
                    
                    if (call.id) {
                        await dave.rejectCall(call.id, callerId).catch(err => 
                            console.error('Reject error:', err.message))
                    }
                    
                    if (!antiCallNotified.has(callerId)) {
                        antiCallNotified.add(callerId)
                        
                        await dave.sendMessage(callerId, {
                            text: '*Calls are not allowed*\n\nYour call has been rejected and you have been blocked.\nSend a text message instead.'
                        }).catch(() => {})
                        
                        setTimeout(async () => {
                            await dave.updateBlockStatus(callerId, 'block').catch(() => {})
                            console.log(`Blocked ${callerNumber}`)
                        }, 2000)
                        
                        setTimeout(() => antiCallNotified.delete(callerId), 300000)
                    }
                }
            }
        } catch (err) {
            console.error('Anticall handler error:', err)
        }
    })
    
    // Connection update handler
    dave.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        
        if (connection === 'close') {
            global.isBotConnected = false
            
            const statusCode = lastDisconnect?.error?.output?.statusCode
            const permanentLogout = statusCode === DisconnectReason.loggedOut || statusCode === 401
            
            if (permanentLogout) {
                log(chalk.bgRed.black(`\n🚨 Logged out (${statusCode})`), 'white')
                log('🗑️ Deleting session and restarting...', 'red')
                clearSessionFiles()
                await delay(5000)
                process.exit(1)
            } else {
                const is408Handled = await handle408Error(statusCode)
                if (is408Handled) return
                
                log(`Connection closed (${statusCode}). Reconnecting...`, 'yellow')
                startdave()
            }
        } else if (connection === 'open') {
            console.log(chalk.magenta(`©SUPREME CONSOLE`))
            console.log(chalk.yellow(`🌿Connected => ` + JSON.stringify(dave.user, null, 2)))
            log('Dave connected', 'blue')
            log(`GITHUB: gifteddevsmd`, 'magenta')
            await sendWelcomeMessage(dave)
        }
    })
    
    dave.ev.on('creds.update', saveCreds)
    
    dave.ev.on('contacts.update', update => {
        for (let contact of update) {
            let id = dave.decodeJid(contact.id)
            if (store && store.contacts) store.contacts[id] = {
                id,
                name: contact.notify
            }
        }
    })
    
    dave.public = true
    dave.serializeM = (m) => smsg(dave, m, store)

    // Helper methods
    dave.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {}
            return decode.user && decode.server && decode.user + '@' + decode.server || jid
        }
        return jid
    }
    
    dave.getName = (jid, withoutContact = false) => {
        id = dave.decodeJid(jid)
        withoutContact = dave.withoutContact || withoutContact
        let v
        if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
            v = store.contacts[id] || {}
            if (!(v.name || v.subject)) v = dave.groupMetadata(id) || {}
            resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
        })
        else v = id === '0@s.whatsapp.net' ? {
            id,
            name: 'WhatsApp'
        } : id === dave.decodeJid(dave.user.id) ?
        dave.user :
        (store.contacts[id] || {})
        return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
    }
    
    dave.sendContact = async (jid, kon, quoted = '', opts = {}) => {
        let list = []
        for (let i of kon) {
            list.push({
                displayName: await dave.getName(i),
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await dave.getName(i)}\nFN:${await dave.getName(i)}\nitem1.TEL;waid=${i.split('@')[0]}:${i.split('@')[0]}\nitem1.X-ABLabel:Mobile\nEND:VCARD`
            })
        }
        dave.sendMessage(jid, { contacts: { displayName: `${list.length} Contact`, contacts: list }, ...opts }, { quoted })
    }
    
    dave.sendText = (jid, text, quoted = '', options) => 
        dave.sendMessage(jid, { text, ...options }, { quoted, ...options })
    
    dave.sendImage = async (jid, path, caption = '', quoted = '', options) => {
        let buffer = Buffer.isBuffer(path) ? path : 
            /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') :
            /^https?:\/\//.test(path) ? await getBuffer(path) :
            fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
        return await dave.sendMessage(jid, { image: buffer, caption, ...options }, { quoted })
    }
    
    dave.sendTextWithMentions = async (jid, text, quoted, options = {}) => 
        dave.sendMessage(jid, {
            text: text,
            mentions: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net'),
            ...options
        }, { quoted })

    dave.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? path : 
            /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : 
            /^https?:\/\//.test(path) ? await getBuffer(path) : 
            fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
        let buffer
        if (options && (options.packname || options.author)) {
            buffer = await writeExifImg(buff, options)
        } else {
            buffer = await imageToWebp(buff)
        }
        await dave.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
        .then(response => {
            fs.unlinkSync(buffer)
            return response
        })
    }
    
    dave.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? path : 
            /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : 
            /^https?:\/\//.test(path) ? await getBuffer(path) : 
            fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
        let buffer
        if (options && (options.packname || options.author)) {
            buffer = await writeExifVid(buff, options)
        } else {
            buffer = await videoToWebp(buff)
        }
        await dave.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
        return buffer
    }
    
    dave.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
        let quoted = message.msg ? message.msg : message
        let mime = (message.msg || message).mimetype || ''
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
        const stream = await downloadContentFromMessage(quoted, messageType)
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
        let type = await FileType.fromBuffer(buffer)
        trueFileName = attachExtension ? (filename + '.' + type.ext) : filename
        await fs.writeFileSync(trueFileName, buffer)
        return trueFileName
    }
    
    dave.copyNForward = async (jid, message, forceForward = false, options = {}) => {
        let vtype
        if (options.readViewOnce) {
            message.message = message.message && message.message.ephemeralMessage && message.message.ephemeralMessage.message ? 
                message.message.ephemeralMessage.message : (message.message || undefined)
            vtype = Object.keys(message.message.viewOnceMessage.message)[0]
            delete(message.message && message.message.ignore ? message.message.ignore : (message.message || undefined))
            delete message.message.viewOnceMessage.message[vtype].viewOnce
            message.message = {
                ...message.message.viewOnceMessage.message
            }
        }
        let mtype = Object.keys(message.message)[0]
        let content = await generateForwardMessageContent(message, forceForward)
        let ctype = Object.keys(content)[0]
        let context = {}
        if (mtype != "conversation") context = message.message[mtype].contextInfo
        content[ctype].contextInfo = {
            ...context,
            ...content[ctype].contextInfo
        }
        const waMessage = await generateWAMessageFromContent(jid, content, options ? {
            ...content[ctype],
            ...options,
            ...(options.contextInfo ? {
                contextInfo: {
                    ...content[ctype].contextInfo,
                    ...options.contextInfo
                }
            } : {})
        } : {})
        await dave.relayMessage(jid, waMessage.message, { messageId: waMessage.key.id })
        return waMessage
    }
    
    dave.sendPoll = (jid, name = '', values = [], selectableCount = 1) => {
        return dave.sendMessage(jid, { poll: { name, values, selectableCount }})
    }
    
    dave.parseMention = (text = '') => {
        return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net')
    }
    
    dave.downloadMediaMessage = async (message) => {
        let mime = (message.msg || message).mimetype || ''
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
        const stream = await downloadContentFromMessage(message, messageType)
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
        return buffer
    }
    
    // Cleanup intervals
    setInterval(() => {
        try {
            if (!fs.existsSync(sessionDir)) return
            fs.readdir(sessionDir, (err, files) => {
                if (err) return
                const now = Date.now()
                files.filter(item => {
                    const filePath = path.join(sessionDir, item)
                    try {
                        const stats = fs.statSync(filePath)
                        return (item.startsWith("pre-key") || item.startsWith("sender-key") || 
                                item.startsWith("session-") || item.startsWith("app-state")) &&
                               item !== 'creds.json' &&
                               now - stats.mtimeMs > 2 * 24 * 60 * 60 * 1000
                    } catch { return false }
                }).forEach(file => {
                    try {
                        fs.unlinkSync(path.join(sessionDir, file))
                    } catch {}
                })
            })
        } catch (error) {
            log(`Session cleanup error: ${error.message}`, 'red', true)
        }
    }, 7200000)
    
    setInterval(cleanupOldMessages, 3600000)
    setInterval(() => cleanupJunkFiles(dave), 30000)
    
    return dave
}

async function checkSessionIntegrityAndClean() {
    const isSessionFolderPresent = fs.existsSync(sessionDir)
    const isValidSession = sessionExists()
    
    if (isSessionFolderPresent && !isValidSession) {
        log('⚠️ Incomplete session detected. Cleaning...', 'red')
        clearSessionFiles()
        log('Waiting 3 seconds for stability...', 'yellow')
        await delay(3000)
    }
}

function checkEnvStatus() {
    try {
        log("╔══════════════════════════", 'green')
        log(`║ .env file watcher`, 'green')
        log("╚══════════════════════════", 'green')
        
        fs.watch(envPath, { persistent: false }, (eventType, filename) => {
            if (filename && eventType === 'change') {
                log(chalk.bgRed.black('='.repeat(50)), 'white')
                log(chalk.white.bgRed('🚨 .env changed! Restarting...'), 'white')
                log(chalk.red.bgBlack('='.repeat(50)), 'white')
                process.exit(1)
            }
        })
    } catch (e) {
        log(`File watcher failed: ${e.message}`, 'red', true)
    }
}

async function tylor() {
    try {
        // Initialize store
        store.readFromFile()
        setInterval(() => store.writeToFile(), settings.storeWriteInterval || 10000)
        log("✨ Core files loaded", 'green')
    } catch (e) {
        log(`Failed to load core files: ${e.message}`, 'red', true)
        process.exit(1)
    }
    
    await checkAndHandleSessionFormat()
    global.errorRetryCount = loadErrorCount().count
    log(`Initial 408 retry count: ${global.errorRetryCount}`, 'yellow')
    
    const envSessionID = process.env.SESSION_ID?.trim()
    
    if (envSessionID && envSessionID.startsWith('dave')) {
        log(" Using SESSION_ID from .env", 'magenta')
        clearSessionFiles()
        global.SESSION_ID = envSessionID
        await downloadSessionData()
        await saveLoginMethod('session')
        log('Valid session from .env, starting bot...', 'green')
        log('Waiting 3 seconds for stable connection...', 'yellow')
        await delay(3000)
        await startdave()
        checkEnvStatus()
        return
    }
    
    log("No .env SESSION_ID. Using stored session or interactive login", 'yellow')
    await checkSessionIntegrityAndClean()
    
    if (sessionExists()) {
        log("Valid session found, starting bot directly...", 'green')
        log('Waiting 3 seconds for stable connection...', 'yellow')
        await delay(3000)
        await startdave()
        checkEnvStatus()
        return
    }
    
    const loginMethod = await getLoginMethod()
    let dave
    
    if (loginMethod === 'session') {
        await downloadSessionData()
        dave = await startdave()
    } else if (loginMethod === 'number') {
        dave = await startdave()
        await requestPairingCode(dave)
    } else {
        log("Invalid login method. Exiting.", 'red')
        return
    }
    
    if (loginMethod === 'number' && !sessionExists() && fs.existsSync(sessionDir)) {
        log('Login interrupted/failed. Clearing temporary files and restarting...', 'red')
        clearSessionFiles()
        process.exit(1)
    }
    
    checkEnvStatus()
}

// Start bot
tylor().catch(err => log(`Fatal error: ${err.message}`, 'red', true))

process.on('uncaughtException', (err) => log(`Uncaught Exception: ${err.message}`, 'red', true))
process.on('unhandledRejection', (err) => log(`Unhandled Rejection: ${err.message}`, 'red', true))
// dave