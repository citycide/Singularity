/*********************************** TWITCH ***********************************/
'use strict';

import jetpack from 'fs-jetpack';
import moment from 'moment';
import tmi from 'tmi.js';
import Tock from '../../../utils/Tock';
import db from '../../../../db';

const tick = new Tock();

export default class TwitchClass {
    constructor() {
        this.alertInProgress = false;
        this.followers = [];
        this.alertQueue = [];

        this.CHANNEL = {
            name: Settings.get('channel'),
            id: Settings.get('channelID'),
            token: Settings.get('accessToken')
        };
        this.CLIENT_ID = Settings.get('clientID');

        this.client = null;
        this.TMI_OPTIONS = {
            options: {
                debug: false
            },
            connection: {
                reconnect: true,
                cluster: 'aws'
            },
            identity: {
                username: this.CHANNEL.name,
                password: this.CHANNEL.token
            },
            channels: [this.CHANNEL.name]
        };

        this.API = {
            BASE_URL: 'https://api.twitch.tv/kraken',
            CHANNEL_EP: `/channels/${this.CHANNEL.name}/`
        };
    }

    initAPI(pollInterval = 30 * 1000) {
        setTimeout(() => {
            Logger.info('Initializing Twitch API');
            this.chatConnect();
            this.pollFollowers(pollInterval);
            this.eventHandler();
        }, 5 * 1000);
        tick.setTimeout(this.checkQueue.bind(this), 10 * 1000);
    }

    chatConnect() {
        if (this.CHANNEL.name && this.CHANNEL.token) {
            this.client = new tmi.client(this.TMI_OPTIONS);
            this.client.connect();
            this.client.on('connected', (address, port) => {
                Logger.info(`Connected to Twitch chat at ${address}:${port}`);
                this.clientHandler();
            });
        }
    }

    clientHandler() {
        this.client.on('hosted', (channel, username, viewers) => {
            let thisHost;
            this.resolveUser(username, (userObj) => {
                if (userObj.resolved) {
                    thisHost = {
                        user: {
                            _id: userObj.user._id,
                            display_name: userObj.user.display_name,
                            logo: userObj.user.logo,
                            viewers: viewers
                        },
                        type: 'host'
                    };
                    db.dbHostsAdd(thisHost.user._id, thisHost.user.display_name, moment().valueOf(), thisHost.user.viewers);
                } else {
                    thisHost = {
                        user: {
                            display_name: userObj.user.display_name,
                            viewers: viewers
                        },
                        type: 'host'
                    };
                    db.dbHostsAdd(null, thisHost.user.display_name, moment().valueOf(), thisHost.user.viewers);
                }
                // if (thisHost.user.viewers > 0) {
                this.alertQueue.push(thisHost);
                // }
            });
        });

        this.client.on('subscription', (channel, username) => {
            let thisSub;
            this.resolveUser(username, (userObj) => {
                if (userObj.resolved) {
                    thisSub = {
                        user: {
                            _id: userObj.user._id,
                            display_name: userObj.user.display_name,
                            logo: userObj.user.logo
                        },
                        type: 'subscriber'
                    };
                    db.dbSubscribersAdd(thisSub.user._id, thisSub.user.display_name, moment().valueOf(), null);
                } else {
                    thisSub = {
                        user: {
                            display_name: userObj.user.display_name
                        },
                        type: 'subscriber'
                    };
                    db.dbSubscribersAdd(null, thisSub.user.display_name, moment().valueOf(), null);
                }
                this.alertQueue.push(thisSub);
            });
        });

        this.client.on('subanniversary', (channel, username, months) => {
            let thisResub;
            this.resolveUser(username, (userObj) => {
                if (userObj.resolved) {
                    thisResub = {
                        user: {
                            _id: userObj.user._id,
                            display_name: userObj.user.display_name,
                            logo: userObj.user.logo,
                            months: months
                        },
                        type: 'subscriber'
                    };
                    db.dbSubscribersAdd(thisResub.user._id, thisResub.user.display_name, moment().valueOf(), thisResub.user.months);
                } else {
                    thisResub = {
                        user: {
                            display_name: userObj.user.display_name,
                            months: months
                        },
                        type: 'subscriber'
                    };
                    db.dbSubscribersAdd(null, thisResub.user.display_name, moment().valueOf(), thisResub.user.months);
                }
                this.alertQueue.push(thisResub);
            });
        });
    }

