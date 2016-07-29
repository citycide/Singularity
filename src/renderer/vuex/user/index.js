import { remote } from 'electron'
import Levers from 'levers'
import url from 'url'
import Vue from 'vue'
import types from './types'

import log from '../../../common/utils/logger'
import transit from '../../components/js/transit'

const settings = new Levers('app')
const cache = new Levers('twitch')
const api = {
  KRAKEN: 'https://api.twitch.tv/kraken'
}

let authWindow = null

const state = {
  authorized: !!settings.get('twitchToken'),
  twitchToken: settings.get('twitchToken'),
  channel: cache.data
}

const getters = {
  authorized: state => state.authorized,
  twitchToken: state => state.twitchToken,
  channel: state => state.channel
}

const actions = {
  authenticate ({ commit }) {
    if (authWindow) authWindow.close()

    const mainWindow = remote.getGlobal('mainAppWindow')
    const bounds = mainWindow.getBounds()
    const width = 800
    const height = 600

    authWindow = new remote.BrowserWindow({
      title: 'singularity - Twitch Login',
      show: false,
      parent: mainWindow,
      modal: true,
      width,
      height,
      x: width >= bounds.width
        ? (bounds.x + (bounds.width / 2)) - (width / 2)
        : bounds.x + Math.max(0, ((bounds.width - width) / 2)),
      y: bounds.y,
      frame: true,
      webPreferences: {
        nodeIntegration: false
      }
    })

    authWindow.once('ready-to-show', () => authWindow.show())
    authWindow.once('closed', () => { authWindow = null })

    authWindow.webContents.on('will-navigate', async (e, u) => {
      const parsedURL = url.parse(u, true)
      const hn = parsedURL.hostname

      if (parsedURL.query && 'error' in parsedURL.query) {
        if (parsedURL.query.error === 'access_denied') {
          // user cancelled the login
          e.preventDefault()
          authWindow.close()
        } else {
          e.preventDefault()

          // TODO: show an error in the UI
          log.debug('Error during Twitch login: ', parsedURL.query.error)
          authWindow.close()
        }
      }

      if (hn === 'api.twitch.tv' || hn === 'secure.twitch.tv') return

      if (parsedURL.hash && parsedURL.hash.startsWith('#access_token=')) {
        e.preventDefault()

        const token = parsedURL.hash.slice(14, 44)
        const res = await Vue.http.get(`${api.KRAKEN}?oauth_token=${token}&client_id=${settings.get('clientID')}`)

        authWindow.close()

        if (res.data.token.valid) {
          state.channel.name = res.data.token.user_name

          transit.fire('auth:twitch', token)
          commit(types.AUTHENTICATE, token)
        } else {
          // TODO: show an error in the UI
          log.error(`Invalid Twitch registration`)
        }
      } else {
        e.preventDefault()

        log.trace(`Preventing outside navigation`, e, u)
      }
    })

    const clientID = settings.get('clientID')
    const redirect = 'http://localhost'
    const scopes = 'user_read+channel_read+channel_editor+channel_subscriptions+chat_login'

    let authURL = 'https://api.twitch.tv/kraken/oauth2/authorize'
    authURL += `?response_type=token&client_id=${clientID}`
    authURL += `&redirect_uri=${redirect}&scope=${scopes}&force_verify=true`

    authWindow.loadURL(authURL)
  },
  logout ({ commit }) {
    settings.del('twitchToken')
    cache.clear()
    commit(types.LOGOUT)
  },

  async getChannelInfo ({ commit }) {
    if (!state.authorized || !state.channel.name) return

    const res = await Vue.http.get(`${api.KRAKEN}/channels/${state.channel.name}`, {
      params: { 'client_id': settings.get('clientID') }
    })

    cache.data = res.data

    if (res.ok && 'data' in res) commit(types.SET_CHANNEL_INFO, res.data)
  }
}

const mutations = {
  [types.AUTHENTICATE] (state, token) {
    state.authorized = true
    state.twitchToken = token
  },
  [types.LOGOUT] (state) {
    state.authorized = false
    state.twitchToken = null
    state.channel = {}
  },

  [types.SET_CHANNEL_INFO] (state, payload) {
    state.channel = payload
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
