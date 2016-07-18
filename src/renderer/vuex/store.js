import Vue from 'vue'
import Vuex from 'vuex'
import ui from './interface'
import auth from './auth'

Vue.use(Vuex)

export default new Vuex.Store({
  strict: true,

  state: {},

  modules: {
    ui,
    auth
  }
})
