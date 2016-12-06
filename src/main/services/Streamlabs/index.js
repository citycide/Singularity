import moment from 'moment'
import Levers from 'levers'

import Streamlabs from './lib'
import { sleep } from 'common/utils/helpers'
import transit from 'main/components/transit'
import store from 'main/components/state'
import log from 'common/utils/logger'
import Tock from 'common/utils/tock'

const settings = new Levers('app')
const tick = new Tock()

const isEnabled = () => !!settings.get('streamlabs.active')
const tips = []

async function start (instant) {
  if (!isEnabled()) {
    return { stop: () => {} }
  }

  log.info('Initializing Streamlabs donations API')

  const instance = new Streamlabs({ token: settings.get('streamlabs.token') })

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
  tick.clearInterval('pollStreamlabs')

  store.modifyState(({ services }) => {
    services[NAME].active = false
  })
}

function listen (instance) {
  interval(instance)
  tick.setInterval('pollStreamlabs', interval.bind(undefined, instance), 60 * 1000)
}

function activate (data) {
  log.info('Enabling Streamlabs service')
  settings.set('streamlabs.active', true)
  settings.set('streamlabs.token', data)

  start(true)
}

function deactivate () {
  stop()

  log.info('Disabling Streamlabs service')
  settings.set('streamlabs.active', false)
  settings.del('streamlabs.token')
}

async function interval (instance) {
  try {
    const data = await instance.getRecentDonations()

    if (!data.donations) {
      return log.debug('Streamlabs:: No donation data found.')
    }

    handleResponse(data.donations)
  } catch (e) {
    log.error(e)
  }
}

function handleResponse (donations) {
  if (!tips.length) {
    donations.reverse().forEach(tip => {
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
    donations.reverse().forEach(tip => {
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
        }, 'all')
      }
    })
  }
}

const NAME = 'streamlabs'

export {
  NAME,
  start,
  stop,
  isEnabled,
  activate,
  deactivate
}
