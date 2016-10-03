import Levers from 'levers'
import types from './types'

import transit from 'renderer/components/js/transit'

const settings = new Levers('app')

const state = {
  tipeeeEnabled: settings.get('tipeee.active'),
  streamtipEnabled: settings.get('streamtip.active'),
  streamlabsEnabled: settings.get('streamlabs.active')
}

const getters = {
  tipeeeEnabled: state => state.tipeeeEnabled,
  streamtipEnabled: state => state.streamtipEnabled,
  streamlabsEnabled: state => state.streamlabsEnabled
}

const actions = {
  enableService ({ commit }, { service, token }) {
    transit.fire(`service:${service}:enable`, token)
    commit(types.ENABLE_SERVICE, service)
  },

  disableService ({ commit }, service) {
    transit.fire(`service:${service}:disable`)
    commit(types.DISABLE_SERVICE, service)
  }
}

const mutations = {
  [types.ENABLE_SERVICE] (state, name) {
    state[`${name}Enabled`] = true
  },

  [types.DISABLE_SERVICE] (state, name) {
    state[`${name}Enabled`] = false
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
