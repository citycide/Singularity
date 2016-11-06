export default class Queue extends Array {
  get isEmpty () {
    return this.length === 0
  }

  get size () {
    return this.length
  }

  add (...values) {
    this.push(...values)
  }

  next () {
    if (this.isEmpty) return
    return this.splice(0, 1)[0]
  }

  clear () {
    this.length = 0
  }
}
