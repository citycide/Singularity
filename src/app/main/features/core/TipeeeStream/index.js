import { EventEmitter } from 'events';
import socket from 'socket.io-client';
// import API from './api';

class TipeeeStream extends EventEmitter {
    constructor(key, username) {
        super();
        this.key = key;
        this.username = username;
        this.tipeee = null;
        
        // this.API = new API(options.key);
    }

    connect() {
        if (this.key && this.username) {
            this.tipeee = socket.connect('https://sso.tipeeestream.com:4242');
            this._listen();
        } else {
            console.log('TipeeeStream needs auth.');
        }
    }

    connectDelayed() {
        setTimeout(this.connect.bind(this), 5 * 1000);
    }

    disconnect() {
        if (this.tipeee) {
            this.tipeee.close();
            this.tipeee = null;
        }
        this.emit('disconnect');
    }

    _listen() {
        if (this.tipeee) {
            this.tipeee.on('connect', () => {
                this.emit('connect');
                this.tipeee.emit('join-room', { room: this.key, username: this.username });
            });

            this.tipeee.on('new-event', (data) => {
                switch (data.event.type) {
                    case 'donation':
                        this.emit('donation', data);
                        break;
                    default:
                        this.emit('unknown', data);
                        break;
                }
            });
        } else {
            this.connect();
        }
    }
}

// TipeeeStream.API = API;

export default TipeeeStream;