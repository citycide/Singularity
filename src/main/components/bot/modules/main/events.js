import transit from 'main/components/transit'

module.exports.alerts = async event => {
  const param1 = event.args[1]

  if (event.subcommand === 'follow') {
    if (param1 === 'enable') {
      await $.settings.set('followAlerts', true)
      $.say(event.sender, weave.get('bot:settings:alerts-follows:enabled:success'))
    } else if (param1 === 'disable') {
      await $.settings.set('followAlerts', false)
      $.say(event.sender, weave.get('bot:settings:alerts-follows:disabled:success'))
    } else {
      const status = await $.settings.get('followAlerts', true)
        ? weave.get('common-words:enabled')
        : weave.get('common-words:disabled')
      $.say(event.sender, weave.get('bot:modules:events:alerts:follow:usage', status))
    }

    return
  }

  if (event.subcommand === 'host') {
    if (param1 === 'enable') {
      await $.settings.set('hostAlerts', true)
      $.say(event.sender, weave.get('bot:settings:alerts-hosts:enabled:success'))
    } else if (param1 === 'disable') {
      await $.settings.set('hostAlerts', false)
      $.say(event.sender, weave.get('bot:settings:alerts-hosts:disabled:success'))
    } else {
      const status = await $.settings.get('hostAlerts', true)
        ? weave.get('common-words:enabled')
        : weave.get('common-words:disabled')
      $.say(event.sender, weave.get('bot:modules:events:alerts:host:usage', status))
    }

    return
  }

  if (event.subcommand === 'sub') {
    if (param1 === 'enable') {
      await $.settings.set('subAlerts', true)
      $.say(event.sender, weave.get('bot:settings:alerts-subs:enabled:success'))
    } else if (param1 === 'disable') {
      await $.settings.set('subAlerts', false)
      $.say(event.sender, weave.get('bot:settings:alerts-subs:disabled:success'))
    } else {
      const status = await $.settings.get('subAlerts', false)
        ? weave.get('common-words:enabled')
        : weave.get('common-words:disabled')
      $.say(event.sender, weave.get('bot:modules:events:alerts:sub:usage', status))
    }

    return
  }

  if (event.subcommand === 'tip') {
    if (param1 === 'enable') {
      await $.settings.set('tipAlerts', true)
      $.say(event.sender, weave.get('bot:settings:alerts-tips:enabled:success'))
    } else if (param1 === 'disable') {
      await $.settings.set('tipAlerts', false)
      $.say(event.sender, weave.get('bot:settings:alerts-tips:disabled:success'))
    } else {
      const status = await $.settings.get('tipAlerts', false)
        ? weave.get('common-words:enabled')
        : weave.get('common-words:disabled')
      $.say(event.sender, weave.get('bot:modules:events:alerts:tip:usage', status))
    }

    return
  }

  if (event.subcommand === 'settings') {
    const cfg = [
      await $.settings.get('followAlerts', true)
        ? weave.get('common-words:enabled')
        : weave.get('common-words:disabled'),
      await $.settings.get('hostAlerts', true)
        ? weave.get('common-words:enabled')
        : weave.get('common-words:disabled'),
      await $.settings.get('subAlerts', false)
        ? weave.get('common-words:enabled')
        : weave.get('common-words:disabled'),
      await $.settings.get('tipAlerts', false)
        ? weave.get('common-words:enabled')
        : weave.get('common-words:disabled')
    ]

    $.say(event.sender, weave.get('bot:modules:events:alerts:settings', ...cfg))

    return
  }

  $.say(event.sender, weave.get('bot:modules:events:alerts:usage'))
}

// Keep an array of events to prevent duplicates
const events = []

transit.on('alert:follow', async data => {
  if (await $.settings.get('followAlerts', true)) {
    if (!events.includes(`${data.display_name}:follow`)) {
      events.push(`${data.display_name}:follow`)
      const reward = await $.settings.get('followReward', 50)

      if (reward > 0) {
        $.shout(weave.get('bot:settings:alerts-follows:response-reward',
                    data.display_name, await $.points.str(reward)))
      } else {
        $.shout(weave.get('bot:settings:alerts-follows:response-no-reward',
                    data.display_name))
      }
    }
  }
})

transit.on('alert:host', async data => {
  if (await $.settings.get('hostAlerts', true)) {
    if (!events.includes(`${data.display_name}:host`)) {
      // Only consider hosts duplicates if the viewer count is the same
      events.push(`${data.display_name}:host:${data.viewers}`)
      const reward = await $.settings.get('hostReward', 50)

      if (reward > 0) {
        $.shout(weave.get('bot:settings:alerts-hosts:response-reward',
                    data.display_name, data.viewers, await $.points.str(reward)))
      } else {
        $.shout(weave.get('bot:settings:alerts-hosts:response-no-reward',
                    data.display_name, data.viewers))
      }
    }
  }
})

transit.on('alert:subscriber', async data => {
  if (await $.settings.get('subAlerts', false)) {
    if (!events.includes(`${data.display_name}:sub`)) {
      events.push(`${data.display_name}:sub`)
      const reward = await $.settings.get('subReward', 50)
      let response = ''

      if (data.hasOwnProperty('months')) {
        // Event is a resub
        if (reward > 0) {
          response = weave.get('bot:settings:alerts-resubs:response-reward',
                        data.display_name, data.months, await $.points.str(reward))
        } else {
          response = weave.get('bot:settings:alerts-resubs:response-no-reward',
                        data.display_name, data.months)
        }
      } else {
        // Event is a new subscription
        if (reward > 0) {
          response = weave.get('bot:settings:alerts-subs:response-reward',
                        data.display_name, await $.points.str(reward))
        } else {
          response = weave.get('bot:settings:alerts-subs:response-no-reward',
                        data.display_name)
        }
      }

      $.shout(response)
    }
  }
})

transit.on('alert:tip', async data => {
  if (await $.settings.get('tipAlerts', false)) {
    // Tip alerts are probably not duplicates, so don't check
    const reward = await $.settings.get('tipReward', 50)

    if (reward > 0) {
      $.shout(weave.get('bot:settings:alerts-tips:response-reward',
                data.name, data.amount, await $.points.str(reward)))
    } else {
      $.shout(weave.get('bot:settings:alerts-tips:response-no-reward',
                data.name, data.amount))
    }
  }
});

(() => {
  $.addCommand('alerts', { permLevel: 0, status: true })
})()
