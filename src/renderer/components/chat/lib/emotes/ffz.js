import _ from 'lodash'
import axios from 'axios'
import Levers from 'levers'
import recurse from './recurser'

const twitch = new Levers('twitch')

async function parseFFZEmotes (messageTree) {
  const tree = _.cloneDeep(messageTree)
  _.each(tree, async (o, i) => {
    if (o.type !== 'text') return

    _.each(await getFFZEmoteList(), (e, k) => {
      const [items = [], loc, del] = recurse(o, i, e, k, 'ffz')
      if (!items.length) return
      tree.splice(loc, del, ...items)
    })
  })

  return tree

  /*
  const emoteList = await getFFZEmoteList()

  return _.flatMap(messageTree, (o, i, a) => {
    if (o.type !== 'text') return

    _.each(emoteList, (e, k) => {
      const [items, loc, del] = recurse(o, i, e, k, 'ffz')
      if (!items.length) return
      a.splice(loc, del, ...items)
    })

    return a
  }).filter(v => typeof v !== 'undefined')
  */
}

async function getFFZEmotes () {
  const [{ data: global }, { data: channel }] = await Promise.all([
    axios('http://api.frankerfacez.com/v1/set/global'),
    axios(`http://api.frankerfacez.com/v1/room/${twitch.get('name')}`)
  ])

  const globalEmotes = _.flatMap(global.default_sets, set => {
    return _.map(global.sets[set].emoticons, emote => {
      return {
        emote: emote.name,
        source: `https:${emote.urls['1']}`
      }
    })
  })

  const channelEmotes = _.map(channel.sets[channel.room.set].emoticons, emote => {
    return {
      emote: emote.name,
      source: `https:${emote.urls['1']}`
    }
  })

  return _.reduce([...globalEmotes, ...channelEmotes], (r, v) => {
    return _.assign(r, { [v.emote]: v.source })
  }, {})
}

const getFFZEmoteList = _.throttle(getFFZEmotes, 14400)

export {
  getFFZEmoteList as default,
  getFFZEmotes,
  parseFFZEmotes
}
