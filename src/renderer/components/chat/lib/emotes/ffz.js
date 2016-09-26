import _ from 'lodash'
import axios from 'axios'
import Levers from 'levers'

const twitch = new Levers('twitch')

async function getFFZEmotes () {
  const [global, channel] = await Promise.all([
    axios('http://api.frankerfacez.com/v1/set/global'),
    axios(`http://api.frankerfacez.com/v1/room/${twitch.get('name')}`)
  ])

  return _.map([...global, ...channel], emote => {
    return {
      emote: emote.name,
      source: `https:${emote.urls['1']}`
    }
  })
}

const getFFZEmoteList = _.throttle(getFFZEmotes, 14400)

export {
  getFFZEmoteList as default,
  getFFZEmotes
}
