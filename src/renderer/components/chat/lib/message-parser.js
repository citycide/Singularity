import parseTwitchEmotes from './emotes/twitch'
import { parseBTTVEmotes } from './emotes/bttv'
import { parseFFZEmotes } from './emotes/ffz'

export default async function parse (user, message) {
  // TODO: BTTV & FFZ emotes, links
  let msg = parseTwitchEmotes(message, user.emotes)
  msg = await parseBTTVEmotes(msg)
  msg = await parseFFZEmotes(msg)
  return msg
}
