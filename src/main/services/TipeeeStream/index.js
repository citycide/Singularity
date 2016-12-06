import moment from 'moment'
import Levers from 'levers'

import TipeeeStream from './lib'
import transit from 'main/components/transit'
import store from 'main/components/state'
import log from 'common/utils/logger'

const settings = new Levers('app')
const channel = new Levers('twitch')

const isEnabled = () => !!settings.get('tipeee.active')

function start (instant) {
  if (!isEnabled()) {
    return { stop: () => {} }
  }

  const instance = new TipeeeStream(
    settings.get('tipeee.token'), channel.get('name')
  )

  instance[instant ? 'connect' : 'connectDelayed']()
  listen(instance)

  return {
    instance,
    stop: stop.bind(undefined, instance)
  }
}

function stop (instance) {
  if (!instance) return
  instance.removeAllListeners()
  instance.disconnect()

  store.modifyState(({ services }) => {
    services[NAME].active = false
  })
}

function listen (instance) {
  instance.on('connect', () => {
    log.info('Connected to TipeeeStream')
  })

  instance.on('disconnect', () => {
    log.info('Disconnected from TipeeeStream')
  })

  instance.on('donation', data => {
    transit.emit('alert:tip:event', {
      user: {
        name: data.event.parameters.username,
        amount: data.event.formattedAmount,
        message: data.event.parameters.formattedMessage,
        messageRaw: data.event.parameters.message,
        timestamp: moment(data.event.created_at).valueOf()
      },
      type: 'tip'
    }, 'all')
  })

  return instance.removeAllListeners
}

function activate (data) {
  log.info('Enabling TipeeeStream service')
  settings.set('tipeee.active', true)
  settings.set('tipeee.token', data)

  start(true)
}

function deactivate () {
  stop()

  log.info('Disabling TipeeeStream service')
  settings.set('tipeee.active', false)
  settings.del('tipeee.token')
}

const NAME = 'tipeee'

export {
  NAME,
  start,
  stop,
  isEnabled,
  activate,
  deactivate
}
