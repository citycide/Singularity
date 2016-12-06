import { screen } from 'electron'
import Levers from 'levers'
import path from 'path'

const windowStorage = new Levers('window')
const IS_WIN_32 = process.platform === 'win32'

export default function () {
  const screenSize = screen.getPrimaryDisplay().workAreaSize
  const defaultHeight = screenSize.height * 3 / 4
  const defaultWidth = screenSize.width * 3 / 4

  return {
    width: windowStorage.get('width', defaultWidth),
    height: windowStorage.get('height', defaultHeight),
    minWidth: 400,
    minHeight: 300,
    x: windowStorage.get('X'),
    y: windowStorage.get('Y'),
    show: false,
    autoHideMenuBar: true,
    frame: windowStorage.get('behavior.nativeFrame', !IS_WIN_32),
    icon: path.resolve(
      __dirname, '../../assets', `icon.${(IS_WIN_32 ? 'ico' : 'png')}`
    ),
    title: 'singularity',
    backgroundColor: '#039BE5',
    webPreferences: {
      nodeIntegration: true,
      plugins: true
    }
  }
}
