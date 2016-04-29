import { app, BrowserWindow, screen } from 'electron';
import winston from 'winston';
import { argv } from 'yargs';
import path from 'path';

import configureApp from './app/main/configureApp';
import generateBrowserConfig from './app/main/configureBrowser';

import EmitterClass from './app/main/utils/Emitter';
import SettingsClass from './app/main/utils/Settings';
import WindowManagerClass from './app/main/utils/WindowManager';
import PlaybackAPIClass from './app/main/utils/PlaybackAPI';
import I3IpcHelperClass from './app/main/utils/I3IpcHelper';

import handleStartupEvent from './squirrel';

const pjson = require('../package.json');
const PORT = pjson['server-port'] || 2881;
/*
process.on('uncaughtException', (err) => {
    console.error(err.stack);
});
*/

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    switch (error.code) {
        case 'EACCES':
            console.error(`${PORT} requires elevated privileges.`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(`${PORT} is already in use.`);
            process.exit(1);
            break;
        default:
            throw error;
    }
}

(() => {
    if (handleStartupEvent()) {
        return;
    }

    global.DEV_MODE = argv.development || argv.dev;

    // Initialize the logger with some default logging levels.
    const defaultFileLogLevel = 'info';
    const defaultConsoleLogLevel = global.DEV_MODE ? 'debug' : 'error';
    global.Logger = new (winston.Logger)({
        transports: [
            new (winston.transports.File)({
                filename: path.resolve(app.getPath('userData'), 'singularity.log'),
                level: defaultFileLogLevel,
                maxsize: 5000000,
                maxfiles: 2
            }),
            new (winston.transports.Console)({
                level: defaultConsoleLogLevel
            })
        ]
    });
    Logger.info('Starting app...');

    const server = require('./server.js');
    server.setPort(PORT);
    server.start();

    server.on('error', onError);
    server.on('listening', () => {
        Logger.info(`Listening on *:${PORT}`);
    });

    configureApp(app);
    
    let mainWindow = null;

    const shouldQuit = app.makeSingleInstance(() => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
            mainWindow.show();
            mainWindow.setSkipTaskbar(false);
            if (app.dock && app.dock.show) app.dock.show();
        }
    });

    if (shouldQuit) {
        app.quit();
        return;
    }

    global.Emitter = new EmitterClass();
    global.WindowManager = new WindowManagerClass();
    global.Settings = new SettingsClass();
    global.PlaybackAPI = new PlaybackAPIClass();

    // Replace the logger's levels with those from settings.
    Logger.transports.console.level = Settings.get('consoleLogLevel', defaultConsoleLogLevel);
    Logger.transports.file.level = Settings.get('fileLogLevel', defaultFileLogLevel);

    app.on('window-all-closed', () => {
        if (process.platform != 'darwin') {
            app.quit();
        }
    });

    app.on('ready', () => {
        mainWindow = new BrowserWindow(generateBrowserConfig());
        global.mainWindowID = WindowManager.add(mainWindow, 'main');

        const position = Settings.get('position');
        let inBounds = false;
        if (position) {
            screen.getAllDisplays().forEach((display) => {
                if (position[0] >= display.workArea.x &&
                    position[0] <= display.workArea.x + display.workArea.width &&
                    position[1] >= display.workArea.y &&
                    position[1] <= display.workArea.y + display.workArea.height) {
                    inBounds = true;
                }
            });
        }

        let size = Settings.get('size');
        size = size || [1200, 800];

        mainWindow.setSize(...size);
        if (position && inBounds) {
            mainWindow.setPosition(...position);
        } else {
            mainWindow.center();
        }

        if (Settings.get('maximized', false)) {
            mainWindow.maximize();
        }

        mainWindow.loadURL(`http://localhost:${PORT}`);
        require('./app/main/features');
        // mainWindow.toggleDevTools();

        mainWindow.on('closed', () => {
            mainWindow = null;
            server.close();
        });

        // setup i3 listener
        const I3IpcHelper = new I3IpcHelperClass();
        I3IpcHelper.setupEventListener();

        app.on('before-quit', () => {
            Logger.info('collapsing the singularity...');
            global.quitting = true;
        });
    });
})();