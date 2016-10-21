import log from 'common/utils/logger'
import { botDB as db } from 'common/components/db'
import { is } from 'common/utils/helpers'

async function isCommandEnabled (cmd, sub) {
  if (!sub) {
    return db.get('commands', 'status', { name: cmd })
  } else {
    const res = await db.get('subcommands', 'status', { name: sub, parent: cmd })

    if (is(res, 'inherit')) {
      return db.get('commands', 'status', { name: cmd })
    } else {
      return res
    }
  }
}

async function commandExists (registry, cmd, sub) {
  if (!registry.hasOwnProperty(cmd)) return false

  if (!sub) {
    return registry.hasOwnProperty(cmd)
  } else {
    return registry[cmd].subcommands.hasOwnProperty(sub)
  }
}

async function enableCommand (cmd, sub) {
  if (!await commandExists(cmd, sub)) {
    log.bot(`ERR in enableCommand:: ${cmd} is not a registered command`)
    return false
  }

  if (sub) {
    await db.set('subcommands', { status: true }, { name: sub, parent: cmd })
  } else {
    await db.set('commands', { status: true }, { name: cmd })
  }

  return true
}

async function disableCommand (cmd, sub) {
  if (!await commandExists(cmd, sub)) {
    log.bot(`ERR in disableCommand:: ${cmd} is not a registered command`)
    return false
  }

  if (sub) {
    await db.set('subcommands', { status: false }, { name: sub, parent: cmd })
  } else {
    await db.set('commands', { status: false }, { name: cmd })
  }

  return true
}

async function isCustomCommand (registry, cmd) {
  if (!await commandExists(cmd)) return false
  return registry[cmd].custom
}

async function getPermLevel (cmd, sub) {
  if (!sub) {
    return db.get('commands', 'permission', { name: cmd })
  } else {
    const res = await db.get('subcommands', 'permission', { name: sub, parent: cmd })

    if (is(res, -1)) {
      return db.get('commands', 'permission', { name: cmd })
    } else {
      return res
    }
  }
}

async function setPermLevel (cmd, level, sub) {
  if (!await commandExists(cmd, sub)) {
    log.bot(`ERR in setPermLevel:: ${cmd} is not a registered command`)
    return false
  }

  if (!sub) {
    await db.set('commands', { permission: level }, { name: cmd })
  } else {
    if (is(level, -1)) {
      const res = await db.get('commands', 'permission', { name: cmd })
      await db.set('subcommands', { permission: res }, { name: sub, parent: cmd })
    } else {
      await db.set('subcommands', { permission: level }, { name: sub, parent: cmd })
    }
  }

  return true
}

export default function ($, { registry }) {
  return {
    command: {
      isEnabled: isCommandEnabled,
      exists: commandExists.bind($, registry),
      enable: enableCommand,
      disable: disableCommand,
      isCustom: isCustomCommand.bind($, registry),
      getPermLevel,
      setPermLevel
    }
  }
}
