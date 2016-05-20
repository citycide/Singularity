import moment from 'moment';
import TwitchClass from './Twitch';
import TipeeeStream from './TipeeeStream';
import StreamTip from './StreamTip';
import TwitchAlerts from './TwitchAlerts';
import Tock from '../../utils/Tock';

const tick = new Tock();
let twitch, tipeee, streamTip, twitchAlerts, bot;

const listeners = {
    tipeee() {
        tipeee.on('connect', () => {
            Logger.info('Connected to TipeeeStream');
        });

        tipeee.on('disconnect', () => {
            Logger.info('Disconnected from TipeeeStream');
        });

        tipeee.on('donation', (data) => {
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
    },
    streamTip() {
        streamTip.on('connect', () => {});

        let auth = false;
        streamTip.on('authenticated', () => {
            if (!auth) {
                Logger.info('Connected to Streamtip');
                auth = true;
            }
        });

        streamTip.on('authenticationFailed', () => {
            Logger.debug('Streamtip authentication failed');
        });

        streamTip.on('ratelimited', () => {
            Logger.debug('The Streamtip service has been rate limited');
        });

        streamTip.on('newTip', (data) => {
            let thisEvent = {
                user: {
                    name: data.username || data.user.display_name || data.user.name,
                    amount: `${data.currencySymbol}${data.amount}`,
                    message: data.note,
                    timestamp: moment(data.date).valueOf()
                },
                type: 'tip'
            };
            Transit.emit('alert:tipeee:event', thisEvent);
        });

        streamTip.on('error', (err) => {
            Logger.trace(err);
            Logger.error(err.message);
        });

        streamTip.on('disconnect', () => {
            Logger.info('Disconnected from Streamtip');
            auth = false;
        });
    },
    twitchAlerts() {
        if (twitchAlerts) {
            Logger.absurd('Checking for TwitchAlerts donations');
            const tips = [];
            let donations = twitchAlerts.getRecentDonations();

            donations.then((data) => {
                if (!data.donations) return Logger.debug('TwitchAlerts:: No donation data found.');
                if (tips.length === 0) {
                    data.donations.reverse().map((tip) => {
                        if (tips.indexOf(tip.id) == -1) {
                            tips.push(tip.id);
                        }
                        let t = {
                            user: {
                                name: tip.donator.name,
                                amount: tip.amount_label,
                                message: tip.message,
                                timestamp: moment(tip.created_at, moment.ISO_8601).valueOf()
                            },
                            type: 'tip'
                        };
                        // db.tipsAdd();
                    });
                } else {
                    data.donations.reverse().map((tip) => {
                        if (tips.indexOf(tip.id) == -1) {
                            tips.push(tip.id);
                            let queueTip = {
                                user: {
                                    name: tip.donator.name,
                                    amount: tip.amount_label,
                                    message: tip.message,
                                    timestamp: tip.created_at
                                },
                                type: 'tip'
                            };
                            Transit.emit('alert:tipeee:event', queueTip);
                        }
                    });
                }
            }).catch((err) => {
                Logger.error(err);
            });
        } else {
            Logger.debug('TwitchAlerts donation polling error');
        }
    }
};

const initServices = (() => {
    if (Settings.get('channel') && Settings.get('isLoggedIn')) {
        if (!twitch) twitch = new TwitchClass();
        twitch.initAPI();

        if (Settings.get('tipeeeActive')) {
            if (!tipeee) tipeee = new TipeeeStream(Settings.get('tipeeeAccessToken'), Settings.get('channel'));
            tipeee.connectDelayed();
            listeners.tipeee();
        }

        if (Settings.get('twitchAlertsActive')) {
            if (!twitchAlerts) twitchAlerts = new TwitchAlerts({ token: Settings.get('taAccessToken') });
            tick.setTimeout(() => {
                Logger.info('Initializing TwitchAlerts donations API');
                listeners.twitchAlerts();
                tick.setInterval(listeners.twitchAlerts, 60 * 1000);
            }, 10 * 1000);
        }

        if (Settings.get('streamTipActive')) {
            if (!streamTip) streamTip = new StreamTip(Settings.get('stClientID'), Settings.get('stAccessToken'));
            streamTip.connectDelayed();
            listeners.streamTip();
        }

        if (Settings.get('botEnabled')) {
            if (!bot) bot = require('../../../bot/core');
            bot.initialize();
        }
    }
})();

io.on('connection', (socket) => {
    /** BEGIN TIPEEE EVENTS **/
    socket.on('tipeee:activate', (data) => {
        Settings.set('tipeeeActive', true);
        Settings.set('tipeeeAccessToken', data);
        if (!tipeee) {
            tipeee = new TipeeeStream(Settings.get('tipeeeAccessToken'), Settings.get('channel'));
        } else {
            tipeee.key = data;
        }
        tipeee.connect();
        listeners.tipeee();
    });

    socket.on('tipeee:deactivate', () => {
        tipeee.disconnect();
        tipeee = null;
        Settings.set('tipeeeActive', false);
        Settings.del('tipeeeAccessToken');
    });
    /** END TIPEEE EVENTS **/

    /** BEGIN STREAMTIP EVENTS **/
    socket.on('streamtip:activate', (data) => {
        Settings.set('streamTipActive', true);
        Settings.set('stAccessToken', data);
        if (!streamTip) {
            streamTip = new StreamTip(Settings.get('stClientID'), Settings.get('stAccessToken'));
        } else {
            streamTip.accessToken = data;
        }
        streamTip.connect();
        listeners.streamTip();
    });

    socket.on('streamtip:deactivate', () => {
        streamTip.disconnect();
        streamTip = null;
        Settings.set('streamTipActive', false);
        Settings.del('stAccessToken');
    });
    /** END STREAMTIP EVENTS **/

    /** BEGIN TWITCHALERTS EVENTS **/
    socket.on('twitchalerts:activate', (data) => {
        Logger.info('Initializing TwitchAlerts donations API');
        Settings.set('twitchAlertsActive', true);
        Settings.set('taAccessToken', data);
        if (!twitchAlerts) {
            twitchAlerts = new TwitchAlerts({ token: Settings.get('taAccessToken') });
        } else {
            twitchAlerts.token = data;
        }
        listeners.twitchAlerts();
        tick.setInterval(listeners.twitchAlerts, 60 * 1000);
    });

    socket.on('twitchalerts:deactivate', () => {
        Logger.info('Deactivated TwitchAlerts donations API');
        tick.clearInterval(listeners.twitchAlerts);
        twitchAlerts = null;
        Settings.set('twitchAlertsActive', false);
        Settings.del('taAccessToken');
    });
    /** END TWITCHALERTS EVENTS **/
});