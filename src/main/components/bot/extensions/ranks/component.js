async function getName (level) {
  return $.db.get('ranks', 'name', { level })
}

async function getLevel (name) {
  return parseInt(await $.db.get('ranks', 'level', { name }))
}

async function getUserRank (user) {
  const username = $.is.string(user) ? user : user['display-name']

  const _rankID = await $.db.get('users', 'rank', { name: username })
  if (_rankID >= 1) return _rankID

  $.log.debug(`getUserRank:: assigning default rank to ${username} (level 1)`)
  await $.db.set('users', { permission: 1 }, { name: username })
  return 1
}

async function getAllowPurchases () {
  if (await $.db.getExtConfig('points', 'enabled', true)) {
    return $.db.getExtConfig('ranks', 'allowPurchases', true)
  } else {
    return false
  }
}

async function setAllowPurchases (bool) {
  if ($.is.boolean(bool)) return
  return $.db.setExtConfig('ranks', 'allowPurchases', bool)
}

/**
 * Add methods to the global core object
 **/
export default async function ($) {
  $.user.getRank = getUserRank
  $.ranks = {
    getName,
    getLevel
  }

  await $.db.addTableCustom('ranks', [
    { name: 'level', type: 'integer', unique: 'inline' },
    'name',
    { name: 'bonus', type: 'integer' },
    { name: 'requirement', type: 'integer' },
    { name: 'price', type: 'integer' }
  ])

  if (await $.db.getExtConfig('ranks', 'state', 'initial') === 'initial') {
    $.log('notice', 'Initializing default user ranks...')

    try {
      await Promise.all([
        $.db.set('ranks', { name: 'atari 2600', level: 1, bonus: 0, requirement: 0, price: 0 }),
        $.db.set('ranks', { name: 'commodore 64', level: 2, bonus: 1, requirement: 3, price: 130 }),
        $.db.set('ranks', { name: 'sega master', level: 3, bonus: 1, requirement: 6, price: 360 }),
        $.db.set('ranks', { name: 'snes', level: 4, bonus: 2, requirement: 9, price: 540 }),
        $.db.set('ranks', { name: 'sega saturn', level: 5, bonus: 2, requirement: 12, price: 720 }),
        $.db.set('ranks', { name: 'playstation', level: 6, bonus: 3, requirement: 15, price: 900 }),
        $.db.set('ranks', { name: 'n64', level: 7, bonus: 3, requirement: 20, price: 1200 }),
        $.db.set('ranks', { name: 'dreamcast', level: 8, bonus: 3, requirement: 30, price: 1800 }),
        $.db.set('ranks', { name: 'xbox', level: 9, bonus: 4, requirement: 50, price: 3000 }),
        $.db.set('ranks', { name: 'ps2', level: 10, bonus: 5, requirement: 100, price: 6000 }),
        $.db.setExtConfig('ranks', 'state', 'default')
      ])
    } catch (e) {
      $.log('notice',
        'An error occurred while setting default user ranks.' +
        'Check the error log for more info.'
      )
      $.log.error(`Error setting default user ranks :: ${e.message}`)
      return
    }

    $.log('notice', 'Done. Default user ranks initialized.')
  }
}
