import Levers from 'levers'
import store from '../components/state'

import './events'
import * as twitch from './Twitch'
import * as tipeeeStream from './TipeeeStream'
import * as streamlabs from './Streamlabs'
import * as streamtip from './Streamtip'
import * as server from './server'
import * as bot from './bot'

const settings = new Levers('app')
const channel = new Levers('twitch')

const instances = new Map()

function initServices () {
  if (!channel.get('name') || !settings.get('twitch.token')) {
    return
  }

  let active = []
  let inactive = []
  let services = [twitch, tipeeeStream, streamlabs, streamtip, server, bot]
  services.forEach(service => {
    instances.set(service.NAME, service.start())
    if (service.NAME === 'twitch') return

    let isEnabled = service.isEnabled()

    if (isEnabled) {
      active.push(service)
    } else {
      inactive.push(service)
    }

    store.modifyState(state => {
      state.services[service.NAME] = {
        active: isEnabled
      }
    })
  })

  return { active, inactive }
}

function getInstance (service) {
  return instances.get(service)
}

export {
  initServices,
  instances,
  getInstance
}
