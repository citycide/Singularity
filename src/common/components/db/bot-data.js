import { once } from 'lodash'
import Trilogy from 'trilogy'
import log from 'common/utils/logger'
import { is, to } from 'common/utils/helpers'

const instantiate = (path, opts) => new Trilogy(path, opts)
const getOrCreate = once(instantiate)

export function getInstance (path) {
  return getOrCreate(path, {
    // verbose: q => console.log(q)
    // errorListener: errHandler
  })
}

export async function initSettings () {
  return Promise.all([
    confirmConfig('prefix', '!'),
    confirmConfig('defaultCooldown', '30'),
    confirmConfig('whisperMode', 'false'),
    confirmConfig('globalCooldown', 'false'),
    confirmConfig('responseMention', 'false')
  ])
}

export async function addTable (name, columns, options) {
  const db = getInstance()
  return db.createTable(name, columns, options)
}

export async function getConfig (key, defaultValue) {
  const db = getInstance()

  let response = await db.getValue('settings', 'value', { key })

  if (is.nil(response)) {
    if (is.nil(defaultValue)) return

    await set(key, defaultValue)
    return defaultValue
  }
  return is.numeric(response) ? to.number(response, false) : response
}

export async function setConfig (key, value) {
  const db = getInstance()
  await db.insert('settings', { key, value }, { conflict: 'replace' })
  return getConfig(key)
}

// Only sets `value` if `key` does not exist
export async function confirmConfig (key, value) {
  const db = getInstance()
  await db.insert('settings', { key, value }, { conflict: 'ignore' })
  return getConfig(key)
}

export async function get (table, what, where, defaultValue) {
  if (is.object(what)) return getRow(table, where)

  const db = getInstance()
  const response = await db.getValue(table, what, where)

  if (is.nil(response)) {
    if (is.nil(defaultValue)) return

    const obj = { [what]: defaultValue }
    return set(table, obj, where)
  }

  return is.numeric(response) ? to.number(response, false) : response
}

export async function set (table, what, where, options = {}) {
  const db = getInstance()
  const whatWhere = Object.assign({}, what, where)
  const obj = Object.assign({ conflict: 'abort' }, options)

  try {
    await db.insert(table, whatWhere, options)
  } catch (e) {
    if (e.message.startsWith('UNIQUE constraint')) {
      if (obj.conflict !== 'abort') throw e
      await db.update(table, what, where)
    }
  }

  if (!where) return

  if (Object.keys(what).length === 1) {
    return get(table, Object.keys(what)[0], where)
  } else {
    return getRow(table, whatWhere)
  }
}

export async function del (table, where) {
  const db = getInstance()
  return db.del(table, where)
}

export async function confirm (table, what, where) {
  const db = getInstance()
  const whatWhere = Object.assign({}, what, where)
  const obj = { conflict: 'abort' }

  await db.insert(table, whatWhere, obj)
  return get(table, what, where)
}

export async function incr (table, what, amount, where) {
  if (!is.finite(amount) || amount === 0) {
    throw new Error(`Invalid amount: ${amount}`)
  }

  if (!is.object(where)) {
    throw new Error(`'where' must be an Object`)
  }

  if (amount < 0) return decr(table, what, amount, where)

  const db = getInstance()
  await db.increment(table, what, amount, where)
  return db.getValue(table, what, where)
}

export async function decr (table, what, amount, where, allowNegative) {
  if (!is.finite(amount) || amount === 0) {
    throw new Error(`Invalid amount: ${amount}`)
  }

  if (!is.object(where)) {
    throw new Error(`'where' must be an Object`)
  }

  const db = getInstance()
  await db.decrement(table, what, amount, where, allowNegative)
  return db.getValue(table, what, where)
}

export async function getRow (table, where, order) {
  const db = getInstance()
  return db.first(table, where, order)
}

export async function getRows (table, where, order) {
  const db = getInstance()
  return db.select(table, where, order)
}

export async function getRandomRow (table) {
  const db = getInstance()
  return db.first(table, {}, { random: true })
}

export async function countRows (table, what, where, options) {
  const db = getInstance()
  return db.count(table, what, where, options)
}

export async function tableExists (table) {
  const db = getInstance()
  return db.hasTable(table)
}

export async function addCommand (name, cooldown, permission, status, price, module, response) {
  if (!name || !module) {
    log.bot('Failed to add command. Name & module are required.')
    return
  }

  const db = getInstance()
  await db.insert('commands', {
    name, cooldown, permission, status, price, module, response
  }, { conflict: 'ignore' })
}

export async function addSubcommand (name, cooldown, permission, status, price, module, parent) {
  if (!name || !module || !parent) {
    log.bot('Failed to add command. Name, module, & parent are required.')
    return
  }

  const db = getInstance()
  await db.insert('subcommands', {
    name, cooldown, permission, status, price, module, parent
  }, { conflict: 'ignore' })
}

export async function addUser (user) {
  const db = getInstance()
  const { name, permission, mod, following, seen, points, time, rank } = user

  try {
    await db.insert('users', {
      name, permission, mod, following, seen, points, time, rank
    }, { conflict: 'abort' })
  } catch (e) {
    if (e.message.startsWith('UNIQUE constraint')) {
      await db.update('users', {
        permission, mod, following, seen, points, time, rank
      }, { name })

      return
    }

    throw e
  }
}
