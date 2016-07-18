class _Warning extends Error {
  constructor (message) {
    super(message)
    this.name = 'Tock Warning::'
    Error.captureStackTrace(this, _Warning)
  }
}

const argWarning = new _Warning('Wrong number of arguments.')
const typeWarning = new _Warning('Second argument must be a function.')

export default class Tock {
  constructor () {
    this.timers = new Map()
    this.intervals = new Map()
  }

  setTimeout (uid, fn, time, ...args) {
    if (arguments.length < 3) return process.emitWarning(argWarning)
    if (typeof fn !== 'function') return process.emitWarning(typeWarning)

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
    if (arguments.length < 3) return process.emitWarning(argWarning)
    if (typeof fn !== 'function') return process.emitWarning(typeWarning)

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
