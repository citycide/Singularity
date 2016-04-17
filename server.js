const http = require('http'),
      express = require('express'),
      cookieParser = require('cookie-parser'),
      bodyParser = require('body-parser'),
      session = require('express-session'),
      socketio = require('socket.io'),
      ejs = require('ejs'),
      moment = require('moment');

const musicWatcher = require('./app/nowPlaying'),
      emitter = require('./app/emitter'),
      config = require('./app/configstore'),
      log = require('./app/logger'),
      db = require('./app/db');

let twitch, tipeee;
if (config.get('channel') && config.get('isLoggedIn')) {
    twitch = require('./app/twitch');
    twitch.initAPI();
}
if (config.get('tipeeeActive') && config.get('channel') && config.get('isLoggedIn')) {
    tipeee = require('./app/tipeee');
}

/********************************** EXPRESS ***********************************/

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const PORT = config.get('port');

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
const sessionConfig = {
    secret: config.get('sessionSecret'),
    saveUninitialized: true,
    cookie: {}
};
app.use(session(sessionConfig));
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/public/views');
app.set('view engine', 'ejs');

const home = require('./public/views/index');
const login = require('./public/views/login');
const setup = require('./public/views/setup');
const auth = require('./public/views/auth');
const overlay = require('./public/views/overlays/overlay');
const followers = require('./public/views/overlays/followers');
const hosts = require('./public/views/overlays/hosts');
const tips = require('./public/views/overlays/tips');
const slider = require('./public/views/overlays/slider');
const nowPlaying = require('./public/views/overlays/nowPlaying');

app.use('/', home);
app.use('/dashboard', home);
app.use('/login', login);
app.use('/setup', setup);
app.use('/auth', auth);
app.use('/overlay', overlay);
app.use('/followers', followers);
app.use('/hosts', hosts);
app.use('/tips', tips);
app.use('/slider', slider);
app.use('/music', nowPlaying);

server.listen(PORT, function(){
    log.sys(`listening on *:${PORT}`);
});

/*********************************** SOCKET ***********************************/

io.on('connection', function(socket){
    log.sys('Client connected.');

    socket.on('disconnect', function(){
        log.sys('Client disconnected.');
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

/*********************************** ROUTES ***********************************/

/*
 **  HOME PAGE
 */
app.get('/', function(req, res) {
    if (config.get('setupComplete') === true) {
        if (config.get('isLoggedIn')) {
            res.render('index', {
                channel: config.get('channel'),
                channelAvatar: config.get('channelAvatar'),
                token: config.get('accessToken'),
                clientID: config.get('clientID'),
                currentSong: musicWatcher.getCurrentSong(),
                tipeeeEnabled: config.get('tipeeeActive'),
                followerObj: db.dbGetFollows().object
            });
            log.sys('Directing to home page.');
        } else {
            res.redirect('/login');
            log.sys('Directing to login page.');
        }
    } else {
        res.redirect('/setup');
        log.sys('Directing to setup page.');
    }
});
app.get('/dashboard', function(req, res) {
    if (config.get('setupComplete') === true) {
        if (config.get('isLoggedIn')) {
            res.render('index', {
                channel: config.get('channel'),
                channelAvatar: config.get('channelAvatar'),
                token: config.get('accessToken'),
                clientID: config.get('clientID'),
                currentSong: musicWatcher.getCurrentSong(),
                followerObj: db.dbGetFollows().object
            });
            log.sys('Directing to home page.');
        } else {
            res.redirect('/login');
            log.sys('Directing to login page.');
        }
    } else {
        res.redirect('/setup');
        log.sys('Directing to setup page.');
    }
});
/*
 **  ACCOUNTS / LOGIN / LOGOUT
 */
app.get('/auth', function(req, res) {
   res.render('auth', {
       clientID: config.get('clientID'),
       setupComplete: config.get('setupComplete')
   });
});
app.get('/login', function(req, res) {
    res.render('login', {
        clientID: config.get('clientID')
    });
});
app.get('/logout', function(req, res) {
    userLogout(function(status) {
        if (!status) {
            log.sys('User has been logged out.');
            res.redirect('/login');
        }
    });
});

/*
 **  OVERLAY
 */
app.get('/overlay', function(req, res) {
    if (config.get('isLoggedIn')) {
        res.render('overlays/overlay');
    } else {
        log.sys('User needs to authenticate.');
        res.redirect('/login');
    }
});
app.get('/slider', function(req, res) {
    res.render('overlays/slider');
});
app.get('/followers', function(req, res) {
    res.render('overlays/followers');
});
app.get('/hosts', function(req, res) {
   res.render('overlays/hosts');
});
app.get('/tips', function(req, res) {
    res.render('overlays/tips');
});
app.get('/music', function(req, res) {
    res.render('overlays/nowPlaying');
});

/*
 **  APP SETUP PAGE
 */
app.get('/setup', function(req, res) {
    if (!config.get('setupComplete')) {
        res.render('setup', {
            channel: config.get('channel'),
            clientID: config.get('clientID')
        });
    } else {
        log.sys('Setup already complete, directing to home page.');
        res.redirect('/')
    }
});

app.get('*', function(req, res){
    // TODO: use res.render to send the user to a custom 404 page
    res.send('Page not found.', 404);
});

function userLogout(callback) {
    config.set('isLoggedIn', false);
    config.set('tipeeeActive', false);
    config.del('accessToken');
    config.del('channel');
    config.del('channelAvatar');
    config.del('channelID');
    config.del('tipeeeAccessToken');
    callback(false);
}

module.exports = app;