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
      jetpack.append(sanitize(file), data + os.EOL)
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
  return path.join(settings.get('paths.botLogging'), file)
}

export default file

$.file = file
