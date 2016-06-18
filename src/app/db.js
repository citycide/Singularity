import path from 'path';
import jetpack from 'fs-jetpack';
import moment from 'moment';
import { app } from 'electron';
import util from './main/utils/util';
import Trilogy from './main/utils/Trilogy.js';
import _ from 'lodash';

let db = null;
let botDB = null;

const errHandler = function(err) {
    if (err) Logger.error(err);
};

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
    addTable(name, args, bot = false, options = {}, fn = errHandler) {
        const opts = Object.assign({ ifNotExists: true }, options);

        if (!bot) {
            db.create(name, args, opts, fn);
        } else {
            botDB.create(name, args, opts, fn);
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
            viewers
        }, errHandler);
    },

    /**
     * Adds a tip event to the database
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
            amount,
            message
        }, errHandler);
    },
    getRecentFollows: () => {
        const CUTOFF = moment().subtract(60, 'days').valueOf();
        const response = db.get('followers', ' * ', { timestamp: { gt: CUTOFF } }, { desc: 'timestamp' });
        if (!response) return [];
        for (let follow of response) {
            follow.age = moment(follow.timestamp, 'x').fromNow();
        }
        return response;
    },
    getFollows: () => {
        const response = db.get('followers', ' * ', null, { desc: 'timestamp' });
        if (!response) return [];
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
            return y - x;
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
        this.settings.confirm('prefix', '!');
        this.settings.confirm('defaultCooldown', '30');
        this.settings.confirm('whisperMode', 'false');
        this.settings.confirm('globalCooldown', 'false');
        this.settings.confirm('responseMention', 'false');
    },

    settings: {
        get(key, defaultValue, fn) {
            if (typeof defaultValue === 'function') fn = defaultValue;

            let value = botDB.getValue('settings', 'value', { key });
            if (util.val.isNullLike(value)) {
                this.set(key, defaultValue);
                return defaultValue;
            }

            if (typeof value === 'object' && value.hasOwnProperty('error')) {
                Logger.error(value.error);
                return defaultValue;
            }

            if (util.str.isBoolean(value)) value = (value === 'true');
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
            botDB.put('settings', { key, value }, { conflict: 'replace' }, errHandler);
            return this.get(key);
        },
        confirm(key, value) {
            // Only sets the value if the key does not exist
            if (typeof key !== 'string') return;
            if (typeof value === 'boolean') value = value.toString();
            botDB.put('settings', { key, value }, { conflict: 'ignore' }, errHandler);
            return this.get(key);
        }
    },

    data: {
        get(table, what, where, fn) {
            let response = botDB.getValue(table, what, where);
            if (util.val.isNullLike(response)) {
                fn && fn();
                return undefined;
            }

            if (_.isPlainObject(response) && response.hasOwnProperty('error')) {
                Logger.error(response.error);
                fn && fn();
                return undefined;
            }

            if (util.str.isBoolean(response)) response = (response === 'true');
            if (util.str.isNumeric(response)) response = parseInt(response);

            if (fn) {
                fn(response);
                return this;
            }

            return response;
        },
        set(table, what, where, options = {}) {
            if (typeof table !== 'string') return;
            if (!_.isPlainObject(what)) return;

            let whatWhere = Object.assign({}, what, where);

            let obj = { conflict: 'abort' };
            Object.assign(obj, options);

            botDB.put(table, whatWhere, obj, () => {
                if (obj.conflict === 'abort') {
                    if (_.isPlainObject(where)) {
                        botDB.update(table, what, where);
                    }
                }
            });

            return this.get(table, what, where);
        },
        del(table, where) {
            if (typeof table !== 'string') return;
            if (!_.isPlainObject(where)) return;

            let numModified = 0;
            botDB.del(table, where, (err, num) => {
                if (err) return errHandler(err);
                numModified = num;
            });

            return numModified;
        },
        confirm(table, what, where) {
            if (typeof table !== 'string') return;
            if (!_.isPlainObject(what)) return;

            let whatWhere = Object.assign({}, what, where);

            let obj = { conflict: 'abort' };

            botDB.put(table, whatWhere, obj, errHandler);

            return this.get(table, what, where);
        },
        incr(table, what, amount, where) {
            amount = parseInt(amount);
            if (typeof table !== 'string') return;
            if (typeof what !== 'string') return;
            if (!_.isFinite(amount) || amount === 0) return;
            if (!_.isPlainObject(where)) return;
            if (amount < 0) {
                this.decr(table, what, amount, where);
                return;
            }

            let newValue = amount;
            this.get(table, what, where, (currentValue) => {
                if (_.isFinite(currentValue)) {
                    newValue += currentValue;
                }
                this.set(table, { [what]: newValue }, where);
            });

            return newValue;
        },
        decr(table, what, amount, where, allowNegative) {
            amount = parseInt(amount);
            if (typeof table !== 'string') return;
            if (typeof what !== 'string') return;
            if (!_.isFinite(amount) || amount === 0) return;
            if (!_.isPlainObject(where)) return;

            let newValue = amount;

            this.get(table, what, where, (currentValue) => {
                if (_.isFinite(currentValue)) {
                    if (allowNegative) {
                        newValue = currentValue - Math.abs(amount);
                    } else {
                        newValue = Math.max(0, currentValue - Math.abs(amount));
                    }
                }
                this.set(table, { [what]: newValue }, where);
            });

            return newValue;
        },
        incrBatch(table, what, where) {
            /**
             * Increment multiple rows in a table at once.
             * If a 'where' object is provided, each row
             * MUST meet the parameter in that where object
             * or it will not be incremented.
             *
             * Amounts are properties in the 'what' object
             * and are coerced to positive unlike incr()
             *
             *** ARGUMENT TYPES:
             * {string} table = 'users'
             * {Array} what = [ { addToThis: 6 }, { AndThis: 4 } ]
             * {object} where = { ifPropEquals: 'thisValue' }
             */
            if (typeof table !== 'string') return;
            if (!Array.isArray(what)) return;
            if (where && !_.isPlainObject(where)) return;

            let newValues = [];

            for (let item of what) {
                for (let [key, value] in Object.entries(item)) {
                    if (!item.hasOwnProperty(key)) continue;

                    value = parseInt(value);
                    if (!_.isFinite(value)) continue;

                    this.get(table, key, where, (currentValue) => {
                        currentValue = parseInt(currentValue);
                        let newValue = value;
                        if (_.isFinite(currentValue)) {
                            newValue = currentValue + Math.abs(value);
                        } else {
                            newValue = Math.abs(value);
                        }
                        this.set(table, { [key]: newValue }, where);
                        newValues.push({ [key]: newValue });
                    });
                }
            }

            return newValues;
        },
        decrBatch(table, what, where, allowNegative = false) {
            /**
             * See docs for incrBatch() above.
             */
            if (typeof table !== 'string') return;
            if (!Array.isArray(what)) return;
            if (where && !_.isPlainObject(where)) return;

            let newValues = [];

            for (let item of what) {
                for (let [key, value] in Object.entries(item)) {
                    if (!item.hasOwnProperty(key)) continue;

                    value = parseInt(value);
                    if (!_.isFinite(value)) continue;

                    this.get(table, key, where, (currentValue) => {
                        currentValue = parseInt(currentValue);
                        let newValue = value;
                        if (_.isFinite(currentValue)) {
                            if (allowNegative) {
                                newValue = currentValue - Math.abs(value);
                            } else {
                                newValue = Math.max(0, currentValue - Math.abs(value));
                            }
                        }
                        this.set(table, { [key]: newValue }, where);
                        newValues.push({ [key]: newValue });
                    });
                }
            }

            return newValues;
        },
        getRow(table, where) {
            const response = botDB.get(table, '*', where);
            if (response && Array.isArray(response)) {
                return response[0];
            } else {
                return response;
            }
        },
        countRows(table, what, where, options) {
            const response = parseInt(botDB.count(table, what, where, options));
            if (_.isFinite(response)) {
                return response;
            } else {
                Logger.error(`ERR in count:: expected number, received ${typeof response}`);
            }
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
        const { name, permission, mod, following, seen, points, time, rank } = user;
        botDB.put('users', {
            name, permission, mod, following, seen, points, time, rank
        }, { conflict: 'abort' }, (err, res) => {
            if (err) Logger.error(err, res);

            botDB.update('users', {
                permission, mod, following, seen, points, time, rank
            }, { name });
        });
    }
};

