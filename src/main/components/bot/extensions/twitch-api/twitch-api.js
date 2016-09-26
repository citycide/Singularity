import _ from 'lodash'
import axios from 'axios'
import moment from 'moment'
import Levers from 'levers'
import 'moment-duration-format'
import log from 'common/utils/logger'
import db from 'common/components/db'

const settings = new Levers('app')
const kraken = 'https://api.twitch.tv/kraken/'
const apiHeaders = {
  'Accept': 'application/vnd.twitchtv.v3+json',
  'Authorization': `OAuth ${settings.get('twitch.token')}`,
  'Client-ID': settings.get('clientID')
}

const twitchAPI = {
  async resolveUser (username) {
    const res = await this.api('users/' + username)
    return res.display_name || false
  },

  async getStreamInfo () {
    const res = await this.api(`streams/${$.channel.name}?ts=${Date.now()}`)

    const isLive = !!res.stream
    const game = _.get(res, 'stream.game')
    const status = _.get(res, 'stream.channel.status')
    const createdTime = moment(_.get(res, 'stream.created_at')).valueOf()
    const timeSince = moment().valueOf() - createdTime

    const uptime = moment
      .duration(timeSince, 'milliseconds')
      .format('h[h], m[m], s[s]')

    $.stream = {
      isLive,
      game,
      status,
      uptime
    }

    $.tick.setTimeout('getStreamInfo', ::this.getStreamInfo, 30 * 1000)
  },
  /**
   * @function getChatUsers()
   * @description updates the viewer list
   * @returns {Array}
   **/
  async getChatUsers () {
    const baseURL = 'https://tmi.twitch.tv/group/user/'
    const { data } = await axios(
      `${baseURL}${$.channel.name}/chatters?ts=${Date.now()}`, apiHeaders
    )

    const promises = _.flatMap(data.chatters, (chatters, group) => {
      return _.map(chatters, async chatter => {
        if (await $.db.getRow('users', { name: chatter })) return chatter

        const following = await $.user.isFollower(chatter)
        let permission = group === 'moderators' ? 1 : 5
        if (await $.user.isAdmin(chatter)) permission = 0

        db.bot.addUser({
          name: chatter,
          permission,
          mod: permission <= 1,
          following,
          seen: moment().valueOf(),
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

    $.tick.setTimeout('getChatUsers', ::this.getChatUsers, 30 * 1000)

    return users
  },

  async api (endpoint) {
    try {
      return (await axios(kraken + endpoint, {
        headers: { 'Client-ID': settings.get('clientID') }
      })).data
    } catch (e) {
      log.error(e.message)
      return {}
    }
  }
}

export default async function ($) {
  $.user.list = []
  $.user.count = 0

  $.api = twitchAPI.api
  $.user.resolve = twitchAPI.resolveUser

  $.stream = Object.assign({}, {
    isLive: false,
    game: null,
    status: null,
    uptime: 0
  })

  twitchAPI.getStreamInfo()
  twitchAPI.getChatUsers()
}
