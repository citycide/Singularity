/*********************************** TWITCH ***********************************/
'use strict';

var request = require('request');
var TwitchClient = require('node-twitch-api');
var emitter = require('./emitter');
var config = require('./configstore');
var db = require('./db');
var moment = require('../public/js/moment.min');

var animating = false;
var followers = [];
var queue = [];

emitter.on('alertComplete', function () {
    animating = false;
    checkQueue();
});

var twitch = new TwitchClient({
    "client_id": config.get('clientID'),
    "access_token": config.get('accessToken'),
    "scope": "user_read channel_read channel_editor channel_subscriptions chat_login"
});

function pollFollowers(pollInterval) {
    if (!pollInterval) pollInterval = 15 * 1000;
    twitch.get('/channels/:channel/follows', {channel: config.get('currentUser'), limit: 50},
        function(err, res) {
            if (err) {
                console.log(err);
                setTimeout(pollFollowers, pollInterval);
                return;
            }

            var i, thisUser, storeThisFollower, storeNewFollower;
            if (res) {
                console.log(res);
                if (res.follows.length > 0) {
                    if (followers.length === 0) {
                        for (i = 0; i < res.follows.length; i++) {
                            thisUser = {
                                user: {
                                    _id: res.follows[i].user._id,
                                    display_name: res.follows[i].user.display_name,
                                    logo: res.follows[i].user.logo,
                                    created_at: res.follows[i].created_at,
                                    notifications: res.follows[i].notifications
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
                            db.events.find({ "follows.twitch_id": { $exists: thisUser.user._id}}, function(err, docs) {
                                if (err) {
                                    console.log(err);
                                    db.events.insert({follows: [storeNewFollower]})
                                }
                            });
                        }
                    } else {
                        for (i = 0; i < res.follows.length; i++) {
                            thisUser = {
                                user: {
                                    _id: res.follows[i].user._id,
                                    display_name: res.follows[i].user.display_name,
                                    logo: res.follows[i].user.logo,
                                    created_at: res.follows[i].created_at,
                                    notifications: res.follows[i].notifications
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
                                checkQueue();
                            }
                        }
                    }
                }
            }
            setTimeout(pollFollowers, pollInterval);
        }
    );
}

function checkQueue() {
    if(!queue.length || animating) return;
    var queueItem = queue.shift();
    actOnQueue(queueItem.user, queueItem.type);
}

function actOnQueue(data, type) {
    console.log('Pushing queue item...');
    animating = true;
    switch (type) {
        case "follower":
            emitter.emit('followAlert', data);
            break;
        case "hoster":
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
    resolveUser(user, "follower", function(userObj) {
        queue.push(userObj);
        checkQueue();
    });
});

function resolveUser(username, type, callback) {
    type = type.toString();
    if (type != "follower" && type != "hoster" && type != "subscriber" && type != "donor") {
        console.log('Error while resolving user. Type argument is invalid.');
        return;
    }
    twitch.get('/users/:user', {user: username},
        function(err, res) {
            if (err) {
                console.log(err);
                return;
            }

            if (res) {
                if (res.error) {
                    var unresolvedUser = {
                        user: {
                            display_name: username
                        },
                        type: type
                    };
                    callback(unresolvedUser);
                    return;
                }
                var resolvedUser = {
                    user: {
                        _id: res._id,
                        display_name: res.display_name,
                        logo: res.logo
                    },
                    type: type
                };
                console.log(res);
                callback(resolvedUser);
            }
        }
    );
}

module.exports.pollFollowers = pollFollowers;
