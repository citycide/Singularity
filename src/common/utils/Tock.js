export default class Tock {
  constructor () {
    this.timers = new Map()
    this.intervals = new Map()
  }

  setTimeout (uid, fn, time, ...args) {
    if (arguments.length < 3) {
      throw new Error('Tock#setTimeout :: wrong number of arguments.')
    }
    
    if (typeof fn !== 'function') {
      throw new Error('Tock#setTimeout :: second argument must be a function.)
    }

    if (this.timers.has(uid)) this.clearTimeout(uid)
    const id = setTimeout(fn, time, ...args)
    this.timers.set(uid, id)
    return this.timers.get(uid)
  }

  clearTimeout (uid) {
    if (!this.timers.has(uid)) return
    const id = this.timers.get(uid)
    return clearTimeout(id)
  }

  setInterval (uid, fn, interval, ...args) {
    if (arguments.length < 3) {
      throw new Error('Tock#setInterval :: wrong number of arguments.')
    }
    
    if (typeof fn !== 'function') {
      throw new Error('Tock#setInterval :: second argument must be a function.)
    }

    if (this.intervals.has(uid)) this.clearInterval(uid)
    const id = setInterval(fn, interval, ...args)
    this.intervals.set(uid, id)
    return this.intervals.get(uid)
  }

  clearInterval (uid) {
    if (!this.intervals.has(uid)) return
    const id = this.intervals.get(uid)
    return clearInterval(id)
  }
}
