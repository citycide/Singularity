/******************************** TIPEEESTREAM ********************************/
'use strict';

const socketio = require('socket.io-client'),
      db = require('./db'),
      log = require('./logger'),
      emitter = require('./emitter'),
      config = require('./configstore'),
      moment = require('../public/js/vendor/moment.min.js');

const tipeee = socketio.connect('https://sso.tipeeestream.com:4242');

const KEY = config.get('tipeeeAccessToken');
tipeee.on('connect', function(){
    log.info('Connected to tipeeestream');
});

tipeee.emit('join-room', { room: KEY, username: 'citycide' });

tipeee.on('new-event', function(data) {
    if (data.event.type !== 'donation') return;
    let thisEvent = {
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