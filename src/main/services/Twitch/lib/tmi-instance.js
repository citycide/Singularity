import { once } from 'lodash'
import { client as Client } from 'tmi.js'

export const getChatInstance = once(function (OPTIONS) {
  return new Client({
    options: {
      debug: false
    },
    connection: {
      reconnect: true,
      cluster: 'aws'
    },
    identity: {
      username: OPTIONS.name,
      password: OPTIONS.token
    },
    channels: [OPTIONS.name]
  })
})
