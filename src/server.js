'use strict';

import http from 'http';
import express from 'express';
import chokidar from 'chokidar';
import socketio from 'socket.io';

/********************************** EXPRESS ***********************************/

const app = express();
const server = http.createServer(app);
global.io = socketio(server);

// Set up a basic user server if it doesn't exist
import userServer from './app/main/utils/_userServerSetup';
userServer(__dirname);

const ROUTES = require('./app/routes')(app);
const SOCKETS = require('./app/sockets');
let PORT;

const setPort = (_port, callback) => {
    PORT = _port || 2881;
    callback && callback();
};

const start = () => {
    server.listen(PORT, () => {});
};

const serviceLoader = require('./app/main/features/core/serviceLoader');

/******************************** FILE WATCHER *********************************/

const watcher = chokidar.watch(__dirname + '/app/*.js', {
    persistent: true
});

watcher.on('change', (_path, stats) => {
    // let _module = '.' + path.sep + path.relative(__dirname, _path);
    Logger.trace('File updated, reloading...', `'${_path}'`);
    delete require.cache[_path];
});

// export the server object for electron
module.exports = server;
module.exports.start = start;
module.exports.setPort = setPort;