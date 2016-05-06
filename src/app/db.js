/********************************** DATABASE **********************************/
'use strict';

const dbstore = require('./stores.js');
import path from 'path';
import jetpack from 'fs-jetpack';
import moment from 'moment';

let db = null, botDB = null;

/**
 * @function - Creates or accesses singularity.db
 */
{
    jetpack.dir(path.resolve(__dirname, '..', 'db'));
    db = dbstore(path.resolve(__dirname, '..', 'db', 'singularity.db'));
}

/**
 * Creates a table of followers with columns:
 * twitchid | username | timestamp | evtype
 */
db.run('CREATE TABLE IF NOT EXISTS followers (twitchid INT UNIQUE, username TEXT, timestamp TEXT, evtype TEXT, notifications TEXT);');

/**
 * Creates a table of subscribers with columns:
 * twitchid | username | timestamp | evtype | months
 */
db.run('CREATE TABLE IF NOT EXISTS subscribers (twitchid INT UNIQUE, username TEXT, timestamp TEXT, evtype TEXT, months TEXT);');

/**
 * Creates a table of host events with columns:
 * twitchid | username | timestamp | evtype | viewers
 */
db.run('CREATE TABLE IF NOT EXISTS hosts (twitchid TEXT, username TEXT, timestamp TEXT, evtype TEXT, viewers TEXT);');

/**
 * Creates a table of tip events with columns:
 * twitchid | username | timestamp | evtype | amount | message
 */
db.run('CREATE TABLE IF NOT EXISTS tips (username TEXT, timestamp TEXT, evtype TEXT, amount TEXT, message TEXT);');

/**
 * Collection of api methods for main database functions
 * @export default
 */
module.exports = {
    /**
     * @function - Creates or accesses bot.db when bot is enabled
     */
    initBotDB: () => {
        botDB = dbstore(path.resolve(__dirname, '..', 'db', 'bot.db'));
    },
    addTable: (name, bot, ...args) => {
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
    },

    /**
     * @function dbFollowersAdd
     * @description Adds a follower to the database, or updates one that already exists
     * @params [ id | username | (timestamp) | (notifications) ]
     */
    dbFollowersAdd: (id, username, timestamp, notifications) => {
        if (!id || !username) {
            Logger.error('Failed to add or update follower. ID & username are required.');
            return;
        }
        db.run('INSERT OR REPLACE INTO followers (twitchid, username, timestamp, evtype, notifications)' +
            `VALUES ("${id}", "${username}", "${timestamp}", "follower", "${notifications}");`);
    },

    /**
     * @function dbSubscribersAdd
     * @description Adds a subscriber to the database, or updates one that already exists
     * @params [ id | username | (timestamp) | (months) ]
     */
    dbSubscribersAdd: (id, username, timestamp, months) => {
        let evtype = 'subscriber';
        if (!id || !username) {
            Logger.error('Failed to add or update subscriber. ID & username are required.');
            return;
        }
        if (months && months > 0) evtype = 'resub';
        db.run('INSERT OR REPLACE INTO subscribers (twitchid, username, timestamp, evtype, months)' +
            `VALUES ("${id}", "${username}", "${timestamp}", "${evtype}", "${months}");`);
    },

    /**
     * @function dbHostsAdd
     * @description Adds a host event to the database
     * @params [ id | username | (timestamp) | viewers ]
     */
    dbHostsAdd: (id, username, timestamp, viewers) => {
        if (!username || !viewers) {
            Logger.error('Failed to add host. Username & viewers are required.');
            return;
        }
        db.run(`INSERT INTO hosts VALUES ("${id}", "${username}", "${timestamp}", "host", "${viewers}");`);
    },

    /**
     * @function dbTipsAdd
     * @description Adds a tip event to the database
     * @params [ id | username | timestamp | amount | (message) ]
     */
    dbTipsAdd: (username, timestamp, amount, message) => {
        if (!username || !amount) {
            Logger.error('Failed to add tip. Name & amount are required.');
            return;
        }
        db.run(`INSERT INTO tips VALUES ("${username}", "${timestamp}", "tip", "${amount}", "${message}");`);
    },
    dbGetFollows: () => {
        const CUTOFF = moment().subtract(60, 'days').valueOf();
        return db.select(`SELECT * FROM followers WHERE timestamp > ${CUTOFF} ORDER BY timestamp DESC`);
    },
    dbGetEvents: () => {
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
    }
};

module.exports.makeFollowObj = (follower) => {
    return db.newFollowerObj(follower);
};

/**
 * Collection of api methods related to the bot database
 * @export bot
 */
