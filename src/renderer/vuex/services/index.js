import Levers from 'levers'
import types from './types'

import transit from 'renderer/components/js/transit'

const settings = new Levers('app')

const state = {
  bot: {
    enabled: settings.get('bot.active'),
    name: settings.get('bot.name'),
    auth: settings.get('bot.auth')
  },
  tipeeeEnabled: settings.get('tipeee.active'),
  streamtipEnabled: settings.get('streamtip.active'),
  streamlabsEnabled: settings.get('streamlabs.active')
}

const getters = {
  bot: state => state.bot,
  tipeeeEnabled: state => state.tipeeeEnabled,
  streamtipEnabled: state => state.streamtipEnabled,
  streamlabsEnabled: state => state.streamlabsEnabled
}

const actions = {
  enableBot ({ commit }, payload) {
    const data = Object.assign({}, payload, {
      name: state.bot.name,
      auth: state.bot.auth
    })

    transit.fire(`service:bot:enable`, data)
    commit(types.ENABLE_BOT, data)
  },

  disableBot ({ commit }) {
    transit.fire(`service:bot:disable`)
    commit(types.DISABLE_BOT)
  },

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
  [types.ENABLE_BOT] (state, { name, auth }) {
    state.bot = {
      enabled: true,
      name,
      auth
    }
  },

  [types.DISABLE_BOT] () {
    state.bot.enabled = false
  },

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
