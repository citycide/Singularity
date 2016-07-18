import { app, remote } from 'electron'
import winston from 'winston'
import path from 'path'
import Settings from '../components/Settings'

const settings = new Settings('app', { useDefaults: true })

function initLogger () {
  const defaultSettings = {
    fileLevel: 'info',
    consoleLevel: settings.get('devMode', false) ? 'trace' : 'error',
    levels: {
      error: 0,
      warn: 1,
      info: 2,
      sys: 2,
      bot: 2,
      debug: 3,
      trace: 4,
      absurd: 5
    },
    colors: {
      error: 'red',
      warn: 'yellow',
      info: 'magenta',
      sys: 'magenta',
      bot: 'green',
      debug: 'cyan',
      trace: 'white',
      absurd: 'grey'
    }
  }

  let logPath
  if (process.type === 'renderer') {
    logPath = path.resolve(remote.app.getPath('userData'), 'singularity.log')
  } else if (process.type === 'browser') {
    logPath = path.resolve(app.getPath('userData'), 'singularity.log')
  } else {
    console.log('Unknown environment, logger will not be available.')
    return {}
  }

  const Logger = new (winston.Logger)({
    transports: [
      new (winston.transports.File)({
        filename: logPath,
        level: defaultSettings.fileLevel,
        maxsize: 5000000,
        maxfiles: 2
      }),
      new (winston.transports.Console)({
        level: defaultSettings.consoleLevel,
        prettyPrint: true,
        colorize: true
      })
    ]
  })

  Logger.setLevels(defaultSettings.levels)
  winston.addColors(defaultSettings.colors)

  // Replace the log level with those from settings.
  Logger.transports.console.level = settings.get('consoleLogLevel', defaultSettings.consoleLevel)
  Logger.transports.file.level = settings.get('fileLogLevel', defaultSettings.fileLevel)

  return Logger
}

export default initLogger()
