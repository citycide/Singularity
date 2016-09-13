import Levers from 'levers'

import './events'
import Twitch from './Twitch'
import * as twitchAlerts from './TwitchAlerts'
import * as tipeeeStream from './TipeeeStream'
import * as streamtip from './Streamtip'
import * as server from './server'

const settings = new Levers('app')
const channel = new Levers('twitch')

const instances = new Map()

function initServices () {
  if (!channel.get('name') || !settings.get('twitch.token')) return

  instances.set('twitch', initTwitch())
  instances.set('server', initServer())

  instances.set('twitchAlerts', twitchAlerts.start())
  instances.set('streamtip', streamtip.start())
  instances.set('tipeee', tipeeeStream.start())
}

function initTwitch () {
  const twitch = new Twitch()
  twitch.initAPI()

  return {
    instance: twitch,
    stop: () => {}
  }
}

function initServer () {
  if (!settings.get('server.active')) return {}
  const instance = server.start()

  return {
    instance,
    stop: force => server.stop(instance, force)
  }
}

function getInstance (service) {
  return instances.get(service)
}

export {
  initServices,
  instances,
  getInstance
}
