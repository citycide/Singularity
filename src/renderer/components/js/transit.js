import { ipcRenderer } from 'electron'

class Transit {
  /**
   * Removes the event parameter
   * @param {string} channel
   * @param {function} fn
   * @returns {*}
   */
  on (channel, fn) {
    ipcRenderer.on(channel, (event, data) => fn(data))
  }

  fire (channel, data) {
    ipcRenderer.send(channel, data)
  }

  /**
   * Alias to IPC's original `on` method
   * @param {...*} args
   * @returns {*}
   */
  event (...args) {
    return ipcRenderer.on(...args)
  }
}

export default new Transit()
