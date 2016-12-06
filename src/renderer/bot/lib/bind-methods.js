import { map, merge } from 'lodash'
import bot from './bot-methods'
import command from './command-methods'
import db from './db-methods'
import user from './user-methods'
import util from './util-methods'

export default function (core, ctx) {
  const arr = map([
    bot,
    command,
    db,
    user,
    util
  ], v => v(core, ctx))

  return merge(core, ...arr)
}
