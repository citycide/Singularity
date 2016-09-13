/**
 * 8ball - Ask a question and be demoralized.
 *
 * @command 8ball
 * @usage !8ball [question]
 * @param {object} event
 *
 * @source stock module
 * @author citycide
 */

module.exports.magicBall = async event => {
  if (!event.args.length) {
    $.say(event.sender, `You need to ask 8ball a question.`)
    return
  }

  if (event.argString === `I'm Ron Burgundy?`) {
    $.shout(`Damnit, who typed a question mark on the teleprompter?`)
    return
  }

  const response = await $.db.getRow('ball', null, { random: true })

  if (response) {
    $.say(event.sender, $.params(event, response.value))
  } else {
    $.say(event.sender, `I'm not going to dignify that with a response.`)
  }
}

async function initResponses () {
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

  await Promise.all(defaults.map(response => $.db.set('ball', { value: response })))

  $.log('8ball', `Done. ${defaults.length} default 8ball responses added.`)
}

;(async () => {
  $.addCommand('8ball', {
    handler: 'magicBall',
    cooldown: 60,
    status: true
  })

  $.addSubcommand('add', '8ball', { permLevel: 0, status: true })
  $.addSubcommand('remove', '8ball', { permLevel: 0, status: true })
  $.addSubcommand('edit', '8ball', { permLevel: 0, status: true })

  await $.db.addTable('ball', true)

  if (!await $.db.countRows('ball')) initResponses()
})()
