import jetpack from 'fs-jetpack'
import moment from 'moment'
import Levers from 'levers'
import tmi from 'tmi.js'

import transit from '../../components/transit'
import db from '../../../common/components/db'
import log from '../../../common/utils/logger'
import Tock from '../../../common/utils/Tock'

const settings = new Levers('app')
const channel = new Levers('twitch')
const tick = new Tock()

export default class TwitchClass {
  constructor () {
    this.alertInProgress = false
    this.followers = []
    this.alertQueue = []

    this.CHANNEL = {
      name: channel.get('name'),
      id: channel.get('_id'),
      token: settings.get('twitchToken')
    }
    this.CLIENT_ID = settings.get('clientID')

    this.client = null
    this.TMI_OPTIONS = {
      options: {
        debug: false
      },
      connection: {
        reconnect: true,
        cluster: 'aws'
      },
      identity: {
        username: this.CHANNEL.name,
        password: this.CHANNEL.token
      },
      channels: [this.CHANNEL.name]
    }

    this.API = {
      BASE_URL: 'https://api.twitch.tv/kraken',
      CHANNEL_EP: `/channels/${this.CHANNEL.name}/`
    }
  }

  initAPI (pollInterval = 30 * 1000) {
    setTimeout(() => {
      log.info('Initializing Twitch API')

      this.chatConnect()
      this.pollFollowers()
      tick.setInterval('pollFollowers', ::this.pollFollowers, pollInterval)
      this.eventHandler()
    }, 5 * 1000)
    tick.setTimeout('checkQueue', ::this.checkQueue, 10 * 1000)
  }

  chatConnect () {
    if (this.CHANNEL.name && this.CHANNEL.token) {
      // eslint-disable-next-line
      this.client = new tmi.client(this.TMI_OPTIONS)

      this.client.on('connected', (address, port) => {
        log.info(`Listening for Twitch events at ${address}:${port}`)
        this.clientHandler()
      })

      this.client.connect()
    }
  }

  clientHandler () {
    this.client.on('hosted', (channel, username, viewers) => {
      let thisHost
      this.resolveUser(username, userObj => {
        if (userObj.resolved) {
          thisHost = {
            user: {
              _id: userObj.user._id,
              display_name: userObj.user.display_name,
              logo: userObj.user.logo,
              viewers
            },
            type: 'host'
          }

          db.addHost(
            thisHost.user._id, thisHost.user.display_name, moment().valueOf(), thisHost.user.viewers
          )
        } else {
          thisHost = {
            user: {
              display_name: userObj.user.display_name,
              viewers
            },
            type: 'host'
          }

          db.addHost(null, thisHost.user.display_name, moment().valueOf(), thisHost.user.viewers)
        }

        this.alertQueue.push(thisHost)
      })
    })

    this.client.on('subscription', (channel, username) => {
      let sub
      this.resolveUser(username, userObj => {
        if (userObj.resolved) {
          sub = {
            user: {
              _id: userObj.user._id,
              display_name: userObj.user.display_name,
              logo: userObj.user.logo
            },
            type: 'subscriber'
          }

          db.addSubscriber(sub.user._id, sub.user.display_name, moment().valueOf(), null)
        } else {
          sub = {
            user: {
              display_name: userObj.user.display_name
            },
            type: 'subscriber'
          }

          db.addSubscriber(null, sub.user.display_name, moment().valueOf(), null)
        }

        this.alertQueue.push(sub)
      })
    })

    this.client.on('subanniversary', (channel, username, months) => {
      let resub
      this.resolveUser(username, userObj => {
        if (userObj.resolved) {
          resub = {
            user: {
              _id: userObj.user._id,
              display_name: userObj.user.display_name,
              logo: userObj.user.logo,
              months
            },
            type: 'subscriber'
          }

          db.addSubscriber(
            resub.user._id, resub.user.display_name, moment().valueOf(), resub.user.months
          )
        } else {
          resub = {
            user: {
              display_name: userObj.user.display_name,
              months
            },
            type: 'subscriber'
          }

          db.addSubscriber(null, resub.user.display_name, moment().valueOf(), resub.user.months)
        }

        this.alertQueue.push(resub)
      })
    })
  }

  eventHandler () {
    transit.on('test:follower', username => {
      let thisTest
      this.resolveUser(username, userObj => {
        if (userObj.resolved) {
          thisTest = {
            user: {
              _id: userObj.user._id,
              display_name: userObj.user.display_name,
              logo: userObj.user.logo
            },
            type: 'follower'
          }
        } else {
          thisTest = {
            user: {
              display_name: userObj.user.display_name
            },
            type: 'follower'
          }
        }

        this.alertQueue.push(thisTest)
        this.checkQueue()
      })
    })

    transit.on('test:host', hostObj => {
      let thisTest
      this.resolveUser(hostObj.user.display_name, userObj => {
        if (userObj.resolved) {
          thisTest = {
            user: {
              _id: userObj.user._id,
              display_name: userObj.user.display_name,
              logo: userObj.user.logo,
              viewers: hostObj.viewers
            },
            type: 'host'
          }
        } else {
          thisTest = {
            user: {
              display_name: userObj.user.display_name
            },
            type: 'host'
          }
        }

        this.alertQueue.push(thisTest)
        this.checkQueue()
      })
    })

    transit.on('test:tip', data => {
      let thisTest = {
        user: {
          name: data.user.name,
          amount: data.amount,
          message: data.message
        },
        type: 'tip'
      }

      this.alertQueue.push(thisTest)
      this.checkQueue()
    })

    transit.on('alert:tip:event', data => {
      this.alertQueue.push(data)
    })

    transit.on('alert:complete', () => {
      this.alertInProgress = false
    })
  }
}

