const fs = require('fs')
const path = require('path')

let daveplug = async (m, { command, xprefix, q, daveshown, reply, args, mess }) => {
  if (!daveshown) return reply(mess.owner)

  const antideletePath = path.join(__dirname, '../database/antidelete_state.json')
  
  let antideleteState = { enabled: true }
  try {
    if (fs.existsSync(antideletePath)) {
      const data = fs.readFileSync(antideletePath, 'utf8')
      antideleteState = JSON.parse(data)
    }
  } catch (error) {
    console.log('Error loading anti-delete state:', error)
  }

  if (!args || args.length < 1) {
    const status = antideleteState.enabled ? 'ON' : 'OFF'
    return reply(`AntiDelete: ${status}`)
  }

  const option = q.toLowerCase()

  if (option === 'on') {
    if (antideleteState.enabled) return reply('AntiDelete already ON')

    antideleteState.enabled = true
    global.antiDeleteEnabled = true
    
    try {
      const dir = path.dirname(antideletePath)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(antideletePath, JSON.stringify(antideleteState, null, 2))
      reply('Antidelete successfully enabled')
    } catch (error) {
      reply('Failed to save settings')
    }
  } 
  else if (option === 'off') {
    if (!antideleteState.enabled) return reply('AntiDelete already OFF')

    antideleteState.enabled = false
    global.antiDeleteEnabled = false
    
    try {
      const dir = path.dirname(antideletePath)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(antideletePath, JSON.stringify(antideleteState, null, 2))
      reply('Antidelete successfully disabled')
    } catch (error) {
      reply('Failed to save settings')
    }
  } 
  else {
    reply(`Use: ${xprefix + command} on/off`)
  }
}

daveplug.help = ['antidelete']
daveplug.tags = ['owner']
daveplug.command = ['antidelete', 'antidel']

module.exports = daveplug;