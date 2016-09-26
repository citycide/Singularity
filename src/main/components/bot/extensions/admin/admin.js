import moment from 'moment'

export async function command (e, $) {
  const [, param1, param2] = e.args

  if (e.subcommand === 'enable') {
    if (e.args.length < 2) {
      return $.say(e.sender, weave.get('bot:modules:admin:command:enable:usage'))
    }

    if (param1.includes('>')) {
      const pair = param1.split('>')

      if (await $.command.exists(pair[0], pair[1])) {
        await $.command.enable(pair[0], pair[1])
        $.say(e.sender, weave.get('bot:commands:enable:success', param1))
      } else {
        $.say(e.sender, weave.get('bot:commands:does-not-exist'))
      }
    } else {
      if (await $.command.exists(param1)) {
        await $.command.enable(param1)
        $.say(e.sender, weave.get('bot:commands:enable:success', param1))
      } else {
        $.say(e.sender, weave.get('bot:commands:does-not-exist'))
      }
    }

    return
  }

  if (e.subcommand === 'disable') {
    if (e.args.length < 2) {
      return $.say(e.sender, weave.get('bot:modules:admin:command:disable:usage'))
    }

    if (param1.includes('>')) {
      const pair = param1.split('>')

      if (await $.command.exists(pair[0], pair[1])) {
        await $.command.disable(pair[0], pair[1])
        $.say(e.sender, weave.get('bot:commands:disable:success', param1))
      } else {
        $.say(e.sender, weave.get('bot:commands:does-not-exist'))
      }
    } else {
      if (await $.command.exists(param1)) {
        await $.command.disable(param1)
        $.say(e.sender, weave.get('bot:commands:disable:success', param1))
      } else {
        $.say(e.sender, weave.get('bot:commands:does-not-exist'))
      }
    }

    return
  }

  if (e.subcommand === 'permission') {
    if (e.args.length < 2) {
      return $.say(e.sender, weave.get('bot:modules:admin:command:permission:usage'))
    }

    if (await $.command.exists(param1)) {
      await $.command.setPermLevel(param1, param2)
      $.say(e.sender, weave.get('bot:commands:permission:success', param1, param2))
    } else {
      $.say(e.sender, weave.get('bot:commands:does-not-exist'))
    }

    return
  }

  if (e.subcommand === 'add') {
    if (e.subArgs.length < 2) {
      return $.say(e.sender, weave.get('bot:modules:admin:command:add:usage'))
    }

    if (await $.command.exists(param1)) {
      return $.say(e.sender, weave.get('bot:commands:already-exists'))
    }

    const response = e.subArgs.slice(1).join(' ')

    await $.command.addCustom(param1, response)
    $.say(e.sender, weave.get('bot:commands:add:success', param1))

    return
  }

  if (e.subcommand === 'remove') {
    if (!e.subArgs[0]) {
      return $.say(e.sender, weave.get('bot:modules:admin:command:remove:usage'))
    }

    if (!await $.command.exists(param1)) {
      return $.say(e.sender, weave.get('bot:commands:does-not-exist'))
    }

    if (!await $.command.isCustom(param1)) {
      return $.say(e.sender, weave.get('bot:commands:is-module-command'))
    }

    await $.command.removeCustom(param1)
    $.say(e.sender, weave.get('bot:commands:remove:success', param1))

    return
  }

  if (e.subcommand === 'edit') {
    if (e.subArgs.length < 2) {
      return $.say(e.sender, weave.get('bot:modules:admin:command:edit:usage'))
    }

    if (!await $.command.exists(param1)) {
      return $.say(e.sender, weave.get('bot:commands:does-not-exist'))
    }

    if (!await $.command.isCustom(param1)) {
      return $.say(e.sender, weave.get('bot:commands:is-module-command'))
    }

    const newResponse = e.subArgs.slice(1).join(' ')

    await $.db.set('commands', { response: newResponse }, { name: param1, module: 'custom' })
    $.say(e.sender, weave.get('bot:commands:edit:success', param1))

    return
  }

  $.say(e.sender, weave.get('bot:modules:admin:command:usage'))
}

export async function whisperMode (e, $) {
  if (e.subcommand === 'enable') {
    await $.settings.set('whisperMode', true)
    $.say(e.sender, weave.get('bot:settings:whisper-mode:enabled:success'))
    return
  }

  if (e.subcommand === 'disable') {
    await $.settings.set('whisperMode', false)
    $.say(e.sender, weave.get('bot:settings:whisper-mode:disabled:success'))
    return
  }

  const status = await $.settings.get('whisperMode')
        ? weave.get('common-words:enabled')
        : weave.get('common-words:disabled')
  $.say(e.sender, weave.get('bot:modules:admin:whisper-mode:usage', status))
}

export async function lastSeen (e, $) {
  let target = e.args[0]
  if (!target) return $.say(e.sender, weave.get('bot:modules:admin:last-seen:usage'))

  if (await $.user.exists(target)) {
    let ts = await $.db.get('users', 'seen', { name: target })
    let timeAgo = moment(ts, 'x').fromNow()

    $.say(e.sender, weave.get('bot:modules:admin:last-seen', target, timeAgo))
  } else {
    $.say(e.sender, weave.get('bot:modules:admin:last-seen:not-seen', target))
  }
}

export default function ($) {
  $.addCommand('command', {
    cooldown: 0,
    permLevel: 0,
    status: true
  })

  $.addSubcommand('enable', 'command', { permLevel: 0, status: true })
  $.addSubcommand('disable', 'command', { permLevel: 0, status: true })
  $.addSubcommand('permission', 'command', { permLevel: 0, status: true })
  $.addSubcommand('add', 'command', { permLevel: 0, status: true })
  $.addSubcommand('remove', 'command', { permLevel: 0, status: true })
  $.addSubcommand('edit', 'command', { permLevel: 0, status: true })

  $.addCommand('whispermode', {
    handler: 'whisperMode',
    cooldown: 0,
    permLevel: 0,
    status: true
  })

  $.addSubcommand('enable', 'whispermode', { permLevel: 0, status: true })
  $.addSubcommand('disable', 'whispermode', { permLevel: 0, status: true })

  $.addCommand('lastseen', { handler: 'lastSeen', status: true })
}
