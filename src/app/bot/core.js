import EventEmitter from 'events';
import db from '../../app/db';
import Tock from '../main/utils/Tock';
import util from '../../app/main/utils/util';
import { updateAuth, default as bot } from './bot';
import modules from './components/moduleHandler';

let commandRegistry = null;
let registry = null;

const coreMethods = {
    api: bot.api,
    tick: new Tock(),
    util,

    channel: {
        name: Settings.get('channel'),
        botName: Settings.get('botName')
    },

    say(user, message) {
        if (arguments.length === 1) {
            message = user;
            return bot.say(this.channel.name, message);
        }

        let mention = '';
        if (this.settings.get('responseMention', false)) mention = `${user}: `;

        if (!this.settings.get('whisperMode', false)) {
            return bot.say(this.channel.name, `${mention}${message}`);
        } else {
            return bot.whisper(user, message);
        }
    },
    whisper(user, message) {
        bot.whisper(user, message);
    },
    shout(message) {
        bot.say(this.channel.name, message);
    },

    command: {
        getPrefix: () => {
            return core.settings.get('prefix', '!');
        },
        getModule(cmd) {
            return modules.load(registry[cmd].module);
        },
        getRunner: cmd => {
            return core.command.getModule(cmd)[registry[cmd].handler];
        },
        isEnabled: (cmd, sub) => {
            if (!sub) {
                return core.db.get('commands', 'status', { name: cmd });
            } else {
                return core.db.get('subcommands', 'status', { name: sub, parent: cmd });
            }
        },
        exists(cmd, sub) {
            if (!registry.hasOwnProperty(cmd)) return false;

            if (!sub) {
                return registry.hasOwnProperty(cmd);
            } else {
                return registry[cmd].subcommands.hasOwnProperty(sub);
            }
        },
        enable(cmd, sub) {
            if (!this.exists(cmd, sub)) {
                Logger.bot(`ERR in enableCommand:: ${cmd} is not a registered command`);
                return false;
            }

            if (sub) {
                core.db.set('subcommands', { status: true }, { name: sub, parent: cmd });
            } else {
                core.db.set('commands', { status: true }, { name: cmd });
            }

            return true;
        },
        disable(cmd, sub) {
            if (!this.exists(cmd, sub)) {
                Logger.bot(`ERR in enableCommand:: ${cmd} is not a registered command`);
                return false;
            }

            if (sub) {
                core.db.set('subcommands', { status: false }, { name: sub, parent: cmd });
            } else {
                core.db.set('commands', { status: false }, { name: cmd });
            }

            return true;
        },
        isCustom(cmd) {
            if (!this.exists(cmd)) return false;
            if (registry[cmd].custom) return true;
        },
        getPermLevel: (cmd, sub) => {
            return (sub)
                ? core.db.get('subcommands', 'permission', { name: sub, parent: cmd })
                : core.db.get('commands', 'permission', { name: cmd });
        },
        setPermLevel: (cmd, level, sub) => {
            if (!this.exists(cmd, sub)) {
                Logger.bot(`ERR in setPermLevel:: ${cmd} is not a registered command`);
                return false;
            }

            if (sub) {
                core.db.set('subcommands', { permission: level }, { name: sub, parent: cmd });
            } else {
                core.db.set('commands', { permission: level }, { name: cmd });
            }

            return true;
        }
    },

    settings: {
        get(key, defaultValue) {
            return db.bot.settings.get(key, defaultValue);
        },
        set(key, value) {
            return db.bot.settings.set(key, value);
        },
        confirm(key, value) {
            return db.bot.settings.confirm(key, value);
        }
    },

    db: {
        get(table, what, where) {
            return db.bot.data.get(table, what, where);
        },
        set(table, what, where, options) {
            return db.bot.data.set(table, what, where, options);
        },
        del(table, where) {
            return db.bot.data.del(table, where);
        },
        confirm(table, what, where) {
            return db.bot.data.confirm(table, what, where);
        },
        incr(table, what, amount, where) {
            return db.bot.data.incr(table, what, amount, where);
        },
        decr(table, what, amount, where, allowNegative) {
            return db.bot.data.decr(table, what, amount, where, allowNegative);
        },
        getRow(table, where, order) {
            return db.bot.data.getRow(table, where, order);
        },
        countRows(table, what, where, options) {
            return db.bot.data.countRows(table, what, where, options);
        },
        exists(table, where) {
            const response = db.bot.data.getRow(table, where);
            return util.isObject(response);
        },
        getModuleConfig(moduleName, key, defaultValue) {
            return db.bot.data.get('extension_settings', 'value', {
                key,
                extension: moduleName,
                type: 'module'
            }, defaultValue);
        },
        setModuleConfig(moduleName, key, value) {
            return db.bot.data.set('extension_settings', { value }, {
                key,
                extension: moduleName,
                type: 'module'
            });
        },
        getComponentConfig(component, key, defaultValue) {
            return db.bot.data.get('extension_settings', 'value', {
                key,
                extension: component,
                type: 'component'
            }, defaultValue);
        },
        setComponentConfig(component, key, value) {
            return db.bot.data.set('extension_settings', { value }, {
                key,
                extension: component,
                type: 'component'
            });
        },
        addTable(name, keyed) {
            if (!name || typeof name !== 'string') {
                Logger.bot(`ERR in core#addTable:: Expected parameter 'name' to be a string, received ${typeof name}`);
                return;
            }

            const columns = keyed
                ? [{ name: 'id', type: 'integer', primaryKey: true, autoIncrement: true }, 'value', 'info']
                : ['key', 'value', 'info'];

            db.addTable(name, columns, true);
        },
        addTableCustom(name, columns) {
            if (arguments.length < 2 || typeof name !== 'string' || !Array.isArray(columns)) {
                Logger.bot(`ERR in core#addTableCustom:: wrong arguments.`);
                return;
            }

            db.addTable(name, columns, true);
        }
    },

    user: {
        isFollower: user => {
            let _status = false;
            bot.api({
                url: `https://api.twitch.tv/kraken/users/${user}/follows/channels/${core.channel.name}`,
                method: 'GET',
                headers: {
                    'Accept': 'application/vnd.twitchtv.v3+json',
                    'Authorization': `OAuth ${Settings.get('accessToken').slice(6)}`,
                    'Client-ID': Settings.get('clientID')
                }
            }, (err, res, body) => {
                if (err) Logger.bot(err);
                _status = (body.error && body.status === 404) ? false : true;
            });
            return _status;
        },
        exists(user) {
            const response = db.bot.data.getRow('users', { name: user });
            return (response) ? true : false;
        },
        isAdmin: user => {
            return (user === core.channel.name || user === core.channel.botName);
        }
    },

    runCommand(event) {
        // Check if the specified command is registered
        if (!this.command.exists(event.command)) {
            Logger.bot(`'${event.command}' is not a registered command`);
            return;
        }

        // Check if the specified command is enabled
        if (!this.command.isEnabled(event.command)) {
            Logger.bot(`'${event.command}' is installed but is not enabled`);
            return;
        }

        // Check if the first argument is a subcommand
        let subcommand = event.args[0] || undefined;
        if (subcommand && this.command.exists(event.command, subcommand)) {
            // if it is, check if the subcommand is enabled
            if (!this.command.isEnabled(event.command, subcommand)) {
                Logger.bot(`'${event.command} ${subcommand}' is installed but is not enabled`);
                subcommand = undefined;
                return;
            }

            // add subcommand argument properties to the event object
            event.subcommand = subcommand;
            event.subArgs = event.args.slice(1);
            event.subArgString = event.subArgs.join(' ');
        } else {
            subcommand = undefined;
        }

        // Check if the specified (sub)command is on cooldown for this user (or globally depending on settings)
        const cooldownActive = this.command.isOnCooldown(event.command, event.sender, subcommand);
        if (cooldownActive) {
            Logger.bot(`'${event.command}' is on cooldown for ${event.sender} (${cooldownActive} seconds)`);
            return this.say(event.sender, `You need to wait ${cooldownActive} seconds to use !${event.command} again.`);
        }

        // Check that the user has sufficient privileges to use the (sub)command
        if (event.groupID > this.command.getPermLevel(event.command, subcommand)) {
            Logger.bot(`${event.sender} does not have sufficient permissions to use !${event.command}`);
            return this.say(event.sender, `You don't have what it takes to use !${event.command}.`);
        }

        // Check that the user has enough points to use the (sub)command
        const commandPrice = this.command.getPrice(event.command, subcommand);
        const userPoints = this.points.get(event.sender);
        if (userPoints < commandPrice) {
            Logger.bot(`${event.sender} does not have enough points to use !${event.command}.`);
            return this.say(event.sender, `You don't have enough points to use !${event.command}. ` +
                `(costs ${commandPrice}, you have ${userPoints})`);
        }

        // Finally, run the (sub)command
        try {
            if (this.command.isCustom(event.command)) {
                const response = this.db.get('commands', 'response', { name: event.command, module: 'custom' });
                this.say(event.sender, this.params(event, response));
            } else {
                this.command.getRunner(event.command)(event);
            }

            this.command.startCooldown(event.command, event.sender, subcommand);
            this.points.sub(event.sender, commandPrice);
        } catch (err) {
            Logger.error(err);
        }
    }
};

