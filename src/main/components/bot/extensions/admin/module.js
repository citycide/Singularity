import moment from 'moment'

export async function command (e, $) {
  const [, param1, param2] = e.args

  if (e.subcommand === 'enable') {
    if (e.args.length < 2) {
      return $.say(e.sender, $.weave('command.enable-usage'))
    }

    if (param1.includes('>')) {
      const pair = param1.split('>')

      if (await $.command.exists(pair[0], pair[1])) {
        await $.command.enable(pair[0], pair[1])
        $.say(e.sender, $.weave.core('commands.enable-success', param1))
      } else {
        $.say(e.sender, $.weave.core('commands.does-not-exist'))
      }
    } else {
      if (await $.command.exists(param1)) {
        await $.command.enable(param1)
        $.say(e.sender, $.weave.core('commands.enable-success', param1))
      } else {
        $.say(e.sender, $.weave.core('commands.does-not-exist'))
      }
    }

    return
  }

  if ($.is(e.subcommand, 'disable')) {
    if (e.args.length < 2) {
      return $.say(e.sender, $.weave('command.disable-usage'))
    }

    if (param1.includes('>')) {
      const pair = param1.split('>')

      if (await $.command.exists(pair[0], pair[1])) {
        await $.command.disable(pair[0], pair[1])
        $.say(e.sender, $.weave.core('commands.disable-success', param1))
      } else {
        $.say(e.sender, $.weave.core('commands.does-not-exist'))
      }
    } else {
      if (await $.command.exists(param1)) {
        await $.command.disable(param1)
        $.say(e.sender, $.weave.core('commands.disable-success', param1))
      } else {
        $.say(e.sender, $.weave.core('commands.does-not-exist'))
      }
    }

    return
  }

  if ($.is(e.subcommand, 'permission')) {
    if (e.args.length < 2) {
      return $.say(e.sender, $.weave('command.permission-usage'))
    }

    if (await $.command.exists(param1)) {
      await $.command.setPermLevel(param1, param2)
      $.say(e.sender, $.weave.core('commands.permission-success', param1, param2))
    } else {
      $.say(e.sender, $.weave.core('commands.does-not-exist'))
    }

    return
  }

  if ($.is(e.subcommand, 'add')) {
    if (e.subArgs.length < 2) {
      return $.say(e.sender, $.weave('command.add-usage'))
    }

    if (await $.command.exists(param1)) {
      return $.say(e.sender, $.weave.core('commands.already-exists'))
    }

    const response = e.subArgs.slice(1).join(' ')

    await $.command.addCustom(param1, response)
    $.say(e.sender, $.weave.core('commands.add-success', param1))

    return
  }

  if ($.is(e.subcommand, 'remove')) {
    if (!e.subArgs[0]) {
      return $.say(e.sender, $.weave('command.remove-usage'))
    }

    if (!await $.command.exists(param1)) {
      return $.say(e.sender, $.weave.core('commands.does-not-exist'))
    }

    if (!await $.command.isCustom(param1)) {
      return $.say(e.sender, $.weave.core('commands.is-extension-command'))
    }

    await $.command.removeCustom(param1)
    $.say(e.sender, $.weave.core('commands.remove-success', param1))

    return
  }

  if ($.is(e.subcommand, 'edit')) {
    if (e.subArgs.length < 2) {
      return $.say(e.sender, $.weave('command.edit-usage'))
    }

    if (!await $.command.exists(param1)) {
      return $.say(e.sender, $.weave.core('commands.does-not-exist'))
    }

    if (!await $.command.isCustom(param1)) {
      return $.say(e.sender, $.weave.core('commands.is-extension-command'))
    }

    const newResponse = e.subArgs.slice(1).join(' ')

    await $.db.set('commands', { response: newResponse }, { name: param1, module: 'custom' })
    $.say(e.sender, $.weave.core('commands.edit-success', param1))

    return
  }

  $.say(e.sender, $.weave('command.usage'))
}

export async function whisperMode (e, $) {
  if ($.is(e.subcommand, 'enable')) {
    await $.settings.set('whisperMode', true)
    $.say(e.sender, $.weave.core('settings.whisper-mode.enabled-success'))
    return
  }

  if ($.is(e.subcommand, 'disable')) {
    await $.settings.set('whisperMode', false)
    $.say(e.sender, $.weave.core('settings.whisper-mode.disabled-success'))
    return
  }

  const status = await $.settings.get('whisperMode')
        ? $.weave.core('common-words.enabled')
        : $.weave.core('common-words.disabled')
  $.say(e.sender, $.weave('whisper-mode.usage', status))
}

export async function lastSeen (e, $) {
  let target = e.args[0]
  if (!target) return $.say(e.sender, $.weave('last-seen.usage'))

  if (await $.user.exists(target)) {
    let ts = await $.db.get('users', 'seen', { name: target })
    let timeAgo = moment(ts, 'x').fromNow()

    $.say(e.sender, $.weave('last-seen.response', target, timeAgo))
  } else {
    $.say(e.sender, $.weave('last-seen.not-seen', target))
  }
}

export default function ($) {
  $.addCommand('command', {
    cooldown: 0,
    permLevel: 1
  })

  $.addSubcommand('enable', 'command')
  $.addSubcommand('disable', 'command')
  $.addSubcommand('permission', 'command')
  $.addSubcommand('add', 'command')
  $.addSubcommand('remove', 'command')
  $.addSubcommand('edit', 'command')

  $.addCommand('whispermode', {
    handler: 'whisperMode',
    cooldown: 0,
    permLevel: 0
  })

  $.addSubcommand('enable', 'whispermode')
  $.addSubcommand('disable', 'whispermode')

  $.addCommand('lastseen', { handler: 'lastSeen' })
}
