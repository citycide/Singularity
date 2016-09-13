import jetpack from 'fs-jetpack'
import { flow } from 'lodash'
import Levers from 'levers'
import types from './types'

const settings = new Levers('app')

const fileExists = file => jetpack.exists(file)
const songFilePath = () => settings.get('music.file', '/null-path-fail.txt')
const songSeparator = () => settings.get('music.separator', '')
const readSongFile = file => jetpack.read(file) || ''
const parseSongTitle = title => title.replace(songSeparator()).trim()

const getCurrentSong = flow([songFilePath, readSongFile, parseSongTitle])

const state = {
  nowPlaying: fileExists(songFilePath()) ? getCurrentSong() : 'No song is currently playing.'
}

const getters = {
  nowPlaying: state => state.nowPlaying
}

const actions = {
  setMusicFilePath ({ commit }, newPath) {
    commit(types.NOW_PLAYING_FILE_PATH, newPath)
  }
}

const mutations = {
  [types.NOW_PLAYING_UPDATE] (state, newTitle) {
    state.nowPlaying = newTitle
  },
  [types.NOW_PLAYING_FILE_PATH] (state, newPath) {
    if (!fileExists(newPath)) return
    settings.set('music.file', newPath)
    state.nowPlaying = getCurrentSong()
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
