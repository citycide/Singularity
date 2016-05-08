import { BrowserWindow } from 'electron';
import path from 'path';

export const showWinOverlay = () => {
    if (WindowManager.getAll('winOverlay').length > 0) {
        WindowManager.getAll('winOverlay')[0].show();
        return;
    }
    const winOverlay = new BrowserWindow({
        width: 1280,
        height: 720,
        autoHideMenuBar: true,
        frame: Settings.get('nativeFrame'),
        show: false,
        webPreferences: {
            nodeIntegration: true,
            preload: path.resolve(`${__dirname}/../../../../inject/generic/index.js`)
        },
        // icon: path.resolve(`${__dirname}/../../../assets/singularity.${(process.platform === 'win32' ? 'ico' : 'png')}`), // eslint-disable-line
        title: 'singularity overlay'
    });
    winOverlay.loadURL(`http://localhost:${Settings.get('port')}/shell?src=${encodeURI('/overlay')}`);
    winOverlay.show();

    WindowManager.add(winOverlay, 'winOverlay');
};

export const showColorWheel = () => {
    if (WindowManager.getAll('color_wheel').length > 0) {
        WindowManager.getAll('color_wheel')[0].show();
        return;
    }
    const colorWheel = new BrowserWindow({
        width: 400,
        height: 400,
        autoHideMenuBar: true,
        frame: Settings.get('nativeFrame'),
        show: false,
        webPreferences: {
            nodeIntegration: true
        },
        // icon: path.resolve(`${__dirname}/../../../assets/singularity.${(process.platform === 'win32' ? 'ico' : 'png')}`), // eslint-disable-line
        title: 'Color Wheel'
    });
    // colorWheel.loadURL(`file://${__dirname}/../../../public_html/color_wheel.html`);

    WindowManager.add(colorWheel, 'color_wheel');
    WindowManager.forceFocus(colorWheel);
};

Emitter.on('window:overlay:open', () => {
    // const mainWindow = WindowManager.getAll('main')[0];
    showWinOverlay();
});

Emitter.on('window:color_wheel', () => {
    showColorWheel();
});

Emitter.on('settings:set', (event, details) => {
    Settings.set(details.key, details.value);
    // DEV: React to settings change
    switch (details.key) {
        case 'miniAlwaysShowSongInfo':
            Emitter.sendToGooglePlayMusic('miniAlwaysShowSongInfo', { state: details.value });
            break;
        case 'miniAlwaysOnTop':
            Emitter.sendToGooglePlayMusic('miniAlwaysOnTop', { state: details.value });
            break;
        case 'speechRecognition':
            Emitter.sendToGooglePlayMusic('speech:toggle', { state: details.value });
            break;
        default:
            break;
    }
});
