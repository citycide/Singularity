import types from './types'

const state = {
  sidebarOpen: false,
  setupComplete: false
}

const getters = {
  sidebarOpen: state => state.sidebarOpen,
  setupComplete: state => state.setupComplete
}

const actions = {
  sidebarToggle ({ commit }) {
    commit(types.SIDEBAR_TOGGLE)
  },
  setupFinished ({ commit }) {
    commit(types.SETUP_FINISHED)
  }
}

const mutations = {
  [types.SIDEBAR_OPEN] (state) {
    state.sidebarOpen = true
  },
  [types.SIDEBAR_CLOSE] (state) {
    state.sidebarOpen = false
  },
  [types.SIDEBAR_TOGGLE] (state) {
    state.sidebarOpen = !state.sidebarOpen
  },

  [types.SETUP_FINISHED] (state) {
    state.setupComplete = true
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
