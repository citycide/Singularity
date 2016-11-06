import jetpack from 'fs-jetpack'
import _ from 'lodash'
import moment from 'moment'
import Levers from 'levers'
import axios from 'axios'

import transit from 'main/components/transit'
import { appDB as db } from 'common/components/db'
import log from 'common/utils/logger'
import Tock from 'common/utils/tock'
import Queue from './lib/queue.js'
import { getChatInstance } from './lib/tmi-instance'

const settings = new Levers('app')
const channel = new Levers('twitch')
const tick = new Tock()
const followers = new Set()
const alertQueue = new Queue()
let alertInProgress = false

const OPTIONS = {
  name: channel.get('name'),
  id: channel.get('_id'),
  token: settings.get('twitch.token'),
  clientID: settings.get('clientID')
}

const instance = axios.create({
  baseURL: 'https://api.twitch.tv/kraken/',
  headers: {
    'Accept': 'application/vnd.twitchtv.v3+json',
    'Authorization': `OAuth ${OPTIONS.token}`,
    'Client-ID': OPTIONS.clientID
  }
})

async function api (endpoint, opts) {
  try {
    return (await instance({
      url: endpoint,
      params: {
        ts: Date.now()
      },
      ...opts
    })).data
  } catch (e) {
    const status = _.get(e, 'response.data.status')
    if (status === 404) return {}

    const msg = _.get(e, 'response.data.message', 'Unknown error')
    log.error(e.message || msg)
    throw e
  }
}

async function resolveUser (username) {
  const data = api('/users/' + username)

  if (!('display_name' in data)) {
    return {
      user: {
        display_name: username
      }
    }
  }

  return {
    user: {
      _id: data._id,
      display_name: data.display_name,
      logo: data.logo
    },
    resolved: true
  }
}

async function pollFollowers () {
  log.absurd(`Hitting follower endpoint for ${OPTIONS.name}...`)

  const res = await api(`/channels/${OPTIONS.name}/follows?limit=100`)
  if (!('follows' in res)) {
    tick.setTimeout('pollFollowers', pollFollowers, 30 * 1000)
    return
  }

  if (!followers.size) {
    res.follows.reverse().map(async follower => {
      followers.add(follower.user.display_name)

      const o = {
        id: follower.user._id,
        name: follower.user.display_name,
        ts: moment(follower.created_at, 'x').valueOf(),
        ev: 'follower',
        ntf: follower.notifications
      }

      await db.addFollower(o.id, o.name, o.ts, o.ntf)
      writeFollower(o.name)
    })
  } else {
    res.follows.reverse().map(async follower => {
      if (followers.has(follower.user.display_name)) return

      followers.add(follower.user.display_name)

      const o = {
        user: {
          _id: follower.user._id,
          display_name: follower.user.display_name,
          logo: follower.user.logo,
          created_at: follower.created_at,
          notifications: follower.notifications
        },
        type: 'follower'
      }

      alertQueue.add(o)

      const s = {
        id: follower.user._id,
        name: follower.user.display_name,
        ts: moment(follower.created_at, 'x').valueOf(),
        ev: 'follower',
        ntf: follower.notifications
      }

      await db.addFollower(s.id, s.name, s.ts, s.ntf)
      writeFollower(s.name)
    })
  }

  tick.setTimeout('pollFollowers', pollFollowers, 30 * 1000)
}

const writeFollower = _.debounce(outputFollower, 250)
function outputFollower (followerName) {
  const dataPath = settings.get('paths.data')
  const followerFile = dataPath + '/text/latest-follower.txt'
  if (jetpack.read(followerFile) !== followerName) {
    jetpack.file(followerFile, { content: followerName })
  }
}

function checkQueue (attempts = 0) {
  if (alertInProgress) {
    if (attempts < 2) {
      log.absurd(
        `checkQueue:: An alert is either in progress ` +
        `or no client has responded with 'alert:complete'`
      )

      tick.setTimeout('checkQueue', checkQueue, 5 * 1000, attempts + 1)
    } else {
      log.absurd(`checkQueue:: Maximum attempts reached. Unblocking alert queue...`)
      alertInProgress = false
      checkQueue()
    }

    return
  }

  if (!alertQueue.size) {
    tick.setTimeout('checkQueue', checkQueue, 5 * 1000)
    return
  }

  const { user, type } = alertQueue.next()
  actOnQueue(user, type)
  tick.setTimeout('checkQueue', checkQueue, 5 * 1000)
}

