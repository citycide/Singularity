import callsites from 'callsites'
import { botDB as db } from 'common/components/db'
import { log } from './ipc-bridge'

let modules = []
let commands = {}

async function addCommandOrSub (cmd, _module, parent = false) {
  if (!modules.includes(_module)) modules.push(_module)

  const { name, handler, cooldown, permLevel, status, price } = cmd

  if (parent) {
    commands[parent].subcommands[cmd.name] = {
      name,
      parent,
      module: _module,
      subcommands: {}
    }
    await db.addSubcommand(name, cooldown, permLevel, status, price, _module, parent)
  } else {
    if (commands.hasOwnProperty(name)) {
      if (commands[name].module === _module) return
      log.bot(`Duplicate command registration attempted by '${_module}'`)
      log.bot(`!${name} already registered to '${commands[name].module}'`)
      return
    }

    commands[name] = {
      name,
      handler,
      module: _module,
      subcommands: {}
    }

    await db.addCommand(name, cooldown, permLevel, status, price, _module)
    log.absurd(`\`- Command loaded:: '${name}' (${_module})`)
  }
}

function registerCommand (name, options) {
  if (!name) return

  const _module = callsites()[1].getFileName()

  const obj = Object.assign({}, {
    name: name.toLowerCase(),
    handler: name,
    cooldown: 30,
    permLevel: 5,
    status: true,
    price: 0
  }, options)

  addCommandOrSub(obj, _module)
}

function registerSubcommand (name, parent, options) {
  if (!name || !parent || !commands.hasOwnProperty(parent)) return

  const opts = Object.assign({}, {
    name: name.toLowerCase(),
    parent,
    cooldown: -1,
    permLevel: -1,
    status: 'inherit',
    price: -1
  }, options)

  const parentModule = commands[parent].module

  addCommandOrSub(opts, parentModule, parent)
}

function addCustomCommand (name, response) {
  if (!name || !response) return false
  const lowerName = name.toLowerCase()

  if (commands.hasOwnProperty(lowerName)) {
    log.bot(`Could not add custom command '${lowerName}'. Name already in use.`)
    return false
  }

  registerCustomCommand(lowerName)
  dbInsertCustomCommand(lowerName, response)

  log.trace(`Added custom command:: '${lowerName}'`)

  return true
}

function deleteCustomCommand (name) {
  if (!name) return
  const lowerName = name.toLowerCase()

  if (commands.hasOwnProperty(lowerName) && commands[lowerName].custom) {
    unregisterCustomCommand(lowerName)
    dbDeleteCustomCommand(lowerName)
    return true
  } else {
    log.bot(`Could not remove command '${lowerName}'. Doesn't exist or is not custom.`)
    return false
  }
}

function registerCustomCommand (name) {
  commands[name] = { name, custom: true }
  log.absurd(`Loaded custom command '${name}'.`)
}

function unregisterCustomCommand (name) {
  delete commands[name]
}

async function dbInsertCustomCommand (name, response) {
  await db.addCommand(name, 30, 5, true, 0, 'custom', response)
}

async function dbDeleteCustomCommand (name) {
  await db.del('commands', { name, module: 'custom' })
}

async function loadCustomCommands () {
  const arr = await db.getRows('commands', { module: 'custom' })
  arr.map(({ name }) => registerCustomCommand(name))
}

function unregister (all) {
  if (all) {
    modules = []
    commands = {}
  }
}

function extendCore ($) {
  $.addCommand = registerCommand
  $.addSubcommand = registerSubcommand
  $.command.addCustom = addCustomCommand
  $.command.removeCustom = deleteCustomCommand

  $.log.debug('core', 'Listening for commands.')
}

export default commands

export {
  extendCore,
  loadCustomCommands,
  unregister
}
