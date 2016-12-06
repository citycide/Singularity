import { ipcMain } from 'electron'
import * as wm from '../components/window-manager'

function send (window, event, ...args) {
  if (window.webContents.isLoading()) {
    let once = false
    window.webContents.on('did-stop-loading', () => {
      if (!once) {
        once = true
        send(window, event, ...args)
      }
    })
  } else {
    window.webContents.send(event, ...args)
  }
}

class Emitter {
  on (channel, fn) {
    ipcMain.on(channel, fn)
  }

  once (channel, fn) {
    ipcMain.once(channel, fn)
  }

  sendToWindow (windowName, event, ...args) {
    const window = wm.get(windowName)
    if (window) {
      send(window, event, ...args)
    }
  }

  sendToAll (event, ...args) {
    for (let [_, { window }] of wm.getAll()) {
      if (window) {
        send(window, event, ...args)
      }
    }
  }

  executeOnWindow (windowName, fn, ...args) {
    let exec = `(${fn.toString()}).apply(window, ${JSON.stringify(args)})`
    this.sendToWindow(windowName, 'execute', {
      fn: exec
    })
  }
}

export default new Emitter()
