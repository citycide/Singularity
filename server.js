var express = require('express');
var ejs = require('ejs');
var passport = require("passport");
var twitchStrategy = require("passport-twitch").Strategy;
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var home = require('./public/index');
var login = require('./public/login');

app.use(express.static(__dirname + "/public"));
app.set('views', __dirname + '/public');
app.set('view engine', 'ejs');

app.use('/', home);
app.use('/login', login);

var port = process.env.PORT || 2016;

server.listen(port, function(){
    console.log('SYS: listening on *:' + port);
});

io.on('connection', function(socket){
    console.log('SYS: Client connected.');

    socket.on('disconnect', function(){
        console.log('SYS: Client disconnected');
    });

    socket.on('newFollower', function(data){
        console.log('Received follower test.');
    });
});

app.use(passport.initialize());

passport.serializeUser(function (user, callback) {
    callback(null, user);
});

passport.deserializeUser(function (user, callback) {
    callback(null, user);
});

function verifyAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.redirect('login');
    }
}

/*
**  HOME PAGE
*/
app.get('/', function (req, res) {
    res.render('index');
    /*
    if (!req.isAuthenticated()) {
        res.redirect('login');
    } else {
        res.render('index', {
            user: req.user
        });
    }
    */
});

/*
**  LOGIN
*/
app.get('/login', function (req, res) {
    res.render('login');
});

app.post('/login', passport.authenticate('local'), function (req, res) {
    res.redirect('/');
});

app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

module.exports = app;