import parseTwitchEmotes from './emotes/twitch'
// import { parseBTTVEmotes } from './emotes/bttv'
// import { parseFFZEmotes } from './emotes/ffz'

export default async function parse (user, message) {
  // TODO: BTTV & FFZ emotes, links
  return parseTwitchEmotes(message, user.emotes)
}
