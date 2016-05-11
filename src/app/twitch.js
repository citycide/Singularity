/*********************************** TWITCH ***********************************/
'use strict';

import fs from 'fs-jetpack';
import moment from 'moment';
import { app } from 'electron';
import { Timers, Intervals } from './tock';
const tmi = require('tmi.js'),
      emitter = require('./emitter'),
      db = require('./db');

const CHANNEL = {
    name: Settings.get('channel'),
    id: Settings.get('channelID'),
    token: Settings.get('accessToken')
};
const CLIENT_ID = Settings.get('clientID');
let alertInProgress = false,
    followers = [],
    queue = [];

Transit.on('alert:complete', () => {
    alertInProgress = false;
});

const OPTIONS = {
    options: {
        debug: false
    },
    connection: {
        reconnect: true,
        cluster: 'aws'
    },
    identity: {
        username: CHANNEL.name,
        password: CHANNEL.token
    },
    channels: [CHANNEL.name]
};

const client = new tmi.client(OPTIONS);
      client.connect();
client.on('connected', (address, port) => {
    Logger.info(`Connected to Twitch chat at ${address}:${port}`)
});

const BASE_URL = 'https://api.twitch.tv/kraken';
const CHANNEL_EP = `/channels/${CHANNEL.name}/`;

const initAPI = (pollInterval) => {
    if (!pollInterval) pollInterval = 30 * 1000;
    setTimeout(() => {
        Logger.info('Initializing Twitch API requests');
        pollFollowers(pollInterval);
    }, 5 * 1000);
    Timers.set(checkQueue, 10 * 1000);
};

const pollFollowers = (pollInterval) => {
    if (!pollInterval) pollInterval = 30 * 1000;
    Logger.absurd(`Hitting follower endpoint for ${CHANNEL.name}...`);
    client.api({
        url: `${BASE_URL}${CHANNEL_EP}follows?limit=100&timestamp=` + new Date().getTime(),
        method: 'GET',
        headers: {
            'Accept': "application/vnd.twitchtv.v3+json",
            'Authorization': `OAuth ${CHANNEL.token.slice(6)}`,
            'Client-ID': CLIENT_ID
        }
    }, (err, res, body) => {
        if (err) {
            Logger.debug(err);
            setTimeout(pollFollowers, pollInterval);
            return;
        }
        if (res.statusCode != 200) {
            Logger.debug(`Unknown response code: ${res.statusCode}`);
            setTimeout(pollFollowers, pollInterval);
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
                if (followers.length === 0) {
                    body.follows.reverse().map((follower) => {
                        if (followers.indexOf(follower.user.display_name) == -1) {
                            followers.push(follower.user.display_name);
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
                    writeFollower(followers[followers.length-1]);
                } else {
                    body.follows.reverse().map((follower) => {
                        if (followers.indexOf(follower.user.display_name) === -1) {
                            followers.push(follower.user.display_name);
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
                            queue.push(queueFollower);
                            let s = {
                                id: follower.user._id,
                                name: follower.user.display_name,
                                ts: moment(follower.created_at, moment.ISO_8601).valueOf(),
                                ev: 'follower',
                                ntf: follower.notifications
                            };
                            db.dbFollowersAdd(s.id, s.name, s.ts, s.ntf.toString());
                            writeFollower(s.name);
                        }
                    });
                }
            }
        }
        setTimeout(pollFollowers, pollInterval);
    });
};

const writeFollower = (followerName) => {
    let followerFile = `${Settings.get('dataPath')}/text/latestfollower.txt`;
    if (fs.read(followerFile) !== followerName) {
        fs.file(followerFile, {
            content: followerName
        });
    }
};

client.on('hosted', (channel, username, viewers) => {
    let thisHost;
    resolveUser(username, (userObj) => {
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
            queue.push(thisHost);
        // }
    });
});

client.on('subscription', (channel, username) => {
    let thisSub;
    resolveUser(username, (userObj) => {
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
        queue.push(thisSub);
    });
});

client.on('subanniversary', (channel, username, months) => {
    let thisResub;
    resolveUser(username, (userObj) => {
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
        queue.push(thisResub);
    });
});

const checkQueue = (attempts = 0) => {
    if (alertInProgress) {
        if (attempts < 2) {
            Logger.absurd(`checkQueue:: An alert is either in progress or no client has responded with 'alert:complete'`);
            attempts++;
            Timers.set(checkQueue, 5 * 1000, attempts);
        } else {
            Logger.absurd(`checkQueue:: Maximum attempts reached. Forcing alertInProgress to false.`);
            alertInProgress = false;
            checkQueue();
        }
        return;
    }
    if (!queue.length) {
        Timers.set(checkQueue, 5 * 1000);
        return;
    }
    let queueItem = queue.pop();
    actOnQueue(queueItem.user, queueItem.type);
    Timers.set(checkQueue, 5 * 1000);
};

const actOnQueue = (data, type) => {
    Logger.trace('Pushing queue item...');
    alertInProgress = true;
    switch (type) {
        case 'follower':
            Logger.trace('Queue item is a follower event.');
            io.emit('alert:follow', data);
            Transit.emit('alert:follow', data);
            io.emit('alert:follow:event', db.makeFollowObj(data));
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

Transit.on('test:follower', (username) => {
    let thisTest;
    resolveUser(username, (userObj) => {
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
        queue.push(thisTest);
        checkQueue();
    });
});

Transit.on('test:host', (hostObj) => {
    let thisTest;
    resolveUser(hostObj.user.display_name, (userObj) => {
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
        queue.push(thisTest);
        checkQueue();
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
    queue.push(thisTest);
    checkQueue();
});

Transit.on('alert:tipeee:event', (data) => {
    queue.push(data);
});

const resolveUser = (username, callback) => {
    client.api({
        url: `/users/${username}`,
        method: 'GET',
        headers: {
            'Accept': "application/vnd.twitchtv.v3+json",
            'Authorization': `OAuth ${CHANNEL.token.slice(6)}`,
            'Client-ID': CLIENT_ID
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
                let unresolvedUser = {
                    user: {
                        display_name: username
                    }
                };
                callback(unresolvedUser);
                return;
            }
            let resolvedUser = {
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

module.exports.initAPI = initAPI;
module.exports.pollFollowers = pollFollowers;
module.exports.checkQueue = checkQueue;