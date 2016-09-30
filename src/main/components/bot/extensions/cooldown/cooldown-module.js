export async function cooldown (e, $) {
  if ($.is(e.subcommand, 'get')) {
    const [cmd, sub = ''] = e.subArgs
    const subStr = sub ? ' ' + sub : ''

    if (!cmd) {
      return $.say(e.sender, 'Usage: !cooldown get (command) [subcommand]')
    }

    const cool = await $.command.getCooldown(cmd, sub)

    if (!$.is.finite(cool)) {
      return $.say(e.sender, `'!${cmd}${subStr}' has no cooldown.`)
    }

    return $.say(e.sender, `Cooldown for '!${cmd}${subStr}' is set to ${cool} seconds.`)
  }

  if ($.is(e.subcommand, 'set')) {
    const [cmd, sub, val] = e.subArgs

    if (!cmd) {
      return $.say(e.sender, 'Usage: !cooldown set (command) [subcommand] (# seconds)')
    }

    switch (e.subArgs.length) {
      case 2:
        // provided a command and cooldown value only
        const num = parseInt(sub)

        if ($.is.finite(num)) {
          return $.say(e.sender, 'Usage: !cooldown set (command) [subcommand] (# seconds)')
        }

        if (!await $.command.exists(cmd)) {
          return $.say(e.sender, `Command '!${cmd}' doesn't exist.`)
        }

        await $.command.setCooldown(cmd, num)
        return $.say(e.sender, `Cooldown for '${cmd}' set to ${num} seconds.`)
      case 3:
        // provided a command, subcommand, and cooldown value
        const subNum = parseInt(val)

        if (!$.is.finite(subNum)) {
          return $.say(e.sender, 'Usage: !cooldown set (command) [subcommand] (# seconds)')
        }

        if (!await $.command.exists(cmd, sub)) {
          return $.say(e.sender, `Command '!${cmd} ${sub}' doesn't exist.`)
        }

        await $.command.setCooldown(cmd, subNum, sub)
        return $.say(e.sender, `Cooldown for '${cmd} ${sub}' set to ${subNum} seconds.`)
      default:
        return $.say(e.sender, 'Usage: !cooldown set (command) [subcommand] (# seconds)')
    }
  }

  if ($.is(e.subcommand, 'admin')) {
    const [status] = e.subArgs

    if (!$.is.oneOf(['enabled', 'disabled'], status)) {
      return $.say(e.sender, `Usage: !cooldown admin (enabled|disabled)`)
    }

    const bool = $.is(status, 'enabled')
    $.db.setComponentConfig('cooldown', 'includeAdmins', bool)
    $.say(e.sender, `Cooldowns will now be ${bool ? 'enabled' : 'disabled'} for administrators.`)
    return
  }

  if (!e.subcommand) {
    $.say(e.sender, `Usage: !cooldown (get|set)`)
  }
}

export default function ($) {
  $.addCommand('cooldown', { permLevel: 1 })
  $.addSubcommand('get', 'cooldown')
  $.addSubcommand('set', 'cooldown')
  $.addSubcommand('admin', 'cooldown')
}
