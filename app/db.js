/********************************** DATABASE **********************************/
const dbstore = require('./stores.js'),
      path = require('path'),
      log = require('./logger.js'),
      moment = require('../public/js/vendor/moment.min.js');

const db = dbstore(path.resolve(__dirname, '..', 'db', 'singularity.db'));

/*
 * Creates a table of followers with columns:
 * twitchid | username | timestamp | evtype
 */
db.run('CREATE TABLE IF NOT EXISTS followers (twitchid TEXT UNIQUE, username TEXT, timestamp TEXT, evtype TEXT, notifications TEXT);');

/*
 * Creates a table of subscribers with columns:
 * twitchid | username | timestamp | evtype | months
 */
db.run('CREATE TABLE IF NOT EXISTS subscribers (twitchid TEXT UNIQUE, username TEXT, timestamp TEXT, evtype TEXT, months TEXT);');

/*
 * Creates a table of host events with columns:
 * twitchid | username | timestamp | evtype | viewers
 */
db.run('CREATE TABLE IF NOT EXISTS hosts (twitchid TEXT, username TEXT, timestamp TEXT, evtype TEXT, viewers TEXT);');

/*
 * Creates a table of tip events with columns:
 * twitchid | username | timestamp | evtype | amount | message
 */
db.run('CREATE TABLE IF NOT EXISTS tips (username TEXT, timestamp TEXT, evtype TEXT, amount TEXT, message TEXT);');

/*
 * @function dbFollowersAdd
 * @description Adds a follower to the database, or updates one that already exists
 * @params [ id | username | (timestamp) | (notifications) ]
 */
module.exports.dbFollowersAdd = function(id, username, timestamp, notifications) {
    if (!id || !username) {
        log.err('Failed to add or update follower. ID & username are required.');
        return;
    }
    db.run('INSERT OR REPLACE INTO followers (twitchid, username, timestamp, evtype, notifications)' +
           `VALUES ("${id}", "${username}", "${timestamp}", "follower", "${notifications}");`);
};

/*
 * @function dbSubscribersAdd
 * @description Adds a subscriber to the database, or updates one that already exists
 * @params [ id | username | (timestamp) | (months) ]
 */
module.exports.dbSubscribersAdd = function(id, username, timestamp, months) {
    let evtype = 'subscriber';
    if (!id || !username) {
        log.err('Failed to add or update subscriber. ID & username are required.');
        return;
    }
    if (months && months > 0) evtype = 'resub';
    db.run('INSERT OR REPLACE INTO subscribers (twitchid, username, timestamp, evtype, months)' +
        `VALUES ("${id}", "${username}", "${timestamp}", "${evtype}", "${months}");`);
};

/*
 * @function dbHostsAdd
 * @description Adds a host event to the database
 * @params [ id | username | (timestamp) | viewers ]
 */
module.exports.dbHostsAdd = function(id, username, timestamp, viewers) {
    if (!username || !viewers) {
        log.err('Failed to add host. Username & viewers are required.');
        return;
    }
    db.run(`INSERT INTO hosts VALUES ("${id}", "${username}", "${timestamp}", "host", "${viewers}");`);
};

/*
 * @function dbTipsAdd
 * @description Adds a tip event to the database
 * @params [ id | username | timestamp | amount | (message) ]
 */
module.exports.dbTipsAdd = function(username, timestamp, amount, message) {
    if (!username || !amount) {
        log.err('Failed to add tip. Name & amount are required.');
        return;
    }
    db.run(`INSERT INTO tips VALUES ("${username}", "${timestamp}", "tip", "${amount}", "${message}");`);
};

module.exports.dbGetFollows = function() {
    const CUTOFF = moment().subtract(60, 'days').valueOf();
    return db.select(`SELECT * FROM followers WHERE timestamp > ${CUTOFF} ORDER BY timestamp DESC`);
};

module.exports.makeFollowObj = function(follower) {
    return db.newFollowerObj(follower);
};

module.exports.dbGetEvents = function() {
    const CUTOFF = moment().subtract(60, 'days').valueOf();
    let followers =
        db.select(`SELECT * FROM followers WHERE timestamp > ${CUTOFF} ORDER BY timestamp DESC`).array[0].values;
    let hosts =
        db.select('SELECT * FROM hosts ORDER BY timestamp DESC').array[0].values;

    let events = followers.concat(hosts);
    events = events.sort(function(a, b) {
        let x = a[2];
        let y = b[2];
        return y-x;
    });
    return events;
};