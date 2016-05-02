'use strict';

import http from 'http';
import path from 'path';
import express from 'express';
import chokidar from 'chokidar';
import socketio from 'socket.io';
import ejs from 'ejs';

const emitter = require(__dirname + '/app/emitter'),
      config = require(__dirname + '/app/configstore'),
      db = require(__dirname + '/app/db');

let twitch, tipeee, bot;

/********************************** EXPRESS ***********************************/

const app = express();
const server = http.createServer(app);
const io = global.io = socketio(server);

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

setTimeout(() => {
    if (config.get('channel') && config.get('isLoggedIn')) {
        twitch = require(__dirname + '/app/twitch');
        twitch.initAPI();
    }
    if (config.get('tipeeeActive') && config.get('channel') && config.get('isLoggedIn')) {
        tipeee = require(__dirname + '/app/tipeee');
    }
    if (config.get('botEnabled') && config.get('isLoggedIn')) {
        global.rootDir = __dirname;
        bot = require(__dirname + '/app/bot/core');
        bot.initialize();
    }
}, 5 * 1000);

/******************************** FILE WATCHER *********************************/

const watcher = chokidar.watch('./app/*.js', {
    persistent: true
});

watcher.on('change', (_path, stats) => {
    Logger.debug('File updated.');
    let _module = '.' + path.sep + path.relative(__dirname, _path);
    delete require.cache[_path];
});

// export the server object for electron
module.exports = server;
module.exports.start = start;
module.exports.setPort = setPort;