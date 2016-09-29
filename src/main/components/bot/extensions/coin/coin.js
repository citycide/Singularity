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
  if (!e.args.length) {
    $.say(e.sender, `Usage: !coin (bet amount)`)
    return
  }

  const risk = await $.db.getModuleConfig('coin', 'risk', 1)
  const reward = await $.db.getModuleConfig('coin', 'reward', 1)
  const maxBet = await $.db.getModuleConfig('coin', 'maxBet', 50)

  if ($.is.numeric(e.args[0])) {
    const betAmount = $.to.number(e.args[0])
    const userPoints = await $.points.get(e.sender)

    if (betAmount > maxBet) {
      $.say(e.sender, `The max bet for !coin is ${await $.points.str(maxBet)}.
        Try again with a smaller bet.`)
      return
    }

    if (betAmount > userPoints * risk) {
      $.say(e.sender, `You don't have enough ${await $.points.getName()} FeelsBadMan
        (${await $.points.get(e.sender, true)} available, risk multiplier of ${risk})`)
      return
    }

    const result = $.to.random(1000) < 500

    if (result) {
      const result = betAmount * reward
      await $.points.add(e.sender, result)
      $.say(e.sender, `You won ${await $.points.str(result)} from the coin flip! PogChamp`)
    } else {
      const result = betAmount * risk
      await $.points.sub(e.sender, result)
      $.say(e.sender, `You lost ${await $.points.str(result)} from the coin flip! BibleThump`)
    }

    return
  }

  if ($.is(e.subcommand, 'risk')) {
    if (!e.subArgs[0] || !$.is.numeric(e.subArgs[0])) {
      $.say(e.sender, `Usage: !coin risk (multiplier) » currently set to ${risk}`)
      return
    }

    const newRisk = $.to.number(e.subArgs[0])
    await $.db.setModuleConfig('coin', 'risk', newRisk)

    $.say(e.sender, `Risk multiplier for !coin updated to ${await $.points.str(newRisk)}.`)

    return
  }

  if ($.is(e.subcommand, 'reward')) {
    if (!e.subArgs[0] || !$.is.numeric(e.subArgs[0])) {
      $.say(e.sender, `Usage: !coin reward (multiplier) » currently set to ${reward}`)
      return
    }

    const newReward = $.to.number(e.subArgs[0])
    await $.db.setModuleConfig('coin', 'reward', newReward)

    $.say(e.sender, `Reward multiplier for !coin updated to ${$.points.str(newReward)}.`)

    return
  }

  if ($.is(e.subcommand, 'max')) {
    if (!e.subArgs[0] || !$.is.numeric(e.subArgs[0])) {
      $.say(e.sender, `Usage: !coin max (number) » currently set to ${maxBet}`)
      return
    }

    const newMax = $.to.number(e.subArgs[0], true)
    await $.db.setModuleConfig('coin', 'maxBet', newMax)

    $.say(e.sender, `Max bet for !coin updated to ${await $.points.str(newMax)}.`)
  }
}

export default function ($) {
  $.addCommand('coin', {
    cooldown: 60
  })

  $.addSubcommand('risk', 'coin', { permLevel: 1 })
  $.addSubcommand('reward', 'coin', { permLevel: 1 })
  $.addSubcommand('max', 'coin', { permLevel: 1 })
}
