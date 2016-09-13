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

module.exports.quote = async event => {
  const param1 = event.args[1]
  const regex = /~(\w+)/g

  console.dir(event)

  if (!event.args.length) {
    $.say(event.sender, `Usage: !quote [add | remove | edit | help]`)
    return
  }

  if (event.subcommand === 'add') {
    if (event.args.length < 3) {
      $.say(event.sender, `Usage: !quote add Something really wise. [~username]`)
      return
    }

    const thisQuote = {
      submitter: event.sender
    }

    if (regex.test(event.subArgString)) {
      thisQuote.message = event.subArgString.replace(regex, '').replace(/"/g, '')
      thisQuote.credit = regex.exec(event.subArgString)[1]
    } else {
      thisQuote.message = event.subArgString.replace(/"/g, '')
    }

    const quoteID = await $.quote.add(thisQuote)

    if (quoteID) {
      $.say(event.sender, `Quote added as #${quoteID}`)
    } else {
      $.say(event.sender, `Failed to add quote.`)
    }

    return
  }

  if (event.subcommand === 'remove') {
    if (!isFinite(parseInt(param1)) || parseInt(param1) < 1) {
      $.say(event.sender, `Usage: !quote remove (number >/= 1)`)
      return
    }

    if ($.quote.remove(parseInt(param1))) {
      const count = await $.db.countRows('quotes')
      $.say(event.sender, `Quote removed. ${count} quotes remaining.`)
    } else {
      $.say(event.sender, `Failed to remove quote #${parseInt(param1)}.`)
    }

    return
  }

  if (event.subcommand === 'edit') {
    if (!isFinite(parseInt(param1)) || parseInt(param1) < 1) {
      $.say(event.sender, `Usage: !quote edit (number >/= 1) [message] [~username]`)
      return
    }

        // @TODO: allow for editing game & date somehow. separate command?

    const newQuote = {}

    if (regex.test(event.subArgString)) {
      newQuote.message = event.subArgs.slice(1).join(' ').replace(regex, '')
      newQuote.credit = regex.exec(event.subArgString)[1]
    } else {
      newQuote.message = event.subArgs.slice(1).join(' ')
    }

    if (await $.quote.modify(parseInt(param1), newQuote)) {
      $.say(event.sender, `Quote #${param1} modified.`)
    } else {
      $.say(event.sender, `Failed to edit quote #${param1}`)
    }

    return
  }

  if (event.subcommand === 'help') {
    $.say(event.sender, `To save a quote, use '!quote add Something really wise.' ` +
            `To credit who said it, add '~username' with no space.`)
    return
  }

  const id = parseInt(event.args[0])
  if (id) {
    if (!await $.db.exists('quotes', { id })) {
      $.say(event.sender, `Quote #${id} doesn't exist.`)
      return
    }

    const quote = await $.quote.get(id)
    const game = quote.game ? ` - ${quote.game}` : ''

    $.shout(`"${quote.message}" - ${quote.credit} (${quote.date}${game})`)
  } else {
    $.say(`Usage: !quote [add | remove | edit | help]`)
  }
}

;(() => {
  $.addCommand('quote', {
    cooldown: 60,
    status: true
  })

  $.addSubcommand('add', 'quote', { status: true })
  $.addSubcommand('remove', 'quote', { permLevel: 0, status: true })
  $.addSubcommand('edit', 'quote', { permLevel: 0, status: true })
  $.addSubcommand('help', 'quote', { status: true })
})()
