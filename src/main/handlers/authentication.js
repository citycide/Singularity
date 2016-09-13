import Levers from 'levers'
import transit from 'main/components/transit'
import log from 'common/utils/logger'

const settings = new Levers('app')

transit.on('auth:twitch', (event, token) => {
  settings.set('twitch.token', token)
  log.debug(`User authorized with token: ${token}`)
}, 'ipc')
