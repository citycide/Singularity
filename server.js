var http = require('http'),
    https = require('https'),
    fs = require('fs'),
    path = require('path'),
    express = require('express'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    SimpleJsonStore = require('simple-json-store'),
    socketio = require('socket.io'),
    ejs = require('ejs'),
    nedb = require('nedb');

var config = new SimpleJsonStore('./config/config.json',
    {
        "setupComplete": false,
        "port": 2016,
        "clientID": "41i6e4g7i1snv0lz0mbnpr75e1hyp9p",
        "sessionSecret": "9347asfg597y43wernhy59072rw345"
    }
);

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

/********************************** DATABASE **********************************/

// var db = {};
// db.events = new nedb({ filename: path.join(gui.App.dataPath, 'events.db') });
// db.events.loadDatabase();

/*********************************** SOCKET ***********************************/

io.on('connection', function(socket){
    console.log('SYS: Client connected.');

    socket.on('disconnect', function(){
        console.log('SYS: Client disconnected');
    });

    socket.on('newFollower', function(data){
        io.emit('newFollower', data);
        console.log('TEST: Received follower test. Forwarding...');
    });

    socket.on('setupComplete', function(){
        config.set('setupComplete', true);
    });

    socket.on('twitchAuth', function(data){
        config.set('isLoggedIn', true);
        console.log('data');
        config.set('currentUser', data.user);
    });

    socket.on('getUserInfo', function () {
        socket.emit('setUserInfo', {
            user: config.get('currentUser'),
            token: config.get('accessToken'),
            clientID: config.get('clientID')
        });
    });
});

/*********************************** ROUTES ***********************************/

/*
 **  HOME PAGE
 */
app.get('/', function (req, res) {
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
   res.render('auth');
});
app.get('/auth/callback', function (req, res) {
    if (req.query.token.length > 20) {
        config.set('accessToken', req.query.token);
        config.set('currentUser', req.query.user);
        config.set('isLoggedIn', true);
        console.log(config.get('accessToken') + ' authed as ' + config.get('currentUser'));
    }
});
app.get('/login', function (req, res) {
    res.render('login');
});
app.get('/logout', function (req, res) {
    config.set('isLoggedIn', false);
    config.del('currentUser');
    config.del('accessToken');
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
        res.render('setup');
    } else {
        console.log('SYS: Setup already complete, directing to home page.');
        res.redirect('/')
    }
});

module.exports = app;
