/* eslint-disable babel/no-await-in-loop */

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

      const nextTime = moment()
      const lastTime = moment(this.settings.lastRun, 'x')
      const timeSince = nextTime.diff(lastTime, 'seconds')

      for (let user of userList) {
        let newTime = 0

        if (user !== $.channel.botName) {
          if (this.settings.lastUserList.includes(user)) {
            newTime = await $.db.incr('users', 'time', timeSince, { name: user })

            if (await this.settings.getAutoRegTime() > 0) {
              if ((await $.db.get('users', 'permission', { name: user }) || 5) >
                await this.settings.getRegLevel()) {
                if (newTime > this.settings.getAutoRegTime()) {
                  await $.db.set('users', {
                    permission: this.settings.getRegLevel()
                  }, { name: user })
                  $.shout(`${user} just became a regular!`)
                }
              }
            }

            if (await this.settings.getRankUp()) {
              const currentRank = await $.db.get('users', 'rank', { name: user })
              const nextLevel = await $.db.getRow('ranks', { level: currentRank + 1 })
              if (newTime > nextLevel.requirement * 3600) {
                $.shout(`LEVEL UP! ${user} is now level ${nextLevel.level} (${nextLevel.name})`)
              }
            }
          } else {
            this.settings.lastUserList.push(user)
          }
        }
      }

      this.settings.lastRun = nextTime.valueOf()
    }

    $.tick.setTimeout('timeKeeping', ::this.run, 60 * 1000)
  },
  settings: {
    lastRun: Date.now(),
    lastUserList: [],
    async getRegLevel () {
      return $.db.get('groups', 'level', { name: 'regular' })
    },
    async getTimeKeeping (offline) {
      if (!offline) {
        return await $.settings.get('timeKeeping', true)
      } else {
        return await $.settings.get('timeKeepingOffline', false)
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
      return await $.settings.get('autoPromoteRegularsTime', 15 * 60 * 60)
    },
    async setAutoRegTime (value) {
      await $.settings.set('autoPromoteRegularsTime', value)
    },
    async getRankUp () {
      return await $.settings.get('autoRankUp', true)
    },
    async setRankUp (bool) {
      await $.settings.set('autoRankUp', bool)
    }
  }
}

/**
 * Add methods to the global core object
 **/
$.on('bot:ready', () => {
  setTimeout(() => {
    time.run()
  }, 5 * 1000)
})

export default time
