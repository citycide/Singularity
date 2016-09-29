/**
 * 8ball - Ask a question and be demoralized.
 *
 * @command 8ball
 * @usage !8ball (question)
 *
 * @source stock module
 * @author citycide
 */

export async function magicBall (e, $) {
  if (!e.args.length) {
    $.say(e.sender, `You need to ask 8ball a question.`)
    return
  }

  if ($.is(e.argString, `I'm Ron Burgundy?`)) {
    $.shout(`Damnit, who typed a question mark on the teleprompter?`)
    return
  }

  const response = await $.db.getRandomRow('ball')

  if (response) {
    $.say(e.sender, $.params(e, response.value))
  } else {
    $.say(e.sender, `I'm not going to dignify that with a response.`)
  }
}

async function initResponses ($) {
  $.log('8ball', 'No 8ball responses found, adding some defaults...')

  const defaults = [
    `It is certain.`,
    `Without a doubt.`,
    `I never say something's definitely happening, but this is *definitely* happening.`,
    `The odds of that happening are... slim.`,
    `The end of the world as we know it will occur before that happens.`,
    `No. Just... no.`,
    `I'd marry (random) before that happens.`
  ]

  defaults.forEach(async response => await $.db.set('ball', { value: response }))

  $.log('8ball', `Done. ${defaults.length} default 8ball responses added.`)
}

export default async function ($) {
  $.addCommand('8ball', {
    handler: 'magicBall',
    cooldown: 60
  })

  $.addSubcommand('add', '8ball', { permLevel: 1 })
  $.addSubcommand('remove', '8ball', { permLevel: 1 })
  $.addSubcommand('edit', '8ball', { permLevel: 1 })

  await $.db.addTable('ball', true)

  if (!await $.db.countRows('ball')) initResponses($)
}
