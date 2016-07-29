import moment from 'moment'
import Levers from 'levers'
import path from 'path'

import transit from '../../main/components/transit'
import log from '../../common/utils/logger'

import TwitchClass from './Twitch'
import TipeeeStream from './TipeeeStream'
import StreamTip from './StreamTip'
import TwitchAlerts from './TwitchAlerts'
import Tock from '../../common/utils/Tock'

const settings = new Levers('app')
const channel = new Levers('twitch')
const tick = new Tock()

let bot, streamTip, tipeee, twitch, twitchAlerts
const tips = []

const listeners = {
  tipeee () {
    tipeee.on('connect', () => {
      log.info('Connected to TipeeeStream')
    })

    tipeee.on('disconnect', () => {
      log.info('Disconnected from TipeeeStream')
    })

    tipeee.on('donation', data => {
      let thisEvent = {
        user: {
          name: data.event.parameters.username,
          amount: data.event.formattedAmount,
          message: data.event.parameters.formattedMessage,
          messageRaw: data.event.parameters.message,
          timestamp: moment(data.event.created_at).valueOf()
        },
        type: 'tip'
      }
      transit.emit('alert:tip:event', thisEvent)
    })
  },
  streamTip () {
    streamTip.on('connect', () => {
    })

    let auth = false
    streamTip.on('authenticated', () => {
      if (!auth) {
        log.info('Connected to Streamtip')
        auth = true
      }
    })

    streamTip.on('authenticationFailed', () => {
      log.debug('Streamtip authentication failed')
    })

    streamTip.on('ratelimited', () => {
      log.debug('The Streamtip service has been rate limited')
    })

    streamTip.on('newTip', data => {
      let thisEvent = {
        user: {
          name: data.username || data.user.display_name || data.user.name,
          amount: `${data.currencySymbol}${data.amount}`,
          message: data.note,
          timestamp: moment(data.date).valueOf()
        },
        type: 'tip'
      }
      transit.emit('alert:tip:event', thisEvent)
    })

    streamTip.on('error', err => {
      log.trace(err)
      log.error(err.message)
    })

    streamTip.on('disconnect', () => {
      log.info('Disconnected from Streamtip')
      auth = false
    })
  },
  twitchAlerts () {
    if (twitchAlerts) {
      log.absurd('Checking for TwitchAlerts donations')
      let donations = twitchAlerts.getRecentDonations()

      donations.then(data => {
        if (!data.donations) return log.debug('TwitchAlerts:: No donation data found.')
        if (tips.length === 0) {
          data.donations.reverse().map(tip => {
            if (!tips.includes(tip.id)) {
              tips.push(tip.id)
            }

            const t = {
              user: {
                name: tip.donator.name,
                amount: tip.amount_label,
                message: tip.message,
                timestamp: moment(tip.created_at, moment.ISO_8601).valueOf()
              },
              type: 'tip'
            }
            // db.tipsAdd()
            return t
          })
        } else {
          data.donations.reverse().map(tip => {
            let queueTip
            if (!tips.includes(tip.id)) {
              tips.push(tip.id)
              queueTip = {
                user: {
                  name: tip.donator.name,
                  amount: tip.amount_label,
                  message: tip.message,
                  timestamp: tip.created_at
                },
                type: 'tip'
              }
              transit.emit('alert:tip:event', queueTip)
            }
            return queueTip
          })
        }
      }).catch(err => log.error(err))
    } else {
      log.debug('TwitchAlerts donation polling error')
    }
  }
}

