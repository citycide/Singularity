import { isEmpty } from 'lodash'
import transit from 'main/components/transit'
import { instances, getInstance, initServices } from './index'

const services = [
  { name: 'tipeee', file: './TipeeeStream' },
  { name: 'streamlabs', file: './Streamlabs' },
  { name: 'streamtip', file: './Streamtip' },
  { name: 'server', file: './server' },
  { name: 'bot', file: './bot' }
]

services.forEach(({ name, file }) => {
  transit.on(`service:${name}:enable`, (e, data) => {
    const instance = getInstance(name)
    if (instance || !isEmpty(instance)) return

    const { activate } = require(file)
    activate(data)
  })

  transit.on(`service:${name}:disable`, () => {
    const instance = getInstance(name)
    if (!instance || isEmpty(instance)) return
    instance.stop()

    const { deactivate } = require(file)
    deactivate()
    instances.delete(name)
  })
})

transit.on('service:all:start', () => initServices())
transit.on('service:all:stop', () => instances.forEach(v => v.stop()))
