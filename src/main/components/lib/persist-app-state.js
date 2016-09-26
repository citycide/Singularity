import Levers from 'levers'
import { debounce } from 'lodash'
import wm from '../window-manager'

const settings = new Levers('window')
const mainWindows = wm.getAll('main')
const mainWindow = mainWindows[0]

const saveTicker = debounce(save, 200, {
  leading: true,
  trailing: true,
  maxWait: 200
})

mainWindow.on('move', saveTicker)
mainWindow.on('resize', saveTicker)
mainWindow.on('maximize', saveTicker)
mainWindow.on('unmaximize', saveTicker)

function save () {
  if (mainWindow.isMaximized()) {
    settings.set('maximized', true)
  } else {
    settings.set('maximized', false)
    settings.set('position', mainWindow.getPosition())
    settings.set('size', mainWindow.getSize())
  }
}

/*
Emitter.on('welcomed', (event, version) => {
  Settings.set('welcomed', version)
})
*/
