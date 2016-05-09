/*********************************** ROUTES ***********************************/
'use strict';

const express = require('express'),
      path = require('path'),
      config = require('./configstore'),
      cookieParser = require('cookie-parser'),
      bodyParser = require('body-parser'),
      ejs = require('ejs'),
      session = require('express-session');

const db = require('./db'),
      musicWatcher = require('./nowPlaying');

module.exports = (app) => {
    app.use(cookieParser());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    const sessionConfig = {
        secret: Settings.get('sessionSecret'),
        saveUninitialized: true,
        resave: true,
        cookie: {}
    };

    app.use(session(sessionConfig));
    app.use(express.static(__dirname + '/../public'));
    app.set('views', __dirname + '/../public/views');
    app.set('view engine', 'ejs');

    const home = require('../public/views/index');
    const login = require('../public/views/login');
    const setup = require('../public/views/setup');
    const auth = require('../public/views/auth');
    const overlay = require('../public/views/overlays/overlay');
    const followers = require('../public/views/overlays/followers');
    const hosts = require('../public/views/overlays/hosts');
    const tips = require('../public/views/overlays/tips');
    const slider = require('../public/views/overlays/slider');
    const nowPlaying = require('../public/views/overlays/nowPlaying');
    const chat = require('../public/views/chat');
    const shell = require('../public/views/shell');
    
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
    app.use('/chat', chat);
    app.use('/shell', shell);

    /*
     **  HOME PAGE
     */
    app.get('/', (req, res) => {
        if (Settings.get('setupComplete') === true) {
            if (Settings.get('isLoggedIn')) {
                res.render('index', {
                    channel: Settings.get('channel'),
                    channelAvatar: Settings.get('channelAvatar'),
                    token: Settings.get('accessToken'),
                    chatView: encodeURIComponent(path.resolve(`${__dirname}/../inject/bttv.js`)),
                    clientID: Settings.get('clientID'),
                    currentSong: musicWatcher.getCurrentSong(),
                    tipeeeEnabled: Settings.get('tipeeeActive'),
                    followerObj: db.dbGetFollows().object
                });
                Logger.trace('Directing to home page.');
            } else {
                res.redirect('/login');
                Logger.trace('Directing to login page.');
            }
        } else {
            res.redirect('/setup');
            Logger.trace('Directing to setup page.');
        }
    });
    app.get('/dashboard', (req, res) => {
        if (Settings.get('setupComplete') === true) {
            if (Settings.get('isLoggedIn')) {
                res.render('index', {
                    channel: Settings.get('channel'),
                    channelAvatar: Settings.get('channelAvatar'),
                    token: Settings.get('accessToken'),
                    clientID: Settings.get('clientID'),
                    currentSong: musicWatcher.getCurrentSong(),
                    tipeeeEnabled: Settings.get('tipeeeActive'),
                    followerObj: db.dbGetFollows().object
                });
                Logger.trace('Directing to home page.');
            } else {
                res.redirect('/login');
                Logger.trace('Directing to login page.');
            }
        } else {
            res.redirect('/setup');
            Logger.trace('Directing to setup page.');
        }
    });
    /*
     **  ACCOUNTS / LOGIN / LOGOUT
     */
    app.get('/auth', (req, res) => {
        res.render('auth', {
            clientID: Settings.get('clientID'),
            setupComplete: Settings.get('setupComplete')
        });
    });
    app.get('/login', (req, res) => {
        res.render('login', {
            clientID: Settings.get('clientID')
        });
    });
    app.get('/logout', (req, res) => {
        userLogout((status) => {
            if (!status) {
                Logger.trace('User has been logged out.');
                res.redirect('/login');
            }
        });
    });

    /*
     **  OVERLAY
     */
    app.get('/overlay', (req, res) => {
        if (Settings.get('isLoggedIn')) {
            res.render('overlays/overlay');
        } else {
            Logger.trace('User needs to authenticate.');
            res.redirect('/login');
        }
    });
    app.get('/slider', (req, res) => {
        res.render('overlays/slider');
    });
    app.get('/followers', (req, res) => {
        res.render('overlays/followers');
    });
    app.get('/hosts', (req, res) => {
        res.render('overlays/hosts');
    });
    app.get('/tips', (req, res) => {
        res.render('overlays/tips');
    });
    app.get('/music', (req, res) => {
        res.render('overlays/nowPlaying');
    });
    app.get('/chat', (req, res) => {
        res.render('chat', {
            channel: Settings.get('channel'),
            token: Settings.get('accessToken'),
            clientID: Settings.get('clientID')
        });
    });

    app.get('/shell', (req, res) => {
        res.render('shell', {
            /** 
             * forwards the query passed to /shell
             * this is used to dynamically change the src of the webview
             * making /shell a universal window container
             **/
            source: encodeURI(`${req.query.src}`)
        });
    });

    /*
     **  APP SETUP PAGE
     */
    app.get('/setup', (req, res) => {
        if (!Settings.get('setupComplete')) {
            res.render('setup', {
                channel: Settings.get('channel'),
                clientID: Settings.get('clientID')
            });
        } else {
            Logger.trace('Setup already complete, directing to home page.');
            res.redirect('/');
        }
    });

    app.get('*', (req, res) => {
        // TODO: use res.render to send the user to a custom 404 page
        res.send('Page not found.', 404);
    });

    const userLogout = (callback) => {
        Settings.set('isLoggedIn', false);
        Settings.set('tipeeeActive', false);
        Settings.del('accessToken');
        Settings.del('channel');
        Settings.del('channelAvatar');
        Settings.del('channelID');
        Settings.del('tipeeeAccessToken');
        callback(false);
    };
};