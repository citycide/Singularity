import { app as local, remote } from 'electron'
import Trilogy from 'trilogy'
import moment from 'moment'
import Levers from 'levers'
import path from 'path'

import log from 'common/utils/logger'
import { is, to } from 'common/utils/helpers'

const settings = new Levers('app')

let db = null
let botDB

const app = local || remote.app

const data = {
  async initBotDB () {
    const dbPath = settings.get('databaseLocation', path.resolve(app.getAppPath(), 'db'))
    botDB = new Trilogy(path.resolve(dbPath, 'bot.db'), {
      // verbose: q => console.log(q)
      // errorListener: trilogyErrHandler
    })

    return botDB
  },

  async addTable (name, args, bot = false, options = {}) {
    const target = bot ? botDB : db
    return target.createTable(name, args, options)
  },

  async addFollower (id, username, timestamp, notifications) {
    if (!id || !username) {
      log.error('Failed to add or update follower. ID & username are required.')
      return
    }

    await db.insert('followers', {
      twitchid: id,
      username,
      timestamp,
      notifications
    }, { conflict: 'replace' })
  },

  async addSubscriber (id, username, timestamp, months) {
    let evtype = 'subscriber'

    if (!id || !username) {
      log.error('Failed to add or update subscriber. ID & username are required.')
      return
    }

    if (months && months > 0) evtype = 'resub'

    await db.insert('subscribers', {
      twitchid: id,
      username,
      timestamp,
      evtype,
      months
    }, { conflict: 'replace' })
  },

  async addHost (id, username, timestamp, viewers) {
    if (!username || !viewers) {
      log.error('Failed to add host. Username & viewers are required.')
      return
    }

    await db.insert('hosts', {
      twitchid: id,
      username,
      timestamp,
      viewers
    })
  },

  async addTip (username, timestamp, amount, message = '') {
    if (!username || !amount) {
      log.error('Failed to add tip. Name & amount are required.')
      return
    }

    await db.insert('tips', {
      username,
      timestamp,
      amount,
      message
    })
  },

  async getRecentFollows () {
    const CUTOFF = moment().subtract(60, 'days').valueOf()
    const response = await db.select('followers', '*',
      ['timestamp', '>', CUTOFF],
      { order: ['timestamp', 'desc'] }
    )

    return response.map(follow => {
      follow.age = moment(follow.timestamp, 'x').fromNow()
      return follow
    })
  },

  async getFollows () {
    const response = await db.select('followers', '*', null,
      { order: ['timestamp', 'desc'] }
    )

    return response.map(follow => {
      follow.age = moment(follow.timestamp, 'x').fromNow(' ')
      return follow
    })
  }

  /**
   * @TODO make this actually pull & combine the different types of events
   * It also needs to be updated to use the Trilogy module, not raw queries
   */
  /*
  dbGetEvents () {
    const CUTOFF = moment().subtract(60, 'days').valueOf()
    let followers =
      db.select(`SELECT * FROM followers WHERE timestamp > ${CUTOFF} ORDER BY timestamp DESC`).array[0].values
    let hosts =
      db.select('SELECT * FROM hosts ORDER BY timestamp DESC').array[0].values

    let events = followers.concat(hosts)
    events = events.sort((a, b) => {
      let x = a[2]
      let y = b[2]
      return y - x
    })
    return events
  }
  */
}

