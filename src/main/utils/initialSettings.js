import { app, remote } from 'electron'
import path from 'path'

const src = app || remote.app

const DIR = path.resolve(`${src.getPath('home')}/singularity`)
const appLoggingPath = path.resolve(`${DIR}/logs`)
const botLoggingPath = path.resolve(appLoggingPath, 'bot')
const userServerPath = path.resolve(`${DIR}/server`)
const userModulePath = path.resolve(`${DIR}/modules`)
const langFile = path.resolve(`${__dirname}/lang/en-US.json`)

export default {
  clientID: 'ejigh97i4w638sdoild5cvile1ajwim',
  nativeFrame: (process.platform !== 'win32'),
  setupComplete: false,
  dataPath: DIR,
  appLoggingPath,
  userServerPath,
  userModulePath,
  botLoggingPath,
  langFile
}
