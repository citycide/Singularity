import callsites from 'callsites'
import db from 'common/components/db'
import log from 'common/utils/logger'

let modules = []
let commands = {}

const _registerCommand = async function (cmd, _module, parent = false) {
  if (!modules.includes(_module)) modules.push(_module)

  const { name, handler, cooldown, permLevel, status, price } = cmd

  if (parent) {
    commands[parent].subcommands[cmd.name] = {
      name,
      parent,
      module: _module,
      subcommands: {}
    }
    await db.bot.addSubcommand(name, cooldown, permLevel, status, price, _module, parent)
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

    await db.bot.addCommand(name, cooldown, permLevel, status, price, _module)
    log.absurd(`\`- Command loaded:: '${name}' (${_module})`)
  }
}

const registerCommand = function (name, options) {
  if (!name) return

  const _module = callsites()[1].getFileName()

  const obj = Object.assign({
    name: name.toLowerCase(),
    handler: name,
    cooldown: 30,
    permLevel: 5,
    status: true,
    price: 0
  }, options)

  _registerCommand(obj, _module)
}

const registerSubcommand = function (name, parent, options) {
  if (!name || !parent || !commands.hasOwnProperty(parent)) return

  const opts = Object.assign({
    name: name.toLowerCase(),
    parent,
    cooldown: -1,
    permLevel: -1,
    status: 'inherit',
    price: -1
  }, options)

  const parentModule = commands[parent].module

  _registerCommand(opts, parentModule, parent)
}

const addCustomCommand = function (name, response) {
  if (!name || !response) return false
  const lowerName = name.toLowerCase()

  if (commands.hasOwnProperty(lowerName)) {
    log.bot(`Could not add custom command '${lowerName}'. Name already in use.`)
    return false
  }

  _registerCustomCommand(lowerName)
  _dbInsertCustomCommand(lowerName, response)

  log.trace(`Added custom command:: '${lowerName}'`)

  return true
}

const deleteCustomCommand = function (name) {
  if (!name) return
  const lowerName = name.toLowerCase()

  if (commands.hasOwnProperty(lowerName) && commands[lowerName].custom) {
    _unregisterCustomCommand(lowerName)
    _dbDeleteCustomCommand(lowerName)
    return true
  } else {
    log.bot(`Could not remove command '${lowerName}'. Doesn't exist or is not custom.`)
    return false
  }
}

const _registerCustomCommand = function (name) {
  commands[name] = {
    name,
    custom: true
  }
  log.absurd(`Loaded custom command '${name}'.`)
}

const _unregisterCustomCommand = function (name) {
  delete commands[name]
}

const _dbInsertCustomCommand = async function (name, response) {
  await db.bot.addCommand(name, 30, 5, true, 0, 'custom', response)
}

const _dbDeleteCustomCommand = async function (name) {
  await db.bot.data.del('commands', { name, module: 'custom' })
}

const _loadCustomCommands = async function () {
  const arr = await db.bot.data.getRows('commands', { module: 'custom' })
  arr.map(({ name }) => _registerCustomCommand(name))
}

const _unregister = function (all) {
  if (all) {
    modules = []
    commands = {}
  }
}

$.on('bot:ready', () => {
  $.addCommand = registerCommand
  $.addSubcommand = registerSubcommand
  $.command.addCustom = addCustomCommand
  $.command.removeCustom = deleteCustomCommand

  log.bot('Listening for commands.')
})

export {
  commands as default,
  addCustomCommand,
  deleteCustomCommand,
  _loadCustomCommands as loadCustomCommands,
  _unregister as unregister
}
