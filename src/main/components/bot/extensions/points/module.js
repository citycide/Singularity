export async function points (e, $) {
  const [action, param1, param2] = e.args

  if (!action) {
    return $.say(e.sender, $.weave(
      'response.default', e.sender, await $.points.get(e.sender, true)
    ))
  }

  if ($.is(e.subcommand, 'add')) {
    if (e.args.length < 3 || !$.is.numeric(param2)) {
      $.say(e.sender, $.weave('add.usage'))
      return
    }

    await $.points.add(param1, param2)
    $.say(e.sender, $.weave('change.success', param1, await $.points.get(param1, true)))

    return
  }

  if ($.is(e.subcommand, 'remove')) {
    if (e.args.length < 3 || !$.is.numeric(param2)) {
      $.say(e.sender, $.weave('remove.usage'))
      return
    }

    await $.points.sub(param1, param2)
    $.say(e.sender, $.weave('change.success', param1, await $.points.get(param1, true)))

    return
  }

  if ($.is(e.subcommand, 'gift')) {
    if (e.args.length < 3 || !$.is.numeric(param2)) {
      $.say(e.sender, $.weave('gift.usage'))
      return
    }

    if ($.points.get(e.sender) < $.to.number(param2, true)) {
      $.say(e.sender, $.weave('gift.not-enough-points', await $.points.get(e.sender, true)))
      return
    }

    await $.points.sub(e.sender, param2)
    await $.points.add(param1, param2)

    const str = $.points.str(param2)
    if ($.settings.get('whisperMode')) {
      $.whisper(e.sender, $.weave(
        'gift.success.sender', str, param1, await $.points.get(e.sender, true)
      ))
      $.whisper(param1, $.weave(
        'gift.success.recipient', e.sender, str, await $.points.get(param1, true)
      ))
    } else {
      $.shout($.weave(
        'gift.success.shout', e.sender, str, param1, await $.points.get(e.sender, true)
      ))
    }

    return
  }

  if (await $.user.exists(action)) {
    return $.say(e.sender, $.weave('response.default', action, await $.points.get(action, true)))
  } else {
    return $.say(e.sender, $.weave('response.not-found', action))
  }
}

export default async function ($) {
  $.addCommand('points')
  $.addSubcommand('add', 'points', { permLevel: 1 })
  $.addSubcommand('remove', 'points', { permLevel: 1 })
}
