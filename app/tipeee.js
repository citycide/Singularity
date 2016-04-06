var socketio = require('socket.io-client');
var db = require('./db');
var log = require('./logger');
var emitter = require('./emitter');
var config = require('./configstore');
var moment = require('../public/js/vendor/moment.min.js');

var tipeee = socketio.connect('https://sso.tipeeestream.com:4242');

config.set('tipeeeAccessToken', 'cfc17e8d5ad60713160b0a320f7a7ee726b158db');

var key = config.get('tipeeeAccessToken');
tipeee.on('connect', function(){
    log.msg('Connected to tipeeestream');
});

tipeee.emit('join-room', { room: key, username: 'citycide' });

tipeee.on('new-event', function(data) {
    if (data.event.type !== 'donation') return;
    var thisEvent = {
        user: {
            name: data.event.parameters.username,
            amount: data.event.formattedAmount,
            message: data.event.parameters.formattedMessage,
            messageRaw: data.event.parameters.message,
            timestamp: data.event.created_at
        },
        type: "tip"
    };
    emitter.emit('tipeeeEvent', thisEvent);
});