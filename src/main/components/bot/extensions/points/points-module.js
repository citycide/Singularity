export async function points (e, $) {
  const [action, param1, param2] = e.args

  if (!action) {
    return $.say(e.sender, `You have ${await $.points.get(e.sender, true)}.`)
  }

  if (action === 'add') {
    if (e.args.length < 3 || !$.util.str.isNumeric(param2)) {
      $.say(e.sender, `Usage: !points add [username] [amount]`)
      return
    }

    await $.points.add(param1, param2)
    $.say(e.sender, `${param1} now has ${await $.points.get(param1, true)}.`)

    return
  }

  if (action === 'remove') {
    if (e.args.length < 3 || !$.util.str.isNumeric(param2)) {
      $.say(e.sender, `Usage: !points remove [username] [amount]`)
      return
    }

    await $.points.sub(param1, param2)
    $.say(e.sender, `${param1} now has ${await $.points.get(param1, true)}.`)

    return
  }

  if (action === 'gift') {
    if (e.args.length < 3 || !$.util.str.isNumeric(param2)) {
      $.say(e.sender, `Usage: !points gift [username] [amount]`)
      return
    }

    if ($.points.get(e.sender) < parseInt(param2)) {
      $.say(e.sender, `You only have ${await $.points.get(e.sender, true)}.`)
      return
    }

    await $.points.sub(e.sender, param2)
    await $.points.add(param1, param2)

    if ($.settings.get('whisperMode')) {
      $.whisper(e.sender,
        `You gave ${$.points.str(param2)} to ${param1} ` +
        `(${await $.points.get(e.sender, true)} left)`)
      $.whisper(param1,
        `${e.sender} gave you ${$.points.str(param2)} ` +
        `(you now have ${await $.points.get(e.sender, true)})`)
    } else {
      $.say(e.sender,
        `You gave ${$.points.str(param2)} to ${param1} ` +
        `(${await $.points.get(e.sender, true)} left)`)
    }

    return
  }

  if (await $.user.exists(action)) {
    return $.say(e.sender, `${action} has ${await $.points.get(action, true)}.`)
  } else {
    return $.say(e.sender, `${action} hasn't visited the chat yet.`)
  }
}

export default async function ($) {
  $.addCommand('points', {
    cooldown: 0,
    status: true
  })

  $.addSubcommand('add', 'points', { permLevel: 0, status: true })
  $.addSubcommand('remove', 'points', { permLevel: 0, status: true })
}
