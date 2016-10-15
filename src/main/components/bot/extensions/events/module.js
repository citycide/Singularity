import transit from 'main/components/transit'

export async function alerts (e, $) {
  const param1 = e.args[1]

  if ($.is(e.subcommand, 'follow')) {
    if (!$.is.oneOf(['enable', 'disable'], param1)) {
      const status = await $.settings.get('followAlerts', true)
        ? $.weave.core('common-words.enabled')
        : $.weave.core('common-words.disabled')

      $.say(e.sender, $.weave('alerts.follows.usage', status))
      return
    }

    const bool = $.is(param1, 'enable')
    const type = bool
      ? $.weave.core('common-words.enabled')
      : $.weave.core('common-words.disabled')

    await $.settings.set('followAlerts', bool)
    $.say(e.sender, $.weave(`alerts.follows.${type}.success`))

    return
  }

  if ($.is(e.subcommand, 'host')) {
    if (!$.is.oneOf(['enable', 'disable'], param1)) {
      const status = await $.settings.get('hostAlerts', true)
        ? $.weave.core('common-words.enabled')
        : $.weave.core('common-words.disabled')

      $.say(e.sender, $.weave('alerts.host.usage', status))
      return
    }

    const bool = $.is(param1, 'enable')
    const type = bool
      ? $.weave.core('common-words.enabled')
      : $.weave.core('common-words.disabled')

    await $.settings.set('hostAlerts', bool)
    $.say(e.sender, $.weave(`alerts.host.${type}.success`))

    return
  }

  if ($.is(e.subcommand, 'sub')) {
    if (!$.is.oneOf(['enable', 'disable'], param1)) {
      const status = await $.settings.get('subAlerts', true)
        ? $.weave.core('common-words.enabled')
        : $.weave.core('common-words.disabled')

      $.say(e.sender, $.weave('alerts.sub.usage', status))
      return
    }

    const bool = $.is(param1, 'enable')
    const type = bool
      ? $.weave.core('common-words.enabled')
      : $.weave.core('common-words.disabled')

    await $.settings.set('subAlerts', bool)
    $.say(e.sender, $.weave(`alerts.sub.${type}.success`))

    return
  }

  if ($.is(e.subcommand, 'tip')) {
    if (!$.is.oneOf(['enable', 'disable'], param1)) {
      const status = await $.settings.get('tipAlerts', true)
        ? $.weave.core('common-words.enabled')
        : $.weave.core('common-words.disabled')

      $.say(e.sender, $.weave('alerts.tip.usage', status))
      return
    }

    const bool = $.is(param1, 'enable')
    const type = bool
      ? $.weave.core('common-words.enabled')
      : $.weave.core('common-words.disabled')

    await $.settings.set('tipAlerts', bool)
    $.say(e.sender, $.weave(`alerts.tip.${type}.success`))

    return
  }

  if ($.is(e.subcommand, 'settings')) {
    const cfg = await Promise.all([
      $.settings.get('followAlerts', true)
        ? $.weave.core('common-words.enabled')
        : $.weave.core('common-words.disabled'),
      $.settings.get('hostAlerts', true)
        ? $.weave.core('common-words.enabled')
        : $.weave.core('common-words.disabled'),
      $.settings.get('subAlerts', false)
        ? $.weave.core('common-words.enabled')
        : $.weave.core('common-words.disabled'),
      $.settings.get('tipAlerts', false)
        ? $.weave.core('common-words.enabled')
        : $.weave.core('common-words.disabled')
    ])

    $.say(e.sender, $.weave('alerts.settings', ...cfg))

    return
  }

  $.say(e.sender, $.weave('alerts.usage'))
}

function listen () {
  transit.removeListener('alert:follow', followHandler)
  transit.removeListener('alert:host', hostHandler)
  transit.removeListener('alert:subscriber', subHandler)
  transit.removeListener('alert:tip', tipHandler)

  transit.on('alert:follow', followHandler)
  transit.on('alert:host', hostHandler)
  transit.on('alert:subsciber', subHandler)
  transit.on('alert:tip', tipHandler)
}

async function followHandler (data) {
  const events = $.cache.get('events', [])

  if (await $.settings.get('followAlerts', true)) {
    if (!events.includes(`${data.display_name}:follow`)) {
      events.push(`${data.display_name}:follow`)
      const reward = await $.settings.get('followReward', 50)

      if (reward > 0) {
        $.shout($.weave(
          'alerts.follows.response-reward',
          data.display_name,
          await $.points.str(reward)
        ))
      } else {
        $.shout($.weave('alerts.follows.response-no-reward', data.display_name))
      }

      $.cache.set('events', events)
    }
  }
}

async function hostHandler (data) {
  const events = $.cache.get('events', [])

  if (await $.settings.get('hostAlerts', true)) {
    if (!events.includes(`${data.display_name}:host`)) {
      // Only consider hosts duplicates if the viewer count is the same
      events.push(`${data.display_name}:host:${data.viewers}`)
      const reward = await $.settings.get('hostReward', 50)

      if (reward > 0) {
        $.shout($.weave(
          'alerts.host.response-reward',
          data.display_name,
          data.viewers,
          await $.points.str(reward)
        ))
      } else {
        $.shout($.weave('alerts.host.response-no-reward', data.display_name, data.viewers))
      }

      $.cache.set('events', events)
    }
  }
}

async function subHandler (data) {
  const events = $.cache.get('events', [])

  if (await $.settings.get('subAlerts', false)) {
    if (!events.includes(`${data.display_name}:sub`)) {
      events.push(`${data.display_name}:sub`)
      const reward = await $.settings.get('subReward', 50)
      let response = ''

      if (data.hasOwnProperty('months')) {
        // Event is a resub
        if (reward > 0) {
          response = $.weave(
            'alerts.sub.resub-reward',
            data.display_name,
            data.months,
            await $.points.str(reward)
          )
        } else {
          response = $.weave(
            'alerts.sub.resub-no-reward',
            data.display_name,
            data.months
          )
        }
      } else {
        // Event is a new subscription
        if (reward > 0) {
          response = $.weave(
            'alerts.sub.response-reward', data.display_name, await $.points.str(reward)
          )
        } else {
          response = $.weave('alerts.sub.response-no-reward', data.display_name)
        }
      }

      $.shout(response)
      $.cache.set('events', events)
    }
  }
}

async function tipHandler (data) {
  if (await $.settings.get('tipAlerts', false)) {
    // Tip alerts are probably not duplicates, so don't check
    const reward = await $.settings.get('tipReward', 50)

    if (reward > 0) {
      $.shout($.weave(
        'alerts.tip.response-reward',
        data.name,
        data.amount,
        await $.points.str(reward)
      ))
    } else {
      $.shout($.weave('alerts.tip.response-no-reward', data.name, data.amount))
    }
  }
}

export default function ($) {
  $.addCommand('alerts', { permLevel: 0 })
  listen()
}
