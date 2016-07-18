import wm from '../WindowManager'
import Settings from '../../../common/components/Settings'

const settings = new Settings('window')
const mainWindows = wm.getAll('main')
const mainWindow = mainWindows[0]

const _save = () => {
  if (mainWindow.isMaximized()) {
    settings.set('maximized', true)
  } else {
    settings.set('maximized', false)
    settings.set('position', mainWindow.getPosition())
    settings.set('size', mainWindow.getSize())
  }
}

mainWindow.on('move', _save)
mainWindow.on('resize', _save)
mainWindow.on('maximize', e => _save())
mainWindow.on('unmaximize', _save)

/*
Emitter.on('welcomed', (event, version) => {
  Settings.set('welcomed', version)
})
*/
