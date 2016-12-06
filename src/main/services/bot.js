import Levers from 'levers'

import * as wm from 'main/components/window-manager'
import transit from 'main/components/transit'
import store from 'main/components/state'
import log from 'common/utils/logger'

const settings = new Levers('app')

const validated = () => !!(settings.get('bot.name') && settings.get('bot.auth'))
const isEnabled = () => !!(settings.get('bot.active') && validated())

function start () {
  if (!isEnabled()) {
    return { stop: () => {} }
  }

  let window = wm.createBot()

  transit.on('bot:loaded', () => {
    store.modifyState(({ services }) => {
      services[NAME].active = true
    })
  })

  transit.sendToBot('initialize')

  return { instance: window, stop }
}

function stop () {
  transit.on('bot:unloaded', () => {
    let window = wm.get('bot')
    window.obliterate()

    store.modifyState(({ services }) => {
      services[NAME].active = false
    })
  })

  transit.sendToBot('disconnect')
}

function activate () {
  log.info('Enabling bot')
  settings.set('bot.active', true)

  start()
}

function deactivate () {
  log.info('Disabling bot')
  settings.set('bot.active', false)

  stop()
}

const NAME = 'bot'

export {
  NAME,
  start,
  stop,
  isEnabled,
  activate,
  deactivate
}
