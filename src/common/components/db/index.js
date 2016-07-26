import { app } from 'electron'
import jetpack from 'fs-jetpack'
import Promise from 'bluebird'
import moment from 'moment'
import path from 'path'
import _ from 'lodash'

import Settings from '../Settings'
import Trilogy from 'trilogy'
import log from '../../utils/logger'
import { str, val } from '../../utils/helpers'

const settings = new Settings('app')

let db = null
let botDB

const trilogyErrHandler = function (err) {
  if (!err) return

  if (err.message.startsWith('UNIQUE constraint')) {
    log.absurd(err.message)
  } else {
    log.error(err.stack)
  }
}

/**
 * Collection of api methods for main database functions
 * @export default
 */
const data = {
  /**
   * Creates or accesses bot.db when bot is enabled
   * @returns {Promise}
   */
  initBotDB () {
    botDB = new Trilogy(path.resolve(__dirname, '..', 'db', 'bot.db'), {
      debug: true,
      errorListener: trilogyErrHandler
    })

    return Promise.resolve(botDB)
  },

  async addTable (name, args, bot = false, options = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!bot) {
          return resolve(await db.createTable(name, args, options))
        } else {
          return resolve(await botDB.createTable(name, args, options))
        }
      } catch (e) {
        return reject(e)
      }
    })
  },

  /**
   * Adds a follower to the database, or updates one that already exists
   * @param id
   * @param username
   * @param [timestamp]
   * @param [notifications]
   */
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

  /**
   * Adds a subscriber to the database, or updates one that already exists
   * @param id
   * @param username
   * @param [timestamp]
   * @param [months]
   */
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

  /**
   * Adds a host event to the database
   * @param id
   * @param username
   * @param [timestamp]
   * @param [viewers]
   */
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

  /**
   * Adds a tip event to the database
   * @param username
   * @param [timestamp]
   * @param amount
   * @param [message='']
   */
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
    const response = await db.select( 'followers', '*',
      ['timestamp', '>', CUTOFF],
      { order: ['timestamp', 'desc'] }
    )

    for (let follow of response) {
      follow.age = moment(follow.timestamp, 'x').fromNow()
    }

    return response
  },
  async getFollows () {
    const response = await db.select('followers', '*', null,
      { order: ['timestamp', 'desc'] }
    )

    for (let follow of response) {
      follow.age = moment(follow.timestamp, 'x').fromNow(' ')
    }

    return response
  },

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

/**
 * Collection of api methods related to the bot database
 * @export default.bot
 */
data.bot = {
  async initSettings () {
    await this.settings.confirm('prefix', '!')
    await this.settings.confirm('defaultCooldown', '30')
    await this.settings.confirm('whisperMode', 'false')
    await this.settings.confirm('globalCooldown', 'false')
    await this.settings.confirm('responseMention', 'false')
  },

  settings: {
    async get (key, defaultValue) {
      let response = await botDB.getValue('settings', 'value', { key })

      if (_.isNil(response)) {
        if (_.isNil(defaultValue)) return Promise.resolve()

        await this.set(key, defaultValue)
        return Promise.resolve(defaultValue)
      }

      if (str.isBoolean(response)) response = (response === 'true')
      if (str.isNumeric(response)) response = val.toNumber(response)

      return Promise.resolve(response)
    },
    async set (key, value) {
      await botDB.insert('settings', { key, value }, { conflict: 'replace' })
      return Promise.resolve(await this.get(key))
    },
    async confirm (key, value) {
      // Only sets the value if the key does not exist
      await botDB.insert('settings', { key, value }, { conflict: 'ignore' })
      return Promise.resolve(await this.get(key))
    }
  },

  data: {
    async get (table, what, where, defaultValue) {
      if (_.isPlainObject(what)) return await this.getRow(table, where)

      let response = await botDB.getValue(table, what, where)

      if (_.isNil(response)) {
        if (_.isNil(defaultValue)) return Promise.resolve()

        const obj = { [what]: defaultValue }

        return Promise.resolve(await this.set(table, obj, where))
      }

      if (str.isBoolean(response)) response = (response === 'true')
      if (str.isNumeric(response)) response = val.toNumber(response)

      return Promise.resolve(response)
    },
    async set (table, what, where, options = {}) {
      const whatWhere = Object.assign({}, what, where)
      const obj = Object.assign({ conflict: 'abort' }, options)

      try {
        await botDB.insert(table, whatWhere, options)
      } catch (e) {
        if (e.message.startsWith('UNIQUE constraint')) {
          if (obj.conflict !== 'abort') return Promise.reject(e)
          await botDB.update(table, what, where)
        }
      }

      if (Object.keys(what).length === 1) {
        return Promise.resolve(await this.get(table, Object.keys(what)[0], where))
      } else {
        return Promise.resolve(await this.getRow(table, whatWhere))
      }
    },
    async del (table, where) {
      return Promise.resolve(await botDB.del(table, where))
    },
    async confirm (table, what, where) {
      const whatWhere = Object.assign({}, what, where)
      const obj = { conflict: 'abort' }

      await botDB.insert(table, whatWhere, obj)

      return Promise.resolve(await this.get(table, what, where))
    },
    async incr (table, what, amount, where) {
      if (!_.isFinite(amount) || amount === 0) return Promise.reject()
      if (!_.isPlainObject(where)) return Promise.reject()
      if (amount < 0) {
        return Promise.resolve(await this.decr(table, what, amount, where))
      }

      await botDB.increment(table, what, amount, where)

      return Promise.resolve(await botDB.getValue(table, what, where))
    },
    async decr (table, what, amount, where, allowNegative) {
      if (!_.isFinite(amount) || amount === 0) return Promise.reject()
      if (!_.isPlainObject(where)) return Promise.reject()

      await botDB.decrement(table, what, amount, where, allowNegative)

      return Promise.resolve(await botDB.getValue(table, what, where))
    },
    async getRow (table, where, order) {
      return Promise.resolve(await botDB.first(table, where, order))
    },
    async getRows (table, where, order) {
      return Promise.resolve(await botDB.select(table, where, order))
    },
    async countRows (table, what, where, options) {
      return Promise.resolve(await botDB.count(table, what, where, options))
    },
    async tableExists (table) {
      return Promise.resolve(await botDB.hasTable(table))
    }
  },

  async addCommand (name, cooldown, permission, status, price, module, response) {
    if (!name || !module) {
      log.bot('Failed to add command. Name & module are required.')
      return Promise.reject()
    }

    await botDB.insert('commands', {
      name, cooldown, permission, status, price, module, response
    }, { conflict: 'ignore' })

    return Promise.resolve(this)
  },

  async addSubcommand (name, cooldown, permission, status, price, module, parent) {
    if (!name || !module || !parent) {
      log.bot('Failed to add command. Name, module, & parent are required.')
      return Promise.reject()
    }

    await botDB.insert('subcommands', {
      name, cooldown, permission, status, price, module, parent
    }, { conflict: 'ignore' })

    return Promise.resolve(this)
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

    return Promise.resolve(this)
  }
}

