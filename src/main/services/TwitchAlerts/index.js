import moment from 'moment'
import Levers from 'levers'

import TwitchAlerts from './lib'
import { sleep } from 'common/utils/helpers'
import transit from 'main/components/transit'
import log from 'common/utils/logger'
import Tock from 'common/utils/Tock'

const settings = new Levers('app')
const tick = new Tock()

const isEnabled = () => settings.get('twitchAlerts.active')
const tips = []

async function start (instant) {
  if (!isEnabled()) return {}

  log.info('Initializing TwitchAlerts donations API')

  const instance = new TwitchAlerts({ token: settings.get('twitchAlerts.token') })

  if (instant) {
    listen(instance)
  } else {
    await sleep(10000)
    listen(instance)
  }

  return {
    instance,
    stop: stop.bind(undefined, instance)
  }
}

function stop () {
  tick.clearInterval('pollTwitchAlerts')
}

function listen (instance) {
  interval(instance)
  tick.setInterval('pollTwitchAlerts', interval.bind(undefined, instance), 60 * 1000)
}

function activate (data) {
  log.info('Enabling TwitchAlerts service')
  settings.set('twitchAlerts.active', true)
  settings.set('twitchAlerts.token', data)

  start(true)
}

function deactivate () {
  stop()

  log.info('Disabling TwitchAlerts service')
  settings.set('twitchAlerts.active', false)
  settings.del('twitchAlerts.token')
}

async function interval (instance) {
  try {
    const data = await instance.getRecentDonations()

    if (!data.donations) {
      return log.debug('TwitchAlerts:: No donation data found.')
    }

    handleResponse(data.donations)
  } catch (e) {
    log.error(e)
  }
}

function handleResponse (donations) {
  if (!tips.length) {
    donations.reverse().map(tip => {
      if (!tips.includes(tip.id)) tips.push(tip.id)

      // eslint-disable-next-line
      const t = {
        user: {
          name: tip.donator.name,
          amount: tip.amount_label,
          message: tip.message,
          timestamp: moment(tip.created_at, moment.ISO_8601).valueOf()
        },
        type: 'tip'
      }

      // db.addTip()
    })
  } else {
    donations.reverse().map(tip => {
      if (!tips.includes(tip.id)) {
        tips.push(tip.id)

        transit.emit('alert:tip:event', {
          user: {
            name: tip.donator.name,
            amount: tip.amount_label,
            message: tip.message,
            timestamp: tip.created_at
          },
          type: 'tip'
        })
      }
    })
  }
}

export {
  start,
  stop,
  isEnabled,
  activate,
  deactivate
}
