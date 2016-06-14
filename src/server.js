import http from 'http';
import express from 'express';
import chokidar from 'chokidar';
import socketio from 'socket.io';

import userServer from './app/main/utils/_userServerSetup';

const app = express();
const server = http.createServer(app);
global.io = socketio(server);

// Set up a basic user server if it doesn't exist
userServer(__dirname);

const ROUTES = require('./app/routes')(app);
const SOCKETS = require('./app/sockets');
const SERVICES = require('./app/main/features/core/serviceLoader');

let PORT;
const setPort = function(_port, callback) {
    PORT = _port || 2881;
    callback && callback();
};

const start = function() {
    server.listen(PORT, () => {});
};

/**
 * File watcher
 */

const watcher = chokidar.watch('./app/**/*.js', {
    persistent: true
});

watcher.on('change', (_path) => {
    // let _module = '.' + path.sep + path.relative(__dirname, _path);
    Logger.absurd('File updated, reloading...', `'${_path}'`);
    delete require.cache[_path];
});

// export the server object & init functions for electron
module.exports = server;
module.exports.start = start;
module.exports.setPort = setPort;
