import { ipcMain } from 'electron'
import _ from 'lodash'
import wm from 'main/components/WindowManager'

class Emitter {
  on (channel, fn) {
    ipcMain.on(channel, fn)
  }

  once (channel, fn) {
    ipcMain.once(channel, fn)
  }

  _send (window, event, details) {
    if (window.webContents.isLoading()) {
      let once = false
      window.webContents.on('did-stop-loading', () => {
        if (!once) {
          once = true
          this._send(window, event, details)
        }
      })
    } else {
      window.webContents.send(event, details)
    }
  }

  sendToWindow (windowID, event, details) {
    const window = wm.get(windowID)
    if (window) {
      this._send(window, event, details)
    }
  }

  sendToWindowsOfName (name, event, details) {
    const windows = wm.getAll(name)
    _.forEach(windows, window => {
      if (window) {
        this._send(window, event, details)
      }
    })
  }

  sendToAll (event, details) {
    _.forIn(wm.IDMap, (index, ID) => {
      const window = wm.getByInternalID(ID)
      if (window) {
        this._send(window, event, details)
      }
    })
  }

  sendToGooglePlayMusic (event, details) {
    this.sendToWindowsOfName('main', 'passthrough', {
      event,
      details
    })
  }

  executeOnWindow (windowID, fn) {
    let fnString = fn.toString()
    fnString = `(${fnString}).apply(window, ` +
      JSON.stringify(Array.prototype.slice.call(arguments, 2)) + ')'
    this.sendToWindow(windowID, 'execute', {
      fn: fnString
    })
  }
}

export default new Emitter()
