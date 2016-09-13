import { map, set, unset } from 'lodash'
import { resolve } from 'path'
import Levers from 'levers'

import { server } from 'main/components/server'
import log from 'common/utils/logger'

const settings = new Levers('app')

function start () {
  const PORT = settings.get('server.port', 8608)

  server.listen(PORT, () => {
    log.info(`Server listening on port ${PORT}`)
  })

  return destroyable(server)
}

function stop (instance, force = false) {
  if (!instance) return

  instance[force && instance.destroy ? 'destroy' : 'close'](() => {
    unset(require.cache, resolve('../../main/components/server/index.js'))
    log.info(`Server stopped.`)
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

export {
  start,
  stop,
  activate,
  deactivate
}
