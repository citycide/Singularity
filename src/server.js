'use strict';

import http from 'http';
import path from 'path';
import express from 'express';
import chokidar from 'chokidar';
import socketio from 'socket.io';

let twitch, tipeee, bot;

/********************************** EXPRESS ***********************************/

const app = express();
const server = http.createServer(app);
global.io = socketio(server);

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

{
    if (Settings.get('channel') && Settings.get('isLoggedIn')) {
        twitch = require('./app/twitch');
        twitch.initAPI();
    }
    if (Settings.get('channel') && Settings.get('isLoggedIn')) {
        tipeee = require('./app/tipeee');
    }
    if (Settings.get('botEnabled') && Settings.get('isLoggedIn')) {
        global.rootDir = __dirname;
        bot = require('./app/bot/core');
        bot.initialize();
    }
}

/******************************** FILE WATCHER *********************************/

const watcher = chokidar.watch('./build/app/*.js', {
    persistent: true
});

watcher.on('change', (_path, stats) => {
    let _module = '.' + path.sep + path.relative(__dirname, _path);
    delete require.cache[_path];
});

// export the server object for electron
module.exports = server;
module.exports.start = start;
module.exports.setPort = setPort;