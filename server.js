var http = require('http'),
    express = require('express'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    socketio = require('socket.io'),
    ejs = require('ejs'),
    moment = require('./public/js/vendor/moment.min.js');

var twitch = require('./app/twitch');
var tipeee = require('./app/tipeee');
var musicWatcher = require('./app/nowPlaying');
var emitter = require('./app/emitter');
var config = require('./app/configstore');
var log = require('./app/logger');
var db = require('./app/db');

/********************************** EXPRESS ***********************************/

var app = express();
var server = http.createServer(app);
var io = socketio(server);

var port = config.get('port');

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
var sessionConfig = {
    secret: config.get('sessionSecret'),
    saveUninitialized: true,
    cookie: {}
};
app.use(session(sessionConfig));
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/public/views');
app.set('view engine', 'ejs');

var home = require('./public/views/index');
var login = require('./public/views/login');
var setup = require('./public/views/setup');
var auth = require('./public/views/auth');
var overlay = require('./public/views/overlays/overlay');
var followers = require('./public/views/overlays/followers');
var hosts = require('./public/views/overlays/hosts');
var tips = require('./public/views/overlays/tips');
var slider = require('./public/views/overlays/slider');
var nowPlaying = require('./public/views/overlays/nowPlaying');

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

server.listen(port, function(){
    log.sys('listening on *:' + port);
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
            log.auth(config.get('accessToken') + ' authed as ' + config.get('channel'));
        }
    });

    socket.on('setupComplete', function(){
        config.set('setupComplete', true);
    });

    socket.on('getUserInfo', function () {
        socket.emit('setUserInfo', {
            user: config.get('channel'),
            logo: config.get('channelAvatar'),
            token: config.get('accessToken'),
            clientID: config.get('clientID')
        });
    });

    socket.on('testFollower', function(user){
        log.alert('Received new follower test with name: ' + user);
        emitter.emit('testFollower', user);
    });

    socket.on('testHost', function(data){
        log.alert('Received new host test: ' + data.user.display_name + ' for ' + data.viewers + ' viewers');
        emitter.emit('testHost', data);
    });

    socket.on('testSubscriber', function(user){
        log.alert('Received new subscriber test with name: ' + user);
        emitter.emit('testSubscriber', user);
    });

    socket.on('testTip', function(data){
        log.alert('Received new tip test: ' + data.user.name + ' ' + data.amount + ' ' + data.message);
        io.emit('tipAlert', data);
    });

    socket.on('testMusic', function(data){
        log.alert('Received new music test: ' + data);
        io.emit('newTestSong', data);
    });

    socket.on('getCurrentSong', function() {
        io.emit('setCurrentSong', musicWatcher.song);
    });

    socket.on('alertComplete', function () {
        emitter.emit('alertComplete');
    });
});

emitter.on('followAlert', function (data) {
    io.emit('followAlert', data);
});

emitter.on('hostAlert', function (data) {
    io.emit('hostAlert', data);
});

emitter.on('subscriberAlert', function (data) {
    io.emit('subscriberAlert', data);
});

emitter.on('tipAlert', function (data) {
    io.emit('tipAlert', data);
});

emitter.on('initSong', function (data) {
    io.emit('initSong', data);
});

emitter.on('newSong', function (data) {
    io.emit('newSong', data);
});

/*********************************** ROUTES ***********************************/

/*
 **  HOME PAGE
 */
app.get('/', function (req, res) {
    if (config.get('setupComplete') === true) {
        if (config.get('isLoggedIn')) {
            res.render('index', {
                channel: config.get('channel'),
                channelAvatar: config.get('channelAvatar'),
                token: config.get('accessToken'),
                clientID: config.get('clientID'),
                currentSong: musicWatcher.song
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
app.get('/dashboard', function (req, res) {
    if (config.get('setupComplete') === true) {
        if (config.get('isLoggedIn')) {
            res.render('index', {
                user: config.get('channel')
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
app.get('/auth', function (req, res) {
   res.render('auth', {
       clientID: config.get('clientID'),
       setupComplete: config.get('setupComplete')
   });
});
app.get('/login', function (req, res) {
    res.render('login', {
        clientID: config.get('clientID')
    });
});
app.get('/logout', function (req, res) {
    config.set('isLoggedIn', false);
    config.del('accessToken');
    config.del('channel');
    config.del('channelAvatar');
    config.del('channelID');
    if (!config.get('isLoggedIn')) {
        log.sys('User has been logged out.');
        res.redirect('/login');
    }
});

/*
 **  OVERLAY
 */
app.get('/overlay', function (req, res) {
    if (config.get('isLoggedIn')) {
        res.render('overlays/overlay');
    } else {
        log.sys('User needs to authenticate.');
        res.redirect('/login');
    }
});
app.get('/slider', function (req, res) {
    res.render('overlays/slider');
});
app.get('/followers', function (req, res) {
    res.render('overlays/followers');
});
app.get('/hosts', function (req, res) {
   res.render('overlays/hosts');
});
app.get('/tips', function (req, res) {
    res.render('overlays/tips');
});
app.get('/music', function (req, res) {
    res.render('overlays/nowPlaying');
});

/*
 **  APP SETUP PAGE
 */
app.get('/setup', function (req, res) {
    if (!config.get('setupComplete')) {
        res.render('setup', {
            clientID: config.get('clientID')
        });
    } else {
        log.sys('Setup already complete, directing to home page.');
        res.redirect('/')
    }
});

twitch.initAPI();

module.exports = app;