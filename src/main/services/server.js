import { map, set, unset } from 'lodash'
import { resolve } from 'path'
import Levers from 'levers'

import { getServer } from 'main/components/server'
import store from 'main/components/state'
import log from 'common/utils/logger'

const settings = new Levers('app')

const isEnabled = () => !!settings.get('server.active')

function start () {
  if (!isEnabled()) {
    return { stop: () => {} }
  }

  const instance = listen()

  return {
    instance,
    stop: force => stop(instance, force)
  }
}

function listen () {
  const PORT = settings.get('server.port', 8608)

  getServer().listen(PORT, () => {
    log.info(`Server listening on port ${PORT}`)
  })

  return destroyable(getServer())
}

function stop (instance, force = false) {
  if (!instance) return

  instance[force && instance.destroy ? 'destroy' : 'close'](() => {
    unset(require.cache, resolve('../../main/components/server/index.js'))
    log.info(`Server stopped.`)
  })

  store.modifyState(({ services }) => {
    services[NAME].active = false
  })
}

function destroyable (instance) {
  const connections = {}

  instance.on('connection', connection => {
    const { remoteAddress, remotePort } = connection
    const key = `${remoteAddress}:${remotePort}`

    set(connections, key, connection)

    connection.on('close', () => unset(connections, key))
  })

  instance.destroy = function (callback) {
    instance.close(callback)

    map(connections, value => value.destroy())
  }

  return instance
}

function activate () {
  log.info('Enabling server')
  settings.set('server.active', true)

  start(true)
}

function deactivate () {
  stop()

  log.info('Disabling server')
  settings.set('server.active', false)
}

const NAME = 'server'

export {
  NAME,
  start,
  stop,
  isEnabled,
  activate,
  deactivate
}
