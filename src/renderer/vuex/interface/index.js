import Levers from 'levers'
import types from './types'

const app = new Levers('app')

const state = {
  sidebarOpen: false,
  modalAbout: false,
  modalHelp: false,
  setupComplete: app.get('setupComplete', false)
}

const getters = {
  sidebarOpen: state => state.sidebarOpen,
  modalAbout: state => state.modalAbout,
  modalHelp: state => state.modalHelp,
  setupComplete: state => state.setupComplete
}

const actions = {
  sidebarToggle ({ commit }) {
    commit(types.SIDEBAR_TOGGLE)
  },
  setupFinished ({ commit }) {
    app.set('setupComplete', true)
    commit(types.SETUP_FINISHED)
  },
  toggleModal ({ commit }, type) {
    commit(types[`MODAL_TOGGLE_${type.toUpperCase()}`])
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
  },

  [types.MODAL_TOGGLE_ABOUT] (state) {
    state.modalAbout = !state.modalAbout
  },
  [types.MODAL_TOGGLE_HELP] (state) {
    state.modalHelp = !state.modalHelp
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
