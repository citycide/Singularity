import { app, dialog } from 'electron'
import { argv } from 'yargs'
import Levers from 'levers'
import path from 'path'

import './components/state'
import log from '../common/utils/logger'
import * as wm from './components/window-manager'
import { initDB } from '../common/components/db'
import { initServices } from './services'

process.on('uncaughtException', errorHandler)
process.on('unhandledRejection', errorHandler)

const cfg = {
  DEV: argv.dev,
  devtools: argv.devtools,
  devtron: argv.devtron,
  vue: argv.vue
}

Levers.create('app', {
  defaults: require('./utils/initial-settings').default
})

if (cfg.DEV) {
  process.env.NODE_ENV = 'dev'
  fixAppPaths()
}

let mainWindow
function createWindows () {
  let splash = wm.createSplash()
  mainWindow = wm.createMain()

  require('./components/lib/persist-app-state')
  require('./handlers')

  function start () {
    splash.destroy()
    mainWindow.show()
  }

  mainWindow.on('ready-to-show', () => {
    // this is gross, but it prevents seeing a white window
    setTimeout(start, 1000)
  })

  if (cfg.DEV) {
    const devTools = require('./utils/devtools').default
    devTools({ devtron: cfg.devtron, vue: cfg.vue })
    if (cfg.devtools) mainWindow.webContents.openDevTools()
  }

  mainWindow.on('closed', () => {
    /**
     * If the 'close to tray' option is enabled,
     * this event won't fire until the user explicitly
     * exits the app through the tray icon.
     */
    wm.close('bot')
    mainWindow = null
  })
}

;(async function () {
  const shouldQuit = app.makeSingleInstance(() => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
      mainWindow.show()
      mainWindow.setSkipTaskbar(false)
      if (app.dock && app.dock.show) app.dock.show()
    }
  })

  if (shouldQuit) {
    app.quit()
    return
  }

  log.info('Starting singularity...')

  await initDB()

  app.on('ready', () => {
    initServices()
    createWindows()
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindows()
    }
  })

  app.on('before-quit', () => {
    // gracefully close connections & shut down services
    log.info('Collapsing the singularity...')
  })
}())

function fixAppPaths () {
  app.setName('singularity')

  const appData = app.getPath('appData')
  app.setPath('userData', path.join(appData, 'singularity'))
}

function errorHandler (e, p) {
  log.error(p, e)

  dialog.showErrorBox(
    p ? 'Unhandled Promise Rejection' : 'Uncaught Exception',
    e.stack
  )

  app.quit()
}
