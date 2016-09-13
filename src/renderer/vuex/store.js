import Vue from 'vue'
import Vuex from 'vuex'
import ui from './interface'
import user from './user'
import services from './services'

Vue.use(Vuex)

export default new Vuex.Store({
  strict: true,

  state: {},

  modules: {
    ui,
    user,
    services
  }
})
