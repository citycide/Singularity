/********************************** DATABASE **********************************/
const dbstore = require('./stores.js'),
      path = require('path'),
      log = require('./logger.js'),
      moment = require('../public/js/vendor/moment.min.js');

const db = dbstore(path.resolve(__dirname, '..', 'db', 'singularity.db'));
let botDB;

/**
 * Creates a table of followers with columns:
 * twitchid | username | timestamp | evtype
 */
db.run('CREATE TABLE IF NOT EXISTS followers (twitchid INT UNIQUE, username TEXT, timestamp TEXT, evtype TEXT, notifications TEXT);');

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

/**
 * @function - Creates or accesses bot.db when bot is enabled
 */
module.exports.initBotDB = () => {
    botDB = dbstore(path.resolve(__dirname, '..', 'db', 'bot.db'));
};

module.exports.addTable = (name, bot, ...args) => {
    let query = [];
    let unique = false;
    for (let key of args) {
        if (typeof key !== null && typeof key === 'object' && unique === false) {
            unique = true;
            if (key.hasOwnProperty('unique')) {
                query.push(`${key.name} TEXT UNIQUE`);
            }
        } else {
            query.push(`${key} TEXT`);
        }
    }
    let queryString = query.join(', ');
    if (!bot) {
        db.run(`CREATE TABLE IF NOT EXISTS ${name} (${queryString});`);
    } else {
        botDB.run(`CREATE TABLE IF NOT EXISTS ${name} (${queryString});`);
    }
};

/**
 * @function dbFollowersAdd
 * @description Adds a follower to the database, or updates one that already exists
 * @params [ id | username | (timestamp) | (notifications) ]
 */
module.exports.dbFollowersAdd = (id, username, timestamp, notifications) => {
    if (!id || !username) {
        log.err('Failed to add or update follower. ID & username are required.');
        return;
    }
    db.run('INSERT OR REPLACE INTO followers (twitchid, username, timestamp, evtype, notifications)' +
           `VALUES ("${id}", "${username}", "${timestamp}", "follower", "${notifications}");`);
};

/**
 * @function dbSubscribersAdd
 * @description Adds a subscriber to the database, or updates one that already exists
 * @params [ id | username | (timestamp) | (months) ]
 */
module.exports.dbSubscribersAdd = (id, username, timestamp, months) => {
    let evtype = 'subscriber';
    if (!id || !username) {
        log.err('Failed to add or update subscriber. ID & username are required.');
        return;
    }
    if (months && months > 0) evtype = 'resub';
    db.run('INSERT OR REPLACE INTO subscribers (twitchid, username, timestamp, evtype, months)' +
        `VALUES ("${id}", "${username}", "${timestamp}", "${evtype}", "${months}");`);
};

/**
 * @function dbHostsAdd
 * @description Adds a host event to the database
 * @params [ id | username | (timestamp) | viewers ]
 */
module.exports.dbHostsAdd = (id, username, timestamp, viewers) => {
    if (!username || !viewers) {
        log.err('Failed to add host. Username & viewers are required.');
        return;
    }
    db.run(`INSERT INTO hosts VALUES ("${id}", "${username}", "${timestamp}", "host", "${viewers}");`);
};

/**
 * @function dbTipsAdd
 * @description Adds a tip event to the database
 * @params [ id | username | timestamp | amount | (message) ]
 */
module.exports.dbTipsAdd = (username, timestamp, amount, message) => {
    if (!username || !amount) {
        log.err('Failed to add tip. Name & amount are required.');
        return;
    }
    db.run(`INSERT INTO tips VALUES ("${username}", "${timestamp}", "tip", "${amount}", "${message}");`);
};

module.exports.dbGetFollows = () => {
    const CUTOFF = moment().subtract(60, 'days').valueOf();
    return db.select(`SELECT * FROM followers WHERE timestamp > ${CUTOFF} ORDER BY timestamp DESC`);
};

module.exports.makeFollowObj = (follower) => {
    return db.newFollowerObj(follower);
};

module.exports.bot = {
    addCommand: (name, cooldown, permission, status, module) => {
        if (!name || !module) {
            log.bot('Failed to add command. Name & module are required.');
            return;
        }
        botDB.run('INSERT OR REPLACE INTO commands (name, cooldown, permission, status, module)' +
            `VALUES ("${name}", "${cooldown}", "${permission}", "${status}", "${module}");`);
    },

    initSettings: () => {
        botDB.run('INSERT OR REPLACE INTO settings (key, value, info)' +
            `VALUES ("prefix","!","");`);
        botDB.run('' +
            `VALUES ("defaultCooldown","30","");`);
    },

    addUser: (user) => {
        botDB.run('INSERT OR REPLACE INTO users (name, permission, mod, following, seen)' +
            `VALUES ("${user.name}","${user.permLevel}","${user.mod}","${user.following}","${user.seen}");`)
    },

    getPermLevel: (user) => {
        return botDB.get(`SELECT permission FROM users WHERE name="${user}"`)[0].values[0][0];
    },

    getStatus: (cmd) => {
        return botDB.get(`SELECT status FROM commands WHERE name="${cmd}"`)[0].values[0][0];
    },
    
    getCommandPrefix: () => {
        return botDB.get(`SELECT value FROM settings WHERE key="prefix"`)[0].values[0][0];
    }
};

module.exports.dbGetEvents = () => {
    const CUTOFF = moment().subtract(60, 'days').valueOf();
    let followers =
        db.select(`SELECT * FROM followers WHERE timestamp > ${CUTOFF} ORDER BY timestamp DESC`).array[0].values;
    let hosts =
        db.select('SELECT * FROM hosts ORDER BY timestamp DESC').array[0].values;

    let events = followers.concat(hosts);
    events = events.sort((a, b) => {
        let x = a[2];
        let y = b[2];
        return y-x;
    });
    return events;
};