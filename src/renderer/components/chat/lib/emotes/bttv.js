import _ from 'lodash'
import axios from 'axios'
import Levers from 'levers'

const twitch = new Levers('twitch')

async function parseBTTVEmotes (messageTree) {
  return Promise.all(_.map(messageTree, async o => {
    if (o.type !== 'text') return o

    _.each(await getBTTVEmoteList(), (e, k) => {
      const escaped = _.escapeRegExp(k)
      const rgxString = `(.+)?(?:^| )${escaped}(?: |$)(.+)?`
      const rgx = new RegExp(rgxString, 'g')
      const [, before, target, after] = rgx.exec(o.value) || []

      if (!target) return

      if (!before && !after) {
        o = {
          raw: o.value,
          type: 'emote',
          value: `http://cdn.betterttv.net/emote/${e}/1x`
        }
      } else if (!before) {
        o = [{
          raw: o.value,
          type: 'emote',
          value: `http://cdn.betterttv.net/emote/${e}/1x`
        }, {
          type: 'text',
          value: after
        }]
      } else if (!after) {
        o = [{
          raw: o.value,
          type: 'emote',
          value: `http://cdn.betterttv.net/emote/${e}/1x`
        }, {
          raw: o.value,
          type: 'emote',
          value: `http://cdn.betterttv.net/emote/${e}/1x`
        }]
      } else if (before && after) {
        o = [{
          type: 'text',
          value: before
        }, {
          raw: target,
          type: 'emote',
          value: `http://cdn.betterttv.net/emote/${e}/1x`
        }, {
          type: 'text',
          value: after
        }]
      }
    })

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
