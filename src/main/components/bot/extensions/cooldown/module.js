export async function cooldown (e, $) {
  if ($.is(e.subcommand, 'get')) {
    const [cmd, sub = ''] = e.subArgs
    const subStr = sub ? ' ' + sub : ''

    if (!cmd) {
      return $.say(e.sender, $.weave('get.usage'))
    }

    const cool = await $.command.getCooldown(cmd, sub)

    if (!$.is.finite(cool)) {
      return $.say(e.sender, `'!${cmd}${subStr}' has no cooldown.`)
    }

    return $.say(e.sender, $.weave('get.response', cmd, sub, cool))
  }

  if ($.is(e.subcommand, 'set')) {
    const [cmd, sub, val] = e.subArgs

    if (!cmd) {
      return $.say(e.sender, $.weave('set.usage'))
    }

    switch (e.subArgs.length) {
      case 2:
        // provided a command and cooldown value only
        const num = parseInt(sub)

        if ($.is.finite(num)) {
          return $.say(e.sender, $.weave('set.usage'))
        }

        if (!await $.command.exists(cmd)) {
          return $.say(e.sender, $.weave.core('commands.does-not-exist'))
        }

        await $.command.setCooldown(cmd, num)
        return $.say(e.sender, $.weave('set.success', cmd, num))
      case 3:
        // provided a command, subcommand, and cooldown value
        const subNum = parseInt(val)

        if (!$.is.finite(subNum)) {
          return $.say(e.sender, $.weave('set.usage'))
        }

        if (!await $.command.exists(cmd, sub)) {
          return $.say(e.sender, $.weave.core('commands.does-not-exist'))
        }

        await $.command.setCooldown(cmd, subNum, sub)
        return $.say(e.sender, $.weave('set.success-sub', cmd, sub, subNum))
      default:
        return $.say(e.sender, $.weave('set.usage'))
    }
  }

  if ($.is(e.subcommand, 'admin')) {
    const [status] = e.subArgs

    if (!$.is.oneOf(['enabled', 'disabled'], status)) {
      return $.say(e.sender, $.weave('admin.usage'))
    }

    const bool = $.is(status, 'enabled')
    $.db.setExtConfig('cooldown', 'includeAdmins', bool)
    $.say(e.sender, $.weave('admin.response', bool ? 'enabled' : 'disabled'))
    return
  }

  if (!e.subcommand) {
    $.say(e.sender, $.weave('usage'))
  }
}

export default function ($) {
  $.addCommand('cooldown', { permLevel: 1 })
  $.addSubcommand('get', 'cooldown')
  $.addSubcommand('set', 'cooldown')
  $.addSubcommand('admin', 'cooldown')
}
