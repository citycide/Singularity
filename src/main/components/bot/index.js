import EventEmitter from 'eventemitter2'
import Levers from 'levers'

import transit from '../transit'
import Tock from 'common/utils/tock'
import db from 'common/components/db'
import log from 'common/utils/logger'
import weave from 'common/components/weave'
import { is, to, sleep } from 'common/utils/helpers'

import extensions from './extension-loader'
import bot from './bot'

const settings = new Levers('app')
const twitch = new Levers('twitch')

const channel = {
  name: twitch.get('name'),
  botName: settings.get('bot.name')
}

let commandRegistry = null
let registry = null

async function dbExists (table, where) {
  return is.object(await db.bot.data.getRow(table, where))
}

async function say (user, message) {
  if (arguments.length === 1) {
    message = user
    return bot.say(channel.name, message)
  }

  const mention = (await db.bot.settings.get('responseMention', false)) ? '' : `${user}: `

  if (!await db.bot.settings.get('whisperMode', false)) {
    return bot.say(channel.name, `${mention}${message}`)
  } else {
    return bot.whisper(user, message)
  }
}

const whisper = (user, message) => bot.whisper(user, message)
const shout = message => bot.say(channel.name, message)
const getPrefix = () => db.bot.settings.get('prefix', '!')
const getModule = cmd => extensions.loadModule(registry[cmd].module)
const getRunner = cmd => getModule(cmd)[registry[cmd].handler]

async function commandIsEnabled (cmd, sub) {
  if (!sub) {
    return db.bot.data.get('commands', 'status', { name: cmd })
  } else {
    const res = await db.bot.data.get('subcommands', 'status', { name: sub, parent: cmd })

    if (is(res, 'inherit')) {
      return db.bot.data.get('commands', 'status', { name: cmd })
    } else {
      return res
    }
  }
}

async function commandExists (cmd, sub) {
  if (!registry.hasOwnProperty(cmd)) return false

  if (!sub) {
    return registry.hasOwnProperty(cmd)
  } else {
    return registry[cmd].subcommands.hasOwnProperty(sub)
  }
}

async function commandEnable (cmd, sub) {
  if (!await commandExists(cmd, sub)) {
    log.bot(`ERR in enableCommand:: ${cmd} is not a registered command`)
    return false
  }

  if (sub) {
    await db.bot.data.set('subcommands', { status: true }, { name: sub, parent: cmd })
  } else {
    await db.bot.data.set('commands', { status: true }, { name: cmd })
  }

  return true
}

async function commandDisable (cmd, sub) {
  if (!await commandExists(cmd, sub)) {
    log.bot(`ERR in disableCommand:: ${cmd} is not a registered command`)
    return false
  }

  if (sub) {
    await db.bot.data.set('subcommands', { status: false }, { name: sub, parent: cmd })
  } else {
    await db.bot.data.set('commands', { status: false }, { name: cmd })
  }

  return true
}

async function commandIsCustom (cmd) {
  if (!await commandExists(cmd)) return false
  return registry[cmd].custom
}

async function commandGetPermLevel (cmd, sub) {
  if (!sub) {
    return db.bot.data.get('commands', 'permission', { name: cmd })
  } else {
    const res = await db.bot.data.get('subcommands', 'permission', { name: sub, parent: cmd })

    if (is(res, -1)) {
      return db.bot.data.get('commands', 'permission', { name: cmd })
    } else {
      return res
    }
  }
}

async function commandSetPermLevel (cmd, level, sub) {
  if (!await commandExists(cmd, sub)) {
    log.bot(`ERR in setPermLevel:: ${cmd} is not a registered command`)
    return false
  }

  if (!sub) {
    await db.bot.data.set('commands', { permission: level }, { name: cmd })
  } else {
    if (is(level, -1)) {
      const res = await db.bot.data.get('commands', 'permission', { name: cmd })
      await db.bot.data.set('subcommands', { permission: res }, { name: sub, parent: cmd })
    } else {
      await db.bot.data.set('subcommands', { permission: level }, { name: sub, parent: cmd })
    }
  }

  return true
}

async function getExtConfig (ext, key, defaultValue) {
  return db.bot.data.get('extension_settings', 'value', {
    key, extension: ext
  }, defaultValue)
}

