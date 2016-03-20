var http = require('http'),
    express = require('express'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    socketio = require('socket.io'),
    ejs = require('ejs'),
    moment = require('./public/js/moment.min');

var twitchRequest = require('./app/twitch');
var emitter = require('./app/emitter');
var config = require('./app/configstore');
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
    console.log('SYS: listening on *:' + port);
});

/*********************************** SOCKET ***********************************/

io.on('connection', function(socket){
    console.log('SYS: Client connected.');

    socket.on('disconnect', function(){
        console.log('SYS: Client disconnected');
    });

    /*
    socket.on('twitchAuth', function(data){
        config.set('isLoggedIn', true);
        console.log('data');
        config.set('currentUser', data.user);
    });
    */

    socket.on('authCallback', function(data) {
        if (data.token.length > 20) {
            config.set('accessToken', data.token);
            config.set('currentUser', data.user);
            config.set('currentUserLogo', data.logo);
            config.set('isLoggedIn', true);
            console.log(config.get('accessToken') + ' authed as ' + config.get('currentUser'));
        }
    });

    socket.on('getUserInfo', function () {
        socket.emit('setUserInfo', {
            user: config.get('currentUser'),
            logo: config.get('currentUserLogo'),
            token: config.get('accessToken'),
            clientID: config.get('clientID')
        });
    });

    socket.on('testFollower', function(user){
        console.log('Received new follower test with name: ' + user);
        emitter.emit('testFollower', user);
    });

    socket.on('testHoster', function(data){
        console.log('Received new host test: ' + data.name + ' ' + data.viewers);
        emitter.emit('testHoster', data.name);
    });

    socket.on('testSubscriber', function(user){
        console.log('Received new subscriber test with name: ' + user);
        emitter.emit('testSubscriber', user);
    });

    socket.on('testDonor', function(data){
        console.log('Received new donation test: ' + data.name + ' ' + data.amount + ' ' + data.message);
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
                user: config.get('currentUser'),
                clientID: config.get('clientID')
            });
            console.log('SYS: Directing to home page.');
        } else {
            res.redirect('/login');
            console.log('SYS: Directing to login page.');
        }
    } else {
        res.redirect('/setup');
        console.log('SYS: Directing to setup page.');
    }
});
app.get('/dashboard', function (req, res) {
    if (config.get('setupComplete') === true) {
        if (config.get('isLoggedIn')) {
            res.render('index', {
                user: config.get('currentUser')
            });
            console.log('SYS: Directing to home page.');
        } else {
            res.redirect('/login');
            console.log('SYS: Directing to login page.');
        }
    } else {
        res.redirect('/setup');
        console.log('SYS: Directing to setup page.');
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
app.get('/auth/callback', function (req, res) {
    if (req.query.token.length > 20) {
        config.set('accessToken', req.query.token);
        config.set('currentUser', req.query.user);
        config.set('currentUserLogo', req.query.logo);
        config.set('isLoggedIn', true);
        console.log(config.get('accessToken') + ' authed as ' + config.get('currentUser'));
    }
});
app.get('/login', function (req, res) {
    res.render('login', {
        clientID: config.get('clientID')
    });
});
app.get('/logout', function (req, res) {
    config.set('isLoggedIn', false);
    config.del('currentUser');
    config.del('accessToken');
    config.del('currentUserLogo');
    if (!config.get('isLoggedIn')) {
        console.log('SYS: User has been logged out.');
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
        console.log('SYS: User needs to authenticate.');
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
        console.log('SYS: Setup already complete, directing to home page.');
        res.redirect('/')
    }
});

// twitchRequest.pollFollowers();

module.exports = app;