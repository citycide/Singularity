var http = require('http'),
    express = require('express'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    socketio = require('socket.io'),
    ejs = require('ejs'),
    moment = require('./public/js/moment.min');

var twitch = require('./app/twitch');
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
// var overlay = require('./public/views/overlays/index');
var follower = require('./public/views/overlays/follower');
var auth = require('./public/views/auth');

app.use('/', home);
app.use('/dashboard', home);
app.use('/login', login);
app.use('/setup', setup);
app.use('/auth', auth);
app.use('/overlays', follower);

server.listen(port, function(){
    log.sys('listening on *:' + port);
});

/*********************************** SOCKET ***********************************/

io.on('connection', function(socket){
    log.sys('Client connected.');

    socket.on('disconnect', function(){
        log.sys('Client disconnected');
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

    socket.on('testHoster', function(data){
        log.alert('Received new host test: ' + data.name + ' ' + data.viewers);
        emitter.emit('testHoster', data.name);
    });

    socket.on('testSubscriber', function(user){
        log.alert('Received new subscriber test with name: ' + user);
        emitter.emit('testSubscriber', user);
    });

    socket.on('testDonor', function(data){
        log.alert('Received new donation test: ' + data.name + ' ' + data.amount + ' ' + data.message);
        emitter.emit('testDonor', data);
    });

    socket.on('alertComplete', function () {
        emitter.emit('alertComplete');
    });

    socket.on('setupComplete', function(){
        config.set('setupComplete', true);
    });
});

emitter.on('followAlert', function (user) {
    io.emit('followAlert', user);
});

emitter.on('hostAlert', function (user) {
    io.emit('hostAlert', user);
});

emitter.on('subscriberAlert', function (user) {
    io.emit('subscriberAlert', user);
});

emitter.on('donationAlert', function (user) {
    io.emit('donationAlert', user);
});

/*********************************** ROUTES ***********************************/

/*
 **  HOME PAGE
 */
app.get('/', function (req, res) {
    if (config.get('setupComplete') === true) {
        if (config.get('isLoggedIn')) {
            res.render('index', {
                user: config.get('channel'),
                clientID: config.get('clientID')
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
app.get('/overlays', function (req, res) {
    if (config.get('isLoggedIn')) {
        res.render('overlays/follower');
    } else {
        log.sys('User needs to authenticate.');
        res.redirect('/login');
    }
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