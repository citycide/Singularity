import types from './types'

const state = {
  sidebarOpen: false
}

const getters = {
  sidebarOpen: state => state.sidebarOpen
}

const actions = {
  sidebarToggle ({ commit }) {
    commit(types.SIDEBAR_TOGGLE)
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
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