TwitchClass.prototype.pollFollowers = function () {
  log.absurd(`Hitting follower endpoint for ${this.CHANNEL.name}...`)
  this.client.api({
    url: `${this.API.BASE_URL}${this.API.CHANNEL_EP}follows?limit=100&ts=${Date.now()}`,
    method: 'GET',
    headers: {
      'Accept': 'application/vnd.twitchtv.v3+json',
      'Authorization': `OAuth ${this.CHANNEL.token.slice(6)}`,
      'Client-ID': this.CLIENT_ID
    }
  }, (err, res, body = {}) => {
    if (err) {
      log.error(err)
      return
    }

    if (res.statusCode !== 200) {
      log.debug(`pollFollowers:: Unknown response code: ${res.statusCode}`)
      return
    }

    if (body.follows.length > 0) {
      if (this.followers.length === 0) {
        body.follows.reverse().map(follower => {
          if (!this.followers.includes(follower.user.display_name)) {
            this.followers.push(follower.user.display_name)
          }

          let s = {
            id: follower.user._id,
            name: follower.user.display_name,
            ts: moment(follower.created_at, moment.ISO_8601).valueOf(),
            ev: 'follower',
            ntf: follower.notifications
          }

          db.addFollower(s.id, s.name, s.ts, s.ntf.toString())
        })

        this.writeFollower(this.followers[this.followers.length - 1])
      } else {
        body.follows.reverse().map(follower => {
          if (!this.followers.includes(follower.user.display_name)) {
            this.followers.push(follower.user.display_name)

            let queueFollower = {
              user: {
                _id: follower.user._id,
                display_name: follower.user.display_name,
                logo: follower.user.logo,
                created_at: follower.created_at,
                notifications: follower.notifications
              },
              type: 'follower'
            }

            this.alertQueue.push(queueFollower)

            let s = {
              id: follower.user._id,
              name: follower.user.display_name,
              ts: moment(follower.created_at, moment.ISO_8601).valueOf(),
              ev: 'follower',
              ntf: follower.notifications
            }

            db.addFollower(s.id, s.name, s.ts, s.ntf.toString())
            this.writeFollower(s.name)
          }
        })
      }
    }
  })
}

TwitchClass.prototype.writeFollower = function (followerName) {
  let followerFile = `${settings.get('dataPath')}/text/latestfollower.txt`
  if (jetpack.read(followerFile) !== followerName) {
    jetpack.file(followerFile, {
      content: followerName
    })
  }
}

TwitchClass.prototype.checkQueue = function (attempts = 0) {
  if (this.alertInProgress) {
    if (attempts < 2) {
      log.absurd(`checkQueue:: An alert is either in progress or no client has responded with 'alert:complete'`)
      attempts += 1
      tick.setTimeout('checkQueue', ::this.checkQueue, 5 * 1000, attempts)
    } else {
      log.absurd(`checkQueue:: Maximum attempts reached. Unblocking the alert queue...`)
      this.alertInProgress = false
      this.checkQueue()
    }

    return
  }

  if (!this.alertQueue.length) {
    tick.setTimeout('checkQueue', ::this.checkQueue, 5 * 1000)
    return
  }

  let queueItem = this.alertQueue.pop()
  this.actOnQueue(queueItem.user, queueItem.type)
  tick.setTimeout('checkQueue', ::this.checkQueue, 5 * 1000)
}

TwitchClass.prototype.actOnQueue = function (data, type) {
  log.trace('Pushing queue item...')

  this.alertInProgress = true
  switch (type) {
    case 'follower':
      log.trace('Queue item is a follower event.')
      transit.fire('alert:follow', data)
      transit.fire('alert:follow:event', {
        twitchid: data._id,
        username: data.display_name,
        timestamp: moment(data.created_at, 'x').fromNow(),
        evtype: 'follower',
        notifications: data.notifications
      })
      break
    case 'host':
      log.trace('Queue item is a host event.')
      transit.fire('alert:host', data)
      break
    case 'subscriber':
      log.trace('Queue item is a subscriber event.')
      transit.fire('alert:subscriber', data)
      break
    case 'tip':
      log.trace('Queue item is a tip event.')
      transit.fire('alert:tip', data)
      break
    default:
      log.debug(`ERR in actOnQueue:: Queue item is of unknown type '${type}'`)
  }
}

TwitchClass.prototype.resolveUser = function (username, callback) {
  this.client.api({
    url: `/users/${username}`,
    method: 'GET',
    headers: {
      Accept: 'application/vnd.twitchtv.v3+json',
      Authorization: `OAuth ${this.CHANNEL.token.slice(6)}`,
      'Client-ID': this.CLIENT_ID
    }
  }, (err, res, body = {}) => {
    if (err) {
      log.error(err)
      return
    }

    if (body.error) {
      const unresolvedUser = {
        user: {
          display_name: username
        }
      }

      callback(unresolvedUser)
      return
    }

    const resolvedUser = {
      user: {
        _id: body._id,
        display_name: body.display_name,
        logo: body.logo
      },
      resolved: true
    }

    callback(resolvedUser)
  })
}
