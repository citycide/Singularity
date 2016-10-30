import { once } from 'lodash'
import Trilogy from 'trilogy'
import moment from 'moment'
import log from 'common/utils/logger'

const instantiate = (path, opts) => new Trilogy(path, opts)
const getOrCreate = once(instantiate)

export function getInstance (path) {
  return getOrCreate(path, {
    // verbose: q => console.log(q)
    // errorListener: errHandler
  })
}

export async function addTable (name, columns, options = {}) {
  const db = getInstance()
  return db.createTable(name, columns, options)
}

export async function initTables () {
  return Promise.all([
    addTable('followers', [
      { name: 'twitchid', type: 'integer', primary: true },
      { name: 'username', notNull: true },
      { name: 'timestamp', type: 'integer' },
      { name: 'evtype', defaultTo: 'follower' },
      { name: 'notifications', defaultTo: false }
    ]),

    addTable('subscribers', [
      { name: 'twitchid', type: 'integer', primary: true },
      { name: 'username', notNull: true },
      { name: 'timestamp', type: 'integer' },
      { name: 'evtype', defaultTo: 'subscriber' },
      { name: 'months', type: 'integer', defaultTo: 0 }
    ]),

    addTable('hosts', [
      { name: 'twitchid', type: 'integer', notNull: true },
      { name: 'username', notNull: true },
      { name: 'timestamp', type: 'integer' },
      { name: 'evtype', defaultTo: 'host' },
      { name: 'viewers', type: 'integer', defaultTo: 0 }
    ]),

    addTable('tips', [
      { name: 'username', notNull: true },
      { name: 'timestamp', type: 'integer' },
      { name: 'evtype', defaultTo: 'tip' },
      'amount', 'message'
    ])
  ])
}

export async function addFollower (id, username, timestamp, notifications) {
  const db = getInstance()

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
}

export async function addSubscriber (id, username, timestamp, months) {
  const db = getInstance()

  if (!id || !username) {
    log.error('Failed to add or update subscriber. ID & username are required.')
    return
  }

  await db.insert('subscribers', {
    twitchid: id,
    username,
    timestamp,
    evtype: (months && months > 0) ? 'resub' : 'subscriber',
    months
  }, { conflict: 'replace' })
}

export async function addHost (id, username, timestamp, viewers) {
  const db = getInstance()

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
}

export async function addTip (username, timestamp, amount, message = '') {
  const db = getInstance()

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
}

export async function getRecentFollows () {
  const db = getInstance()

  const cutoff = moment().subtract(60, 'days').valueOf()
  const response = await db.select('followers', '*',
    ['timestamp', '>', cutoff],
    { order: ['timestamp', 'desc'] }
  )

  return response.map(follow => {
    follow.age = moment(follow.timestamp, 'x').fromNow()
    return follow
  })
}

export async function getFollows () {
  const db = getInstance()

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

/*
 function errHandler (err = {}) {
 if (err.message.startsWith('UNIQUE constraint')) {
 log.absurd(err.message)
 } else {
 log.error(err.message)
 }
 }
 */
