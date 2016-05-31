import { app, BrowserWindow, screen } from 'electron';
import EventEmitter from 'events';
import winston from 'winston';
import { argv } from 'yargs';
import path from 'path';
import util from 'util';

import configureApp from './app/main/configureApp';
import generateBrowserConfig from './app/main/configureBrowser';

import EmitterClass from './app/main/utils/Emitter';
import SettingsClass from './app/main/utils/Settings';
import WindowManagerClass from './app/main/utils/WindowManager';
import PlaybackAPIClass from './app/main/utils/PlaybackAPI';
import I3IpcHelperClass from './app/main/utils/I3IpcHelper';

import handleStartupEvent from './squirrel';

const pkg = require('../package.json');
const PORT = pkg.port || 2881;

process.on('uncaughtException', (err) => {
    console.error(err);
});

const onError = (error) => {
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
};

(() => {
    if (handleStartupEvent()) {
        return;
    }

    global.DEV_MODE = argv.development || argv.dev;

    // Initialize the logger with default log levels
    const defaultFileLogLevel = 'info';
    const defaultConsoleLogLevel = global.DEV_MODE ? 'trace' : 'error';
    const defaultLogLevels = {
        levels: {
            error: 0,
            warn: 1,
            info: 2,
            sys: 2,
            bot: 2,
            debug: 3,
            trace: 4,
            absurd: 5
        },
        colors: {
            error: 'red',
            warn: 'yellow',
            info: 'blue',
            sys: 'blue',
            bot: 'green',
            debug: 'cyan',
            trace: 'white',
            absurd: 'grey'
        }
    };
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
    Logger.setLevels(defaultLogLevels.levels);
    winston.addColors(defaultLogLevels.colors);
    Logger.info('Starting singularity...');

    // Spin up a global event emitter for core interaction
    global.Transit = new EventEmitter();

    global.Emitter = new EmitterClass();
    global.WindowManager = new WindowManagerClass();
    global.Settings = new SettingsClass();
    global.PlaybackAPI = new PlaybackAPIClass();

    const server = require('./server.js');
    server.setPort(PORT);
    server.start();

    server.on('error', onError);
    server.on('listening', () => {
        Logger.info(`Listening on *:${PORT}`);
        Settings.set('port', PORT)
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

    // Replace the log level with those from settings.
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
            Logger.info('Collapsing the singularity...');
            global.quitting = true;
        });
    });
})();