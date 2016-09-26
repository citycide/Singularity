import { screen } from 'electron'
import Levers from 'levers'
// import path from 'path'

const windowStorage = new Levers('window')

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
    frame: windowStorage.get('nativeFrame', process.platform !== 'win32'),
    // icon: path.resolve(`${__dirname}/../../assets/singularity.${(process.platform === 'win32' ? 'ico' : 'png')}`), // eslint-disable-line
    title: 'singularity',
    backgroundColor: '#039BE5',
    webPreferences: {
      nodeIntegration: true,
      // preload: path.resolve(`${__dirname}/../../inject/generic/index.js`),
      plugins: true
    }
  }
}
