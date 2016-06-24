import db from './db';

io.on('connection', socket => {
    Logger.absurd('Client connected.');

    socket.on('disconnect', () => {
        Logger.absurd('Client disconnected.');
    });

    socket.on('auth:callback', data => {
        if (data.token.length > 20) {
            Settings.set('accessToken', data.token);
            Settings.set('channel', data.user);
            Settings.set('channelAvatar', data.logo);
            Settings.set('channelID', data.id);
            Settings.set('isLoggedIn', true);
            Logger.debug(`${Settings.get('accessToken')} authorized as ${Settings.get('channel')}`);
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

    socket.on('test:follower', user => {
        Transit.emit('test:follower', user);
    });

    socket.on('test:host', data => {
        Transit.emit('test:host', data);
    });

    socket.on('test:subscriber', user => {
        Transit.emit('test:subscriber', user);
    });

    socket.on('test:tip', data => {
        Transit.emit('test:tip', data);
    });

    socket.on('test:music', data => {
        io.emit('music:test', data);
    });
    /*
    socket.on('getCurrentSong', () => {
        io.emit('setCurrentSong', musicWatcher.song);
    });
    */
    socket.on('alert:complete', () => {
        Transit.emit('alert:complete');
    });

    socket.on('getFollowers', () => {
        io.emit('receiveFollowers', db.dbGetFollows());
    });
});
