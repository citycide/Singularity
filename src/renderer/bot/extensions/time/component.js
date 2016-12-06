import { every } from 'lodash'
import moment from 'moment'

async function getUserTime (user) {
  return $.db.get('users', 'time', { name: user })
}

async function setUserTime (user, time) {
  await $.db.set('users', { time }, { name: user })
}

async function getRegLevel () {
  return $.db.get('groups', 'level', { name: 'regular' })
}

async function getTimeKeeping (offline) {
  if (!offline) {
    return $.settings.get('timeKeeping', true)
  } else {
    return $.settings.get('timeKeepingOffline', false)
  }
}

async function setTimeKeeping (value, offline) {
  if (!$.is.boolean(value)) return

  if (!offline) {
    await $.settings.set('timeKeeping', value)
  } else {
    await $.settings.set('timeKeepingOffline', value)
  }
}

async function getAutoRegTime () {
  // default auto-promotion time is 15 hours
  return $.settings.get('autoPromoteRegularsTime', 15 * 60 * 60)
}

async function setAutoRegTime (value) {
  await $.settings.set('autoPromoteRegularsTime', value)
}

async function getRankUp () {
  return $.settings.get('autoRankUp', true)
}

async function setRankUp (bool) {
  await $.settings.set('autoRankUp', bool)
}

async function run () {
  const isTimeEnabled = $.db.getExtConfig('time', 'enabled', true)
  if (isTimeEnabled && ($.stream.isLive || await getTimeKeeping(true))) {
    const userList = $.user.list || []
    const lastUserList = $.cache.get('lastUserList', [])
    const lastRun = $.cache.get('lastRun', Date.now())

    const nextTime = moment()
    const lastTime = moment(lastRun, 'x')
    const timeSince = nextTime.diff(lastTime, 'seconds')

    await Promise.map(userList, async user => {
      if (user === $.channel.botName) return
      if (!$.is.oneOf(lastUserList, user)) return

      const [newTime, autoReg, regLevel, rankUp] = await Promise.all([
        $.db.incr('users', 'time', timeSince, { name: user }),
        getAutoRegTime(),
        getRegLevel(),
        getRankUp()
      ])
      const userPermission = (await $.db.get('users', 'permission', { name: user })) || 5

      if (every([
        autoReg > 0,
        newTime > autoReg,
        userPermission > regLevel
      ])) {
        await $.db.set('users', {
          permission: regLevel
        }, { name: user })

        $.shout(`${user} just became a regular!`)
      }

      if (rankUp) {
        const [currentRank, nextLevel] = await Promise.all([
          $.db.get('users', 'rank', { name: user }),
          $.db.getRow('ranks', { level: currentRank + 1 })
        ])

        if (newTime > nextLevel.requirement * 3600) {
          $.shout(`LEVEL UP! ${user} is now level ${nextLevel.level} (${nextLevel.name})`)
          $.db.incr('users', 'rank', { name: user })
        }
      }
    })

    $.cache.set('lastUserList', userList)
    $.cache.set('lastRun', nextTime.valueOf())
  }

  $.tick.setTimeout('timeKeeping', run, 60 * 1000)
}

export default async function ($) {
  await $.sleep(2500)
  run()
}
