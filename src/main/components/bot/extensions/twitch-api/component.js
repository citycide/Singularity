import _ from 'lodash'
import axios from 'axios'
import moment from 'moment'
import Levers from 'levers'
import 'moment-duration-format'
import { botDB as db } from 'common/components/db'

const settings = new Levers('app')
const apiOpts = {
  baseURL: 'https://api.twitch.tv/kraken/',
  headers: {
    'Accept': 'application/vnd.twitchtv.v3+json',
    'Authorization': `OAuth ${settings.get('twitch.token')}`,
    'Client-ID': settings.get('clientID')
  }
}

const instance = axios.create(apiOpts)

async function resolveUser (username) {
  const res = await api('users/' + username)
  return res.display_name || false
}

async function getStreamInfo () {
  const res = await api(`streams/${$.channel.name}?ts=${Date.now()}`)

  const isLive = !!res.stream
  const game = _.get(res, 'stream.game')
  const status = _.get(res, 'stream.channel.status')
  const createdTime = moment(_.get(res, 'stream.created_at')).valueOf()
  const timeSince = Date.now() - createdTime

  const uptime = moment
    .duration(timeSince, 'milliseconds')
    .format('h[h], m[m], s[s]')

  $.stream = {
    isLive,
    game,
    status,
    uptime
  }

  $.tick.setTimeout('getStreamInfo', getStreamInfo, 30 * 1000)
}

/**
 * @function getChatUsers()
 * @description updates the viewer list
 * @returns {Array}
 **/
async function getChatUsers () {
  const baseURL = 'https://tmi.twitch.tv/group/user/'
  const data = await api(`${baseURL}${$.channel.name}/chatters?ts=${Date.now()}`)

  const promises = _.flatMap(data.chatters, (chatters, group) => {
    return _.map(chatters, async chatter => {
      if (await $.db.exists('users', { name: chatter })) return chatter

      const following = await $.user.isFollower(chatter)
      let permission = group === 'moderators' ? 1 : 5
      if (await $.user.isAdmin(chatter)) permission = 0

      db.addUser({
        name: chatter,
        permission,
        mod: permission <= 1,
        following,
        seen: Date.now(),
        points: 0,
        time: 0,
        rank: 1
      })

      return chatter
    })
  })

  const users = await Promise.all(promises)

  $.user.list = users
  $.user.count = users.length

  $.tick.setTimeout('getChatUsers', getChatUsers, 30 * 1000)

  return users
}

async function api (endpoint, opts) {
  try {
    return (await instance({
      url: endpoint, ...opts
    })).data
  } catch (e) {
    $.log.error(e.message)
    return {}
  }
}

export default async function ($) {
  $.user.list = []
  $.user.count = 0

  $.api = api
  $.user.resolve = resolveUser

  $.stream = {
    isLive: false,
    game: null,
    status: null,
    uptime: 0
  }

  getStreamInfo()
  getChatUsers()
}
