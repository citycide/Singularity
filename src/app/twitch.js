/*********************************** TWITCH ***********************************/
'use strict';

const irc = require('tmi.js'),
      fs = require('fs-jetpack'),
      moment = require('moment'),
      emitter = require('./emitter'),
      log = require('./logger'),
      config = require('./configstore'),
      db = require('./db');

const CHANNEL = {
    name: config.get('channel'),
    id: config.get('channelID'),
    token: config.get('accessToken')
};
const CLIENT_ID = config.get('clientID');
let animating = false,
    followers = [],
    queue = [];

/*
const cooldown = require('./cooldown/index');

let test = cooldown({
    cmd: 'rekt',  // name of command to put on cooldown
    time: 10,     // time in seconds until command can be used again
    user: 'test'  // user-specific cooldown, or global if omitted
}, function() {
    console.log('This is a test. The command should only be able to be used every 5 seconds.');
});

test({cmd: 'rip', time: 10, user: 'fiftyffive'});

setTimeout(test({cmd: 'rip', time: 10, user: 'fiftyffive'}), 5 * 1000);

setTimeout(test({cmd: 'rip', time: 10, user: 'fiftyffive'}), 15 * 1000);

test.on('cooldown.calledOnCooldown', function(func, args) {
    console.log('Command called while on cooldown.');
});

test.on('cooldown.start', function() {
    console.log('Cooldown started.');
});

test.on('cooldown.end', function() {
    console.log('Cooldown is over.');
});
*/

emitter.on('alertComplete', function () {
    animating = false;
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

const client = new irc.client(OPTIONS);
      client.connect();
client.on("connected", (address, port) => {
    Logger.info(`Connected to Twitch chat at ${address}:${port}`)
});

const BASE_URL = 'https://api.twitch.tv/kraken';
const CHANNEL_EP = `/channels/${CHANNEL.name}/`;

function initAPI(pollInterval) {
    Logger.info('Initializing Twitch API requests');
    if (!pollInterval) pollInterval = 30 * 1000;
    setTimeout(function() {
        pollFollowers(pollInterval);
    }, 5000);
    setTimeout(checkQueue, 10000);
}

function pollFollowers(pollInterval) {
    if (!pollInterval) pollInterval = 30 * 1000;
    Logger.info(`Hitting follower endpoint for ${CHANNEL.name}...`);
    client.api({
        url: `${BASE_URL}${CHANNEL_EP}follows?limit=100&timestamp=` + new Date().getTime(),
        method: 'GET',
        headers: {
            'Accept': "application/vnd.twitchtv.v3+json",
            // 'Authorization': 'OAuth ' + CHANNEL.token.slice(6),
            'Client-ID': CLIENT_ID
        }
    }, (err, res, body) => {
        if (err) {
            log.debug(err);
            setTimeout(pollFollowers, pollInterval);
            return;
        }
        if (res.statusCode != 200) {
            log.debug(`Unknown response code: ${res.statusCode}`);
            setTimeout(pollFollowers, pollInterval);
            return;
        }

        try {
            body = JSON.parse(body);
        } catch (error) {
            log.debug(error);
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
                        if (followers.indexOf(follower.user.display_name) == -1) {
                            followers.push(follower.user.display_name);
                            queue.push(follower);
                            let s = {
                                id: follower.user._id,
                                name: follower.user.display_name,
                                ts: moment(follower.created_at).valueOf(),
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
}

function writeFollower(followerName) {
    let followerFile = __dirname + '/../outputs/latestfollower.txt';
    if (fs.read(followerFile) !== followerName) {
        fs.file(followerFile, {
            content: followerName
        });
    }
}

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
            db.dbHostsAdd(thisHost.user._id, thisHost.user.display_name, moment().valueOf, thisHost.user.viewers);
        } else {
            thisHost = {
                user: {
                    display_name: userObj.user.display_name,
                    viewers: viewers
                },
                type: 'host'
            };
            db.dbHostsAdd(null, thisHost.user.display_name, moment().valueOf, thisHost.user.viewers);
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
            db.dbSubscribersAdd(thisSub.user._id, thisSub.user.display_name, moment().valueOf, null);
        } else {
            thisSub = {
                user: {
                    display_name: userObj.user.display_name
                },
                type: 'subscriber'
            };
            db.dbSubscribersAdd(null, thisSub.user.display_name, moment().valueOf, null);
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
            db.dbSubscribersAdd(thisResub.user._id, thisResub.user.display_name, moment().valueOf, thisResub.user.months);
        } else {
            thisResub = {
                user: {
                    display_name: userObj.user.display_name,
                    months: months
                },
                type: 'subscriber'
            };
            db.dbSubscribersAdd(null, thisReub.user.display_name, moment().valueOf, thisResub.user.months);
        }
        queue.push(thisResub);
    });
});

function checkQueue() {
    if(!queue.length || animating) {
        setTimeout(checkQueue, 5 * 1000);
        return;
    }
    let queueItem = queue.pop();
    actOnQueue(queueItem.user, queueItem.type);
    setTimeout(checkQueue, 5 * 1000);
}

function actOnQueue(data, type) {
    log.alert('Pushing queue item...');
    animating = true;
    switch (type) {
        case 'follower':
            emitter.emit('followAlert', data);
            break;
        case 'host':
            emitter.emit('hostAlert', data);
            break;
        case 'subscriber':
            emitter.emit('subscriberAlert', data);
            break;
        case 'tip':
            emitter.emit('tipAlert', data);
            break;
    }
}

emitter.on('testFollower', (username) => {
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

emitter.on('testHost', (hostObj) => {
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

emitter.on('testTip', (data) => {
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

emitter.on('tipeeeEvent', (data) => {
    queue.push(data);
});

function resolveUser(username, callback) {
    client.api({
        url: `/users/${username}`,
        method: 'GET',
        headers: {
            'Accept': "application/vnd.twitchtv.v3+json",
            // 'Authorization': 'OAuth ' + channel.token.slice(6),
            'Client-ID': CLIENT_ID
        }
    }, (err, res, body) => {
        if (err) {
            log.debug(err);
            return;
        }

        try {
            body = JSON.parse(body);
        } catch (error) {
            log.debug(error);
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
}

module.exports.initAPI = initAPI;
module.exports.pollFollowers = pollFollowers;
module.exports.checkQueue = checkQueue;