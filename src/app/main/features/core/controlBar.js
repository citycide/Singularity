Emitter.on('window:refresh', (e, windowID) => {
    WindowManager.getByInternalID(windowID).reload();
});

Emitter.on('window:minimize', (e, windowID) => {
    WindowManager.getByInternalID(windowID).minimize();
});

Emitter.on('window:maximize', (e, windowID) => {
    const window = WindowManager.getByInternalID(windowID);
    if (window.isMaximized()) {
        WindowManager.getByInternalID(windowID).unmaximize();
    } else {
        WindowManager.getByInternalID(windowID).maximize();
    }
});

Emitter.on('window:close', (e, windowID) => {
    const winToClose = WindowManager.getByInternalID(windowID);
    if (winToClose) {
        winToClose.close();
    }
});

const mainWindow = WindowManager.getAll('main')[0];
mainWindow.on('close', (e) => {
    if ((Settings.get('minToTray', true) || process.platform === 'darwin') && !global.quitting) {
        if (process.platform !== 'darwin') {
            mainWindow.minimize();
            mainWindow.setSkipTaskbar(true);
        } else {
            if (PlaybackAPI.isPlaying() && !Settings.get('minToTray', true)) {
                Emitter.sendToGooglePlayMusic('playback:playPause');
            }
            mainWindow.hide();
        }
        e.preventDefault();
    }
});
