/*********************************** TWITCH ***********************************/
'use strict';

const request = require('request'),
      irc = require('tmi.js'),
      fs = require('fs'),
      emitter = require('./emitter'),
      log = require('./logger'),
      config = require('./configstore'),
      db = require('./db'),
      moment = require('../public/js/vendor/moment.min.js');

const channel = {
    name: config.get('channel'),
    id: config.get('channelID'),
    token: config.get('accessToken')
};
const CLIENT_ID = config.get('clientID');
let animating = false,
    followers = [],
    queue = [];

emitter.on('alertComplete', function () {
    animating = false;
});

const OPTIONS = {
    options: {
        debug: false
    },
    connection: {
        random: 'chat',
        reconnect: true
    },
    identity: {
        username: channel.name,
        password: channel.token
    },
    channels: [channel.name]
};

const client = new irc.client(OPTIONS);
      client.connect();
const BASE_URL = 'https://api.twitch.tv/kraken';
const CHANNEL_EP = `/channels/${channel.name}/`;

function initAPI(pollInterval) {
    log.msg('Initializing Twitch API requests');
    if (!pollInterval) pollInterval = 30 * 1000;
    setTimeout(function() {
        pollFollowers(pollInterval);
    }, 5000);
    setTimeout(checkQueue, 10000);
}

function pollFollowers(pollInterval) {
    if (!pollInterval) pollInterval = 30 * 1000;
    log.msg(`Hitting follower endpoint for ${channel.name}...`);
    client.api({
        url: `${BASE_URL}${CHANNEL_EP}follows?limit=100&timestamp=` + new Date().getTime(),
        method: 'GET',
        headers: {
            'Accept': "application/vnd.twitchtv.v3+json",
            // 'Authorization': 'OAuth ' + channel.token.slice(6),
            'Client-ID': CLIENT_ID
        }
    }, function (err, res, body) {
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

        var i, thisUser, s, n;
        if (body) {
            if (body.follows.length > 0) {
                if (followers.length === 0) {
                    for (i = 0; i < body.follows.length; i++) {
                        thisUser = {
                            user: {
                                _id: body.follows[i].user._id,
                                display_name: body.follows[i].user.display_name,
                                logo: body.follows[i].user.logo,
                                created_at: body.follows[i].created_at,
                                notifications: body.follows[i].notifications
                            },
                            type: 'follower'
                        };
                        if (followers.indexOf(thisUser.user.display_name) == -1) {
                            followers.push(thisUser.user.display_name);
                        }
                        s = {
                            id: thisUser.user._id,
                            name: thisUser.user.display_name,
                            ts: moment(thisUser.user.created_at, moment.ISO_8601).valueOf(),
                            ev: 'follower',
                            ntf: thisUser.user.notifications
                        };
                        db.dbFollowersAdd(s.id, s.name, s.ts, s.ntf.toString());
                    }
                } else {
                    for (i = 0; i < body.follows.length; i++) {
                        thisUser = {
                            user: {
                                _id: body.follows[i].user._id,
                                display_name: body.follows[i].user.display_name,
                                logo: body.follows[i].user.logo,
                                created_at: body.follows[i].created_at,
                                notifications: body.follows[i].notifications
                            },
                            type: 'follower'
                        };
                        // writeFollower(thisUser.display_name);
                        if (followers.indexOf(thisUser.user.display_name) == -1) {
                            followers.push(thisUser.user.display_name);
                            queue.push(thisUser);
                            n = {
                                id: thisUser.user._id,
                                name: thisUser.user.display_name,
                                ts: moment(thisUser.created_at).valueOf(),
                                ev: 'follower',
                                ntf: thisUser.user.notifications
                            };
                            db.dbFollowersAdd(n.id, n.name, n.ts, n.ntf.toString());
                        }
                    }
                }
            }
        }
        setTimeout(pollFollowers, pollInterval);
    });
}

/** DOESN'T WORK
 * Should write the latest follower to a text file but fails if the file doesn't exist...
function writeFollower(followerName) {
    var followerFile = __dirname + '/../outputs/latestfollower.txt';
    fs.statSync(followerFile, function(err, stats) {
        if (err && err.errno === 34) {
            fs.writeFile(followerFile, ' ', function (err) {
                if (err) return console.log(err);
            });
        }
        if (followerName !== fs.readFileSync(followerFile)) {
            fs.writeFile(followerFile, followerName, function (err) {
                if (err) return console.log(err);
            });
        }
    });
}
*/

client.on('hosted', function (channel, username, viewers) {
    let thisHost;
    resolveUser(username, function(userObj) {
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

client.on('subscription', function (channel, username) {
    let thisSub;
    resolveUser(username, function(userObj) {
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

client.on('subanniversary', function (channel, username, months) {
    let thisResub;
    resolveUser(username, function(userObj) {
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
            db.dbSubscribersAdd(thisSub.user._id, thisSub.user.display_name, moment().valueOf, thisResub.user.months);
        } else {
            thisResub = {
                user: {
                    display_name: userObj.user.display_name,
                    months: months
                },
                type: 'subscriber'
            };
            db.dbSubscribersAdd(null, thisSub.user.display_name, moment().valueOf, thisResub.user.months);
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

emitter.on('testFollower', function(username) {
    let thisTest;
    resolveUser(username, function(userObj) {
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

emitter.on('testHost', function(hostObj) {
    let thisTest;
    resolveUser(hostObj.user.display_name, function(userObj) {
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

emitter.on('testTip', function(data) {
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

emitter.on('tipeeeEvent', function (data) {
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
    }, function(err, res, body) {
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