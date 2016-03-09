var config = require('./config');

var https = require('https');
var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
// var config = require('configstore');
var ejs = require('ejs');
var nedb = require('nedb');
var fs = require('fs');
var path = require('path');
var passport = require('passport');
var TwitchStrategy = require('passport-twitch').Strategy;

/********************************** EXPRESS ***********************************/

var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
var sessionConfig = {
    secret: config.sessionSecret,
    saveUninitialized: true,
    cookie: {}
};
app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/public');
app.set('view engine', 'ejs');

var home = require('./public/index');
var login = require('./public/login');
var overlay = require('./public/overlays/index');

app.use('/', home);
app.use('/login', login);
app.use('/overlays', overlay);

server.listen(config.port, function(){
    console.log('SYS: listening on *:' + config.port);
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
});

/********************************** PASSPORT **********************************/

passport.use(new TwitchStrategy(
    {
        clientID: config.client,
        clientSecret: config.secret,
        redirect_uri: 'http://localhost:'+config.port,
        callbackURL: '/auth/callback',
        scope: 'user_read'
    },
    function (accessToken, refreshToken, profile, done) {
        if (err) return done(err);
        return done(null, profile);
    }
));

passport.serializeUser(function serializeUserCallback(user, done) {
    done(null, user)
});

passport.deserializeUser(function deserializeUserCallback(user, done) {
    done(null, user)
});

function isLoggedIn(req, res, next) {
    if (!req.isAuthenticated()) {
        console.log('SYS: User is authenticated.');
        return next();
    } else {
        console.log('SYS: User needs to authenticate.');
        res.redirect('/login');
    }
}

/*********************************** ROUTES ***********************************/

// Check for the config file
var fileObj, exists;
function configExists () {
    try {
        fileObj = fs.statSync('./config.js');
        exists = true;
        // console.debug("File exists.");
    }
    catch (e) {
        exists = false;
        // console.debug("File does not exist.");
    }
}

/*
 **  HOME PAGE
 */
app.get('/', isLoggedIn, function (req, res) {
    configExists();
    if (exists) {
        res.render('index');
        console.log('SYS: Directing to home page.');
    } else {
        res.redirect('/setup');
        console.log('SYS: Directing to setup page.');
    }
});

/*
 **  ACCOUNTS / LOGIN / LOGOUT
 */
app.get('/login', function (req, res) {
    res.render('login');
});

app.get('/auth', passport.authenticate("twitch"));
app.get('/auth/callback',
    passport.authenticate('twitch', {
        successRedirect : 'http://localhost:'+config.port,
        failureRedirect : '/login'
    })
);

app.get('/logout', function (req, res) {
    req.logout();
    if (!req.isAuthenticated()) {
        console.log('SYS: User has been logged out.');
    }
    res.redirect('/login');
});

/*
 **  OVERLAY
 */
app.get('/overlays', isLoggedIn, function (req, res) {
    res.render('overlays');
});


/*
 **  APP SETUP PAGE
 */
app.get('/setup', function (req, res) {
    res.render('setup');
});

module.exports = app;