import _ from 'lodash'
import moment from 'moment'

const time = {
  async getUserTime (user) {
    return await $.db.get('users', 'time', { name: user })
  },

  async setUserTime (user, time) {
    await $.db.set('users', { time }, { name: user })
  },

  async run () {
    if ($.stream.isLive || await this.settings.getTimeKeeping(true)) {
      const userList = $.user.list || []
      const lastUserList = $.cache.get('lastUserList', [])
      const lastRun = $.cache.get('lastRun', Date.now())

      const nextTime = moment()
      const lastTime = moment(lastRun, 'x')
      const timeSince = nextTime.diff(lastTime, 'seconds')

      await Promise.map(userList, async user => {
        if (user === $.channel.botName) return
        if (!_.includes(lastUserList, user)) return

        const newTime = await $.db.incr('users', 'time', timeSince, { name: user })
        const autoReg = await this.settings.getAutoRegTime()
        const userPermission = (await $.db.get('users', 'permission', { name: user })) || 5

        if (_.every([
          autoReg > 0,
          newTime > autoReg,
          userPermission > await this.settings.getRegLevel()
        ])) {
          await $.db.set('users', {
            permission: this.settings.getRegLevel()
          }, { name: user })

          $.shout(`${user} just became a regular!`)
        }

        if (await this.settings.getRankUp()) {
          const currentRank = await $.db.get('users', 'rank', { name: user })
          const nextLevel = await $.db.getRow('ranks', { level: currentRank + 1 })

          if (newTime > nextLevel.requirement * 3600) {
            $.shout(`LEVEL UP! ${user} is now level ${nextLevel.level} (${nextLevel.name})`)
            $.db.incr('users', 'rank', 1, { name: user })
          }
        }
      })

      $.cache.set('lastUserList', userList)
      $.cache.set('lastRun', nextTime.valueOf())
    }

    $.tick.setTimeout('timeKeeping', ::this.run, 60 * 1000)
  },
  settings: {
    async getRegLevel () {
      return $.db.get('groups', 'level', { name: 'regular' })
    },

    async getTimeKeeping (offline) {
      if (!offline) {
        return $.settings.get('timeKeeping', true)
      } else {
        return $.settings.get('timeKeepingOffline', false)
      }
    },

    async setTimeKeeping (value, offline) {
      if (typeof value !== 'boolean') {
        if (value === 'true' || value === 'false') {
          value = (value === 'true')
        } else {
          return
        }
      }

      if (!offline) {
        await $.settings.set('timeKeeping', value)
      } else {
        await $.settings.set('timeKeepingOffline', value)
      }
    },

    async getAutoRegTime () {
      // default auto-promotion time is 15 hours
      return $.settings.get('autoPromoteRegularsTime', 15 * 60 * 60)
    },

    async setAutoRegTime (value) {
      await $.settings.set('autoPromoteRegularsTime', value)
    },

    async getRankUp () {
      return $.settings.get('autoRankUp', true)
    },

    async setRankUp (bool) {
      await $.settings.set('autoRankUp', bool)
    }
  }
}

export default async function ($) {
  await $.sleep(5000)
  time.run()
}
