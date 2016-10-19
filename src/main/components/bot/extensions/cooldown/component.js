import _ from 'lodash'

async getCooldown (cmd, sub) {
  if (!sub) {
    return $.db.get('commands', 'cooldown', { name: cmd })
  } else {
    // inherit from the parent command
    const res = await $.db.get('subcommands', 'cooldown', { name: sub })
    return res >= 0 ? res : $.db.get('commands', 'cooldown', { name: cmd })
  }
}

async setCooldown (cmd, value, sub) {
  if (!sub) {
    await $.db.set('commands', { cooldown: value }, { name: cmd })
  } else {
    if (value === -1) {
      // inherit from the parent command
      const res = await $.db.get('commands', 'cooldown', { name: cmd })
      await $.db.set('subcommands', { cooldown: res }, { name: sub })
    } else {
      await $.db.set('subcommands', { cooldown: value }, { name: cmd })
    }
  }
}

async function startCooldown (cmd, user, sub) {
  const [includeAdmins, isAdmin] = await Promise.all([
    $.db.getExtConfig('cooldown', 'includeAdmins', false),
    $.user.isAdmin(user)
  ])

  if (!includeAdmins && isAdmin) return

  // if this command has no default specified, use the bot default
  const [cmdTime, fallback] = await Promise.all([getCooldown(cmd, sub), getDefault()])
  const time = $.is.number(cmdTime) ? cmdTime : fallback
  const cooldowns = $.cache.get('cooldowns', [])

  $.cache.set('cooldowns', [{
    name: cmd,
    sub,
    until: Date.now() + (time * 1000),
    // if globalCooldown is set to true or no user was provided
    scope: (await $.settings.get('globalCooldown') || !user)
      // a value of false for cooldown scope means global, ie. all users
      ? false
      // handle the case where no user is provided
      : user || false
  }, ...cooldowns])
}

function clearCooldown (cmd, user, sub) {
  const index = getIndex(cmd, user, sub)
  const cooldowns = $.cache.get('cooldowns', [])

  // check that the item was actually in the array, remove if it was
  if (index >= 0) {
    const removed = cooldowns.splice(index, 1)
    $.cache.set('cooldowns', cooldowns)
    // returns true if exactly 1 item was removed, otherwise false
    return removed.length === 1
  } else {
    // if the item was not in the array, do nothing
    return false
  }
}

function clearAll () {
  $.cache.set('cooldowns', [])
}

async function getDefault () {
  return $.settings.get('defaultCooldown')
}

async function isOnCooldown (cmd, user, sub) {
  // see above for comments about cooldown scope
  const scope = (await $.settings.get('globalCooldown') || !user)
    ? false
    : user || false

  const cooldowns = $.cache.get('cooldowns', [])
  const active = _.find(cooldowns, { name: cmd, scope, sub })

  if (!active) return false

  const timeLeft = active.until - Date.now()
  if (timeLeft > 0) {
    const [includeAdmins, isAdmin] = await Promise.all([
      $.db.getExtConfig('cooldown', 'includeAdmins', false),
      $.user.isAdmin(user)
    ])

    if (!includeAdmins && isAdmin) return false

    // return the number of seconds left if > 0
    return parseInt(timeLeft / 1000)
  } else {
    // remove the cooldown if the time has reached 0
    // returns false if exactly 1 item was removed, otherwise true
    const index = getIndex(cmd, user, sub)
    const removed = cooldowns.splice(index, 1)
    $.cache.set('cooldowns', cooldowns)
    return removed.length !== 1
  }
}

async function getIndex (cmd, user, sub) {
  // see above for comments about cooldown scope
  const scope = (await $.settings.get('globalCooldown') || !user)
    ? false
    : user || false

  const cooldowns = $.cache.get('cooldowns', [])

  return _.findIndex(cooldowns, { name: cmd, scope, sub })
}

/**
 * Add methods to the global core object
 **/
export default function ($) {
  Object.assign($.command, {
    getCooldown,
    setCooldown,
    startCooldown,
    clearCooldown,
    isOnCooldown
  })
}
