import axios from 'axios'
import Levers from 'levers'

const settings = new Levers('app')

const kraken = 'https://api.twitch.tv/kraken/'

export async function getBadges (target) {
  const { _id: userID } = await getUser(target)

  const baseURL = 'https://badges.twitch.tv/v1/badges/'
  const globalURL = `${baseURL}global/display?language=en`
  const channelURL = `${baseURL}channels/${userID}/display?language=en`

  const { data: global } = await axios(globalURL)
  const { data: channel } = await axios(channelURL)

  return Object.assign({}, global.badge_sets, channel.badge_sets)
}

export const getUser = async username => api('users/' + username)
export const getStream = async channel => api('streams/' + channel)
export const getChannel = async channel => api('channels/' + channel)

export const chatters = async channel => {
  return (await axios(`https://tmi.twitch.tv/group/user/${channel}/chatters`)).data
}

export async function api (endpoint) {
  try {
    return (await axios(kraken + endpoint, {
      headers: { 'Client-ID': settings.get('clientID') }
    })).data
  } catch (e) {
    return {}
  }
}
