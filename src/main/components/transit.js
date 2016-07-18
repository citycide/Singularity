import { EventEmitter } from 'events'
import ipcMain from '../utils/ipcMain'

class Transit extends EventEmitter {
  on (channel, fn, bus = false) {
    switch (bus) {
      case true:
        super.on(channel, fn)
        ipcMain.on(channel, fn)
        break
      case false:
        super.on(channel, fn)
        break
      case 'ipc':
      default:
        ipcMain.on(channel, fn)
    }
  }

  once (channel, fn, bus = false) {
    switch (bus) {
      case true:
        super.once(channel, fn)
        ipcMain.once(channel, fn)
        break
      case false:
        super.once(channel, fn)
        break
      case 'ipc':
      default:
        ipcMain.once(channel, fn)
    }
  }

  emit (channel, data, bus = false) {
    switch (bus) {
      case true:
        super.emit(channel, data)
        ipcMain.sendToAll(channel, data)
        break
      case false:
        super.emit(channel, data)
        break
      case 'ipc':
      default:
        ipcMain.sendToAll(channel, data)
    }
  }

  /**
   * Wraps around ipcMain to send data to renderer
   * @param {string} channel
   * @param {*} [data]
   * @param {boolean} [emit=false] whether to also emit over EventEmitter
   */
  fire (channel, data, emit = false) {
    ipcMain.sendToAll(channel, data)
    if (emit) this.emit(channel, data)
  }

  /**
   * Explicitly listens to events from the renderer process
   * @param {string} channel
   * @param {function} fn
   */
  subscribe (channel, fn) {
    ipcMain.on(channel, fn)
  }
}

export default new Transit()
