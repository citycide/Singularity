export async function booty (e, $) {
  if (e.args.length > 1) {
    $.say(`${e.sender} tried to touch a sentence's booty. Didn't work.`)
    return
  }

  const target = e.args[0]

  if (!target) {
    if ($.user.list.length) {
      const random = $.to.random($.user.list)
      $.say(`${e.sender} flails randomly, and grabs ${random}'s butt.`)
      return
    } else {
      $.say(`Strange... there's no booty to grab here.`)
      return
    }
  }

  if (!$.is.oneOf($.user.list, target)) {
    $.say(`${e.sender} couldn't find that sweet ${target} booty :(`)
    return
  }

  const response = await $.db.getRandomRow('booty')
  if (response) {
    $.say(await $.params(e, response.value, { target }))
  } else {
    e.respond('Alright, cool it Handy McHandface.')
  }
}

async function initResponses ($) {
  $.log('booty', 'No booty responses found, adding some defaults...')

  const defaults = [
    `(sender) touched (target)'s booty, aaalll sensual-like.`,
    `Little did (target) know, (game) is (sender)'s booty-touching trigger.`,
    `(sender) would 100% give all their (pointname) to touch (target)'s booty.`,
    `(target) swatted down (sender)'s attempt to touch their booty.`,
    `(target) touched (sender)'s booty. Didn't see that one coming, did you?`,
    `(sender) grabbed (target) by the butt. Totally consensual by the way.`
  ]

  defaults.map(async value => await $.db.set('booty', { value }))

  $.log('booty', `Done. ${defaults.length} default booty responses added.`)
}

export default async function ($) {
  $.addCommand('booty')

  // not implemented yet. can follow rekt's implementation though.
  // $.addSubcommand('add', 'booty', { permLevel: 1 })
  // $.addSubcommand('remove', 'booty', { permLevel: 1 })
  // $.addSubcommand('edit', 'booty', { permLevel: 1 })

  await $.db.addTable('booty', true)

  if (!await $.db.countRows('booty')) initResponses($)
}
