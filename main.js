const electron = require('electron');
const path = require('path');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const pjson = require('./package.json');
const PORT = pjson['server-port'] || 2881;

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

let mainWindow = null;

app.on('window-all-closed', () => {
    if (process.platform != 'darwin') {
        app.quit();
    }
});

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true
        },
        width: 640,
        height: 400
    });

    const server = require('./server.js');

    server.setPort(PORT, () => {
        server.start();
    });

    server.on('error', onError);
    server.on('listening', () => {
        console.log(`Listening on *:${PORT}`);
        mainWindow.loadURL(`http://localhost:${PORT}`);
        // mainWindow.toggleDevTools();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
        server.close();
    });
});