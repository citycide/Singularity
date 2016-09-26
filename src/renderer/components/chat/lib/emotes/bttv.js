import _ from 'lodash'
import axios from 'axios'
import Levers from 'levers'

const twitch = new Levers('twitch')

async function parseBTTVEmotes (messageTree) {
  return Promise.all(_.map(messageTree, async o => {
    if (o.type !== 'text') return o

    _.each(await getBTTVEmoteList(), (e, k) => {
      const escaped = _.escapeRegExp(k)
      const rgxString = `(?:^| +)${escaped}(?=(?: |$))(?!(?:[^<]*>))`
      const rgx = new RegExp(rgxString, 'g')

      // this replaces the value...
      // but still need to split the nodes somehow
      o.value = o.value.replace(rgx, '')
    })

    // modify the node as needed
    // if there's more than just the emote in the node,
    // we need to split it up into multiple nodes

    console.log(o)
    return o
  }))
}

async function getBTTVEmotes () {
  const [{ data: global }, { data: channel }] = await Promise.all([
    axios('https://api.betterttv.net/2/emotes'),
    axios(`https://api.betterttv.net/2/channels/${twitch.get('name')}`)
  ])

  return _.reduce([...global.emotes, ...channel.emotes], (r, v) => {
    return _.assign(r, { [v.code]: v.id })
  }, {})
}

const getBTTVEmoteList = _.throttle(getBTTVEmotes, 14400)

export {
  getBTTVEmoteList as default,
  getBTTVEmotes,
  parseBTTVEmotes
}