/**
 * Creates or accesses singularity.db
 */
function initDB (opts = {}) {
  if (opts.DEV) {
    /**
     * Store the database in the project root directory
     */
    // jetpack.dir(path.resolve(__dirname, '..', '..', '..', 'db'))
    db = new Trilogy(path.resolve(__dirname, '..', '..', '..', 'singularity.db'))
  } else {
    switch (opts.LOCATION) {
      case 'home':
        // app directory in the user home folder
        jetpack.dir(path.resolve(settings.get('dataPath'), 'db'))
        db = new Trilogy(path.resolve(settings.get('dataPath'), 'db', 'singularity.db'))
        break
      case 'data':
        // app directory in the OS data folder
        jetpack.dir(path.resolve(app.getAppPath(), 'db'))
        db = new Trilogy(path.resolve(app.getAppPath(), 'db', 'singularity.db'))
        break
      case 'custom':
        // user configured a custom location for the db
        const dbPath = settings.get('databaseLocation', path.resolve(app.getAppPath(), 'db'))
        jetpack.dir(path.resolve(dbPath))
        db = new Trilogy(path.resolve(dbPath, 'singularity.db'))
        break
      default:
        throw new TypeError('ERR in initDB :: Invalid LOCATION property')
    }
  }

  return new Promise((resolve, reject) => {
    if (db) {
      _initTables()
        .then(() => resolve('Database & tables ready'))
        .catch(e => reject(e))
    } else {
      reject('ERR in initDB :: Database was not initialized.')
    }
  })
}

function _initTables () {
  /**
   * Creates a table of followers with columns:
   * twitchid | username | timestamp | evtype
   */
  return Promise.all([
    data.addTable('followers', [
      { name: 'twitchid', type: 'integer', primary: true },
      { name: 'username', notNull: true },
      { name: 'timestamp', type: 'integer' },
      { name: 'evtype', defaultTo: 'follower' },
      { name: 'notifications', defaultTo: false }
    ]),

    /**
     * Creates a table of subscribers with columns:
     * twitchid | username | timestamp | evtype | months
     */
    data.addTable('subscribers', [
      { name: 'twitchid', type: 'integer', primary: true },
      { name: 'username', notNull: true },
      { name: 'timestamp', type: 'integer' },
      { name: 'evtype', defaultTo: 'subscriber' },
      { name: 'months', type: 'integer', defaultTo: 0 }
    ]),

    /**
     * Creates a table of host events with columns:
     * twitchid | username | timestamp | evtype | viewers
     */
    data.addTable('hosts', [
      { name: 'twitchid', type: 'integer', notNull: true },
      { name: 'username', notNull: true },
      { name: 'timestamp', type: 'integer' },
      { name: 'evtype', defaultTo: 'host' },
      { name: 'viewers', type: 'integer', defaultTo: 0 }
    ]),

    /**
     * Creates a table of tip events with columns:
     * username | timestamp | evtype | amount | message
     */
    data.addTable('tips', [
      { name: 'username', notNull: true },
      { name: 'timestamp', type: 'integer' },
      { name: 'evtype', defaultTo: 'tip' },
      'amount', 'message'
    ])
  ])
}

export { data as default, initDB }
