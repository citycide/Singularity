/**
 * couch - lets users find random amounts of currency
 *
 * @command couch
 * @usage !couch
 *
 * @source stock module
 * @author citycide
 */

export async function couch (e, $) {
  const multi = await $.db.getModuleConfig('couch', 'multiplier', 1)
  const num = $.to.random(1000)
  let payout = 0

  if (!e.args.length) {
    if (num <= 500) {
      payout = $.to.random(3) * multi
    }

    if (num > 500 && num <= 750) {
      payout = $.to.random(6) * multi
    }

    if (num > 750 && num <= 920) {
      payout = $.to.random(3, 9) * multi
    }

    if (num > 920 && num <= 990) {
      payout = $.to.random(6, 18) * multi
    }

    if (num > 990 && num <= 1000) {
      payout = $.to.random(22, 100) * multi
    }

    if (payout === 0) {
      $.say(e.sender, `You didn't find any ${await $.points.getName()} in the couch this time.`)
    } else {
      await $.points.add(e.sender, payout)
      $.say(e.sender, `You found ${await $.points.str(payout)} in the couch.`)
    }

    return
  }

  if ($.is(e.subcommand, 'multi')) {
    if (!e.subArgs[0] || !$.is.numeric(e.subArgs[0])) {
      $.say(e.sender, `Usage: !couch multi (multiplier) » currently set to ${multi}`)
      return
    }

    const newMulti = $.to.number(e.subArgs[0])

    await $.db.setModuleConfig('couch', 'multiplier', newMulti)
    $.say(e.sender, `!couch multiplier set to ${newMulti}`)
  }
}

export default function ($) {
  $.addCommand('couch', {
    cooldown: 300
  })

  $.addSubcommand('multi', 'couch', { permLevel: 1 })
}