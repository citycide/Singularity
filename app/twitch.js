/*********************************** TWITCH ***********************************/
'use strict';

var request = require('request');
var irc = require('tmi.js');
var emitter = require('./emitter');
var log = require('./logger');
var config = require('./configstore');
var db = require('./db');
var moment = require('../public/js/moment.min');

var channel = {
    name: config.get('channel'),
    id: config.get('channelID'),
    token: config.get('accessToken')
};
var clientID = config.get('clientID');
var animating = false;
var followers = [];
var queue = [];

emitter.on('alertComplete', function () {
    animating = false;
});

var options = {
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

var client = new irc.client(options);
var baseURL = 'https://api.twitch.tv/kraken';
var channelEP = '/channels/' + channel.name + '/';

function initAPI(pollInterval) {
    log.msg('Initializing Twitch API requests');
    if (!pollInterval) pollInterval = 30 * 1000;
    setTimeout(function() {
        pollFollowers(pollInterval);
        // pollDonations(pollInterval);
    }, 5000);
}

function pollFollowers(pollInterval) {
    if (!pollInterval) pollInterval = 30 * 1000;
    log.msg('Hitting follower endpoint for ' + channel.name + '...');
    client.api({
        url: baseURL + channelEP + 'follows' + '?limit=100&timestamp=' + new Date().getTime(),
        method: 'GET',
        headers: {
            'Accept': "application/vnd.twitchtv.v3+json",
            // 'Authorization': 'OAuth ' + channel.token.slice(6),
            'Client-ID': clientID
        }
    }, function (err, res, body) {
        if (err) {
            log.debug(err);
            setTimeout(pollFollowers, pollInterval);
            return;
        }
        if (res.statusCode != 200) {
            log.debug('Unknown response code: ' + res.statusCode);
            setTimeout(pollFollowers, pollInterval);
            return;
        }

        try {
            body = JSON.parse(body);
        } catch (error) {
            log.debug(error);
            return;
        }

        var i, thisUser, storeThisFollower, storeNewFollower;
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
                            type: "follower"
                        };
                        if (followers.indexOf(thisUser.user.display_name) == -1) {
                            followers.push(thisUser.user.display_name);
                        }
                        storeThisFollower = {
                            twitch_id: thisUser.user._id,
                            timestamp: moment(thisUser.created_at),
                            name: thisUser.user.display_name
                        };
                        db.events.find({"follows.twitch_id": {$exists: thisUser.user._id}}, function (err, docs) {
                            if (err) {
                                log.debug(err);
                                db.events.insert({follows: [storeNewFollower]})
                            }
                        });
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
                            type: "follower"
                        };
                        if (followers.indexOf(thisUser.user.display_name) == -1) {
                            followers.push(thisUser.user.display_name);
                            queue.push(thisUser);
                            storeNewFollower = {
                                twitch_id: thisUser.user._id,
                                timestamp: moment(thisUser.created_at),
                                name: thisUser.user.display_name
                            };
                            db.events.update({follows: [{twitch_id: thisUser.user._id}]}, {follows: [storeNewFollower]}, {upsert: true});
                        }
                    }
                }
            }
        }
        checkQueue();
        setTimeout(pollFollowers, pollInterval);
    });
}

client.on('hosted', function (channel, username, viewers) {
    var thisHost;
    resolveUser(username, function(userObj) {
        if (userObj.resolved) {
            thisHost = {
                user: {
                    _id: userObj.user._id,
                    display_name: userObj.user.display_name,
                    logo: userObj.user.logo,
                    viewers: viewers
                },
                type: "host"
            };
        } else {
            thisHost = {
                user: {
                    display_name: userObj.user.display_name,
                    viewers: viewers
                },
                type: "host"
            };
        }
        queue.push(thisHost);
        checkQueue();
    });
});

client.on('subscription', function (channel, username) {
    var thisSub;
    resolveUser(username, function(userObj) {
        if (userObj.resolved) {
            thisSub = {
                user: {
                    _id: userObj.user._id,
                    display_name: userObj.user.display_name,
                    logo: userObj.user.logo
                },
                type: "subscriber"
            };
        } else {
            thisSub = {
                user: {
                    display_name: userObj.user.display_name
                },
                type: "subscriber"
            };
        }
        queue.push(thisSub);
        checkQueue();
    });
});

client.on('subanniversary', function (channel, username, months) {
    var thisResub;
    resolveUser(username, function(userObj) {
        if (userObj.resolved) {
            thisResub = {
                user: {
                    _id: userObj.user._id,
                    display_name: userObj.user.display_name,
                    logo: userObj.user.logo,
                    months: months
                },
                type: "subscriber"
            };
        } else {
            thisResub = {
                user: {
                    display_name: userObj.user.display_name,
                    months: months
                },
                type: "subscriber"
            };
        }
        queue.push(thisResub);
        checkQueue();
    });
});

function checkQueue() {
    if(!queue.length || animating) return;
    var queueItem = queue.pop();
    actOnQueue(queueItem.user, queueItem.type);
}

function actOnQueue(data, type) {
    log.alert('Pushing queue item...');
    animating = true;
    switch (type) {
        case "follower":
            emitter.emit('followAlert', data);
            break;
        case "host":
            emitter.emit('hostAlert', data);
            break;
        case "subscriber":
            emitter.emit('subscriberAlert', data);
            break;
        case "donor":
            emitter.emit('donationAlert', data);
            break;
    }
}

emitter.on('testFollower', function(user) {
    var thisTest;
    resolveUser(user, function(userObj) {
        if (userObj.resolved) {
            thisTest = {
                user: {
                    _id: userObj.user._id,
                    display_name: userObj.user.display_name,
                    logo: userObj.user.logo
                },
                type: "follower"
            };
        } else {
            thisTest = {
                user: {
                    display_name: userObj.user.display_name
                },
                type: "follower"
            };
        }
        queue.push(thisTest);
        checkQueue();
    });
});

function resolveUser(username, callback) {
    client.api({
        url: '/users/' + username,
        method: 'GET',
        headers: {
            'Accept': "application/vnd.twitchtv.v3+json",
            'Authorization': 'OAuth ' + channel.token.slice(6),
            'Client-ID': clientID
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
                var unresolvedUser = {
                    user: {
                        display_name: username
                    }
                };
                callback(unresolvedUser);
                return;
            }
            var resolvedUser = {
                user: {
                    _id: body._id,
                    display_name: body.display_name,
                    logo: body.logo
                },
                resolved: true
            };
            // log.msg(body);
            callback(resolvedUser);
        }
    });
}

module.exports.initAPI = initAPI;
module.exports.pollFollowers = pollFollowers;
