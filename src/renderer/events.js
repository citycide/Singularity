import EventEmitter from 'eventemitter2'

export default {
  install (Vue) {
    Vue.prototype.$events = new EventEmitter({
      wildcard: true,
      delimiter: ':',
      newListener: false,
      maxListeners: 20
    })
  }
}
