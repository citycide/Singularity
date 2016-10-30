import moment from 'moment'

async function add (quote) {
  if (!$.is.object(quote) || !('message' in quote)) return false

  const obj = Object.assign({}, {
    credit: $.channel.name,
    submitter: '',
    date: moment().format('L'),
    game: $.stream.game || ''
  }, quote)

  await $.db.set('quotes', {
    message: sanitizeText(obj.message),
    credit: obj.credit,
    submitter: obj.submitter,
    date: obj.date,
    game: obj.game
  })

  const res = await $.db.getRow('quotes', obj)
  return res ? res.id : false
}

async function get (id) {
  if (!$.is.number(id)) return false

  const res = await $.db.getRow('quotes', { id })
  return $.is.object(res) ? res : null
}

async function remove (id) {
  if (!$.is.number(id)) return false

  await $.db.del('quotes', { id })
  return !$.db.exists('quotes', { id })
}

async function modify (id, newData) {
  if (!$.is.number(id) || !$.is.object(newData)) return false

  await $.db.set('quotes', newData, { id })
  return $.db.exists('quotes', { id })
}

function sanitizeText (str) {
  // remove surrounding double quotes
  // @DEV: if this pattern has issues try this one:
  // /^"(.+(?="$))"$/g
  const match = str.match(/^"(.*)"$/g)
  return match ? str.replace(/^"(.*)"$/g, '$1') : str
}

export default async function ($) {
  $.quote = {
    add,
    get,
    modify,
    remove
  }

  await $.db.addTableCustom('quotes', [
    { name: 'id', type: 'integer', primary: true, increments: true },
    'message', 'credit', 'submitter', 'date', 'game'
  ])
}
