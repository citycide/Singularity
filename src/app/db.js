import path from 'path';
import jetpack from 'fs-jetpack';
import moment from 'moment';
import { app } from 'electron';
import util from './main/utils/util';
import Trilogy from './main/utils/Trilogy.js';

let db = null, botDB = null;

const errHandler = function(err) {
    if (err) Logger.error(err);
};

/**
 * Creates or accesses singularity.db
 * @function IIFE
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
     * Creates or accesses bot.db when bot is enabled
     * @function initBotDB
     * @param {function} fn
     */
    initBotDB(fn = () => {}) {
        botDB = new Trilogy(path.resolve(__dirname, '..', 'db', 'bot.db'));
        fn();
        return botDB;
    },
    addTable(name, args, bot = false, ifNotExists = true, fn = errHandler) {
        if (!bot) {
            db.create(name, args, ifNotExists, errHandler);
        } else {
            botDB.create(name, args, ifNotExists, errHandler);
        }
        return this;
    },

    /**
     * Adds a follower to the database, or updates one that already exists
     * @function dbFollowersAdd
     * @param id
     * @param username
     * @param [timestamp]
     * @param [notifications]
     */
    dbFollowersAdd: (id, username, timestamp, notifications) => {
        if (!id || !username) {
            Logger.error('Failed to add or update follower. ID & username are required.');
            return;
        }
        db.put('followers', {
            twitchid: id,
            username,
            timestamp,
            evtype: 'follower',
            notifications
        }, { conflict: 'replace' }, errHandler);
    },

    /**
     * Adds a subscriber to the database, or updates one that already exists
     * @function dbSubscribersAdd
     * @param id
     * @param username
     * @param [timestamp]
     * @param [months]
     */
    dbSubscribersAdd: (id, username, timestamp, months) => {
        let evtype = 'subscriber';
        if (!id || !username) {
            Logger.error('Failed to add or update subscriber. ID & username are required.');
            return;
        }
        if (months && months > 0) evtype = 'resub';
        db.put('subscribers', {
            twitchid: id,
            username,
            timestamp,
            evtype,
            months
        }, { conflict: 'replace' }, errHandler);

    },

    /**
     * Adds a host event to the database
     * @function dbHostsAdd
     * @param id
     * @param username
     * @param [timestamp]
     * @param [viewers]
     */
    dbHostsAdd: (id, username, timestamp, viewers) => {
        if (!username || !viewers) {
            Logger.error('Failed to add host. Username & viewers are required.');
            return;
        }
        db.put('hosts', {
            twitchid: id,
            username,
            timestamp,
            evtype: 'host',
            viewers
        }, errHandler);
    },

    /**Adds a tip event to the database
     * @function dbTipsAdd
     * @param username
     * @param [timestamp]
     * @param amount
     * @param [message='']
     */
    dbTipsAdd: (username, timestamp, amount, message = '') => {
        if (!username || !amount) {
            Logger.error('Failed to add tip. Name & amount are required.');
            return;
        }
        db.put('tips', {
            username,
            timestamp,
            evtype: 'tip',
            amount,
            message
        }, errHandler);
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
 * @export default.bot
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
            if (util.val.isNullLike(value)) return undefined;
            
            if (typeof value === 'object' && value.hasOwnProperty('error')) {
                Logger.error(value.error);
                return undefined;
            }

            if (value === 'true' || value === 'false') value = (value === 'true');
            
            if (util.str.isNumeric(value)) value = parseInt(value);
            
            if (fn) {
                fn(value);
                return this;
            }
            
            return value;
        },
        set(key, value) {
            if (typeof key !== 'string') return;
            if (typeof value === 'boolean') value = value.toString();
            botDB.put('settings', { key, value }, { conflict: 'replace'}, errHandler);
            return this;
        },
        confirm(key, value) {
            // Only sets the value if the key does not exist
            if (typeof key !== 'string') return;
            if (typeof value === 'boolean') value = value.toString();
            botDB.put('settings', { key, value }, { conflict: 'ignore' }, errHandler);
            return this;
        }
    },

    data: {
        get(table, what, where, fn) {
            let response = botDB.getValue(table, what, where);
            if (util.val.isNullLike(response)) return undefined;
            
            if (typeof response === 'object' && response.hasOwnProperty('error')) {
                Logger.error(response.error);
                return undefined;
            }
            
            if (response === 'true' || response === 'false') response = (response === 'true');
            
            if (util.str.isNumeric(response)) response = parseInt(response);
            
            if (fn) {
                fn(response);
                return this;
            }
            
            return response;
        },
        set(table, what, where = null, options = {}) {
            if (typeof table !== 'string') return;
            if (util.val.isNullLike(what) || typeof what !== 'object') return;

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
            if (util.val.isNullLike(what) || typeof what !== 'object') return;

            let whatWhere = Object.assign({}, what, where);

            let obj = { conflict: 'abort' };

            botDB.put(table, whatWhere, obj, errHandler);
            
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
        botDB.put('commands', {
            name, cooldown, permission, status, price, module
        }, { conflict: 'ignore' }, errHandler);
        return this;
    },

    addSubcommand(name, cooldown, permission, status, price, module, parent) {
        if (!name || !module || !parent) {
            Logger.bot('Failed to add command. Name, module, & parent are required.');
            return;
        }
        botDB.put('subcommands', {
            name, cooldown, permission, status, price, module, parent
        }, { conflict: 'ignore' }, errHandler);
        return this;
    },

    addUser(user) {
        const { name, permLevel, mod, following, seen, points } = user;
        botDB.put('users', {
            name, permission: permLevel, mod, following, seen, points
        }, { conflict: 'abort' }, (err, res) => {
            if (err) Logger.error(err, res);
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
        if (!util.val.isNullLike(_permission) && _permission >= 0) {
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
    data.addTable('followers', [{
        name: 'twitchid',
        type: 'INT',
        unique: true
    }, 'username', 'timestamp', 'evtype', 'notifications']);

    /**
     * Creates a table of subscribers with columns:
     * twitchid | username | timestamp | evtype | months
     */
    data.addTable('subscribers', [{
        name: 'twitchid',
        type: 'INT',
        unique: true
    }, 'username', 'timestamp', 'evtype', 'months']);

    /**
     * Creates a table of host events with columns:
     * twitchid | username | timestamp | evtype | viewers
     */
    data.addTable('hosts', [{
        name: 'twitchid',
        type: 'INT'
    }, 'username', 'timestamp', 'evtype', 'viewers']);

    /**
     * Creates a table of tip events with columns:
     * twitchid | username | timestamp | evtype | amount | message
     */
    data.addTable('tips', ['username', 'timestamp', 'evtype', 'amount', 'message']);
}

export { data as default };
