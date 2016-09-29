/**
 * Just a simple in-memory store for caching data
 *
 * Automatically namespaced to the calling file.
 *
 * Use this for storing things during sessions,
 * rather than storing them in the chat module
 * and such. This is because the require.cache
 * is cleared for extension modules every time
 * they are loaded in order to hot-reload changes.
 *
 * @example
 * // in an extension module
 * $.cache.set('trackedUsers', ['citycide'])
 * const users = $.cache.get('trackedUsers')
 *
 * users.forEach(user => console.log(user))
 * // -> 'citycide'
 */

import _ from 'lodash'
import callsites from 'callsites'
import { basename, dirname } from 'path'

const cache = {
  storage: {},

  get (key, defaultValue) {
    const space = getCaller(callsites())
    return this.getSpace(space, key, defaultValue)
  },

  set (key, value) {
    const space = getCaller(callsites())
    return this.setSpace(space, key, value)
  },

  push (target, value) {
    const space = getCaller(callsites())
    return this.pushSpace(space, target, value)
  },

  has (key) {
    const space = getCaller(callsites())
    return this.hasSpace(space, key)
  },

  getSpace (space, key, defaultValue) {
    const path = _.toPath(key)
    const value = _.get(this.storage, [space, ...path])
    return _.isNil(value) ? defaultValue : value
  },

  setSpace (space, key, value) {
    const path = _.toPath(key)
    _.set(this.storage, [space, ...path], value)
    return _.get(this.storage, [space, ...path])
  },

  pushSpace (space, target, value) {
    const path = _.toPath(target)
    const arr = _.get(this.storage, [space, ...path], [])
    arr.push(value)
    _.set(this.storage, [space, ...path], arr)
    return _.get(this.storage, [space, ...path])
  },

  hasSpace (space, key) {
    const path = _.toPath(key)
    return _.has(this.storage, [space, ...path])
  }
}

function getCaller (callsite) {
  const caller = callsite[1].getFileName()
  const parent = basename(dirname(caller))
  return `${parent}/${basename(callsite[1].getFileName())}`
}

$.cache = cache
