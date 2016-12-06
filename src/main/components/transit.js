import EventEmitter from 'eventemitter2'
import { getSocket } from './server'
import ipcMain from '../utils/ipc-main'
import * as windowManager from './window-manager'

class Transit extends EventEmitter {
  constructor () {
    super({
      wildcard: true,
      delimiter: ':',
      newListener: false,
      maxListeners: 20
    })

    // forward all events to the bot window
    this.onAny((event, ...args) => this.forwardToBot(event, ...args))
  }

  on (channel, fn, bus) {
    switch (bus) {
      case 'all':
        super.on(channel, fn)
        ipcMain.on(channel, (e, ...a) => fn(...a))
        getSocket().on('connection', socket => socket.on(channel, fn))
        break
      case 'main':
        super.on(channel, fn)
        break
      case 'io':
        getSocket().once('connection', socket => socket.on(channel, fn))
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
        getSocket().once('connection', socket => socket.once(channel, fn))
        break
      case 'main':
        super.once(channel, fn)
        break
      case 'io':
        getSocket().once('connection', socket => socket.once(channel, fn))
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
        getSocket().emit(channel, data)
        break
      case 'main':
        super.emit(channel, data)
        break
      case 'io':
        getSocket().emit(channel, data)
        break
      case 'ipc':
      default:
        super.emit(channel, data)
        ipcMain.sendToAll(channel, data)
    }
  }

  /**
   * Wraps around ipcMain to send data to renderer
   * @param {string} channel
   * @param {*} [data]
   * @param {Object} [opts]
   * @param {string} [opts.atWindow] fire at window with a specific name
   */
  fire (channel, data, opts = {}) {
    if (!opts.atWindow) {
      ipcMain.sendToAll(channel, data)
    } else {
      ipcMain.sendToWindow(opts.atWindow, channel, data)
    }

    super.emit('transit', {
      name: channel,
      args: Array.isArray(data) ? data : [data]
    })
  }

  sendToBot (channel, ...args) {
    if (!windowManager.has('bot')) return
    ipcMain.sendToWindow('bot', channel, ...args)
  }

  forwardToBot (channel, ...args) {
    if (!windowManager.has('bot')) return

    if (channel === 'transit') {
      ipcMain.sendToWindow('bot', channel, ...args)
    } else {
      ipcMain.sendToWindow('bot', 'transit', {
        name: channel,
        args
      })
    }
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

  /**
   * Turns an event into a Promise that can be awaited.
   * Useful when not concerned about the payload, only
   * that the event occurred at all.
   * @param channel
   * @param bus
   * @returns {Promise}
   */
  trigger (channel, bus) {
    return new Promise(resolve => {
      this.once(channel, resolve, bus)
    })
  }
}

export default new Transit()
