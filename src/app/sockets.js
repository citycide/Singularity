/*********************************** SOCKET ***********************************/
'use strict';

const emitter = require('./emitter');
const config = require('./configstore');
const db = require('./db');

io.on('connection', (socket) => {
    Logger.debug('Client connected.');

    socket.on('disconnect', () => {
        Logger.debug('Client disconnected.');
    });

    socket.on('auth:callback', (data) => {
        if (data.token.length > 20) {
            Settings.set('accessToken', data.token);
            Settings.set('channel', data.user);
            Settings.set('channelAvatar', data.logo);
            Settings.set('channelID', data.id);
            Settings.set('isLoggedIn', true);
            Logger.debug(`${Settings.get('accessToken')} authed as ${Settings.get('channel')}`);
        }
    });

    socket.on('setup:complete', () => {
        Settings.set('setupComplete', true);
    });

    socket.on('getUserInfo', () => {
        socket.emit('setUserInfo', {
            user: Settings.get('channel'),
            logo: Settings.get('channelAvatar'),
            token: Settings.get('accessToken'),
            clientID: Settings.get('clientID')
        });
    });

    socket.on('test:follower', (user) => {
        Logger.debug(`Received new follower test with name: ${user}`);
        Transit.emit('test:follower', user);
    });

    socket.on('test:host', (data) => {
        Logger.debug(`Received new host test: ${data.user.display_name} for ${data.viewers} viewers`);
        Transit.emit('test:host', data);
    });

    socket.on('test:subscriber', (user) => {
        Logger.debug(`Received new subscriber test with name: ${user}`);
        Transit.emit('test:subscriber', user);
    });

    socket.on('test:tip', (data) => {
        Logger.debug(`Received new tip test: ${data.user.name} for ${data.amount} | ${data.message}`);
        Transit.emit('test:tip', data);
    });

    socket.on('test:music', (data) => {
        Logger.debug(`Received new music test: ${data}`);
        io.emit('music:test', data);
    });

    socket.on('getCurrentSong', () => {
        io.emit('setCurrentSong', musicWatcher.song);
    });

    socket.on('alert:complete', () => {
        Transit.emit('alert:complete');
    });

    socket.on('getFollowers', () => {
        io.emit('receiveFollowers', db.dbGetFollows().object);
    });

    /*
    socket.on('tipeee:activate', (data) => {
        Transit.emit('tipeee:activate', data);
    });
    
    socket.on('tipeee:deactivate', () => {
        Transit.emit('tipeee:deactivate');
    });
    */
});