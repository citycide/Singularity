/******************************** TIPEEESTREAM ********************************/
'use strict';

import moment from 'moment';
import socketio from 'socket.io-client';
const db = require('./db'),
      emitter = require('./emitter'),
      config = require('./configstore');

const tipeee = socketio.connect('https://sso.tipeeestream.com:4242');

const KEY = config.get('tipeeeAccessToken');
tipeee.on('connect', () => {
    Logger.info('Connected to tipeeestream');
});

tipeee.emit('join-room', { room: KEY, username: 'citycide' });

tipeee.on('new-event', (data) => {
    if (data.event.type !== 'donation') return;
    let thisEvent = {
        user: {
            name: data.event.parameters.username,
            amount: data.event.formattedAmount,
            message: data.event.parameters.formattedMessage,
            messageRaw: data.event.parameters.message,
            timestamp: moment(data.event.created_at).valueOf
        },
        type: "tip"
    };
    emitter.emit('tipeeeEvent', thisEvent);
});