class Core extends EventEmitter {
    constructor() {
        super();
        Object.assign(this, coreMethods);
    }
}
let core = new Core();

/**
 * Exports & Globals
 */

global.$ = core;
global.core = core;

const initialize = (instant = false) => {
    const delay = instant ? 1 : 5 * 1000;
    setTimeout(() => {
        if (!Settings.get('botName') || !Settings.get('botAuth')) {
            return Logger.bot('Bot setup is not complete.');
        }

        Logger.bot('Initializing bot...');
        if (!core) core = new Core();
        bot.connect();

        db.initBotDB(() => {
            _loadHelpers();
            _loadTables();
            _loadComponents();

            Logger.bot('Bot ready.');
            core.emit('bot:ready');

            modules.watcher.start();

            // noinspection JSUnresolvedFunction
            commandRegistry.loadCustomCommands();
        });
    }, delay);
};

const disconnect = function() {
    Logger.bot('Deactivating bot...');
    modules.watcher.stop();
    bot.disconnect();
    modules.unload(null, { all: true });
    commandRegistry.unregister(true);
    Logger.bot('Deactivated bot.');
};

const reconfigure = function(name, auth) {
    updateAuth(name, auth);
};

module.exports.initialize = initialize;
module.exports.disconnect = disconnect;
module.exports.reconfigure = reconfigure;

