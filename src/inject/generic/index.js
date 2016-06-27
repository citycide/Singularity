// import './core';

import SettingsController from '../../app/main/utils/Settings';
global.Settings = new SettingsController();
Settings.uncouple();

require(`./${process.platform}`);

document.addEventListener('DOMContentLoaded', () => {
    // require('./windowThemeHandler');
    setTimeout(() => require('electron').remote.getCurrentWindow().show(), 100);

    const nativeFrameAtLaunch = Settings.get('nativeFrame');

    document.body.classList.toggle('native-frame', nativeFrameAtLaunch);

    document.addEventListener('dragover', event => {
        event.preventDefault();
        return false;
    }, false);

    document.addEventListener('drop', event => {
        event.preventDefault();
        return false;
    }, false);
});
