import jetpack from 'fs-jetpack'
import Levers from 'levers'
import path from 'path'
import os from 'os'

const settings = new Levers('app')

export function read (file, json) {
  if (!file) return false
  return jetpack.read(sanitize(file), json ? 'json' : undefined)
}

export function write (file, data, append) {
  if (!file) return false

  if (append) {
    jetpack.append(sanitize(file), data + os.EOL)
  } else {
    jetpack.write(sanitize(file), data)
  }
}

export function exists (file) {
  if (!file) return false
  return jetpack.exists(sanitize(file)) === 'file'
}

export function isDirectory (file) {
  if (!file) return false
  return jetpack.exists(sanitize(file)) === 'dir'
}

function sanitize (file) {
  if (!file.endsWith('.txt')) file += '.txt'
  if (file.startsWith('/')) file = file.slice(1)
  return path.join(settings.get('paths.botLogging'), file)
}

$.file = {
  read,
  write,
  exists,
  isDirectory
}
