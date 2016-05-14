'use strict';

import http from 'http';
import path from 'path';
import express from 'express';
import chokidar from 'chokidar';
import socketio from 'socket.io';
import moment from 'moment';
import TwitchClass from './app/Twitch';
import TipeeeStream from './app/tipeee';

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
        twitch = new TwitchClass();
        twitch.initAPI();
    }
    if (Settings.get('channel') && Settings.get('isLoggedIn')) {
        tipeee = new TipeeeStream(Settings.get('tipeeeAccessToken'), Settings.get('channel'));
        tipeee.connectDelayed();

        tipeee.on('wtf', () => {
            console.log('wtf');
        });

        tipeee.on('connect', () => {
            Logger.info('Connected to TipeeeStream');
        });
        
        tipeee.on('disconnect', () => {
            Logger.info('Disconnected from TipeeeStream');
        });

        tipeee.on('donation', (data) => {
            let thisEvent = {
                user: {
                    name: data.event.parameters.username,
                    amount: data.event.formattedAmount,
                    message: data.event.parameters.formattedMessage,
                    messageRaw: data.event.parameters.message,
                    timestamp: moment(data.event.created_at).valueOf()
                },
                type: 'tip'
            };
            Transit.emit('alert:tipeee:event', thisEvent);
        });
    }
    if (Settings.get('botEnabled') && Settings.get('isLoggedIn')) {
        global.rootDir = __dirname;
        bot = require('./app/bot/core');
        bot.initialize();
    }
}

io.on('connection', (socket) => {
    socket.on('tipeee:activate', (data) => {
        Settings.set('tipeeeActive', true);
        Settings.set('tipeeeAccessToken', data);
        tipeee.key = data;
        tipeee.connect();
    });

    socket.on('tipeee:deactivate', () => {
        tipeee.disconnect();
        Settings.set('tipeeeActive', false);
        Settings.del('tipeeeAccessToken');
    });
});

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