async function setExtConfig (ext, key, value) {
  return db.bot.data.set('extension_settings', { value }, {
    key, extension: ext
  })
}

async function addTable (name, keyed) {
  if (await db.bot.data.tableExists(name)) return
  if (!name || typeof name !== 'string') {
    log.bot(
      `ERR in core#addTable:: Expected parameter 'name' to be a string, received ${typeof name}`
    )
    return
  }

  const columns = keyed
    ? [{ name: 'id', type: 'integer', primary: true, increments: true }, 'value', 'info']
    : ['key', 'value', 'info']

  await db.addTable(name, columns, true)
}

async function addTableCustom (name, columns) {
  if (await db.bot.data.tableExists(name)) return
  if (arguments.length < 2 || typeof name !== 'string' || !Array.isArray(columns)) {
    log.bot(`ERR in core#addTableCustom:: wrong arguments.`)
    return
  }

  await db.addTable(name, columns, true)
}

async function getSubcommand (event) {
  const { command, args: [query] } = event
  if (!query || !await commandExists(command)) return [undefined, {}]

  return [query, {
    subcommand: query,
    subArgs: event.args.slice(1),
    subArgString: event.subArgs.join(' ')
  }]
}

const coreMethods = {
  tick: new Tock(),
  weave,
  sleep,
  is,
  to,

  channel,

  say,
  whisper,
  shout,

  command: {
    getPrefix,
    getModule,
    getRunner,
    isEnabled: commandIsEnabled,
    exists: commandExists,
    enable: commandEnable,
    disable: commandDisable,
    isCustom: commandIsCustom,
    getPermLevel: commandGetPermLevel,
    setPermLevel: commandSetPermLevel
  },

  settings: {
    get: db.bot.settings.get,
    set: db.bot.settings.set,
    confirm: db.bot.settings.confirm
  },

  db: {
    get: db.bot.data.get,
    set: db.bot.data.set,
    del: db.bot.data.del,
    confirm: db.bot.data.confirm,
    incr: db.bot.data.incr,
    decr: db.bot.data.decr,
    getRow: db.bot.data.getRow,
    getRandomRow: db.bot.data.getRandomRow,
    countRows: db.bot.data.countRows,
    exists: dbExists,
    getExtConfig,
    setExtConfig,
    addTable,
    addTableCustom
  },

  user: {
    async isFollower (user) {
      const data = this.api(`users/${user}/follows/channels/${channel.name}`)
      return is.object(data.channel)
    },

    async exists (user) {
      return dbExists('users', { name: user })
    },

    async isAdmin (user) {
      // refactor to pull from some kind of Map or from the database
      return is.oneOf([channel.name, channel.botName], user)
    }
  },

  async runCommand (event) {
    const { command, sender, groupID } = event
    const [pointsEnabled, cooldownsEnabled] = await Promise.all([
      getExtConfig('points', 'enabled', true),
      getExtConfig('cooldown', 'enabled', true)
    ])

    let charge = 0

    // Check if the specified command is registered
    if (!await commandExists(command)) {
      log.bot(`'${command}' is not a registered command`)
      return
    }

    const [subcommand, subEvent] = await getSubcommand(event)

    // add subcommand properties to the event object
    if (subcommand) Object.assign(event, subEvent)

    // Check if the specified (sub)command is enabled
    if (!await commandIsEnabled(command, subcommand)) {
      this.log.event(
        `'${command}${subcommand ? ' ' + subcommand : ''}' is installed but is not enabled`
      )
      return
    }

    // Check if the specified (sub)command is on cooldown
    if (cooldownsEnabled) {
      const cooldownActive = await this.command.isOnCooldown(command, sender, subcommand)
      if (cooldownActive) {
        this.log.event(`'${command}' is on cooldown for ${sender} (${cooldownActive} seconds)`)
        say(event.sender, `You need to wait ${cooldownActive} seconds to use !${command} again.`)
        return
      }
    }

    // Check that the user has sufficient privileges to use the (sub)command
    if (groupID > await commandGetPermLevel(command, subcommand)) {
      this.log.event(`${sender} does not have sufficient permissions to use !${command}`)
      say(sender, `You don't have what it takes to use !${command}.`)
      return
    }

    // Check that the user has enough points to use the (sub)command
    if (pointsEnabled) {
      const [canAfford, userPoints, commandPrice] = await this.user.canAffordCommand(
        sender, command, subcommand
      )

      if (!canAfford) {
        this.log(`${sender} does not have enough points to use !${command}.`)
        say(
          sender,
          `You don't have enough points to use !${command}. ` +
          `» costs ${commandPrice}, you have ${userPoints}`
        )

        return
      }

      charge = commandPrice
    }

    // Finally, run the (sub)command
    if (await commandIsCustom(command)) {
      const response = await db.bot.data.get('commands', 'response', {
        name: command, module: 'custom'
      })

      say(event.sender, await this.params(event, response))

      if (cooldownsEnabled) this.command.startCooldown(command, sender)
      if (pointsEnabled && charge) this.points.sub(sender, charge)
    } else {
      try {
        getRunner(command)(event, this)

        if (cooldownsEnabled) this.command.startCooldown(command, sender, subcommand)
        if (pointsEnabled && charge) this.points.sub(sender, charge)
      } catch (e) {
        this.log.error(e.message)
      }
    }

    // Fire the command event over the emitter
    this.emit(`bot:command:${command}${subcommand ? ':' + subcommand : ''}`, event)
  }
}