    eventHandler() {
        Transit.on('test:follower', (username) => {
            let thisTest;
            this.resolveUser(username, (userObj) => {
                if (userObj.resolved) {
                    thisTest = {
                        user: {
                            _id: userObj.user._id,
                            display_name: userObj.user.display_name,
                            logo: userObj.user.logo
                        },
                        type: 'follower'
                    };
                } else {
                    thisTest = {
                        user: {
                            display_name: userObj.user.display_name
                        },
                        type: 'follower'
                    };
                }
                this.alertQueue.push(thisTest);
                this.checkQueue();
            });
        });

        Transit.on('test:host', (hostObj) => {
            let thisTest;
            this.resolveUser(hostObj.user.display_name, (userObj) => {
                if (userObj.resolved) {
                    thisTest = {
                        user: {
                            _id: userObj.user._id,
                            display_name: userObj.user.display_name,
                            logo: userObj.user.logo,
                            viewers: hostObj.viewers
                        },
                        type: 'host'
                    };
                } else {
                    thisTest = {
                        user: {
                            display_name: userObj.user.display_name
                        },
                        type: 'host'
                    };
                }
                this.alertQueue.push(thisTest);
                this.checkQueue();
            });
        });

        Transit.on('test:tip', (data) => {
            let thisTest = {
                user: {
                    name: data.user.name,
                    amount: data.amount,
                    message: data.message
                },
                type: 'tip'
            };
            this.alertQueue.push(thisTest);
            this.checkQueue();
        });

        Transit.on('alert:tipeee:event', (data) => {
            this.alertQueue.push(data);
        });

        Transit.on('alert:complete', () => {
            this.alertInProgress = false;
        });
    }
}
TwitchClass.prototype.pollFollowers = function(pollInterval = 30 * 1000) {
    Logger.absurd(`Hitting follower endpoint for ${this.CHANNEL.name}...`);
    this.client.api({
        url: `${this.API.BASE_URL}${this.API.CHANNEL_EP}follows?limit=100&timestamp=` + new Date().getTime(),
        method: 'GET',
        headers: {
            'Accept': 'application/vnd.twitchtv.v3+json',
            'Authorization': `OAuth ${this.CHANNEL.token.slice(6)}`,
            'Client-ID': this.CLIENT_ID
        }
    }, (err, res, body) => {
        if (err) {
            Logger.debug(err);
            tick.setTimeout(this.pollFollowers.bind(this), pollInterval);
            return;
        }
        if (res.statusCode != 200) {
            Logger.debug(`Unknown response code: ${res.statusCode}`);
            tick.setTimeout(this.pollFollowers.bind(this), pollInterval);
            return;
        }

        try {
            body = JSON.parse(body);
        } catch (error) {
            Logger.debug(error);
            return;
        }

        if (body) {
            if (body.follows.length > 0) {
                if (this.followers.length === 0) {
                    body.follows.reverse().map((follower) => {
                        if (this.followers.indexOf(follower.user.display_name) == -1) {
                            this.followers.push(follower.user.display_name);
                        }
                        let s = {
                            id: follower.user._id,
                            name: follower.user.display_name,
                            ts: moment(follower.created_at, moment.ISO_8601).valueOf(),
                            ev: 'follower',
                            ntf: follower.notifications
                        };
                        db.dbFollowersAdd(s.id, s.name, s.ts, s.ntf.toString());
                    });
                    this.writeFollower(this.followers[this.followers.length-1]);
                } else {
                    body.follows.reverse().map((follower) => {
                        if (this.followers.indexOf(follower.user.display_name) === -1) {
                            this.followers.push(follower.user.display_name);
                            let queueFollower = {
                                user: {
                                    _id: follower.user._id,
                                    display_name: follower.user.display_name,
                                    logo: follower.user.logo,
                                    created_at: follower.created_at,
                                    notifications: follower.notifications
                                },
                                type: 'follower'
                            };
                            this.alertQueue.push(queueFollower);
                            let s = {
                                id: follower.user._id,
                                name: follower.user.display_name,
                                ts: moment(follower.created_at, moment.ISO_8601).valueOf(),
                                ev: 'follower',
                                ntf: follower.notifications
                            };
                            db.dbFollowersAdd(s.id, s.name, s.ts, s.ntf.toString());
                            this.writeFollower(s.name);
                        }
                    });
                }
            }
        }
        tick.setTimeout(this.pollFollowers.bind(this), pollInterval);
    });
};

