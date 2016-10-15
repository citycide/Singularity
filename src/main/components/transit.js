import EventEmitter from 'eventemitter2'
import { io } from './server'
import ipcMain from '../utils/ipc-main'

class Transit extends EventEmitter {
  constructor () {
    super()
    Object.assign(this, {
      wildcard: true,
      delimiter: ':',
      newListener: false,
      maxListeners: 20
    })
  }

  on (channel, fn, bus) {
    switch (bus) {
      case 'all':
        super.on(channel, fn)
        ipcMain.on(channel, (e, ...a) => fn(...a))
        io.on('connection', socket => socket.on(channel, fn))
        break
      case 'main':
        super.on(channel, fn)
        break
      case 'io':
        io.once('connection', socket => socket.on(channel, fn))
        break
      case 'ipc':
      default:
        ipcMain.on(channel, (e, ...a) => fn(...a))
    }
  }

  once (channel, fn, bus) {
    switch (bus) {
      case 'all':
        super.once(channel, fn)
        ipcMain.once(channel, (e, ...a) => fn(...a))
        io.once('connection', socket => socket.once(channel, fn))
        break
      case 'main':
        super.once(channel, fn)
        break
      case 'io':
        io.once('connection', socket => socket.once(channel, fn))
        break
      case 'ipc':
      default:
        ipcMain.once(channel, (e, ...a) => fn(...a))
    }
  }

  emit (channel, data, bus) {
    switch (bus) {
      case 'all':
        super.emit(channel, data)
        ipcMain.sendToAll(channel, data)
        io.emit(channel, data)
        break
      case 'main':
        super.emit(channel, data)
        break
      case 'io':
        io.emit(channel, data)
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
   * Explicitly listens to events from the renderer process.
   * This is the only way to receive the `event` argument,
   * since using the transit#on method drops it from the callback.
   * @param {string} channel
   * @param {function} fn
   */
  subscribe (channel, fn) {
    ipcMain.on(channel, fn)
  }
}

export default new Transit()
