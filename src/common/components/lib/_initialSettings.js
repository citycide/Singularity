import { app, remote } from 'electron'
import path from 'path'

const DIR = path.resolve(`${(app ? app.getPath('home') : remote.require('electron').app.getPath('home'))}/singularity`)
const logPath = path.resolve(`${DIR}/logs`)
const serverPath = path.resolve(`${DIR}/server`)
const modulePath = path.resolve(`${DIR}/modules`)
const langFile = path.resolve(`${__dirname}/lang/en-US.json`)

export default {
  themeColor: '#03AFF9',
  nativeFrame: (process.platform !== 'win32'),
  setupComplete: false,
  clientID: '41i6e4g7i1snv0lz0mbnpr75e1hyp9p',
  dataPath: DIR,
  botLoggingPath: logPath,
  userServerPath: serverPath,
  userModulePath: modulePath,
  langFile
}