/**
 * Creates or accesses singularity.db
 */
module.exports.initDB = function(opts = {}, fn = () => {}) {
    if (opts.DEV) {
        /**
         * Store the database in the /build directory
         */
        jetpack.dir(path.resolve(__dirname, '..', 'db'));
        db = new Trilogy(path.resolve(__dirname, '..', 'db', 'singularity.db'));
    } else {
        switch (opts.LOCATION) {
            case 'home': {
                // app directory in the user home folder
                jetpack.dir(path.resolve(Settings.get('dataPath'), 'db'));
                db = new Trilogy(path.resolve(Settings.get('dataPath'), 'db', 'singularity.db'));
                break;
            }
            case 'data': {
                // app directory in the OS data folder
                jetpack.dir(path.resolve(app.getAppPath(), 'db'));
                db = new Trilogy(path.resolve(app.getAppPath(), 'db', 'singularity.db'));
                break;
            }
            case 'custom': {
                // user configured a custom location for the db
                const dbPath = Settings.get('databaseLocation', path.resolve(app.getAppPath(), 'db'));
                jetpack.dir(path.resolve(dbPath));
                db = new Trilogy(path.resolve(dbPath, 'singularity.db'));
                break;
            }
            default: {
                throw new TypeError('ERR in initDB:: Invalid LOCATION property');
            }
        }

        if (db) {
            _initTables();
            fn && fn(data);
        } else {
            throw new Error('ERR in initDB:: Database was not initialized.');
        }
    }
};


