/*********************************** SOCKET ***********************************/

const io = global.io;
const log = require('./logger');
const emitter = require('./emitter');
const config = require('./configstore');

io.on('connection', function(socket){
    log.info('Client connected.');

    socket.on('disconnect', function(){
        log.info('Client disconnected.');
    });

    socket.on('authCallback', function(data) {
        if (data.token.length > 20) {
            config.set('accessToken', data.token);
            config.set('channel', data.user);
            config.set('channelAvatar', data.logo);
            config.set('channelID', data.id);
            config.set('isLoggedIn', true);
            log.auth(`${config.get('accessToken')} authed as ${config.get('channel')}`);
        }
    });

    socket.on('setupComplete', function(){
        config.set('setupComplete', true);
    });

    socket.on('getUserInfo', function() {
        socket.emit('setUserInfo', {
            user: config.get('channel'),
            logo: config.get('channelAvatar'),
            token: config.get('accessToken'),
            clientID: config.get('clientID')
        });
    });

    socket.on('testFollower', function(user){
        log.alert(`Received new follower test with name: ${user}`);
        emitter.emit('testFollower', user);
    });

    socket.on('testHost', function(data){
        log.alert(`Received new host test: ${data.user.display_name} for ${data.viewers} viewers`);
        emitter.emit('testHost', data);
    });

    socket.on('testSubscriber', function(user){
        log.alert(`Received new subscriber test with name: ${user}`);
        emitter.emit('testSubscriber', user);
    });

    socket.on('testTip', function(data){
        log.alert(`Received new tip test: ${data.user.name} for ${data.amount} | ${data.message}`);
        emitter.emit('testTip', data);
    });

    socket.on('testMusic', function(data){
        log.alert(`Received new music test: ${data}`);
        io.emit('newTestSong', data);
    });

    socket.on('getCurrentSong', function() {
        io.emit('setCurrentSong', musicWatcher.song);
    });

    socket.on('alertComplete', function() {
        emitter.emit('alertComplete');
    });

    socket.on('getFollowers', function() {
        io.emit('receiveFollowers', db.dbGetFollows().object);
    });

    socket.on('activateTipeee', function(data) {
        config.set('tipeeeActive', true);
        config.set('tipeeeAccessToken', data);
    });
});

emitter.on('followAlert', function(data) {
    io.emit('followAlert', data);
    io.emit('addFollowEvent', db.makeFollowObj(data));
});

emitter.on('hostAlert', function(data) {
    io.emit('hostAlert', data);
});

emitter.on('subscriberAlert', function(data) {
    io.emit('subscriberAlert', data);
});

emitter.on('tipAlert', function(data) {
    log.alert('Forwarding tip test');
    io.emit('tipAlert', data);
});

emitter.on('initSong', function(data) {
    io.emit('initSong', data);
});

emitter.on('newSong', function(data) {
    io.emit('newSong', data);
});