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

    socket.on('authCallback', (data) => {
        if (data.token.length > 20) {
            config.set('accessToken', data.token);
            config.set('channel', data.user);
            config.set('channelAvatar', data.logo);
            config.set('channelID', data.id);
            config.set('isLoggedIn', true);
            Logger.debug(`${config.get('accessToken')} authed as ${config.get('channel')}`);
        }
    });

    socket.on('setupComplete', () => {
        config.set('setupComplete', true);
    });

    socket.on('getUserInfo', () => {
        socket.emit('setUserInfo', {
            user: config.get('channel'),
            logo: config.get('channelAvatar'),
            token: config.get('accessToken'),
            clientID: config.get('clientID')
        });
    });

    socket.on('test:follower', (user) => {
        Logger.debug(`Received new follower test with name: ${user}`);
        emitter.emit('testFollower', user);
    });

    socket.on('test:host', (data) => {
        Logger.debug(`Received new host test: ${data.user.display_name} for ${data.viewers} viewers`);
        emitter.emit('testHost', data);
    });

    socket.on('test:subscriber', (user) => {
        Logger.debug(`Received new subscriber test with name: ${user}`);
        emitter.emit('testSubscriber', user);
    });

    socket.on('test:tip', (data) => {
        Logger.debug(`Received new tip test: ${data.user.name} for ${data.amount} | ${data.message}`);
        emitter.emit('testTip', data);
    });

    socket.on('test:music', (data) => {
        Logger.debug(`Received new music test: ${data}`);
        io.emit('music:test', data);
    });

    socket.on('getCurrentSong', () => {
        io.emit('setCurrentSong', musicWatcher.song);
    });

    socket.on('alertComplete', () => {
        emitter.emit('alertComplete');
    });

    socket.on('getFollowers', () => {
        io.emit('receiveFollowers', db.dbGetFollows().object);
    });

    socket.on('tipeee:activate', (data) => {
        config.set('tipeeeActive', true);
        config.set('tipeeeAccessToken', data);
    });

    socket.on('tipeee:deactivate', () => {
        config.set('tipeeeActive', false);
        config.del('tipeeeAccessToken');
    });
});

/*
emitter.on('followAlert', (data) => {
    io.emit('followAlert', data);
    io.emit('addFollowEvent', db.makeFollowObj(data));
});

emitter.on('hostAlert', (data) => {
    io.emit('hostAlert', data);
});

emitter.on('subscriberAlert', (data) => {
    io.emit('subscriberAlert', data);
});

emitter.on('tipAlert', (data) => {
    Logger.debug('Forwarding tip test');
    io.emit('tipAlert', data);
});

emitter.on('initSong', (data) => {
    io.emit('initSong', data);
});

emitter.on('newSong', (data) => {
    io.emit('newSong', data);
});
*/
