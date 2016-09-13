module.exports.points = async event => {
  const [action, param1, param2] = event.args

  if (!action) {
    return $.say(event.sender, `You have ${await $.points.get(event.sender, true)}.`)
  }

  if (action === 'add') {
    if (event.args.length < 3 || !$.util.str.isNumeric(param2)) {
      $.say(event.sender, `Usage: !points add [username] [amount]`)
      return
    }

    await $.points.add(param1, param2)
    $.say(event.sender, `${param1} now has ${await $.points.get(param1, true)}.`)

    return
  }

  if (action === 'remove') {
    if (event.args.length < 3 || !$.util.str.isNumeric(param2)) {
      $.say(event.sender, `Usage: !points remove [username] [amount]`)
      return
    }

    await $.points.sub(param1, param2)
    $.say(event.sender, `${param1} now has ${await $.points.get(param1, true)}.`)

    return
  }

  if (action === 'gift') {
    if (event.args.length < 3 || !$.util.str.isNumeric(param2)) {
      $.say(event.sender, `Usage: !points gift [username] [amount]`)
      return
    }

    if ($.points.get(event.sender) < parseInt(param2)) {
      $.say(event.sender, `You only have ${await $.points.get(event.sender, true)}.`)
      return
    }

    await $.points.sub(event.sender, param2)
    await $.points.add(param1, param2)

    if ($.settings.get('whisperMode')) {
      $.whisper(event.sender,
                `You gave ${$.points.str(param2)} to ${param1} ` +
                `(${await $.points.get(event.sender, true)} left)`)
      $.whisper(param1,
                `${event.sender} gave you ${$.points.str(param2)} ` +
                `(you now have ${await $.points.get(event.sender, true)})`)
    } else {
      $.say(event.sender,
                `You gave ${$.points.str(param2)} to ${param1} ` +
                `(${await $.points.get(event.sender, true)} left)`)
    }

    return
  }

  if (await $.user.exists(action)) {
    return $.say(event.sender, `${action} has ${await $.points.get(action, true)}.`)
  } else {
    return $.say(event.sender, `${action} hasn't visited the chat yet.`)
  }
};

(() => {
  $.addCommand('points', {
    cooldown: 0,
    status: true
  })

  $.addSubcommand('add', 'points', { permLevel: 0, status: true })
  $.addSubcommand('remove', 'points', { permLevel: 0, status: true })
})()
