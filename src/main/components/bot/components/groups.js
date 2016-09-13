import { isNil } from 'lodash'
import log from 'common/utils/logger'

const groups = {
  async getGroupName (level) {
    return await $.db.get('groups', 'name', { level })
  },
  async getGroupLevel (name) {
    return parseInt(await $.db.get('groups', 'level', { name }))
  },
  async getUserGroup (user) {
    // 'user' parameter should always be an object
    // minimum requirements:
    // user = { 'display-name': 'name' }

    const username = user['display-name']
    const userType = user['user-type']
    if (!username) return

    let defaultGroupID = 5

    if (userType === 'mod') defaultGroupID = 1
    if ($.user.isAdmin(username)) defaultGroupID = 0

    const _groupID = await $.db.get('users', 'permission', { name: username })
    if (!isNil(_groupID) && _groupID >= 0) {
      return _groupID
    } else {
      log.trace(`getUserGroup:: assigning default group to ${username} (level ${defaultGroupID})`)
      await $.db.set('users', { permission: defaultGroupID }, { name: username })
      return defaultGroupID
    }
  }
}

/**
 * Add methods to the global core object
 **/
$.on('bot:ready', async () => {
  $.user.getGroup = groups.getUserGroup
  $.groups = {
    getName: groups.getGroupName,
    getLevel: groups.getGroupLevel
  }

  await $.db.addTableCustom('groups', [
    { name: 'level', type: 'integer', unique: 'inline' },
    'name',
    { name: 'bonus', type: 'integer' }
  ])

  if (await $.db.getComponentConfig('groups', 'state', 'initial') === 'initial') {
    $.log('notice', 'Initializing default user ranks...')

    try {
      await Promise.all([
        $.db.set('groups', { name: 'admin', level: 0, bonus: 0 }),
        $.db.set('groups', { name: 'moderator', level: 1, bonus: 0 }),
        $.db.set('groups', { name: 'subscriber', level: 2, bonus: 5 }),
        $.db.set('groups', { name: 'regular', level: 3, bonus: 5 }),
        $.db.set('groups', { name: 'follower', level: 4, bonus: 2 }),
        $.db.set('groups', { name: 'viewer', level: 5, bonus: 0 }),
        $.db.setComponentConfig('groups', 'state', 'default')
      ])
    } catch (e) {
      $.log.error(`Error setting default user groups :: ${e.message}`)
    }

    $.log('notice', 'Done. Default user ranks initialized.')
  }
})

export default groups
