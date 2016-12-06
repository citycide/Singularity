import LoggerNeue from 'logger-neue'
import { app, remote } from 'electron'
import { argv } from 'yargs'
import { resolve } from 'path'

const isDev = argv.dev
const level = isDev ? 'trace' : 'error'

export default LoggerNeue.create({
  file: {
    level,
    path: resolve((app || remote.app).getPath('userData'), 'singularity.log')
  },
  console: { level },
  levels: {
    /* eslint-disable key-spacing */
    error:  [0, ['red', 'bold', 'underline']],
    warn:   [1, 'yellow'],
    info:   [2, 'magenta'],
    bot:    [2, 'magenta'],
    debug:  [3, 'cyan'],
    trace:  [4],
    absurd: [5, 'gray']
    /* eslint-enable key-spacing */
  }
})
