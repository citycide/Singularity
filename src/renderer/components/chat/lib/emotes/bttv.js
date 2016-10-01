import _ from 'lodash'
import axios from 'axios'
import Levers from 'levers'
import recurse from './recurser'

const twitch = new Levers('twitch')

async function parseBTTVEmotes (messageTree) {
  const tree = _.cloneDeep(messageTree)
  _.each(tree, async (o, i) => {
    if (o.type !== 'text') return

    _.each(await getBTTVEmoteList(), (e, k) => {
      const [items = [], loc, del] = recurse(o, i, e, k, 'bttv')
      if (!items.length) return
      tree.splice(loc, del, ...items)
    })
  })

  return tree
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
