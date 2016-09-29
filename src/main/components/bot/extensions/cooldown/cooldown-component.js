import _ from 'lodash'

const cooldown = {
  // cooldowns = [...{ name, sub, until, scope }]

  async get (cmd, sub) {
    if (!sub) {
      return await $.db.get('commands', 'cooldown', { name: cmd })
    } else {
      const res = await $.db.get('subcommands', 'cooldown', { name: sub })

      if (res === -1) {
        return await $.db.get('commands', 'cooldown', { name: cmd })
      } else {
        return await $.db.get('subcommands', 'cooldown', { name: sub })
      }
    }
  },

  async set (cmd, value, sub) {
    if (!sub) {
      await $.db.set('commands', { cooldown: value }, { name: cmd })
    } else {
      if (value === -1) {
        const res = await $.db.get('commands', 'cooldown', { name: sub })
        await $.db.set('commands', { cooldown: res }, { name: cmd })
      } else {
        await $.db.set('subcommands', { cooldown: value }, { name: cmd })
      }
    }
  },

  async start (cmd, user, sub) {
    const [needAdmin, isAdmin] = await Promise.all([
      $.db.getComponentConfig('cooldown', 'includeAdmins', true),
      $.user.isAdmin(user)
    ])

    if (needAdmin && !isAdmin) return

    // if this command has no default specified, use the bot default
    const [cmdTime, fallback] = await Promise.all([this.get(cmd, sub), this.getDefault()])
    const time = typeof cmdTime === 'number' ? cmdTime : fallback
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
  },

  clear (cmd, user, sub) {
    const index = this.getIndex(cmd, user, sub)
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
  },

  clearAll () {
    $.cache.set('cooldowns', [])
  },

  async getDefault () {
    return await $.settings.get('defaultCooldown')
  },

  async isActive (cmd, user, sub) {
    // see above for comments about cooldown scope
    const scope = (await $.settings.get('globalCooldown') || !user)
      ? false
      : user || false

    const cooldowns = $.cache.get('cooldowns', [])

    const active = _.find(cooldowns, v => v.name === cmd && v.scope === scope && v.sub === sub)

    if (!active) return false

    const timeLeft = active.until - Date.now()
    if (timeLeft > 0) {
      const [needAdmin, isAdmin] = await Promise.all([
        $.db.getComponentConfig('cooldown', 'includeAdmins', true),
        $.user.isAdmin(user)
      ])

      if (needAdmin && !isAdmin) return false

      // return the number of seconds left if > 0
      return parseInt(timeLeft / 1000)
    } else {
      // remove the cooldown if the time has reached 0
      // returns false if exactly 1 item was removed, otherwise true
      const index = this.getIndex(cmd, user, sub)
      const removed = cooldowns.splice(index, 1)
      $.cache.set('cooldowns', cooldowns)
      return removed.length !== 1
    }
  },

  async getIndex (cmd, user, sub) {
    // see above for comments about cooldown scope
    const scope = (await $.settings.get('globalCooldown') || !user)
      ? false
      : user || false

    const cooldowns = $.cache.get('cooldowns', [])

    return _.findIndex(cooldowns, v => v.name === cmd && v.scope === scope && v.sub === sub)
  }
}

/**
 * Add methods to the global core object
 **/
export default function ($) {
  Object.assign($.command, {
    getCooldown: cooldown.get,
    setCooldown: cooldown.set,
    startCooldown: ::cooldown.start,
    clearCooldown: ::cooldown.clear,
    isOnCooldown: ::cooldown.isActive
  })
}
