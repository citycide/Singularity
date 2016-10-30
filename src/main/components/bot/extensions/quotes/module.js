/**
 * Quotes - add & manage quotes
 *
 * @command quote
 * @usage !quote [subcommands]
 *
 * @source stock module
 * @author citycide
 */

export async function quote (e, $) {
  const param1 = e.args[1]
  const parsed = parseInt(param1)
  const regex = /~(\w+)/g

  if (!e.args.length) {
    $.say(e.sender, $.weave('usage'))
    return
  }

  if ($.is(e.subcommand, 'add')) {
    if (e.args.length < 3) {
      $.say(e.sender, $.weave('add.usage'))
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
      $.say(e.sender, $.weave('add.succes', quoteID))
    } else {
      $.say(e.sender, $.weave('add.failure'))
    }

    return
  }

  if ($.is(e.subcommand, 'remove')) {
    if (!$.is.number(parsed) || parsed < 1) {
      $.say(e.sender, $.weave('remove.usage'))
      return
    }

    if (await $.quote.remove(parsed)) {
      const count = await $.db.countRows('quotes')
      $.say(e.sender, $.weave('remove.success', count))
    } else {
      $.say(e.sender, $.weave('remove.failure', param1))
    }

    return
  }

  if ($.is(e.subcommand, 'edit')) {
    if (!$.is.number(parsed) || parsed < 1) {
      $.say(e.sender, $.weave('edit.usage'))
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

    if (await $.quote.modify(parsed, newQuote)) {
      $.say(e.sender, $.weave('edit.success', param1))
    } else {
      $.say(e.sender, $.weave('edit.failure', param1))
    }

    return
  }

  if ($.is(e.subcommand, 'help')) {
    $.say(e.sender, $.weave('help'))
    return
  }

  const id = parseInt(e.args[0])
  if (id) {
    if (!await $.db.exists('quotes', { id })) {
      $.say(e.sender, $.weave('response.not-found', id))
      return
    }

    const quote = await $.quote.get(id)
    const game = quote.game ? ` - ${quote.game}` : ''
    $.shout($.weave('response', quote.message, quote.credit, quote.date, game))
  } else {
    $.say(e.sender, $.weave('usage'))
  }
}

export default function ($) {
  $.addCommand('quote', { cooldown: 60 })

  $.addSubcommand('help', 'quote')
  $.addSubcommand('add', 'quote')
  $.addSubcommand('remove', 'quote', { permLevel: 1 })
  $.addSubcommand('edit', 'quote', { permLevel: 1 })
}
