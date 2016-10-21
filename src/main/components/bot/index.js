import EventEmitter from 'eventemitter2'
import Levers from 'levers'

import transit from '../transit'
import log from 'common/utils/logger'
import { initBotDB, botDB as db } from 'common/components/db'
import { sleep } from 'common/utils/helpers'
import bindMethods from './lib/bind-methods'

import bot from './bot'
import extensions from './extension-loader'
import registry, {
  loadCustomCommands,
  unregister,
  extendCore
} from './command-registry'

const settings = new Levers('app')
const twitch = new Levers('twitch')

const channel = {
  name: twitch.get('name'),
  botName: settings.get('bot.name')
}

const getModule = cmd => extensions.loadModule(registry[cmd].module)
const getRunner = cmd => getModule(cmd)[registry[cmd].handler]

async function getSubcommand (event) {
  const { command, args: [query] } = event
  if (!query || !await this.command.exists(command, query)) {
    return [undefined, {}]
  }

  return [query, {
    subcommand: query,
    subArgs: event.args.slice(1),
    subArgString: event.subArgs.join(' ')
  }]
}

class Core extends EventEmitter {
  constructor (methods) {
    // initialize the emitter
    super({
      wildcard: true,
      delimiter: ':',
      newListener: false,
      maxListeners: 30
    })

    Object.assign(this, methods)

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

  async runCommand (event) {
    const { command, sender, groupID } = event
    const [pointsEnabled, cooldownsEnabled] = await Promise.all([
      this.db.getExtConfig('points', 'enabled', true),
      this.db.getExtConfig('cooldown', 'enabled', true)
    ])

    let charge = 0

    // Check if the specified command is registered
    if (!await this.command.exists(command)) {
      this.log.event('core', `'${command}' is not a registered command`)
      return
    }

    const [subcommand, subEvent] = await this::getSubcommand(event)

    // add subcommand properties to the event object
    if (subcommand) Object.assign(event, subEvent)

    // Check if the specified (sub)command is enabled
    if (!await this.command.isEnabled(command, subcommand)) {
      this.log.event(
        'core',
        `'${command}${subcommand ? ' ' + subcommand : ''}' is installed but is not enabled`
      )
      return
    }

    // Check if the specified (sub)command is on cooldown
    if (cooldownsEnabled) {
      const cooldownActive = await this.command.isOnCooldown(command, sender, subcommand)
      if (cooldownActive) {
        this.log.event('core',
          `'${command}' is on cooldown for ${sender} (${cooldownActive} seconds)`
        )
        this.say(
          event.sender,
          `You need to wait ${cooldownActive} seconds to use !${command} again.`
        )
        return
      }
    }

    // Check that the user has sufficient privileges to use the (sub)command
    if (groupID > await this.command.getPermLevel(command, subcommand)) {
      this.log.event('core',
        `${sender} does not have sufficient permissions to use !${command}`
      )
      this.say(sender, `You don't have what it takes to use !${command}.`)
      return
    }

    // Check that the user has enough points to use the (sub)command
    if (pointsEnabled) {
      const [canAfford, userPoints, commandPrice] = await this.user.canAffordCommand(
        sender, command, subcommand
      )

      if (!canAfford) {
        this.log('core', `${sender} does not have enough points to use !${command}.`)
        this.say(
          sender,
          `You don't have enough points to use !${command}. ` +
          `» costs ${commandPrice}, you have ${userPoints}`
        )

        return
      }

      charge = commandPrice
    }

    // Finally, run the (sub)command
    if (await this.command.isCustom(command)) {
      const response = await db.get('commands', 'response', {
        name: command, module: 'custom'
      })

      this.say(event.sender, await this.params(event, response))

      if (cooldownsEnabled) this.command.startCooldown(command, sender)
      if (pointsEnabled && charge) this.points.sub(sender, charge)
    } else {
      try {
        getRunner(command)(event, this)

        if (cooldownsEnabled) this.command.startCooldown(command, sender, subcommand)
        if (pointsEnabled && charge) this.points.sub(sender, charge)
      } catch (e) {
        this.log.error('core', e.message)
      }
    }

    // Fire the command event over the emitter
    this.emit(`command:${command}${subcommand ? ':' + subcommand : ''}`, event)
  }
}

export async function initialize (instant) {
  if (!settings.get('bot.name') || !settings.get('bot.auth')) {
    return log.bot('Bot setup is not complete.')
  }

  await sleep(instant ? 1 : 5000)
  log.bot('Initializing bot...')

  const core = new Core({
    channel,
    command: {
      getModule,
      getRunner
    }
  })

  global.$ = core
  bot.connect()

  initBotDB()
  await loadTables()
  await loadHelpers()
  bindMethods(core, {
    registry, extensions, channel
  })
  extendCore(core)
  extensions.registerAll()

  log.bot('Bot ready.')
  core.emit('bot:ready', core)

  loadCustomCommands()
}

export function disconnect () {
  log.bot('Deactivating bot...')
  bot.disconnect()
  unregister(true)
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
    ])

    await db.initSettings()
  } catch (e) {
    log.error(e.message)
    throw e
  }

  await Promise.all([
    db.addTable('extension_settings', [
      'extension', 'key', 'value', 'info'
    ], { compositeKey: ['extension', 'key'] }),

    db.addTable('users', [
      { name: 'name', unique: 'inline' },
      { name: 'permission', type: 'integer' },
      { name: 'mod', defaultTo: 'false' },
      { name: 'following', defaultTo: 'false' },
      { name: 'seen', type: 'integer', defaultTo: 0 },
      { name: 'points', type: 'integer', defaultTo: 0 },
      { name: 'time', type: 'integer', defaultTo: 0 },
      { name: 'rank', type: 'integer', defaultTo: 1 }
    ]),

    db.addTable('commands', [
      { name: 'name', unique: 'inline' },
      { name: 'cooldown', type: 'integer', defaultTo: 30 },
      { name: 'permission', type: 'integer', defaultTo: 5 },
      { name: 'status', defaultTo: 'false' },
      { name: 'price', type: 'integer', defaultTo: 0 },
      'module', 'response'
    ]),

    db.addTable('subcommands', [
      'name',
      { name: 'cooldown', type: 'integer', defaultTo: 30 },
      { name: 'permission', type: 'integer', defaultTo: 5 },
      { name: 'status', defaultTo: 'false' },
      { name: 'price', type: 'integer', defaultTo: 0 },
      'module',
      'parent'
    ], { compositeKey: ['name', 'module'] })
  ])
}

async function loadHelpers () {
  require('./helpers')
}
