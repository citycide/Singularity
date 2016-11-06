export default class Tock {
  /**
   * Create a new `Tock` instance
   */
  constructor () {
    this.timers = new Map()
    this.intervals = new Map()
  }

  /**
   * Has the same signature as native `window.setTimeout`
   * but with the addition of an optional first parameter
   * that is used as a unique identifier.
   *
   * If `uid` is set, calling this method again with the
   * same `uid` will clear the previous timeout before
   * setting the new one.
   *
   * @param {*} [uid] - unique identifier, anything but a function
   * @param {function} fn
   * @param {number} [time=1] - defaults to 1ms
   * @param {...*} args - arguments to be passed to `fn`
   *
   * @returns {number}
   */
  setTimeout (uid, fn, time = 1, ...args) {
    if (typeof uid === 'function') {
      time = parseInt(fn) || 1
      fn = uid
      uid = undefined
    } else if (arguments.length < 3) {
      throw new Error('Tock#setTimeout :: wrong number of arguments.')
    }

    if (typeof fn !== 'function') {
      throw new Error(`Tock#setTimeout :: 'fn' parameter must be a function.`)
    }

    if (!uid) {
      // just return a native setTimeout ID
      return setTimeout(fn, time, ...args)
    } else {
      // clear any existing timeout with this ID
      this.clearTimeout(uid)

      const id = setTimeout(this._wrapper.bind(this), time, fn, uid, ...args)
      this.timers.set(uid, id)
      return this.timers.get(uid)
    }
  }

  /**
   * Clear a timeout and remove its reference
   * [Tock's setTimeout method]{@link Tock#setTimeout} must
   * previously have been called with the `uid` parameter
   *
   * @param {*} uid
   */
  clearTimeout (uid) {
    if (!this.timers.has(uid)) return

    clearTimeout(this.timers.get(uid))
    this.timers.delete(uid)
  }

  /**
   * Has the same signature as native `window.setInterval`
   * but with the addition of an optional first parameter
   * that is used as a unique identifier.
   *
   * If `uid` is set, calling this method again with the
   * same `uid` will clear the previous interval before
   * setting the new one.
   *
   * @param {*} [uid] - unique identifier, anything but a function
   * @param {function} fn
   * @param {number} [interval=1000] - defaults to 1s
   * @param {...*} args - arguments to be passed to `fn`
   *
   * @returns {number}
   */
  setInterval (uid, fn, interval = 1000, ...args) {
    if (typeof uid === 'function') {
      interval = parseInt(fn) || 1
      fn = uid
      uid = undefined
    } else if (arguments.length < 3) {
      throw new Error('Tock#setInterval :: wrong number of arguments.')
    }

    if (typeof fn !== 'function') {
      throw new Error(`Tock#setInterval :: 'fn' parameter must be a function.`)
    }

    if (!uid) {
      // just return a native setInterval ID
      return setInterval(fn, interval, ...args)
    } else {
      // clear any existing interval with this ID
      this.clearInterval(uid)

      const id = setInterval(fn, interval, ...args)
      this.intervals.set(uid, id)
      return this.intervals.get(uid)
    }
  }

  /**
   * Clear an interval and remove its reference
   * [Tock's setInterval method]{@link Tock#setInterval} must
   * previously have been called with the `uid` parameter
   *
   * @param {*} uid
   */
  clearInterval (uid) {
    if (!this.intervals.has(uid)) return

    clearInterval(this.intervals.get(uid))
    this.intervals.delete(uid)
  }

  /**
   * A wrapper function around the user's callback
   * When setTimeout calls the wrapper it will call
   * the user's callback function, then remove its
   * reference from the timer Map.
   *
   * @param {function} fn
   * @param {*} uid
   * @param {...*} args - arguments to pass to `fn`
   * @private
   */
  _wrapper (fn, uid, ...args) {
    fn(...args)
    this.timers.delete(uid)
  }
}
