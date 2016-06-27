import moment from 'moment';
import path from 'path';
import TwitchClass from './Twitch';
import TipeeeStream from './TipeeeStream';
import StreamTip from './StreamTip';
import TwitchAlerts from './TwitchAlerts';
import Tock from '../../utils/Tock';

const tick = new Tock();
let bot, streamTip, tipeee, twitch, twitchAlerts;
const tips = [];

const listeners = {
    tipeee() {
        tipeee.on('connect', () => {
            Logger.info('Connected to TipeeeStream');
        });

        tipeee.on('disconnect', () => {
            Logger.info('Disconnected from TipeeeStream');
        });

        tipeee.on('donation', data => {
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
            Transit.emit('alert:tip:event', thisEvent);
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

        streamTip.on('newTip', data => {
            let thisEvent = {
                user: {
                    name: data.username || data.user.display_name || data.user.name,
                    amount: `${data.currencySymbol}${data.amount}`,
                    message: data.note,
                    timestamp: moment(data.date).valueOf()
                },
                type: 'tip'
            };
            Transit.emit('alert:tip:event', thisEvent);
        });

        streamTip.on('error', err => {
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
            let donations = twitchAlerts.getRecentDonations();

            donations.then(data => {
                if (!data.donations) return Logger.debug('TwitchAlerts:: No donation data found.');
                if (tips.length === 0) {
                    data.donations.reverse().map(tip => {
                        if (!tips.includes(tip.id)) {
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
                        return t;
                    });
                } else {
                    data.donations.reverse().map(tip => {
                        let queueTip;
                        if (!tips.includes(tip.id)) {
                            tips.push(tip.id);
                            queueTip = {
                                user: {
                                    name: tip.donator.name,
                                    amount: tip.amount_label,
                                    message: tip.message,
                                    timestamp: tip.created_at
                                },
                                type: 'tip'
                            };
                            Transit.emit('alert:tip:event', queueTip);
                        }
                        return queueTip;
                    });
                }
            }).catch(err => Logger.error(err));
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
            setTimeout(() => {
                Logger.info('Initializing TwitchAlerts donations API');
                listeners.twitchAlerts();
                tick.setInterval('pollTwitchAlerts', listeners.twitchAlerts, 60 * 1000);
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

const botConfig = {
    activate() {
        if (!bot) bot = require('../../../bot/core');
        bot.initialize(true);
        Settings.set('botEnabled', true);
    },
    deactivate() {
        if (!bot) return;
        bot.disconnect(path.resolve(__dirname, '../../../bot'));
        bot = null;
        Settings.set('botEnabled', false);
    }
};

io.on('connection', socket => {
    /** BEGIN BOT EVENTS **/
    socket.on('settings:services:bot:activate', () => {
        botConfig.activate();
    });

    socket.on('settings:services:bot:deactivate', () => {
        botConfig.deactivate();
    });

    socket.on('settings:services:bot:configure', data => {
        if (data.name !== Settings.get('botName') && data.auth !== Settings.get('botAuth')) {
            Settings.set('botName', data.name);
            Settings.set('botAuth', data.auth);
            if (!bot) return;
            Logger.bot('Bot authorization has changed. Reloading...');
            bot.reconfigure(data.name, data.auth);
            if (Settings.get('botEnabled')) {
                botConfig.deactivate();
                botConfig.activate();
            }
        }
    });
    /** END BOT EVENTS **/

    /** BEGIN TIPEEE EVENTS **/
    socket.on('settings:services:tipeee:activate', data => {
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

    socket.on('settings:services:tipeee:deactivate', () => {
        tipeee.disconnect();
        tipeee = null;
        Settings.set('tipeeeActive', false);
        Settings.del('tipeeeAccessToken');
    });
    /** END TIPEEE EVENTS **/

    /** BEGIN STREAMTIP EVENTS **/
    socket.on('settings:services:streamtip:activate', data => {
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

    socket.on('settings:services:streamtip:deactivate', () => {
        streamTip.disconnect();
        streamTip = null;
        Settings.set('streamTipActive', false);
        Settings.del('stAccessToken');
    });
    /** END STREAMTIP EVENTS **/

    /** BEGIN TWITCHALERTS EVENTS **/
    socket.on('settings:services:twitchalerts:activate', data => {
        Logger.info('Initializing TwitchAlerts donations API');
        Settings.set('twitchAlertsActive', true);
        Settings.set('taAccessToken', data);
        if (!twitchAlerts) {
            twitchAlerts = new TwitchAlerts({ token: Settings.get('taAccessToken') });
        } else {
            twitchAlerts.token = data;
        }
        listeners.twitchAlerts();
        tick.setInterval('pollTwitchAlerts', listeners.twitchAlerts, 60 * 1000);
    });

    socket.on('settings:services:twitchalerts:deactivate', () => {
        Logger.info('Deactivated TwitchAlerts donations API');
        tick.clearInterval('pollTwitchAlerts', listeners.twitchAlerts);
        twitchAlerts = null;
        Settings.set('twitchAlertsActive', false);
        Settings.del('taAccessToken');
    });
    /** END TWITCHALERTS EVENTS **/
});
