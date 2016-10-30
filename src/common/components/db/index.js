import { app as local, remote } from 'electron'
import { argv } from 'yargs'
import { join } from 'path'
import Levers from 'levers'
import * as appDB from './app-data'
import * as botDB from './bot-data'

const isDev = argv.dev || process.env.NODE_ENV === 'dev'
const settings = new Levers('app')
const app = local || remote.app

function getDBPath (filename) {
  const devPath = join(app.getAppPath(), 'db')
  if (isDev) return join(devPath, filename)

  const defaultPath = join(settings.get('paths.data'), 'db')
  const dir = settings.get('paths.database', defaultPath)
  return join(dir, filename)
}

export async function initDB () {
  appDB.getInstance(getDBPath('singularity.db'))
  return appDB.initTables()
}

export function initBotDB () {
  botDB.getInstance(getDBPath('bot.db'))
}

export { appDB, botDB }
