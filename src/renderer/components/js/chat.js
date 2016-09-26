import Levers from 'levers'
import { client as Client } from 'tmi.js'

const settings = new Levers('app')
const channel = new Levers('twitch')

export default new Client({
  connection: {
    reconnect: true,
    cluster: 'aws'
  },
  identity: {
    username: channel.get('name'),
    password: settings.get('twitch.token')
  },
  channels: [channel.get('name')]
})
