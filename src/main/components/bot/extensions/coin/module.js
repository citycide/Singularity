/**
 * coin - bet currency on the outcome of a coin flip
 *
 * @command coin
 * @usage !coin (amount)
 *
 * @source stock module
 * @author citycide
 */

export async function coin (e, $) {
  const risk = await $.db.getModuleConfig('coin', 'risk', 1)
  const reward = await $.db.getModuleConfig('coin', 'reward', 1)
  const maxBet = await $.db.getModuleConfig('coin', 'maxBet', 50)

  if ($.is.numeric(e.args[0])) {
    const betAmount = $.to.number(e.args[0])
    const userPoints = await $.points.get(e.sender)

    if (betAmount > maxBet) {
      $.say(e.sender, $.weave('error.bet-over-max', await $.points.str(maxBet)))
      return
    }

    if (betAmount > userPoints * risk) {
      $.say(e.sender, $.weave(
        'error.not-enough-points',
        await $.points.getName(),
        await $.points.get(e.sender, true), risk)
      )
      return
    }

    const result = $.to.random(1000) < 500
    const outcome = result ? betAmount * reward : betAmount * risk
    const str = await $.points.str(outcome)

    if (result) {
      await $.points.add(e.sender, outcome)
      $.say(e.sender, $.weave('flip.win', str))
    } else {
      await $.points.sub(e.sender, outcome)
      $.say(e.sender, $.weave('flip.loss', str))
    }

    return
  }

  if ($.is(e.subcommand, 'risk')) {
    if (!e.subArgs[0] || !$.is.numeric(e.subArgs[0])) {
      $.say(e.sender, $.weave('risk.usage', risk))
      return
    }

    const newRisk = $.to.number(e.subArgs[0])
    await $.db.setModuleConfig('coin', 'risk', newRisk)

    $.say(e.sender, $.weave('risk.success', await $.points.str(newRisk)))

    return
  }

  if ($.is(e.subcommand, 'reward')) {
    if (!e.subArgs[0] || !$.is.numeric(e.subArgs[0])) {
      $.say(e.sender, $.weave('reward.usage', reward))
      return
    }

    const newReward = $.to.number(e.subArgs[0])
    await $.db.setModuleConfig('coin', 'reward', newReward)

    $.say(e.sender, $.weave('reward.success', await $.points.str(newReward)))

    return
  }

  if ($.is(e.subcommand, 'max')) {
    if (!e.subArgs[0] || !$.is.numeric(e.subArgs[0])) {
      $.say(e.sender, $.weave('max.usage', maxBet))
      return
    }

    const newMax = $.to.number(e.subArgs[0], true)
    await $.db.setModuleConfig('coin', 'maxBet', newMax)

    $.say(e.sender, $.weave('max.success', await $.points.str(newMax)))
    return
  }

  $.say(e.sender, $.weave('usage'))
}

export default function ($) {
  $.addCommand('coin', { cooldown: 60 })
  $.addSubcommand('risk', 'coin', { permLevel: 1 })
  $.addSubcommand('reward', 'coin', { permLevel: 1 })
  $.addSubcommand('max', 'coin', { permLevel: 1 })
}
