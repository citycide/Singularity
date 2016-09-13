import { app, BrowserWindow, screen } from 'electron'
import { argv } from 'yargs'
import Levers from 'levers'
import path from 'path'

import { initDB } from '../common/components/db'
import wm from './components/WindowManager'
import log from '../common/utils/logger'
import { initServices } from './services'
import defaults from './utils/initialSettings'

const cfg = {
  DEV: argv.development || argv.dev,
  devtools: argv.devtools,
  devtron: argv.devtron,
  vue: argv.vue
}

if (cfg.DEV) fixAppPaths()

const windows = new Levers('window')
const settings = new Levers('app', { defaults })

let mainWindow
function createWindow () {
  const obj = Object.assign({}, wm.windowDefaults, { frame: !cfg.DEV })

  mainWindow = new BrowserWindow(obj)
  global.mainAppWindow = mainWindow
  global.mainWindowID = wm.add(mainWindow, 'main')
  require('./components/lib/_persistAppState')
  require('./handlers/windowControls')

  const position = windows.get('position')
  let inBounds = false
  if (position) {
    screen.getAllDisplays().forEach(display => {
      if (position[0] >= display.workArea.x &&
        position[0] <= display.workArea.x + display.workArea.width &&
        position[1] >= display.workArea.y &&
        position[1] <= display.workArea.y + display.workArea.height) {
        inBounds = true
      }
    })
  }

  let size = windows.get('size')
  size = size || [1200, 800]

  mainWindow.setSize(...size)
  if (position && inBounds) {
    mainWindow.setPosition(...position)
  } else {
    mainWindow.center()
  }

  if (windows.get('maximized', false)) {
    mainWindow.maximize()
  }

  mainWindow.loadURL(path.join('file://', __dirname, '..', 'renderer/index.html'))
  mainWindow.once('ready-to-show', () => mainWindow.show())

  if (cfg.DEV) {
    const devTools = require('./utils/devtools').default
    devTools({ devtron: cfg.devtron, vue: cfg.vue })
    if (cfg.devtools) mainWindow.webContents.openDevTools()
  }

  mainWindow.on('closed', () => {
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

  await initDB({
    DEV: cfg.DEV,
    LOCATION: settings.get('databaseLocation', 'home')
  })

  initServices()

  app.on('ready', createWindow)

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow()
    }
  })

  app.on('before-quit', () => {
    log.info('Collapsing the singularity...')
  })
}())

function fixAppPaths () {
  app.setName('singularity')

  const appData = app.getPath('appData')
  app.setPath('userData', path.join(appData, 'singularity'))
}
