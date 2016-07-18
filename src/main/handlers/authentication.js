import transit from '../components/transit'
import Settings from '../../common/components/Settings'
import log from '../../common/utils/logger'

const settings = new Settings('app')

transit.on('auth:twitch', (event, token) => {
  settings.set('twitchToken', token)
  log.debug(`User authorized with token: ${token}`)
}, 'ipc')
