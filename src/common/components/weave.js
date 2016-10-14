import _ from 'lodash'
import path from 'path'
import Levers from 'levers'
import jetpack from 'fs-jetpack'
import format from 'string-format'
import { app, remote } from 'electron'
import log from 'common/utils/logger'
import callsites from 'callsites'
import { sync as find } from 'find-up'

const settings = new Levers('app')
const EXISTING_FILE = 'Cannot overwrite existing language file.'
const MISSING_FILE = 'Language file not found.'
const MISSING_STRING = 'Unknown language string.'

const directory = {
  'en-029': 'en-US',
  'en-AU': 'en-US',
  'en-BZ': 'en-US',
  'en-CA': 'en-US',
  'en-GB': 'en-US',
  'en-IE': 'en-US',
  'en-IN': 'en-US',
  'en-JM': 'en-US',
  'en-MY': 'en-US',
  'en-NZ': 'en-US',
  'en-PH': 'en-US',
  'en-SG': 'en-US',
  'en-TT': 'en-US',
  'en-ZA': 'en-US',
  'en-ZW': 'en-US'
}

const getLocale = () => (app || remote.app).getLocale()

function getPath () {
  const defaultPath = path.dirname(settings.get('paths.languages.default'))
  const locale = directory[getLocale()] || getLocale() || 'en-US'

  const current = settings.get('paths.languages.current')

  if (jetpack.exists(current) !== 'file') {
    const fallback = path.resolve(defaultPath, `${locale}.json`)
    if (jetpack.exists(fallback) !== 'file') {
      throw new Error(MISSING_FILE)
    } else {
      return fallback
    }
  } else {
    return current
  }
}

const readData = () => jetpack.read(getPath(), 'json') || {}
const writeData = data => jetpack.write(getPath(), data)

let coreLang = readData()
let extLang = {}

function weave (key, ...replacements) {
  const str = _.get(extLang, getKeyPath(callsites(), key))
  if (!str) return MISSING_STRING
  return format(str, ...replacements)
}

weave.core = function (key, ...replacements) {
  const keyPath = _.toPath(key)
  const str = _.get(coreLang, ['bot', 'core', ...keyPath])
  if (!str) return MISSING_STRING
  return format(str, ...replacements)
}

weave.set = function (key, str) {
  if (arguments.length < 2 || !_.isString(key) || !_.isString(str)) {
    return false
  }

  _.set(extLang, getKeyPath(callsites(), key), str)
  return true
}

weave.fork = function (toFile) {
  const outFile = sanitizeFileName(toFile)
  const outPath = path.resolve(settings.get('paths.data'), outFile)

  if (jetpack.exists(outPath) === 'file') {
    log.error(EXISTING_FILE)
    return
  }

  jetpack.copy(getPath(), outPath)
  settings.set('paths.languages.current', outPath)
  coreLang = readData()
}

function sanitizeFileName (input) {
  // TODO
  return input
}

function getKeyPath (callsite, key) {
  const caller = callsite[1].getFileName()
  const manifest = find('ext.json', { cwd: path.dirname(caller) })
  const { name: extName } = jetpack.read(manifest, 'json') || { name: '' }
  const keyPath = _.toPath(key)
  return [extName, ...keyPath]
}

export default weave