function initServices () {
  if (channel.get('name')/* && settings.get('isLoggedIn')*/) {
    if (!twitch) twitch = new TwitchClass()
    twitch.initAPI()

    if (settings.get('tipeeeActive')) {
      if (!tipeee) tipeee = new TipeeeStream(settings.get('tipeeeAccessToken'), settings.get('channel'))
      tipeee.connectDelayed()
      listeners.tipeee()
    }

    if (settings.get('twitchAlertsActive')) {
      if (!twitchAlerts) twitchAlerts = new TwitchAlerts({ token: settings.get('taAccessToken') })
      setTimeout(() => {
        log.info('Initializing TwitchAlerts donations API')
        listeners.twitchAlerts()
        tick.setInterval('pollTwitchAlerts', listeners.twitchAlerts, 60 * 1000)
      }, 10 * 1000)
    }

    if (settings.get('streamTipActive')) {
      if (!streamTip) streamTip = new StreamTip(settings.get('stClientID'), settings.get('stAccessToken'))
      streamTip.connectDelayed()
      listeners.streamTip()
    }

    if (settings.get('botEnabled')) {
      if (!bot) bot = require('../../main/components/bot/core')
      bot.initialize()
    }
  }
}

const botConfig = {
  activate () {
    if (!bot) bot = require('../../main/components/bot/core')
    bot.initialize(true)
    settings.set('botEnabled', true)
  },
  deactivate () {
    if (!bot) return
    bot.disconnect(path.resolve(__dirname, '../../../bot'))
    bot = null
    settings.set('botEnabled', false)
  }
}

transit.on('auth:twitch', initServices)

/* BEGIN BOT EVENTS */
transit.on('settings:services:bot:activate', () => {
  botConfig.activate()
})

transit.on('settings:services:bot:deactivate', () => {
  botConfig.deactivate()
})

transit.on('settings:services:bot:configure', data => {
  if (data.name !== settings.get('botName') && data.auth !== settings.get('botAuth')) {
    if (!bot) return

    settings.set('botName', data.name)
    settings.set('botAuth', data.auth)

    log.bot('Bot authorization has changed. Reloading...')

    bot.reconfigure(data.name, data.auth)
    if (settings.get('botEnabled')) {
      botConfig.deactivate()
      botConfig.activate()
    }
  }
})
/* END BOT EVENTS */

/* BEGIN TIPEEE EVENTS */
transit.on('settings:services:tipeee:activate', data => {
  settings.set('tipeeeActive', true)
  settings.set('tipeeeAccessToken', data)

  if (!tipeee) {
    tipeee = new TipeeeStream(settings.get('tipeeeAccessToken'), settings.get('channel'))
  } else {
    tipeee.key = data
  }

  tipeee.connect()
  listeners.tipeee()
})

transit.on('settings:services:tipeee:deactivate', () => {
  tipeee.disconnect()
  tipeee = null
  settings.set('tipeeeActive', false)
  settings.del('tipeeeAccessToken')
})
/* END TIPEEE EVENTS */

/* BEGIN STREAMTIP EVENTS */
transit.on('settings:services:streamtip:activate', data => {
  settings.set('streamTipActive', true)
  settings.set('stAccessToken', data)

  if (!streamTip) {
    streamTip = new StreamTip(settings.get('stClientID'), settings.get('stAccessToken'))
  } else {
    streamTip.accessToken = data
  }

  streamTip.connect()
  listeners.streamTip()
})

transit.on('settings:services:streamtip:deactivate', () => {
  streamTip.disconnect()
  streamTip = null
  settings.set('streamTipActive', false)
  settings.del('stAccessToken')
})
/* END STREAMTIP EVENTS */

/* BEGIN TWITCHALERTS EVENTS */
transit.on('settings:services:twitchalerts:activate', data => {
  log.info('Initializing TwitchAlerts donations API')
  settings.set('twitchAlertsActive', true)
  settings.set('taAccessToken', data)

  if (!twitchAlerts) {
    twitchAlerts = new TwitchAlerts({ token: settings.get('taAccessToken') })
  } else {
    twitchAlerts.token = data
  }

  listeners.twitchAlerts()
  tick.setInterval('pollTwitchAlerts', listeners.twitchAlerts, 60 * 1000)
})

transit.on('settings:services:twitchalerts:deactivate', () => {
  log.info('Deactivated TwitchAlerts donations API')
  tick.clearInterval('pollTwitchAlerts', listeners.twitchAlerts)
  twitchAlerts = null
  settings.set('twitchAlertsActive', false)
  settings.del('taAccessToken')
})
/* END TWITCHALERTS EVENTS */

export { initServices }
