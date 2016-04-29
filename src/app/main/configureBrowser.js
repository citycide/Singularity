import {screen} from 'electron';
import path from 'path';

export default () => {
    const screenSize = screen.getPrimaryDisplay().workAreaSize;
    const defaultHeight = screenSize.height * 3 / 4;
    const defaultWidth = screenSize.width * 3 / 4;

    const baseConfig = {
        width: Settings.get('width', defaultWidth),
        height: Settings.get('height', defaultHeight),
        x: Settings.get('X'),
        y: Settings.get('Y'),
        show: false,
        autoHideMenuBar: true,
        frame: Settings.get('nativeFrame'),
        // icon: path.resolve(`${__dirname}/../../assets/singularity.${(process.platform === 'win32' ? 'ico' : 'png')}`), // eslint-disable-line
        title: 'singularity',
        webPreferences: {
            nodeIntegration: true,
            preload: path.resolve(`${__dirname}/../../inject/generic/index.js`),
            plugins: true
        }
    };

    return baseConfig;
};
