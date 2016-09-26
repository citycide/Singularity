/**
 * Quotes - add & manage quotes
 *
 * @command quote
 * @usage !quote [subcommands]
 * @param {object} event
 *
 * @source stock module
 * @author citycide
 */

import { isFinite } from 'lodash'

export async function quote (e, $) {
  const param1 = e.args[1]
  const regex = /~(\w+)/g

  if (!e.args.length) {
    $.say(e.sender, `Usage: !quote [add | remove | edit | help]`)
    return
  }

  if (e.subcommand === 'add') {
    if (e.args.length < 3) {
      $.say(e.sender, `Usage: !quote add Something really wise. [~username]`)
      return
    }

    const thisQuote = {
      submitter: e.sender
    }

    if (regex.test(e.subArgString)) {
      thisQuote.message = e.subArgString.replace(regex, '').replace(/"/g, '')
      thisQuote.credit = regex.exec(e.subArgString)[1]
    } else {
      thisQuote.message = e.subArgString.replace(/"/g, '')
    }

    const quoteID = await $.quote.add(thisQuote)

    if (quoteID) {
      $.say(e.sender, `Quote added as #${quoteID}`)
    } else {
      $.say(e.sender, `Failed to add quote.`)
    }

    return
  }

  if (e.subcommand === 'remove') {
    if (!isFinite(parseInt(param1)) || parseInt(param1) < 1) {
      $.say(e.sender, `Usage: !quote remove (number >/= 1)`)
      return
    }

    if ($.quote.remove(parseInt(param1))) {
      const count = await $.db.countRows('quotes')
      $.say(e.sender, `Quote removed. ${count} quotes remaining.`)
    } else {
      $.say(e.sender, `Failed to remove quote #${parseInt(param1)}.`)
    }

    return
  }

  if (e.subcommand === 'edit') {
    if (!isFinite(parseInt(param1)) || parseInt(param1) < 1) {
      $.say(e.sender, `Usage: !quote edit (number >/= 1) [message] [~username]`)
      return
    }

    // @TODO: allow for editing game & date somehow. separate command?

    const newQuote = {}

    if (regex.test(e.subArgString)) {
      newQuote.message = e.subArgs.slice(1).join(' ').replace(regex, '')
      newQuote.credit = regex.exec(e.subArgString)[1]
    } else {
      newQuote.message = e.subArgs.slice(1).join(' ')
    }

    if (await $.quote.modify(parseInt(param1), newQuote)) {
      $.say(e.sender, `Quote #${param1} modified.`)
    } else {
      $.say(e.sender, `Failed to edit quote #${param1}`)
    }

    return
  }

  if (e.subcommand === 'help') {
    $.say(e.sender, `To save a quote, use '!quote add Something really wise.' ` +
            `To credit who said it, add '~username' with no space.`)
    return
  }

  const id = parseInt(e.args[0])
  if (id) {
    if (!await $.db.exists('quotes', { id })) {
      $.say(e.sender, `Quote #${id} doesn't exist.`)
      return
    }

    const quote = await $.quote.get(id)
    const game = quote.game ? ` - ${quote.game}` : ''

    $.shout(`"${quote.message}" - ${quote.credit} (${quote.date}${game})`)
  } else {
    $.say(`Usage: !quote [add | remove | edit | help]`)
  }
}

export default function ($) {
  $.addCommand('quote', {
    cooldown: 60,
    status: true
  })

  $.addSubcommand('add', 'quote', { status: true })
  $.addSubcommand('remove', 'quote', { permLevel: 0, status: true })
  $.addSubcommand('edit', 'quote', { permLevel: 0, status: true })
  $.addSubcommand('help', 'quote', { status: true })
}
