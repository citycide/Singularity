import { remote } from 'electron'
import url from 'url'
import types from './types'

import Settings from '../../../common/components/Settings'
import log from '../../../common/utils/logger'
import transit from '../../components/js/transit'

const settings = new Settings('app')

let authWindow = null

const state = {
  authorized: !!settings.get('twitchToken'),
  twitchToken: null
}

const getters = {
  authorized: state => state.authorized,
  twitchToken: state => state.twitchToken
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

    authWindow.webContents.on('will-navigate', (e, u) => {
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

        transit.fire('auth:twitch', token)
        commit(types.AUTHENTICATE, token)
        authWindow.close()
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
    commit(types.LOGOUT)
  }
}

const mutations = {
  [types.AUTHENTICATE] (state, token) {
    state.authorized = true
    state.twitchToken = token
  },
  [types.LOGOUT] (state) {
    console.log(state)
    state.authorized = false
    state.twitchToken = null
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
