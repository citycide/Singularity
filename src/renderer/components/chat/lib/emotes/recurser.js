import { escapeRegExp } from 'lodash'

/**
 * @param {object} o - the current node in the tree
 * @param {number} i - index of the node in the tree array
 * @param {object} e - the emote id for building the url
 * @param {string} k - the emote string to search for
 * @param {string} provider - emote provider, for building URLs
 */
export default function recurse (o, i, e, k, provider) {
  const regex = new RegExp(escapeRegExp(k), 'g')
  const found = o.value.search(regex)

  if (found < 0) {
    // no match found
    return [[]]
  } else if (found === 0) {
    if (found + k.length === o.value.length) {
      // the match is the entire string
      return [[{
        raw: k,
        type: 'emote',
        value: makeURL(provider, e)
      }], i, 1]
    } else {
      // there's something after the match but not before
      const after = o.value.slice(found + k.length)
      let afterTree = [{ type: 'text', value: after }]

      if (regex.test(after)) {
        [afterTree] = recurse({ type: 'text', value: after }, i, e, k, provider)
      }

      return [[{
        raw: k,
        type: 'emote',
        value: o.value.slice(found, found + k.length)
      }, ...afterTree], i, 1]
    }
  } else {
    if (found + k.length < o.value.length) {
      // there's something before & after the match
      const before = o.value.slice(0, found - 1)
      const emote = o.value.slice(found, found + k.length)
      const after = o.value.slice(found + k.length)
      let afterTree = [{ type: 'text', value: after }]

      if (regex.test(after)) {
        [afterTree] = recurse({ type: 'text', value: after }, i, e, k, provider)
      }

      return [[
        { type: 'text', value: before },
        { raw: emote, type: 'emote', value: makeURL(provider, e) },
        ...afterTree
      ], i, 1]
    } else {
      // there's nothing after the match
      const before = o.value.slice(0, found - 1)
      const emote = o.value.slice(found)

      return [[
        { type: 'text', value: before },
        { raw: emote, type: 'emote', value: makeURL(provider, e) }
      ], i, 1]
    }
  }
}

function makeURL (provider, id) {
  switch (provider) {
    case 'bttv': return `https://cdn.betterttv.net/emote/${id}/1x`
    case 'ffz': return id
    default: return ''
  }
}
