import moment from 'moment'
import Levers from 'levers'

import Streamtip from './lib'
import transit from 'main/components/transit'
import log from 'common/utils/logger'

const settings = new Levers('app')

const isEnabled = () => settings.get('streamtip.active')

function start (instant) {
  if (!isEnabled()) return {}

  const instance = new Streamtip(
    settings.get('streamtip.clientID'), settings.get('streamtip.token')
  )

  instance[instant ? 'connect' : 'connectDelayed']()
  listen(instance)

  return {
    instance,
    stop: stop.bind(undefined, instance)
  }
}

function stop (instance) {
  instance.removeAllListeners()
  instance.disconnect()
}

function listen (instance) {
  instance.on('connect', () => {})

  let auth = false
  instance.on('authenticated', () => {
    if (!auth) {
      log.info('Connected to Streamtip')
      auth = true
    }
  })

  instance.on('authenticationFailed', () => {
    log.debug('Streamtip authentication failed')
  })

  instance.on('ratelimited', () => {
    log.debug('The Streamtip service has been rate limited')
  })

  instance.on('newTip', data => {
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

  instance.on('error', err => {
    log.trace(err)
    log.error(err.message)
  })

  instance.on('disconnect', () => {
    log.info('Disconnected from Streamtip')
    auth = false
  })

  return instance.removeAllListeners
}

function activate (data) {
  log.info('Enabling Streamtip service')
  settings.set('streamtip.active', true)
  settings.set('streamtip.token', data)

  start(true)
}

function deactivate () {
  stop()

  log.info('Disabling Streamtip service')
  settings.set('streamtip.active', false)
  settings.del('streamtip.token')
}

export {
  start,
  stop,
  isEnabled,
  activate,
  deactivate
}