class Core extends EventEmitter {
  constructor () {
    super({
      wildcard: true,
      delimiter: ':',
      newListener: false,
      maxListeners: 30
    })

    Object.assign(this, coreMethods)

    // forward events from the app emitter
    transit.onAny((...args) => this.emit(...args))
  }

  /**
   * Override `EventEmitter#on` to add the ability to
   * prevent adding the same exact listener twice.
   *
   * @param channel
   * @param fn
   * @param single
   */
  on (channel, fn, single = true) {
    if (single) this.off(channel, fn)
    super.on(channel, fn)
  }
}
const core = new Core()

global.$ = core

export async function initialize (instant) {
  if (!settings.get('bot.name') || !settings.get('bot.auth')) {
    return log.bot('Bot setup is not complete.')
  }

  await sleep(instant ? 1 : 5000)

  log.bot('Initializing bot...')
  bot.connect()

  await db.initBotDB()
  await loadHelpers()
  await loadTables()

  extensions.registerAll()

  log.bot('Bot ready.')
  core.emit('bot:ready')

  commandRegistry.loadCustomCommands()
}

export function disconnect () {
  log.bot('Deactivating bot...')
  bot.disconnect()
  commandRegistry.unregister(true)
  log.bot('Deactivated bot.')
}

/*
export function reconfigure (name, auth) {
  updateAuth(name, auth)
}
*/

async function loadTables () {
  try {
    await db.addTable('settings', [
      { name: 'key', primary: true },
      'value', 'info'
    ], true)

    await db.bot.initSettings()
  } catch (e) {
    log.error(e.message)
    throw e
  }

  await Promise.all([
    db.addTable('extension_settings', [
      'extension', 'key', 'value', 'info'
    ], true, { compositeKey: ['extension', 'key'] }),

    db.addTable('users', [
      { name: 'name', unique: 'inline' },
      { name: 'permission', type: 'integer' },
      { name: 'mod', defaultTo: 'false' },
      { name: 'following', defaultTo: 'false' },
      { name: 'seen', type: 'integer', defaultTo: 0 },
      { name: 'points', type: 'integer', defaultTo: 0 },
      { name: 'time', type: 'integer', defaultTo: 0 },
      { name: 'rank', type: 'integer', defaultTo: 1 }
    ], true),

    db.addTable('commands', [
      { name: 'name', unique: 'inline' },
      { name: 'cooldown', type: 'integer', defaultTo: 30 },
      { name: 'permission', type: 'integer', defaultTo: 5 },
      { name: 'status', defaultTo: 'false' },
      { name: 'price', type: 'integer', defaultTo: 0 },
      'module', 'response'
    ], true),

    db.addTable('subcommands', [
      'name',
      { name: 'cooldown', type: 'integer', defaultTo: 30 },
      { name: 'permission', type: 'integer', defaultTo: 5 },
      { name: 'status', defaultTo: 'false' },
      { name: 'price', type: 'integer', defaultTo: 0 },
      'module',
      'parent'
    ], true, { compositeKey: ['name', 'module'] })
  ])
}

async function loadHelpers () {
  commandRegistry = require('./command-registry')
  registry = commandRegistry.default

  require('./helpers')
}
