import { app, BrowserWindow, screen } from 'electron';
import { argv } from 'yargs';
import EventEmitter from 'events';
// import util from 'util';

import handleStartupEvent from './squirrel';
import configureApp from './app/main/configureApp';
import generateBrowserConfig from './app/main/configureBrowser';
import initLogger from './app/main/utils/Logger';

import EmitterClass from './app/main/utils/Emitter';
import SettingsClass from './app/main/utils/Settings';
import WindowManagerClass from './app/main/utils/WindowManager';
import Weave from './app/main/utils/Weave';

const pkg = require('../package.json');
const PORT = pkg.port || 2881;

process.on('uncaughtException', err => console.error(err));

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    switch (error.code) {
        case 'EACCES':
            throw new Error(`${PORT} requires elevated privileges.`);
        case 'EADDRINUSE':
            throw new Error(`${PORT} is already in use.`);
        default:
            throw error;
    }
}

(() => {
    if (handleStartupEvent()) {
        return;
    }

    global.DEV_MODE = argv.development || argv.dev;
    global.Transit = new EventEmitter();
    global.Emitter = new EmitterClass();
    global.WindowManager = new WindowManagerClass();
    global.Settings = new SettingsClass();
    global.weave = new Weave(Settings.get('langFile'));

    const Logger = initLogger();

    Logger.info('Starting singularity...');

    global.Logger = Logger;

    // Initialize the database
    const initDB = require('./app/db').initDB;
    initDB({ DEV: global.DEV_MODE, LOCATION: 'home' });

    // Start the server
    const server = require('./server.js');
    server.setPort(PORT);
    server.start();

    server.default.on('error', onError);
    server.default.on('listening', () => {
        Logger.info(`Listening on *:${PORT}`);
        Settings.set('port', PORT);
    });

    configureApp(app);

    let mainWindow = null;
    let child = null;

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

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    app.on('ready', () => {
        mainWindow = new BrowserWindow(generateBrowserConfig());
        global.mainWindowID = WindowManager.add(mainWindow, 'main');

        const position = Settings.get('position');
        let inBounds = false;
        if (position) {
            screen.getAllDisplays().forEach(display => {
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
            // server.close();
        });

        app.on('before-quit', () => {
            Logger.info('Collapsing the singularity...');
            global.quitting = true;
        });
    });
})();
