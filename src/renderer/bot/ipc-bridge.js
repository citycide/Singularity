import { remote, ipcRenderer } from 'electron'
import { resolve } from 'path'

export function forward (emitter) {
  if (!emitter || typeof emitter.emit !== 'function') {
    return
  }

  ipcRenderer.on('transit', (event, ...args) => {
    emitter.emit(event, ...args)
  })
}

export function on (channel, fn) {
  ipcRenderer.on(channel, (_, ...args) => fn(...args))
}

export function once (channel, fn) {
  ipcRenderer.once(channel, (_, ...args) => fn(...args))
}

export function emit (channel, ...args) {
  ipcRenderer.send(channel, ...args)
}

export function destroy () {
  ipcRenderer.removeAllListeners()
}

export const onEvent = ipcRenderer.on
export const onceEvent = ipcRenderer.once

export const log = remote.require(
  resolve(__dirname, '../../common/utils/logger')
).default
