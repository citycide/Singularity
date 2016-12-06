import { app, Menu, Tray, shell } from 'electron'
import { get, set } from 'lodash'
import { resolve } from 'path'
import Levers from 'levers'
import store from '../components/state'
import * as wm from '../components/window-manager'

const settings = new Levers('app')
const IS_WIN_32 = process.platform === 'win32'

const getMainWindow = () => wm.get('main')

if (settings.get('behavior.closeToTray', false)) {
  let window = getMainWindow()

  if (window) {
    window.on('close', event => {
      event.preventDefault()
      toggleWindow(window)
    })
  }
}

;(function setupTray () {
  const tray = new Tray(
    resolve(__dirname, '../assets', `icon.${IS_WIN_32 ? 'ico' : 'png'}`)
  )

  // prevent garbage collection
  global.tray = tray

  tray.setToolTip('singularity')
  tray.setContextMenu(buildMenu())

  switch (process.platform) {
    case 'darwin':
      break
    case 'linux':
    case 'freebsd':
    case 'sunos':
      tray.on('click', () => toggleWindow(getMainWindow()))
      break
    case 'win32':
      tray.on('double-click', () => toggleWindow(getMainWindow()))
      break
  }
})()

function buildMenu () {
  return Menu.buildFromTemplate([{
    // TODO: figure out how to make this dynamic
    // label: getWindowState() ? 'Show' : 'Hide',
    label: 'Show or Hide',
    click: () => toggleWindow(getMainWindow())
  }, {
    label: 'Help',
    role: 'help',
    submenu: [{
      label: 'Issues',
      click: () => shell.openExternal('https://github.com/citycide/singularity/issues')
    }, {
      label: 'Learn More',
      click: () => shell.openExternal('https://github.com/citycide/singularity')
    }]
  }, {
    type: 'separator'
  }, {
    label: 'Exit',
    click: () => app.quit()
  }])
}

function toggleWindow (window) {
  if (!window) return

  if (!getWindowState()) {
    window.setSkipTaskbar(false)
    window.show()

    if (get(store.state, 'windows.main.maximized', false)) {
      window.maximize()
    }
  } else {
    store.modifyState(state => {
      set(state, 'windows.main.maximized', window.isMaximized())
    })

    window.minimize()
    window.setSkipTaskbar(true)
  }
}

function getWindowState () {
  let window = getMainWindow()
  return !(window.isMinimized() || !window.isVisible())
}
