import { app, Menu, Tray, shell } from 'electron';
import path from 'path';

import showWinOverlay from './desktopSettings';

let appIcon = null;
const mainWindow = WindowManager.getAll('main')[0];

let audioDeviceMenu = [
    {
        label: 'Loading Devices...',
        enabled: false
    }
];

if (process.platform === 'darwin') {
    appIcon = new Tray(path.resolve(`${__dirname}/../../../../assets/singularity_sm.png`));
} else {
    appIcon = new Tray(path.resolve(`${__dirname}/../../../../assets/singularity_sm.png`));
}

const setContextMenu = () => {
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show',
            click: () => {
                mainWindow.setSkipTaskbar(false);
                mainWindow.show();
            }
        },
        /*
        { type: 'separator' },
        {
            label: 'Play / Pause',
            click: () => Emitter.sendToGooglePlayMusic('playback:playPause')
        },
        {
            label: 'Previous Track',
            click: () => Emitter.sendToGooglePlayMusic('playback:previousTrack')
        },
        {
            label: 'Next Track',
            click: () => Emitter.sendToGooglePlayMusic('playback:nextTrack')
        },
        { type: 'separator' },
        {
            label: 'Thumbs Up',
            click: () => Emitter.sendToGooglePlayMusic('playback:thumbsUp')
        },
        {
            label: 'Thumbs Down',
            click: () => Emitter.sendToGooglePlayMusic('playback:thumbsDown')
        },
        { type: 'separator' },
        {
            label: 'Audio Device',
            submenu: audioDeviceMenu
        },
        */
        {
            label: 'Help',
            role: 'help',
            submenu: [
                {
                    label: 'About',
                    click: () => {
                        Emitter.sendToWindowsOfName('main', 'about');
                    }
                },
                {
                    label: 'Issues',
                    click: () => shell.openExternal('https://github.com/citycide/singularity/issues')
                },
                {
                    label: 'Donate',
                    click: () => shell.openExternal('https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=BP83JQTLPGDHQ')
                },
                {
                    // @TODO make a gh-pages presentation site for this
                    label: 'Learn More',
                    click: () => shell.openExternal('https://github.com/citycide/singularity')
                }
            ]
        },
        {
            label: 'Overlay Preview',
            click: () => {
                showWinOverlay();
            }
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                global.quitting = true;
                app.quit();
            }
        }
    ]);
    appIcon.setContextMenu(contextMenu);
};
setContextMenu();

let wasMaximized = Settings.get('maximized', false);

// Tray icon toggle action (windows, linux)
function toggleMainWindow() {
    // the mainWindow variable will be GC'd
    // we must find the window ourselves
    const win = WindowManager.getAll('main')[0];

    if (win.isMinimized()) {
        win.setSkipTaskbar(false);
        win.show();
        if (wasMaximized) {
            win.maximize();
        }
    } else {
        wasMaximized = win.isMaximized();
        // Hide to tray, if configured
        if (Settings.get('minToTray', true)) {
            win.minimize();
            win.setSkipTaskbar(true);
        }
    }
}

appIcon.setToolTip('singularity');

switch (process.platform) {
    case 'darwin':
        // OS X
        // No toggle action, use the context menu.
        break;
    case 'linux':
    case 'freebsd':
    case 'sunos':
        appIcon.on('click', toggleMainWindow);
        break;
    case 'win32':
        // Win32 also on 64-bit Windows
        appIcon.on('double-click', toggleMainWindow);
        break;
    default:
        // Unreachable case for linting
}

// DEV: Keep the icon in the global scope or it gets garbage collected
global.appIcon = appIcon;

app.on('before-quit', () => {
    appIcon.destroy();
    delete global.appIcon;
    appIcon = null;
});

Emitter.on('audiooutput:list', (event, devices) => {
    audioDeviceMenu = [];
    devices.forEach(device => {
        if (device.kind === 'audiooutput') {
            let label = device.label;
            if (!label) {
                switch (device.deviceId) {
                    case 'default':
                        label = 'System Default';
                        break;
                    case 'communications':
                        label = 'System Default Communications';
                        break;
                    default:
                        label = 'Unknown Device';
                        break;
                }
            }
            audioDeviceMenu.push({
                label,
                type: 'radio',
                click: () => {
                    Emitter.sendToGooglePlayMusic('audiooutput:set', device.deviceId);
                    Settings.set('audiooutput', label);
                },
                checked: (label === Settings.get('audiooutput'))
            });
        }
    });
    setContextMenu();
});

Emitter.sendToGooglePlayMusic('audiooutput:fetch');
Emitter.on('audiooutput:set', () => Emitter.sendToGooglePlayMusic('audiooutput:fetch'));
