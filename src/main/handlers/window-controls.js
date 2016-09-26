import ipcMain from '../utils/ipc-main'
import wm from '../components/window-manager'

ipcMain.on('window:refresh', (e, windowID) => {
  wm.getByInternalID(windowID).reload()
})

ipcMain.on('window:minimize', (e, windowID) => {
  wm.getByInternalID(windowID).minimize()
})

ipcMain.on('window:maximize', (e, windowID) => {
  const window = wm.getByInternalID(windowID)

  if (window.isMaximized()) {
    window.unmaximize()
  } else {
    window.maximize()
  }
})

ipcMain.on('window:close', (e, windowID) => {
  const window = wm.getByInternalID(windowID)

  if (window) window.close()
})

const mainWindow = wm.getAll('main')[0]

mainWindow.on('close', e => {
  // TODO: implement tray + minimize to tray
})
