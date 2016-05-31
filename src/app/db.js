import path from 'path';
import jetpack from 'fs-jetpack';
import moment from 'moment';
import { app } from 'electron';
import util from './main/utils/util';
import Store from './main/utils/Store.js';

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
    db = new Store(path.resolve(__dirname, '..', 'db', 'singularity.db'));

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

{
    /**
     * Creates a table of followers with columns:
     * twitchid | username | timestamp | evtype
     */
    db.run('CREATE TABLE IF NOT EXISTS followers (twitchid INT UNIQUE, username TEXT, timestamp TEXT, evtype TEXT, notifications TEXT);');
    // data.addTable('followers', false, { name: 'twitchid', type: 'INT', unique: true }, 'username', 'timestamp', 'evtype', 'notifications');

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
}

/**
 * Collection of api methods for main database functions
 * @export default
 */
const data = {
    /**
     * @function - Creates or accesses bot.db when bot is enabled
     */
    initBotDB: (fn) => {
        botDB = new Store(path.resolve(__dirname, '..', 'db', 'bot.db'));
        if (!fn) return true;
        fn();
    },
    addTable: (name, bot, ...args) => {
        let query = [];
        let unique = false;
        for (let key of args) {
            if (typeof key !== null && typeof key === 'object' && unique === false) {
                unique = true;
                if (key.hasOwnProperty('unique')) {
                    if (!key.hasOwnProperty('type')) {
                        query.push(`${key.name} TEXT UNIQUE`);
                    } else {
                        query.push(`${key.name} ${key.type} UNIQUE`);
                    }
                } else {
                    if (!key.hasOwnProperty('type')) {
                        query.push(`${key.name} TEXT`);
                    } else {
                        query.push(`${key.name} ${key.type}`);
                    }
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
        this.settings.confirm('prefix', '!');
        this.settings.confirm('defaultCooldown', '30');
        this.settings.confirm('whisperMode', 'false');
        this.settings.confirm('globalCooldown', 'false');
        this.settings.confirm('followAlerts', 'true');
        this.settings.confirm('hostAlerts', 'true');
        this.settings.confirm('subAlerts', 'true');
        this.settings.confirm('tipAlerts', 'false');
    },

    settings: {
        get(key) {
            let value = botDB.getValue('settings', 'value', { key });
            if (value !== null) {
                if (value.hasOwnProperty('error')) return Logger.error(value.error);

                if (value === 'true' || value === 'false') value = (value === 'true');
                if (util.isNumeric(value)) value = parseInt(value);
                return value;
            }
        },
        set(key, value) {
            if (typeof key !== 'string') return;
            if (typeof value === 'boolean') value = value.toString();
            botDB.put('settings', { key, value }, { conflict: 'replace'}, (err, res) => {
                if (err) Logger.error(err);
            });
        },
        confirm(key, value) {
            // Only sets the value if the key does not exist
            if (typeof key !== 'string') return;
            if (typeof value === 'boolean') value = value.toString();
            botDB.put('settings', { key, value }, { conflict: 'ignore' }, (err, res) => {
                if (err) Logger.error(err);
            });
        }
    },

    data: {
        get: (table, what, where) => {
            let response = botDB.getValue(table, what, where);
            if (response === null) return 404;
            if (response) {
                if (response === 'true' || response === 'false') {
                    response = (response === 'true');
                }
                if (util.isNumeric(response)) response = parseInt(response);
                return response;
            }
        },
        set(table, what, where) {
            if (typeof table !== 'string') return;
            if (!(typeof what !== null && typeof what === 'object')) return;
            if (!(typeof where !== null && typeof where === 'object')) return;
            
            let obj = { conflict: 'replace' };
            Object.assign(obj, where);
            
            botDB.put(table, what, where);
        },
        setPermissionTest(user, permission) {
            botDB.update('users', { permission }, { name: user });
        }
    },

    addCommand(name, cooldown, permission, status, module) {
        if (!name || !module) {
            Logger.bot('Failed to add command. Name & module are required.');
            return;
        }
        botDB.put('commands', { name, cooldown, permission, status, module }, { conflict: 'ignore' }, (err, res) => {
            if (err) Logger.error(err);
        });
    },

    addUser(user) {
        const { name, permLevel, mod, following, seen } = user;
        botDB.put('users', { name, permission: permLevel, mod, following, seen }, { conflict: 'abort' }, (err, res) => {
            if (err) Logger.error(err);
            botDB.update('users', { mod, following, seen }, { name });
        });
    },

    getPermLevel: (user, fn) => {
        const _permission = parseInt(botDB.getValue('users', 'permission', { name: user }));
        if (!Number.isNaN(_permission)) {
            if (fn && typeof fn === 'function') fn(_permission);
            return _permission;
        } else {
            const type = Number.isNaN(_permission) ? 'NaN' : typeof v;
            Logger.debug(`ERR in getPermLevel:: Expected a number, got ${type}`);
            if (fn && typeof fn === 'function') fn(7);
            return 7;
        }
    },

    getCommandStatus: (cmd) => {
        let status = botDB.getValue('commands', 'status', { name: cmd });
        status = (status === 'true');
        Logger.absurd(`'${cmd}' is ${(status) ? 'enabled' : 'disabled'}.`);
        return status;
    },

    setCommandStatus: (cmd, bool) => {
        if (typeof bool !== 'string') bool = bool.toString();
        if (bool !== 'true' && bool !== 'false') {
            return Logger.debug('ERR in setCommandStatus:: requires boolean string');
        }
        botDB.update('commands', { status: bool }, { name: cmd });
    },

    getCommandPrefix: () => {
        return botDB.getValue('settings', 'value', { key: 'prefix' });
    }
};

export { data as default };
