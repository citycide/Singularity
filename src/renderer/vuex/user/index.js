import { remote } from 'electron'
import Levers from 'levers'
import axios from 'axios'
import url from 'url'
import types from './types'

import transit from '../../components/js/transit'

const settings = new Levers('app')
const cache = new Levers('twitch')
const api = {
  KRAKEN: 'https://api.twitch.tv/kraken'
}

let authWindow = null

const state = {
  authorized: !!settings.get('twitch.token'),
  twitchToken: settings.get('twitch.token'),
  channel: cache.data
}

const getters = {
  authorized: state => state.authorized,
  twitchToken: state => state.twitch.token,
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

    const hasToken = hash => hash && hash.startsWith('#access_token=')

    authWindow.webContents.on('did-get-redirect-request', (e, from, to) => {
      const { hash } = url.parse(to)

      if (hasToken(hash)) {
        e.preventDefault()
        processAuth(hash)
      }
    })

    authWindow.webContents.on('will-navigate', async (e, target) => {
      const { hash, hostname, query = {} } = url.parse(target, true)

      if (hasToken(hash)) {
        e.preventDefault()
        processAuth(hash)
      }

      if (hostname === 'localhost') {
        if (query.error === 'access_denied') {
          // user cancelled the login
          console.debug('Login cancelled: ', query.error)

          this.$events.emit('notification', {
            message: 'Login cancelled.'
          })
        } else {
          console.debug('Error during Twitch login: ', query.error)

          this.$events.emit('notification', {
            message: 'Error during Twitch login. Please try again.'
          })
        }

        e.preventDefault()
        authWindow.close()
      }
    })

    async function processAuth (hash) {
      const token = hash.slice(14, 44)
      const res = await axios(api.KRAKEN, {
        params: {
          oauth_token: token,
          client_id: settings.get('clientID')
        }
      })

      authWindow.close()

      if (res.data.token.valid) {
        state.channel.name = res.data.token.user_name

        settings.set('twitch.token', token)
        transit.fire('services:all:start')
        commit(types.AUTHENTICATE, token)
      } else {
        console.error(`Invalid Twitch registration`)

        this.$events.emit('notification', {
          message: 'Invalid Twitch registration. Please try again.'
        })
      }
    }

    const clientID = settings.get('clientID')
    const redirect = 'http://localhost'
    const scopes = [
      'user_read',
      'channel_read',
      'channel_editor',
      'channel_subscriptions',
      'chat_login'
    ]

    const queries = [
      'response_type=token',
      `client_id=${clientID}`,
      `redirect_uri=${redirect}`,
      `scope=${scopes.join('+')}`,
      'force_verify=true'
    ]

    authWindow.loadURL('https://api.twitch.tv/kraken/oauth2/authorize?' + queries.join('&'))
  },

  logout ({ commit }) {
    settings.del('twitch.token')
    transit.fire('services:all:stop')
    cache.clear()
    commit(types.LOGOUT)
  },

  async getChannelInfo ({ commit }) {
    if (!state.authorized || !state.channel.name) return

    const res = await axios(`${api.KRAKEN}/channels/${state.channel.name}`, {
      params: { client_id: settings.get('clientID') }
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
