/******************************** TIPEEESTREAM ********************************/
'use strict';

import moment from 'moment';
import socket from 'socket.io-client';

let tipeee = null;
let key = null;
const tm = {
    tipeeeConnect: () => {
        Logger.debug('Connecting to TipeeeStream...');
        tipeee = socket.connect('https://sso.tipeeestream.com:4242');
        key = Settings.get('tipeeeAccessToken');

        tm.connectHandler();
    },
    tipeeeDisconnect: () => {
        Logger.info('Disconnected from TipeeeStream.');
        tipeee = null;
    },
    tipeeeActivate: (data) => {
        Settings.set('tipeeeActive', true);
        Settings.set('tipeeeAccessToken', data);
        tm.tipeeeConnect();
    },
    tipeeeDeactivate: () => {
        Settings.set('tipeeeActive', false);
        Settings.del('tipeeeAccessToken');
        tm.tipeeeDisconnect();
    },
    connectHandler: () => {
        tipeee.on('connect', () => {
            Logger.info('Connected to TipeeeStream');
            tipeee.emit('join-room', { room: key, username: Settings.get('channel') });
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
                type: 'tip'
            };
            Transit.emit('alert:tipeee:event', thisEvent);
        });
    }
};

if (Settings.get('tipeeeActive')) {
    if (Settings.get('tipeeeAccessToken')) {
        setTimeout(tm.tipeeeConnect, 5 * 1000);
    }
}

io.on('connection', (socket) => {
    socket.on('tipeee:activate', (data) => {
        tm.tipeeeActivate(data);
    });

    socket.on('tipeee:deactivate', () => {
        tm.tipeeeDeactivate();
    });
});