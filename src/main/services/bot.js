import Levers from 'levers'

import log from 'common/utils/logger'

const settings = new Levers('app')

const validated = () => settings.get('bot.name') && settings.get('bot.auth')
const isEnabled = () => settings.get('bot.active') && validated()

function start (instant) {
  if (!isEnabled()) return {}

  const instance = require('../../main/components/bot')

  instance.initialize(instant)

  return {
    instance,
    stop: stop.bind(undefined, instance)
  }
}

function stop (instance, force = false) {
  if (!instance) return
  instance.disconnect()
}

function activate () {
  log.info('Enabling bot')
  settings.set('bot.active', true)

  start(true)
}

function deactivate () {
  stop()

  log.info('Disabling bot')
  settings.set('bot.active', false)
}

export {
  start,
  stop,
  activate,
  deactivate
}
