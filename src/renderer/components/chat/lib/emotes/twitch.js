import _ from 'lodash'
import { api } from '../api'
import { sleep } from 'common/utils/helpers'

function parseTwitchEmotes (message, emotes) {
  if (!emotes) return [{ type: 'text', value: message }]

  const mapped = _.flatMap(emotes, (v, k) => {
    return _.map(v, range => {
      const indices = range.split('-')
      return [...indices, k].map(Number)
    })
  }).sort((a, b) => a[0] - b[0])

  let currentPosition = 0
  return _.flatMap(mapped, ([start, end, id], i) => {
    const emote = {
      type: 'emote',
      raw: message.slice(start - 1, end),
      value: `https://static-cdn.jtvnw.net/emoticons/v1/${id}/1.0`
    }

    const text = {
      type: 'text',
      value: message.slice(currentPosition, start - 1)
    }

    const final = (i + 1 === mapped.length) ? [{
      type: 'text',
      value: message.slice(end + 1, message.length)
    }] : []

    currentPosition = end + 1

    if (start !== 0) {
      return [
        text,
        emote,
        ...final
      ]
    } else {
      return [
        emote,
        ...final
      ]
    }
  }).filter(({ type, value }) => value !== '')
}

async function getEmoteList (sets) {
  try {
    const res = await api(`chat/emoticon_images?emotesets=${sets}`)
    return _.flatMap(res.emoticon_sets, set => {
      return set
      .filter(v => !_.includes(v.code, '/'))
      .map(v => ({ emote: v.code }))
    })
  } catch (e) {
    await sleep(1000)
    getTwitchEmoteList()
  }
}

const getTwitchEmoteList = _.throttle(getEmoteList, 14400)

export {
  parseTwitchEmotes as default,
  getEmoteList,
  getTwitchEmoteList
}
