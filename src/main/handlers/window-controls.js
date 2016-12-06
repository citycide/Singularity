import ipcMain from '../utils/ipc-main'
import * as wm from '../components/window-manager'

ipcMain.on('window:refresh', (e, windowID) => {
  wm.getByID(windowID).reload()
})

ipcMain.on('window:minimize', (e, windowID) => {
  wm.getByID(windowID).minimize()
})

ipcMain.on('window:maximize', (e, windowID) => {
  const window = wm.getByID(windowID)

  if (window.isMaximized()) {
    window.unmaximize()
  } else {
    window.maximize()
  }
})

ipcMain.on('window:close', (e, windowID) => {
  const window = wm.getByID(windowID)

  if (window) window.close()
})

const mainWindow = wm.get('main')

mainWindow.on('close', _ => {
  // TODO: implement tray + minimize to tray
})