function actOnQueue (data, type) {
  log.trace('Alert Queue:: Pushing queue item...')
  alertInProgress = true

  switch (type) {
    case 'follower':
      log.trace('Queue item is a follower event.')
      transit.emit('alert:follow', data, 'all')
      transit.emit('alert:follow:event', {
        twitchid: data._id,
        username: data.display_name,
        timestamp: moment(data.created_at, 'x').fromNow(),
        evtype: 'follower',
        notifications: data.notifications
      }, 'all')
      break
    case 'host':
      log.trace('Queue item is a host event.')
      transit.emit('alert:host', data, 'all')
      break
    case 'sub':
      log.trace('Queue item is a subscriber event.')
      transit.emit('alert:subscriber', data, 'all')
      break
    case 'tip':
      log.trace('Queue item is a tip event.')
      transit.emit('alert:tip', data, 'all')
      break
    default:
      log.debug(
        `ERR in actOnQueue:: Queue item is of unknown type '${type}'`
      )
  }
}

async function followHandler (username) {
  const user = await resolveUser(username)

  let follower
  if (user.resolved) {
    follower = {
      user: {
        _id: user.user._id,
        display_name: user.user.display_name,
        logo: user.user.logo
      },
      type: 'follower'
    }
  } else {
    follower = {
      user: {
        display_name: user.user.display_name
      },
      type: 'follower'
    }
  }

  alertQueue.add(follower)
  checkQueue()
}

async function hostHandler (obj) {
  const user = await resolveUser(obj.user.display_name)

  let host
  if (user.resolved) {
    host = {
      user: {
        _id: user.user._id,
        display_name: user.user.display_name,
        logo: user.user.logo,
        viewers: obj.viewers
      },
      type: 'host'
    }
  } else {
    host = {
      user: {
        display_name: obj.user.display_name
      },
      type: 'host'
    }
  }

  alertQueue.add(host)
  checkQueue()
}

async function subHandler (username) {
  const user = await resolveUser(username)

  let sub
  if (user.resolved) {
    sub = {
      user: {
        _id: user.user._id,
        display_name: user.user.display_name,
        logo: user.user.logo
      },
      type: 'sub'
    }
  } else {
    sub = {
      user: {
        display_name: user.user.display_name
      },
      type: 'sub'
    }
  }

  alertQueue.add(sub)
  checkQueue()
}

async function resubHandler (obj) {
  const user = await resolveUser(obj.user.display_name)

  let resub
  if (user.resolved) {
    resub = {
      user: {
        _id: user.user._id,
        display_name: user.user.display_name,
        logo: user.user.logo,
        months: obj.months
      },
      type: 'subscriber'
    }
  } else {
    resub = {
      user: {
        display_name: user.user.display_name,
        months: obj.months
      },
      type: 'subscriber'
    }
  }

  alertQueue.add(resub)
  checkQueue()
}

async function tipHandler (obj) {
  const tip = {
    user: {
      name: obj.user.name,
      amount: obj.amount,
      message: obj.message
    },
    type: 'tip'
  }

  alertQueue.add(tip)
  checkQueue()
}

export default class Twitch {
  constructor (instant) {
    log.info('Initializing Twitch API...')

    setTimeout(() => {
      pollFollowers()
      this.chatListener()
      this.eventHandlers()
    }, instant ? 1 : 5000)

    tick.setTimeout('checkQueue', checkQueue, 10 * 1000)
  }

  chatListener () {
    if (!OPTIONS.name || !OPTIONS.token) return
    getChatInstance(OPTIONS).on('connected', (address, port) => {
      log.info(`Listening for Twitch events at ${address}:${port}`)
      this.clientHandlers()
    })
    getChatInstance(OPTIONS).connect()
  }

  clientHandlers () {
    getChatInstance(OPTIONS).on('hosted', hostHandler)
    getChatInstance(OPTIONS).on('subscription', subHandler)
    getChatInstance(OPTIONS).on('subanniversary', resubHandler)
  }

  eventHandlers () {
    transit.on('alert:follow:test', followHandler)
    transit.on('alert:host:test', hostHandler)
    transit.on('alert:tip:test', tipHandler)
    transit.on('alert:sub:test', subHandler)
    transit.on('alert:resub:test', resubHandler)

    transit.on('alert:tip:event', data => {
      alertQueue.add(data)
      checkQueue()
    })
    transit.on('alert:complete', () => {
      alertInProgress = false
    })
  }
}

export {
  api,
  resolveUser,
  writeFollower
}
