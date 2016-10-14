import { app as local, remote } from 'electron'
import { join } from 'path'

const app = local || remote.app

const DIR = join(app.getPath('appData'), 'singularity')
const appLogging = join(DIR, 'logs')
const botLogging = join(appLogging, 'bot')
const userServer = join(DIR, 'server')
const extensions = join(DIR, 'ext')
const translation = join(__dirname, 'lang', 'en-US.json')

export default {
  clientID: 'ejigh97i4w638sdoild5cvile1ajwim',
  setupComplete: false,
  paths: {
    data: DIR,
    appLogging,
    botLogging,
    userServer,
    extensions,
    languages: {
      current: translation,
      default: translation
    }
  }
}
