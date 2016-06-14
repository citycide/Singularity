import EventEmitter from 'events';
import io from 'socket.io-client';

const API = require('./api');

class StreamTip extends EventEmitter {
    constructor(clientID, accessToken) {
        super();
        this.clientID = clientID || '5506393c0a1cfab303c6b12a';
        this.accessToken = accessToken;
        this.socket = null;

        this.api = new API(this.clientID, this.accessToken);
    }

    connect() {
        if (this.socket) return;
        if (this.clientID && this.accessToken) {
            this.socket = io.connect('https://streamtip.com/', {
                multiplex: false,
                query: `client_id=${this.clientID}&access_token=${this.accessToken}`
            });
            this._listen();
        } else {
            console.log('The StreamTip service needs authorization.');
        }
    }

    connectDelayed() {
        setTimeout(this.connect.bind(this), 5 * 1000);
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.emit('disconnect');
    }

    _listen() {
        if (this.socket) {
            this.socket.on('connect', () => {
                this.emit('connect');
            });

            this.socket.on('authenticated', () => {
                this.emit('authenticated');
            });

            this.socket.on('newTip', (tip) => {
                console.log('Received tip.');
                this.emit('newTip', tip);
            });

            this.socket.on('error', (err) => {
                if (err === '401::Access Denied::') {
                    this.emit('authenticationFailed');
                } else if (err === '429::Too Many Requests::') {
                    // Too many bad authentications = ratelimited
                    this.emit('ratelimited');
                } else if (err.message === 'xhr poll error') {
                    // ignoring xhr poll error, socket.io will reconnect
                } else {
                    this.emit('error', err);
                }
            });
        } else {
            this.connect();
        }
    }
}

StreamTip.API = API;
export default StreamTip;
