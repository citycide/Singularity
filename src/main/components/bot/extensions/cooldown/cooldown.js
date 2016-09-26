const cooldown = {
  // cooldowns['command-name'] = { name, until, scope }
  cooldowns: [],

  async get (cmd, sub) {
    if (!sub) {
      return await $.db.get('commands', 'cooldown', { name: cmd })
    } else {
      return await $.db.get('subcommands', 'cooldown', { name: sub })
    }
  },

  async start (cmd, user, sub) {
    // if this command has no default specified, use the bot default
    const time = this.get(cmd, sub) || this.getDefault()
    this.cooldowns.push({
      name: cmd,
      sub,
      until: Date.now() + (time * 1000),
      // if globalCooldown is set to true or no user was provided
      scope: (await $.settings.get('globalCooldown') || !user)
        // a value of false for cooldown scope means global, ie. all users
        ? false
        // handle the case where no user is provided
        : user || false
    })
  },

  clear (cmd, user, sub) {
    const index = this.getIndex(cmd, user, sub)

    // check that the item was actually in the array, remove if it was
    if (index >= 0) {
      // returns true if exactly 1 item was removed, otherwise false
      return (this.cooldowns.splice(index, 1).length === 1)
    } else {
      // if the item was not in the array, do nothing
      return false
    }
  },

  clearAll () {
    this.cooldowns = []
    return this
  },

  async getDefault () {
    return await $.settings.get('defaultCooldown')
  },

  async isActive (cmd, user, sub) {
    // see above for comments about cooldown scope
    const scope = (await $.settings.get('globalCooldown') || !user)
      ? false
      : user || false

    for (const [index, command] of this.cooldowns.entries()) {
      // if we matched a command name & scope combination
      if (command.name === cmd && command.scope === scope && command.sub === sub) {
        const timeLeft = command.until - Date.now()

        if (timeLeft > 0) {
          if (user === $.channel.name) return false
          // return the number of seconds left if > 0
          return parseInt(timeLeft / 1000)
        } else {
          // remove the cooldown if the time has reached 0
          // returns false if exactly 1 item was removed, otherwise true
          return !(this.cooldowns.splice(index, 1).length === 1)
        }
      }
    }
  },

  async getIndex (cmd, user, sub) {
    // see above for comments about cooldown scope
    const scope = (await $.settings.get('globalCooldown') || !user)
      ? false
      : user || false

    for (const [index, command] of this.cooldowns.entries()) {
      // if we matched a command name & scope combination
      if (command.name === cmd && command.scope === scope && command.sub === sub) {
        // return the position in the array
        return index
      }
    }
  }
}

/**
 * Add methods to the global core object
 **/
export default function ($) {
  Object.assign($.command, {
    getCooldown: cooldown.get,
    startCooldown: ::cooldown.start,
    clearCooldown: ::cooldown.clear,
    isOnCooldown: ::cooldown.isActive
  })
}