/**
 * Private functions
 */

const _loadTables = function() {
    db.addTable('settings', [{ name: 'key', unique: true },
        'value', 'info'
    ], true)
    .addTable('extension_settings', [
        'extension', 'type', 'key', 'value', 'info'
    ], true, { compositeKey: ['extension', 'type', 'key'] })
    .addTable('users', [
        { name: 'name', unique: true },
        { name: 'permission', type: 'int' },
        { name: 'mod', defaultValue: 'false' },
        { name: 'following', defaultValue: 'false' },
        { name: 'seen', type: 'int', defaultValue: 0 },
        { name: 'points', type: 'int', defaultValue: 0 },
        { name: 'time', type: 'int', defaultValue: 0 },
        { name: 'rank', type: 'int', defaultValue: 1 }
    ], true);

    db.bot.initSettings();

    db.addTable('commands', [
        { name: 'name', unique: true },
        { name: 'cooldown', type: 'int', defaultValue: 30 },
        { name: 'permission', type: 'int', defaultValue: 5 },
        { name: 'status', defaultValue: 'false' },
        { name: 'price', type: 'int', defaultValue: 0 },
        'module', 'response'
    ], true)
    .addTable('subcommands', [
        'name',
        { name: 'cooldown', type: 'int', defaultValue: 30 },
        { name: 'permission', type: 'int', defaultValue: 5 },
        { name: 'status', defaultValue: 'false' },
        { name: 'price', type: 'int', defaultValue: 0 },
        'module',
        'parent'
    ], true, { compositeKey: ['name', 'module'] });
};

const _loadHelpers = function() {
    require('./helpers');
};

const _loadComponents = function() {
    commandRegistry = require('./components/commandRegistry');
    registry = commandRegistry.default;

    require('./components/twitchapi');
    require('./components/cooldown');
    require('./components/points');
    require('./components/time');
    require('./components/groups');
    require('./components/ranks');
    require('./components/quotes');
};
