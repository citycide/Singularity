import strat from 'strat'
import { read } from 'fs-jetpack'
import { escapeRegExp } from 'lodash'
import { isAbsolute, relative, resolve } from 'path'

import { reduce, toObject } from 'common/utils/helpers'

async function params (event, text, tags) {
  if (!$.is.object(event) || !hasTags(text)) return text

  const tagMap = Object.assign({}, toObject(getTags(text)), event, tags)
  const replacements = await getReplacements(tagMap)
  return strat(text, replacements)
}

async function getReplacements (tags) {
  return reduce(Object.keys(tags), async (p, c) => {
    const replacement = await (async () => {
      switch (c) {
        case 'sender':
          return tags.sender
        case '@sender':
          return '@' + tags.sender
        case 'random':
          return $.to.random($.user.list) || $.channel.name
        case 'pointname':
          return $.points.getName()
        case '#':
          return $.to.random(100)
        case 'uptime':
          return $.stream.uptime
        case 'game':
          return $.stream.game || 'this game'
        case 'status':
          return $.stream.status
        case 'echo':
          return tags.argString
        case 'price':
          return $.command.getPrice(tags.command, tags.subcommand)
        case 'target':
          return tags.target
        case 'readfile':
          return file => read(resolvePath(file))
        case 'count':
        case 'followers':
        default:
          return
      }
    })()

    return Object.assign({}, p, { [c]: replacement })
  }, {})
}

const tagList = [
  `{age}`,
  `{sender}`,
  `{@sender}`,
  `{random}`,
  `{count}`,
  `{pointname}`,
  `{price}`,
  `{#}`,
  `{uptime}`,
  `{followers}`,
  `{game}`,
  `{status}`,
  `{target}`,
  `{echo}`,
  `{readfile `
]
const escapedTags = tagList.map(escapeRegExp)

function getTags (str) {
  return str.match(/[^{}]+(?=})/g)
}

function hasTags (str) {
  return escapedTags.some(v => v.test(str))
}

function resolvePath (path) {
  let abs = isAbsolute(path) ? path : ''
  let rel = abs ? relative(__dirname, abs) : path
  return resolve(__dirname, rel)
}

export default params

$.params = params