data.bot = {
  async initSettings () {
    return Promise.all([
      this.settings.confirm('prefix', '!'),
      this.settings.confirm('defaultCooldown', '30'),
      this.settings.confirm('whisperMode', 'false'),
      this.settings.confirm('globalCooldown', 'false'),
      this.settings.confirm('responseMention', 'false')
    ])
  },

  settings: {
    async get (key, defaultValue) {
      let response = await botDB.getValue('settings', 'value', { key })

      if (is.nil(response)) {
        if (is.nil(defaultValue)) return

        await this.set(key, defaultValue)
        return defaultValue
      }

      if (is.numeric(response)) response = to.number(response)

      return response
    },
    async set (key, value) {
      await botDB.insert('settings', { key, value }, { conflict: 'replace' })
      return this.get(key)
    },
    async confirm (key, value) {
      // Only sets the value if the key does not exist
      await botDB.insert('settings', { key, value }, { conflict: 'ignore' })
      return this.get(key)
    }
  },

  data: {
    async get (table, what, where, defaultValue) {
      if (is.object(what)) return this.getRow(table, where)

      let response = await botDB.getValue(table, what, where)

      if (is.nil(response)) {
        if (is.nil(defaultValue)) return

        const obj = { [what]: defaultValue }

        return this.set(table, obj, where)
      }

      if (is.numeric(response)) response = to.number(response)

      return response
    },
    async set (table, what, where, options = {}) {
      const whatWhere = Object.assign({}, what, where)
      const obj = Object.assign({ conflict: 'abort' }, options)

      try {
        await botDB.insert(table, whatWhere, options)
      } catch (e) {
        if (e.message.startsWith('UNIQUE constraint')) {
          if (obj.conflict !== 'abort') throw e
          await botDB.update(table, what, where)
        }
      }

      if (!where) return

      if (Object.keys(what).length === 1) {
        return this.get(table, Object.keys(what)[0], where)
      } else {
        return this.getRow(table, whatWhere)
      }
    },
    async del (table, where) {
      return botDB.del(table, where)
    },
    async confirm (table, what, where) {
      const whatWhere = Object.assign({}, what, where)
      const obj = { conflict: 'abort' }

      await botDB.insert(table, whatWhere, obj)

      return this.get(table, what, where)
    },
    async incr (table, what, amount, where) {
      if (!is.finite(amount) || amount === 0) {
        throw new Error(`Invalid amount: ${amount}`)
      }

      if (!is.object(where)) {
        throw new Error(`'where' must be an Object`)
      }

      if (amount < 0) return this.decr(table, what, amount, where)

      await botDB.increment(table, what, amount, where)
      return botDB.getValue(table, what, where)
    },
    async decr (table, what, amount, where, allowNegative) {
      if (!is.finite(amount) || amount === 0) {
        throw new Error(`Invalid amount: ${amount}`)
      }

      if (!is.object(where)) {
        throw new Error(`'where' must be an Object`)
      }

      await botDB.decrement(table, what, amount, where, allowNegative)
      return botDB.getValue(table, what, where)
    },
    async getRow (table, where, order) {
      return botDB.first(table, where, order)
    },
    async getRows (table, where, order) {
      return botDB.select(table, where, order)
    },
    async getRandomRow (table) {
      return botDB.first(table, {}, { random: true })
    },
    async countRows (table, what, where, options) {
      return botDB.count(table, what, where, options)
    },
    async tableExists (table) {
      return botDB.hasTable(table)
    }
  },

  async addCommand (name, cooldown, permission, status, price, module, response) {
    if (!name || !module) {
      log.bot('Failed to add command. Name & module are required.')
      return
    }

    await botDB.insert('commands', {
      name, cooldown, permission, status, price, module, response
    }, { conflict: 'ignore' })

    return this
  },

  async addSubcommand (name, cooldown, permission, status, price, module, parent) {
    if (!name || !module || !parent) {
      log.bot('Failed to add command. Name, module, & parent are required.')
      return
    }

    await botDB.insert('subcommands', {
      name, cooldown, permission, status, price, module, parent
    }, { conflict: 'ignore' })

    return this
  },

  async addUser (user) {
    const { name, permission, mod, following, seen, points, time, rank } = user

    try {
      await botDB.insert('users', {
        name, permission, mod, following, seen, points, time, rank
      }, { conflict: 'abort' })
    } catch (e) {
      if (e.message.startsWith('UNIQUE constraint')) {
        await botDB.update('users', {
          permission, mod, following, seen, points, time, rank
        }, { name })
      }
    }

    return this
  }
}

/**
 * Creates or accesses singularity.db
 */
function initDB (opts = {}) {
  let filePath = path.join(app.getAppPath(), 'db', 'singularity.db')
  if (!opts.DEV) {
    switch (opts.LOCATION) {
      case 'home':
        filePath = path.join(settings.get('paths.data'), 'db', 'singularity.db')
        break
      case 'data':
        filePath = path.join(app.getAppPath(), 'db', 'singularity.db')
        break
      case 'custom':
        const defaultPath = path.join(app.getAppPath(), 'db')
        const dbPath = settings.get('paths.database', defaultPath)
        filePath = path.join(dbPath, 'singularity.db')
        break
      default:
        throw new TypeError('ERR in initDB :: Invalid LOCATION property')
    }
  }

  db = new Trilogy(filePath)
  return initTables()
}

function initTables () {
  return Promise.all([
    data.addTable('followers', [
      { name: 'twitchid', type: 'integer', primary: true },
      { name: 'username', notNull: true },
      { name: 'timestamp', type: 'integer' },
      { name: 'evtype', defaultTo: 'follower' },
      { name: 'notifications', defaultTo: false }
    ]),

    data.addTable('subscribers', [
      { name: 'twitchid', type: 'integer', primary: true },
      { name: 'username', notNull: true },
      { name: 'timestamp', type: 'integer' },
      { name: 'evtype', defaultTo: 'subscriber' },
      { name: 'months', type: 'integer', defaultTo: 0 }
    ]),

    data.addTable('hosts', [
      { name: 'twitchid', type: 'integer', notNull: true },
      { name: 'username', notNull: true },
      { name: 'timestamp', type: 'integer' },
      { name: 'evtype', defaultTo: 'host' },
      { name: 'viewers', type: 'integer', defaultTo: 0 }
    ]),

    data.addTable('tips', [
      { name: 'username', notNull: true },
      { name: 'timestamp', type: 'integer' },
      { name: 'evtype', defaultTo: 'tip' },
      'amount', 'message'
    ])
  ])
}

/*
function trilogyErrHandler (err) {
  if (!err) return

  if (err.message.startsWith('UNIQUE constraint')) {
    log.absurd(err.message)
  } else {
    log.error(err.message)
  }
}
*/

export { data as default, initDB }