const _initTables = function() {
    /**
     * Creates a table of followers with columns:
     * twitchid | username | timestamp | evtype
     */
    data.addTable('followers', [
        { name: 'twitchid', type: 'int', primaryKey: true },
        { name: 'username', notNull: true },
        { name: 'timestamp', type: 'int' },
        { name: 'evtype', defaultValue: 'follower' },
        { name: 'notifications', defaultValue: 'false' }
    ]);

    /**
     * Creates a table of subscribers with columns:
     * twitchid | username | timestamp | evtype | months
     */
    data.addTable('subscribers', [
        { name: 'twitchid', type: 'int', primaryKey: true },
        { name: 'username', notNull: true },
        { name: 'timestamp', type: 'int' },
        { name: 'evtype', defaultValue: 'subscriber' },
        { name: 'months', type: 'int', defaultValue: 0 }
    ]);

    /**
     * Creates a table of host events with columns:
     * twitchid | username | timestamp | evtype | viewers
     */
    data.addTable('hosts', [
        { name: 'twitchid', type: 'int', notNull: true },
        { name: 'username', notNull: true },
        { name: 'timestamp', type: 'int' },
        { name: 'evtype', defaultValue: 'host' },
        { name: 'viewers', type: 'int', defaultValue: 0 }
    ]);

    /**
     * Creates a table of tip events with columns:
     * username | timestamp | evtype | amount | message
     */
    data.addTable('tips', [
        { name: 'username', notNull: true },
        { name: 'timestamp', type: 'int' },
        { name: 'evtype', defaultValue: 'tip' },
        'amount', 'message'
    ]);
};

export { data as default };