module.exports.bot = {
    addCommand: (name, cooldown, permission, status, module) => {
        if (!name || !module) {
            Logger.bot('Failed to add command. Name & module are required.');
            return;
        }
        botDB.run('INSERT INTO commands (name, cooldown, permission, status, module)' +
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
        let permission = 7;
        try {
            permission = botDB.get(`SELECT permission FROM users WHERE name='${user}'`)[0].values[0][0];
            return permission;
        } catch (err) {
            Logger.debug(err);
        }
    },

    // @TODO Always returns true?? What the eff.
    getStatus: (cmd) => {
        let status = false;
        try {
            status = botDB.get(`SELECT status FROM commands WHERE name='${cmd}'`)[0].values[0][0];
            status = (status === 'true');
            Logger.trace(`'${cmd}' is ${(status) ? 'enabled' : 'disabled'}.`);
            return status;
        } catch (err) {
            Logger.error(err);
        }
    },

    setCommandStatus: (cmd, bool) => {
        if (typeof bool !== 'string') bool = bool.toString();
        if (bool !== 'true' && bool !== 'false') {
            return Logger.debug('ERR in setCommandStatus:: requires boolean string');
        }
        botDB.run(`UPDATE commands SET status = '${bool}' WHERE name='${cmd}'`);
        // return (botDB.get(`SELECT status FROM commands WHERE name='${cmd}'`)[0].values[0][0] === 'true');
    },
    
    getCommandPrefix: () => {
        return botDB.get(`SELECT value FROM settings WHERE key='prefix'`)[0].values[0][0];
    }
};

/*
import NeDB from 'nedb';

let _db = {};
_db.main = new NeDB({
    filename: path.resolve(__dirname, '..', 'db', 'singularity_test.db'),
    autoload: true
});
_db.main.ensureIndex({ fieldName: 'id', unique: true });

_db.test = new NeDB({
    filename: path.resolve(__dirname, '..', 'db', 'test.db'),
    autoload: true
});
_db.test.insert({ followers: {}, subscribers: {}, hosts: {}, tips: {} });
 */

/**
 * @function _dbFollowersAdd
 * @description Adds a follower to the database, or updates one that already exists
 * @params [ id | username | (timestamp) | (notifications) ]
 */
/*
module.exports._dbFollowersAdd = (id, username, timestamp, notifications) => {
    if (!id || !username) {
        Logger.error('Failed to add or update follower. ID & username are required.');
        return;
    }
    // _db.main.insert({ id, username, timestamp, notifications });

    _db.main.find({ id }, (err, docs) => {
        if (docs.length < 1) {
            _db.main.insert({ id, username, timestamp, notifications }, (err) => {
                if (err) Logger.debug(err);
                Logger.trace(`New follower added: ${username}`);
            });
        } else {
            Logger.trace(`${username} is already in the database.`);
        }
    });
    _db.test.find({ 'followers.id': id }, (err, followers) => {
        if (followers.length < 1) {
            _db.test.insert({ 'followers.id': id, username, timestamp, notifications }, (err) => {
                if (err) Logger.debug(err);
                Logger.trace(`New follower added: ${username}`);
            });
        } else {
            Logger.trace(`${username} is already in the database.`);
        }
    });
};

setTimeout(() => {
    _db.main.find({ name: 'test' }, (err, docs) => {
        if (err) Logger.debug(err);
        Logger.info(docs);
    });
}, 5000);
*/

/*
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

module.exports.dbFollowersAdd = (id, username, timestamp, notifications) => {
    if (!id || !username) {
        Logger.error('Failed to add or update follower. ID & username are required.');
        return;
    }
    db.run('INSERT OR REPLACE INTO followers (twitchid, username, timestamp, evtype, notifications)' +
        `VALUES ("${id}", "${username}", "${timestamp}", "follower", "${notifications}");`);
};

module.exports.dbSubscribersAdd = (id, username, timestamp, months) => {
    let evtype = 'subscriber';
    if (!id || !username) {
        Logger.error('Failed to add or update subscriber. ID & username are required.');
        return;
    }
    if (months && months > 0) evtype = 'resub';
    db.run('INSERT OR REPLACE INTO subscribers (twitchid, username, timestamp, evtype, months)' +
        `VALUES ("${id}", "${username}", "${timestamp}", "${evtype}", "${months}");`);
};

module.exports.dbHostsAdd = (id, username, timestamp, viewers) => {
    if (!username || !viewers) {
        Logger.error('Failed to add host. Username & viewers are required.');
        return;
    }
    db.run(`INSERT INTO hosts VALUES ("${id}", "${username}", "${timestamp}", "host", "${viewers}");`);
};

module.exports.dbTipsAdd = (username, timestamp, amount, message) => {
    if (!username || !amount) {
        Logger.error('Failed to add tip. Name & amount are required.');
        return;
    }
    db.run(`INSERT INTO tips VALUES ("${username}", "${timestamp}", "tip", "${amount}", "${message}");`);
};

module.exports.dbGetFollows = () => {
    const CUTOFF = moment().subtract(60, 'days').valueOf();
    return db.select(`SELECT * FROM followers WHERE timestamp > ${CUTOFF} ORDER BY timestamp DESC`);
};


*/