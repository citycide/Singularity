export async function points (e, $) {
  const [action, target, amount] = e.args
  const parsedAmount = $.to.number(amount)

  if (!action) {
    return $.say(e.sender, $.weave('response', e.sender, await $.points.get(e.sender, true)))
  }

  if ($.is(e.subcommand, 'add')) {
    if (e.args.length < 3 || !$.is.number(parsedAmount)) {
      $.say(e.sender, $.weave('add.usage'))
      return
    }

    await $.points.add(target, amount)
    $.say(e.sender, $.weave('change.success', target, await $.points.get(target, true)))

    return
  }

  if ($.is(e.subcommand, 'remove')) {
    if (e.args.length < 3 || !$.is.number(parsedAmount)) {
      $.say(e.sender, $.weave('remove.usage'))
      return
    }

    await $.points.sub(target, amount)
    $.say(e.sender, $.weave('change.success', target, await $.points.get(target, true)))

    return
  }

  if ($.is(e.subcommand, 'gift')) {
    if (e.args.length < 3 || !$.is.number(parsedAmount)) {
      $.say(e.sender, $.weave('gift.usage'))
      return
    }

    if ($.points.get(e.sender) < parsedAmount) {
      $.say(e.sender, $.weave('gift.not-enough-points', await $.points.get(e.sender, true)))
      return
    }

    await $.points.sub(e.sender, amount)
    await $.points.add(target, amount)

    const str = $.points.str(amount)
    if ($.settings.get('whisperMode')) {
      $.whisper(e.sender, $.weave(
        'gift.success.sender', str, target, await $.points.get(e.sender, true)
      ))
      $.whisper(target, $.weave(
        'gift.success.recipient', e.sender, str, await $.points.get(target, true)
      ))
    } else {
      $.shout($.weave(
        'gift.success.shout', e.sender, str, target, await $.points.get(e.sender, true)
      ))
    }

    return
  }

  if (await $.user.exists(action)) {
    return $.say(e.sender, $.weave('response', action, await $.points.get(action, true)))
  } else {
    return $.say(e.sender, $.weave('response.not-found', action))
  }
}

export default async function ($) {
  $.addCommand('points')
  $.addSubcommand('add', 'points', { permLevel: 1 })
  $.addSubcommand('remove', 'points', { permLevel: 1 })
}
