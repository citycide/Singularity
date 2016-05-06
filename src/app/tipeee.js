/******************************** TIPEEESTREAM ********************************/
'use strict';

import moment from 'moment';
import * as socket from 'socket.io-client';
const db = require('./db'),
      config = require('./configstore');

let tipeee = null;
let key = null;
const tm = {
    tipeeeConnect: () => {
        Logger.debug('Connecting to TipeeeStream...');
        tipeee = socket.connect('https://sso.tipeeestream.com:4242');
        key = config.get('tipeeeAccessToken');

        connectHandler();
    },
    tipeeeDisconnect: () => {
        Logger.info('Disconnected from TipeeeStream.');
        // @TODO find out how to close the socket connection, this doesn't work
        // socket.close();
        tipeee = null;
    },
    tipeeeActivate: (data) => {
        config.set('tipeeeActive', true);
        config.set('tipeeeAccessToken', data);
        tm.tipeeeConnect();
    },
    tipeeeDeactivate: () => {
        config.set('tipeeeActive', false);
        config.del('tipeeeAccessToken');
        tm.tipeeeDisconnect();
    }
};

if (config.get('tipeeeActive')) {
    if (config.get('tipeeeAccessToken')) {
        tm.tipeeeConnect();
    }
}

const connectHandler = () => {
    tipeee.on('connect', () => {
        Logger.info('Connected to tipeeestream');
        tipeee.emit('join-room', { room: key, username: config.get('channel') });
    });

    tipeee.on('new-event', (data) => {
        // We're only interested in events of type 'donation'
        if (data.event.type !== 'donation') return;
        let thisEvent = {
            user: {
                name: data.event.parameters.username,
                amount: data.event.formattedAmount,
                message: data.event.parameters.formattedMessage,
                messageRaw: data.event.parameters.message,
                timestamp: moment(data.event.created_at).valueOf()
            },
            type: "tip"
        };
        Transit.emit('alert:tipeee:event', thisEvent);
    });
};

Transit.on('tipeee:activate', (data) => {
    tm.tipeeeActivate(data);
});

Transit.on('tipeee:deactivate', () => {
    tm.tipeeeDeactivate();
});