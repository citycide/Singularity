/**
 * coin - bet currency on the outcome of a coin flip
 *
 * @command coin
 * @usage !coin [amount]
 * @param {object} event
 *
 * @source stock module
 * @author citycide
 */

module.exports.coin = async event => {
  if (!event.args.length) {
    $.say(event.sender, `Usage: !coin (bet amount)`)
    return
  }

  const risk = await $.db.getModuleConfig('coin', 'risk', 1)
  const reward = await $.db.getModuleConfig('coin', 'reward', 1)
  const maxBet = await $.db.getModuleConfig('coin', 'maxBet', 50)

  if ($.util.str.isNumeric(event.args[0])) {
    const betAmount = parseInt(event.args[0])
    const userPoints = await $.points.get(event.sender)

    if (betAmount > maxBet) {
      $.say(event.sender, `The max bet for !coin is ${await $.points.str(maxBet)}.
        Try again with a smaller bet.`)
      return
    }

    if (betAmount > userPoints * risk) {
      $.say(event.sender, `You don't have enough ${await $.points.getName()} FeelsBadMan
        (${await $.points.get(event.sender, true)} available, risk multiplier of ${risk})`)
      return
    }

    const result = $.util.num.random(1000) < 500

    if (result) {
      const result = betAmount * reward
      await $.points.add(event.sender, result)
      $.say(event.sender, `You won ${await $.points.str(result)} from the coin flip! PogChamp`)
    } else {
      const result = betAmount * risk
      await $.points.sub(event.sender, result)
      $.say(event.sender, `You lost ${await $.points.str(result)} from the coin flip! BibleThump`)
    }

    return
  }

  if (event.subcommand === 'risk') {
    if (!event.subArgs[0] || !$.util.str.isNumeric(event.subArgs[0])) {
      $.say(event.sender, `Usage: !coin risk (multiplier) » currently set to ${risk}`)
      return
    }

    const newRisk = $.util.val.toNumber(event.subArgs[0])
    await $.db.setModuleConfig('coin', 'risk', newRisk)

    $.say(event.sender, `Risk multiplier for !coin updated to ${await $.points.str(newRisk)}.`)

    return
  }

  if (event.subcommand === 'reward') {
    if (!event.subArgs[0] || !$.util.str.isNumeric(event.subArgs[0])) {
      $.say(event.sender, `Usage: !coin reward (multiplier) » currently set to ${reward}`)
      return
    }

    const newReward = $.util.val.toNumber(event.subArgs[0])
    await $.db.setModuleConfig('coin', 'reward', newReward)

    $.say(event.sender, `Reward multiplier for !coin updated to ${$.points.str(newReward)}.`)

    return
  }

  if (event.subcommand === 'max') {
    if (!event.subArgs[0] || !$.util.str.isNumeric(event.subArgs[0])) {
      $.say(event.sender, `Usage: !coin max (number) » currently set to ${maxBet}`)
      return
    }

    const newMax = $.util.val.toNumber(event.subArgs[0], true)
    await $.db.setModuleConfig('coin', 'maxBet', newMax)

    $.say(event.sender, `Max bet for !coin updated to ${await $.points.str(newMax)}.`)
  }
}

;(() => {
  $.addCommand('coin', {
    cooldown: 60,
    status: true
  })

  $.addSubcommand('risk', 'coin', { permLevel: 0, status: true })
  $.addSubcommand('reward', 'coin', { permLevel: 0, status: true })
  $.addSubcommand('max', 'coin', { permLevel: 0, status: true })
})()
