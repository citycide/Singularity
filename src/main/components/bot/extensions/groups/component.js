async function getName (level) {
  return $.db.get('groups', 'name', { level })
}

async function getLevel (name) {
  return parseInt(await $.db.get('groups', 'level', { name }))
}

async function getUserGroup (user) {
  const _user = $.is.object(user) ? user : { 'display-name': user }
  const { 'display-name': username, 'user-type': userType } = _user

  let defaultGroupID = 5
  if (userType === 'mod') defaultGroupID = 1
  if (await $.user.isAdmin(username)) defaultGroupID = 0

  const _groupID = await $.db.get('users', 'permission', { name: username })
  if (_groupID >= 0) return _groupID

  $.log.debug('groups',
    `getUserGroup:: assigning default group to ${username} (level ${defaultGroupID})`
  )
  await $.db.set('users', { permission: defaultGroupID }, { name: username })
  return defaultGroupID
}

/**
 * Add methods to the global core object
 **/
export default async function ($) {
  $.user.getGroup = getUserGroup
  $.groups = {
    getName,
    getLevel
  }

  await $.db.addTableCustom('groups', [
    { name: 'level', type: 'integer', unique: 'inline' },
    'name',
    { name: 'bonus', type: 'integer' }
  ])

  if (await $.db.getExtConfig('groups', 'state', 'initial') === 'initial') {
    $.log('notice', 'Initializing default user groups...')

    try {
      await Promise.all([
        $.db.set('groups', { name: 'admin', level: 0, bonus: 0 }),
        $.db.set('groups', { name: 'moderator', level: 1, bonus: 0 }),
        $.db.set('groups', { name: 'subscriber', level: 2, bonus: 5 }),
        $.db.set('groups', { name: 'regular', level: 3, bonus: 5 }),
        $.db.set('groups', { name: 'follower', level: 4, bonus: 2 }),
        $.db.set('groups', { name: 'viewer', level: 5, bonus: 0 }),
        $.db.setExtConfig('groups', 'state', 'default')
      ])
    } catch (e) {
      $.log('notice',
        'An error occurred while setting default user groups.' +
        'Check the error log for more info.'
      )
      $.log.error('groups', `Error setting default user groups :: ${e.message}`)
      return
    }

    $.log('notice', 'Done. Default user ranks initialized.')
  }
}
