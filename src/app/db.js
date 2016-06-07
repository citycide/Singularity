import path from 'path';
import jetpack from 'fs-jetpack';
import moment from 'moment';
import { app } from 'electron';
import util from './main/utils/util';
import Trilogy from './main/utils/Trilogy.js';

let db = null, botDB = null;

/**
 * @function
 * @description Creates or accesses singularity.db
 */
{
    /**
     * Store the database in the /build directory
     * Probably best for development, so maybe make it based on dev mode?
     * Possibly make it user-defined as well
     */
    jetpack.dir(path.resolve(__dirname, '..', 'db'));
    db = new Trilogy(path.resolve(__dirname, '..', 'db', 'singularity.db'));

    /**
     * ... or in the app's directory in the user's home folder?
    jetpack.dir(path.resolve(Settings.get('dataPath'), 'db'));
    db = dbstore(path.resolve(Settings.get('dataPath'), 'db', 'singularity.db'));
    */

    /**
     * ... or in the app's directory in the OS app folder?
    jetpack.dir(path.resolve(app.getAppPath(), 'db'));
    db = dbstore(path.resolve(app.getAppPath(), 'db', 'singularity.db'));
    */
}

/**
 * Collection of api methods for main database functions
 * @export default
 */
const data = {
    /**
     * @function - Creates or accesses bot.db when bot is enabled
     */
    initBotDB(fn = () => {}) {
        botDB = new Trilogy(path.resolve(__dirname, '..', 'db', 'bot.db'));
        fn();
        return botDB;
    },
    errHandler(err) {
        if (err) return Logger.error(err);
    },
    addTable(name, args, bot = false, ifNotExists = true, fn = this.errHandler) {
        if (!bot) {
            db.create(name, args, ifNotExists, (err, res) => {
                if (err) Logger.error(err);
                if (fn) fn(err, res);
            });
        } else {
            botDB.create(name, args, ifNotExists, (err, res) => {
                fn(err, res);
            });
        }
        return this;
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
        db.put('followers', { twitchid: id, username, timestamp, evtype: 'follower', notifications }, { conflict: 'replace' }, (err, res) => {
            if (err) Logger.error(err);
        });
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
        db.put('subscribers', { twitchid: id, username, timestamp, evtype, months }, { conflict: 'replace' }, (err, res) => {
            if (err) Logger.error(err);
        });

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
        db.put('hosts', { twitchid: id, username, timestamp, evtype: 'host', viewers }, (err, res) => {
            if (err) Logger.error(err);
        });
    },

    /**
     * @function dbTipsAdd
     * @description Adds a tip event to the database
     * @params [ id | username | timestamp | amount | (message) ]
     */
    dbTipsAdd: (username, timestamp, amount, message = '') => {
        if (!username || !amount) {
            Logger.error('Failed to add tip. Name & amount are required.');
            return;
        }
        db.put('tips', { username, timestamp, evtype: 'tip', amount, message }, (err, res) => {
            if (err) Logger.error(err);
        });
    },
    getRecentFollows: () => {
        const CUTOFF = moment().subtract(60, 'days').valueOf();
        const response = db.get('followers', ' * ', { timestamp: { gt: CUTOFF } }, { desc: 'timestamp' });
        for (let follow of response) {
            follow.age = moment(follow.timestamp, 'x').fromNow();
        }
        return response;
    },
    getFollows: () => {
        const response = db.get('followers', ' * ', null, { desc: 'timestamp' });
        for (let follow of response) {
            follow.age = moment(follow.timestamp, 'x').fromNow(' ');
        }
        return response;
    },
    
    /**
     * @TODO make this actually pull & combine the different types of events
     */
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

/**
 * Collection of api methods related to the bot database
 * @export bot
 */
data.bot = {
    initSettings: function() {
        this.settings.confirm('prefix', '!')
            .confirm('defaultCooldown', '30')
            .confirm('whisperMode', 'false')
            .confirm('globalCooldown', 'false')
            .confirm('followAlerts', 'true')
            .confirm('hostAlerts', 'true')
            .confirm('subAlerts', 'true')
            .confirm('tipAlerts', 'false')
            .confirm('responseMention', 'false')

            .confirm('pointsPayoutLive', '6')
            .confirm('pointsPayoutOffline', '-1')
            .confirm('pointsIntervalLive', '1')
            .confirm('pointsIntervalOffline', '-1');
    },

    settings: {
        get(key, fn) {
            let value = botDB.getValue('settings', 'value', { key });
            if (value !== null && value !== undefined) {
                if (value.hasOwnProperty('error')) return Logger.error(value.error);

                if (value === 'true' || value === 'false') value = (value === 'true');
                if (util.str.isNumeric(value)) value = parseInt(value);
                if (fn) {
                    fn(value);
                    return this;
                }
                return value;
            }
        },
        set(key, value) {
            if (typeof key !== 'string') return;
            if (typeof value === 'boolean') value = value.toString();
            botDB.put('settings', { key, value }, { conflict: 'replace'}, (err, res) => {
                if (err) Logger.error(err);
            });
            return this;
        },
        confirm(key, value) {
            // Only sets the value if the key does not exist
            if (typeof key !== 'string') return;
            if (typeof value === 'boolean') value = value.toString();
            botDB.put('settings', { key, value }, { conflict: 'ignore' }, (err, res) => {
                if (err) Logger.error(err);
            });
            return this;
        }
    },

    data: {
        get(table, what, where, fn) {
            let response = botDB.getValue(table, what, where);
            if (response === null) return;
            if (response) {
                if (response === 'true' || response === 'false') {
                    response = (response === 'true');
                }
                if (util.str.isNumeric(response)) response = parseInt(response);
                if (fn) {
                    fn(response);
                    return this;
                }
                return response;
            }
        },
        set(table, what, where = null, options = {}) {
            if (typeof table !== 'string') return;
            if (!(typeof what !== null && typeof what === 'object')) return;

            let whatWhere = Object.assign({}, what, where);

            let obj = { conflict: 'abort' };
            Object.assign(obj, options);
            
            botDB.put(table, whatWhere, obj, () => {
                if (obj.conflict === 'abort') {
                    if (typeof where !== null && typeof where === 'object') {
                        botDB.update(table, what, where);
                    }
                }
            });
            
            return this;
        },
        confirm(table, what, where) {
            if (typeof table !== 'string') return;
            if (!(typeof what !== null && typeof what === 'object')) return;

            let whatWhere = Object.assign({}, what, where);

            let obj = { conflict: 'abort' };

            botDB.put(table, whatWhere, obj, () => {});
            
            return this;
        },
        setPermissionTest(user, permission) {
            botDB.update('users', { permission }, { name: user });
        }
    },

    addCommand(name, cooldown, permission, status, price, module) {
        if (!name || !module) {
            Logger.bot('Failed to add command. Name & module are required.');
            return;
        }
        botDB.put('commands', { name, cooldown, permission, status, price, module }, { conflict: 'ignore' }, (err, res) => {
            if (err) Logger.error(err);
        });
        return this;
    },

    addSubCommand(name, cooldown, permission, status, price, module, parent) {
        if (!name || !module || !parent) {
            Logger.bot('Failed to add command. Name, module, & parent are required.');
            return;
        }
        botDB.put('subcommands', { name, cooldown, permission, status, price, module, parent }, { conflict: 'ignore' }, (err, res) => {
            if (err) Logger.error(err);
        });
        return this;
    },

    addUser(user) {
        const { name, permLevel, mod, following, seen, points } = user;
        botDB.put('users', { name, permission: permLevel, mod, following, seen, points }, { conflict: 'abort' }, (err, res) => {
            if (err) Logger.error(err);
            botDB.update('users', { permission: permLevel, mod, following, seen, points }, { name });
        });
    },

    getPermLevel: (user, fn = () => {}) => {
        const username = user['display-name'];
        const userType = user['user-type'];
        let defaultPermLevel = 7;
    
        if (userType === 'mod') defaultPermLevel = 1;
        if (username === Settings.get('channel') || username === Settings.get('botName'))
            defaultPermLevel = 7;
    
        const _permission = util.num.validate(botDB.getValue('users', 'permission', { name: username }));
        if (_permission >= 0) {
            fn(_permission);
            return _permission;
        } else {
            Logger.debug(`ERR in getPermLevel:: assigning default permissions to ${username}`);
            fn(defaultPermLevel);
            return defaultPermLevel;
        }
    }
};

{
    /**
     * Creates a table of followers with columns:
     * twitchid | username | timestamp | evtype
     */
    // db.run('CREATE TABLE IF NOT EXISTS followers (twitchid INT UNIQUE, username TEXT, timestamp TEXT, evtype TEXT, notifications TEXT);');
    data.addTable('followers', [{
        name: 'twitchid',
        type: 'INT',
        unique: true
    }, 'username', 'timestamp', 'evtype', 'notifications']);

    /**
     * Creates a table of subscribers with columns:
     * twitchid | username | timestamp | evtype | months
     */
    // db.run('CREATE TABLE IF NOT EXISTS subscribers (twitchid INT UNIQUE, username TEXT, timestamp TEXT, evtype TEXT, months TEXT);');
    data.addTable('subscribers', [{
        name: 'twitchid',
        type: 'INT',
        unique: true
    }, 'username', 'timestamp', 'evtype', 'months']);

    /**
     * Creates a table of host events with columns:
     * twitchid | username | timestamp | evtype | viewers
     */
    // db.run('CREATE TABLE IF NOT EXISTS hosts (twitchid TEXT, username TEXT, timestamp TEXT, evtype TEXT, viewers TEXT);');
    data.addTable('hosts', [{
        name: 'twitchid',
        type: 'INT'
    }, 'username', 'timestamp', 'evtype', 'viewers']);

    /**
     * Creates a table of tip events with columns:
     * twitchid | username | timestamp | evtype | amount | message
     */
    // db.run('CREATE TABLE IF NOT EXISTS tips (username TEXT, timestamp TEXT, evtype TEXT, amount TEXT, message TEXT);');
    data.addTable('tips', ['username', 'timestamp', 'evtype', 'amount', 'message']);
}

export { data as default };
