import jetpack from 'fs-jetpack'
import Levers from 'levers'
import path from 'path'
import os from 'os'

const settings = new Levers('app')

const file = {
  read (file, json) {
    if (!file) return
    return jetpack.read(sanitize(file), json ? 'json' : undefined)
  },
  write (file, data, append) {
    if (!file) return

    if (append) {
      data += os.EOL
      jetpack.append(sanitize(file), data)
    } else {
      jetpack.write(sanitize(file), data)
    }
  },
  exists (file) {
    if (!file) return
    return jetpack.exists(sanitize(file))
  }
}

function sanitize (file) {
  if (!file.endsWith('.txt')) file += '.txt'
  if (file.startsWith('/')) file = file.slice(1)
  return path.resolve(settings.get('botLoggingPath'), file)
}

export default file

$.file = file
