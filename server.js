var config = require('./config');

var express = require('express');
var session = require("express-session");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var ejs = require('ejs');
var passport = require("passport");
var twitchStrategy = require("passport-twitch").Strategy;
var nedb = require('nedb');
var fs = require('fs');
var path = require('path');

var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(passport.session({
	secret: config.session,
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(express.static(__dirname + "/public"));
app.set('views', __dirname + '/public');
app.set('view engine', 'ejs');

var home = require('./public/index');
var login = require('./public/login');
var overlay = require('./public/overlays/index');

app.use('/', home);
app.use('/login', login);
app.use('/overlays', overlay);

var db = {};
db.users = new nedb({ filename: './db/users.db', autoload: true });
// db.events = new nedb({ filename: path.join(gui.App.dataPath, 'events.db') });

db.users.loadDatabase();
// db.events.loadDatabase();

server.listen(config.port, function(){
    console.log('SYS: listening on *:' + config.port);
});

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

passport.use(new twitchStrategy({
        clientID: config.clientID,
        clientSecret: config.clientSecret,
        callbackURL: "http://localhost:" + config.port + "/auth/twitch/callback",
        scope: "user_read"
    },
    function(accessToken, refreshToken, profile, done) {
        process.nextTick(function() {
            db.users.update({
                twitchId: profile.id,
                displayName: profile.displayName,
                logo: profile.logo
            }, { upsert: true },
                function (err, user) {
                    return done(err, user);
                });
        });
    }
));

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

function verifyAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.redirect('login');
    }
}

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
app.get('/', function (req, res) {
    configExists();
    if (exists) {
        /*
        if (!req.isAuthenticated()) {
            res.redirect('login');
        } else {
            res.render('index', {
                user: req.user
            });
        }
        */
        res.render('index');
        console.log('SYS: Directing to home page.');
    } else {
        res.render('setup');
        console.log('SYS: Directing to setup page.');
    }
});

/*
**  ACCOUNTS / LOGIN / LOGOUT
*/
app.get('/login', function (req, res) {
    res.render('login');
});

app.get("/auth/twitch", passport.authenticate("twitch"));
app.get("/auth/twitch/callback", passport.authenticate("twitch", {
    successRedirect: "/",
    failureRedirect: "/login"
}));

app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/login');
});

/*
**  OVERLAY
*/
app.get('/overlays', function (req, res) {
    res.render('overlays');
});


/*
**  APP SETUP PAGE
*/
app.get('/setup', function (req, res) {
    res.render('setup');
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.redirect('/login');
}

module.exports = app;