TwitchClass.prototype.writeFollower = function(followerName) {
    let followerFile = `${Settings.get('dataPath')}/text/latestfollower.txt`;
    if (jetpack.read(followerFile) !== followerName) {
        jetpack.file(followerFile, {
            content: followerName
        });
    }
};

TwitchClass.prototype.checkQueue = function(attempts = 0) {
    if (this.alertInProgress) {
        if (attempts < 2) {
            Logger.absurd(`checkQueue:: An alert is either in progress or no client has responded with 'alert:complete'`);
            attempts++;
            tick.setTimeout(this.checkQueue.bind(this), 5 * 1000, attempts);
        } else {
            Logger.absurd(`checkQueue:: Maximum attempts reached. Unblocking the alert queue...`);
            this.alertInProgress = false;
            this.checkQueue();
        }
        return;
    }
    if (!this.alertQueue.length) {
        tick.setTimeout(this.checkQueue.bind(this), 5 * 1000);
        return;
    }
    let queueItem = this.alertQueue.pop();
    this.actOnQueue(queueItem.user, queueItem.type);
    tick.setTimeout(this.checkQueue.bind(this), 5 * 1000);
};

TwitchClass.prototype.actOnQueue = function(data, type) {
    Logger.trace('Pushing queue item...');
    this.alertInProgress = true;
    switch (type) {
        case 'follower':
            Logger.trace('Queue item is a follower event.');
            io.emit('alert:follow', data);
            Transit.emit('alert:follow', data);
            io.emit('alert:follow:event', {
                twitchid: data._id,
                username: data.display_name,
                timestamp: moment(data.created_at, 'x').fromNow(),
                evtype: 'follower',
                notifications: data.notifications
            });
            break;
        case 'host':
            Logger.trace('Queue item is a host event.');
            io.emit('alert:host', data);
            Transit.emit('alert:host', data);
            break;
        case 'subscriber':
            Logger.trace('Queue item is a subscriber event.');
            io.emit('alert:subscriber', data);
            Transit.emit('alert:subscriber', data);
            break;
        case 'tip':
            Logger.trace('Queue item is a tip event.');
            io.emit('alert:tip', data);
            Transit.emit('alert:tip', data);
            break;
        default:
            Logger.debug(`ERR in actOnQueue:: Queue item is of unknown type '${type}'`);
    }
};

TwitchClass.prototype.resolveUser = function(username, callback) {
    this.client.api({
        url: `/users/${username}`,
        method: 'GET',
        headers: {
            Accept: 'application/vnd.twitchtv.v3+json',
            Authorization: `OAuth ${this.CHANNEL.token.slice(6)}`,
            'Client-ID': this.CLIENT_ID
        }
    }, (err, res, body) => {
        if (err) {
            Logger.error(err);
            return;
        }

        try {
            body = JSON.parse(body);
        } catch (error) {
            Logger.error(error);
            return;
        }

        if (body) {
            if (body.error) {
                const unresolvedUser = {
                    user: {
                        display_name: username
                    }
                };
                callback(unresolvedUser);
                return;
            }
            const resolvedUser = {
                user: {
                    _id: body._id,
                    display_name: body.display_name,
                    logo: body.logo
                },
                resolved: true
            };
            callback(resolvedUser);
        }
    });
};
