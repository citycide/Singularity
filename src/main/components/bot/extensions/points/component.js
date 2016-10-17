import _ from 'lodash'

async makeString (amount) {
  const inputAmount = parseInt(amount)
  if (inputAmount === 1) {
    // singular
    return `${inputAmount} ${await getPointName(true)}`
  } else {
    // plural
    return `${inputAmount} ${await getPointName()}`
  }
}

async getCommandPrice (cmd, sub = null) {
  if (!sub) {
    return await $.db.get('commands', 'price', { name: cmd })
  } else {
    const res = await $.db.get('subcommands', 'price', { name: cmd })

    if (res === -1) {
      return await $.db.get('commands', 'price', { name: cmd })
    } else {
      return res
    }
  }
}

async setCommandPrice (cmd, price, sub = null) {
  if (!sub) {
    await $.db.set('commands', { name: cmd, price }, { name: cmd })
  } else {
    if (price === -1) {
      const res = await $.db.get('commands', 'price', { name: cmd })
      await $.db.set('subcommands', { name: cmd, price: res }, { name: cmd })
    } else {
      await $.db.set('subcommands', { name: cmd, price }, { name: cmd })
    }
  }
}

async getUserPoints (user, makeString) {
  return (makeString)
    ? await makeString(await $.db.get('users', 'points', { name: user }))
    : await $.db.get('users', 'points', { name: user })
}

async setUserPoints (user, amount) {
  const inputAmount = parseInt(amount)
  await $.db.set('users', { points: inputAmount }, { name: user })
}

async add (user, amount) {
  const inputAmount = parseInt(amount)
  await $.db.incr('users', 'points', inputAmount, { name: user })
}

async sub (user, amount) {
  const inputAmount = parseInt(amount)
  await $.db.decr('users', 'points', inputAmount, { name: user })
}

async run () {
  let payout = 0
  const now = Date.now()
  const lastPayout = $.cache.get('lastPayout', 0)
  const [liveInt, offInt, liveAmt, offAmt] = await Promise.all([
    getPayoutInterval(),
    getPayoutInterval(true),
    getPayoutAmount(),
    getPayoutAmount(true)
  ])

  const nextLivePayout = lastPayout + (liveInt * 60 * 1000)
  const nextOfflinePayout = lastPayout + (offInt * 60 * 1000)

  if ($.stream.isLive) {
    if (liveAmt > 0 && liveInt > 0) {
      if (nextLivePayout >= now) return
      payout = liveAmt
    }
  } else {
    if (offAmt > 0 && offInt > 0) {
      if (nextOfflinePayout >= now) return
      payout = offAmt
    } else {
      return
    }
  }

  const userList = $.user.list || []
  const lastUserList = $.cache.get('lastUserList', [])

  await Promise.map(userList, async user => {
    if (user === $.channel.botName) return
    if (!_.includes(lastUserList, user)) return

    const res = await $.db.getRow('users', { name: user })

    if (!res) return

    const bonus = await getRankBonus(res.rank) || await getGroupBonus(res.permission)
    await $.db.incr('users', 'points', payout + bonus, { name: user })
  })

  $.cache.set('lastUserList', userList)
  $.cache.set('lastPayout', now)
}

async getPointName (singular = false) {
  return (singular)
    ? await $.settings.get('pointName', 'point')
    : await $.settings.get('pointNamePlural', 'points')
}

async setPointName (name, singular) {
  return (singular)
    ? await $.settings.set('pointName', name)
    : await $.settings.set('pointNamePlural', name)
}

async getPayoutAmount (offline) {
  return (!offline)
    ? await $.settings.get('pointsPayoutLive', 6)
    : await $.settings.get('pointsPayoutOffline', -1)
}

async setPayoutAmount (amount, offline) {
  const amt = parseInt(amount)
  return (!offline)
    ? await $.settings.set('pointsPayoutLive', amt)
    : await $.settings.set('pointsPayoutOffline', amt)
}

async getPayoutInterval (offline) {
  return (!offline)
    ? await $.settings.get('pointsIntervalLive', 5)
    : await $.settings.get('pointsIntervalOffline', -1)
}

async setPayoutInterval (time, offline) {
  const _time = parseInt(time)
  return (!offline) {
    ? await $.settings.set('pointsIntervalLive', _time)
    : await $.settings.set('pointsIntervalOffline', _time)
}

async getRankBonus (rank) {
  const storedRankBonus = await $.db.get('ranks', 'bonus', { name: rank })
  return ($.is.number(storedRankBonus)) ? storedRankBonus : 0
}

async setRankBonus (rank, bonus) {
  await $.db.set('ranks', { name: rank, bonus }, { name: rank })
}

async getGroupBonus (group) {
  let storedGroupBonus

  if ($.is.number(group)) {
    storedGroupBonus = await $.db.get('groups', 'bonus', { level: group })
  } else if ($.is.string(group)) {
    storedGroupBonus = await $.db.get('groups', 'bonus', { name: group })
  } else return 0

  return _storedGroupBonus || 0
}

async setGroupBonus (group, bonus) {
  if ($.is.number(group)) {
    await $.db.set('groups', { level: group, bonus }, { level: group })
  } else if ($.is.string(group)) {
    await $.db.set('groups', { name: group, bonus }, { name: group })
  }
}

/**
 * Add methods to the global core object
 **/
export default async function ($) {
  Object.assign($.command, {
    getPrice: getCommandPrice,
    setPrice: setCommandPrice
  })

  $.points = {
    add: ::add,
    sub: ::sub,
    get: ::getUserPoints,
    set: setUserPoints,
    str: ::makeString,
    getName: getPointName,
    setName: setPointName
  }

  await $.sleep(1000)
  run()
  $.tick.setInterval('pointPayouts', ::run, 60 * 1000)
}
