/* jshint -W014 */

import jetpack from 'fs-jetpack';
import path from 'path';
import db from '../../app/db';
import Tock from '../main/utils/Tock';
import { updateAuth, default as bot } from './bot';
import userModules from '../../app/main/utils/_userModuleSetup';
import mods from './moduleHandler';
import cooldown from './core/cooldown';
import points from './core/points';
import twitchapi from './core/twitchapi';
import { unregister, default as registry } from './core/commandRegistry';

const loaders = {
    sys: null,
    user: null
};

const core = {
    api: bot.api,
    tick: new Tock(),
    // db: db,

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
        if (this.settings.get('responseMention')) mention = `${user}: `;

        if (this.settings.get('whisperMode') === false) {
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
        getPrefix() {
            return core.settings.get('prefix') || '!';
        },
        getModule(cmd) {
            return mods.requireModule(registry[cmd].module);
        },
        getRunner: (cmd) => {
            return core.command.getModule(cmd)[registry[cmd].handler];
        },
        isEnabled(cmd, sub) {
            if (!sub) {
                return core.data.get('commands', 'status', { name: cmd });
            } else {
                return core.data.get('subcommands', 'status', { name: sub });
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
                return 404;
            }

            if (sub) {
                core.data.set('subcommands', { status: true }, { name: sub });
            } else {
                core.data.set('commands', { status: true }, { name: cmd });
            }

            return 200;
        },
        disable(cmd, sub) {
            if (!this.exists(cmd, sub)) {
                Logger.bot(`ERR in enableCommand:: ${cmd} is not a registered command`);
                return 404;
            }

            if (sub) {
                core.data.set('subcommands', { status: false }, { name: sub });
            } else {
                core.data.set('commands', { status: false }, { name: cmd });
            }

            return 200;
        },
        getPermLevel: (cmd, sub) => {
            return (sub)
                ? core.data.get('commands', 'permission', { name: cmd })
                : core.data.get('subcommands', 'permission', { name: sub });
        },
        setPermLevel: (cmd, level, sub) => {
            if (!this.exists(cmd, sub)) {
                Logger.bot(`ERR in setPermLevel:: ${cmd} is not a registered command`);
                return 404;
            }

            if (sub) {
                core.data.set('subcommands', { permission: level }, { name: sub });
            } else {
                core.data.set('commands', { permission: level }, { name: cmd });
            }

            return 200;
        }
    },

    settings: {
        get(key) {
            return db.bot.settings.get(key);
        },
        set(key, value) {
            db.bot.settings.set(key, value);
        }
    },

    data: {
        get(table, what, where) {
            return db.bot.data.get(table, what, where);
        },
        set(table, what, where, options) {
            db.bot.data.set(table, what, where, options);
        }
    },

    users: {
        isFollower(user) {
            let _status = false;
            bot.api({
                url: `https://api.twitch.tv/kraken/users/${user}/follows/channels/${core.channel.name}`,
                method: "GET",
                headers: {
                    "Accept": "application/vnd.twitchtv.v3+json",
                    "Authorization": `OAuth ${Settings.get('accessToken').slice(6)}`,
                    "Client-ID": Settings.get('clientID')
                }
            }, (err, res, body) => {
                if (err) Logger.bot(err);
                _status = (body.error && body.status === 404) ? false : true;
            });
            return _status;
        },
        getPermLevel(user, fn) {
            return db.bot.getPermLevel(user, fn);
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
        if (event.permLevel > this.command.getPermLevel(event.command, subcommand)) {
            Logger.bot(`${event.sender} does not have sufficient permissions to use !${event.command}`);
            return this.say(event.sender, `You don't have what it takes to use !${event.command}.`);
        }

        // Check that the user has enough points to use the (sub)command
        const commandPrice = this.command.getPrice(event.command, subcommand);
        const userPoints = this.points.get(event.sender);
        if (userPoints < commandPrice) {
            Logger.bot(`${event.sender} does not have enough points to use !${event.command}.`);
            return this.say(event.sender, `You don't have enough points to use !${event.command}. (costs ${commandPrice}, you have ${userPoints})`);
        }

        // Finally, run the (sub)command
        try {
            this.command.getRunner(event.command)(event);

            if (subcommand) {
                this.command.startCooldown(event.command, event.sender, subcommand);
            } else {
                this.command.startCooldown(event.command, event.sender);
            }

            this.points.sub(event.sender, commandPrice);
        } catch (err) {
            Logger.error(err);
        }
    }
};

global.core = core;
global.$ = core;

const initialize = (instant = false) => {
    const delay = instant ? 1 : 5 * 1000;
    setTimeout(() => {
        if (!Settings.get('botName') || !Settings.get('botAuth')) return Logger.bot('Bot setup is not complete.');
        Logger.bot('Initializing bot...');
        bot.connect();

        db.initBotDB(() => {
            db.addTable('settings', [{ name: 'key', unique: true }, 'value', 'info'], true)
                .addTable('users', [{ name: 'name', unique: true }, 'permission', 'mod', 'following', 'seen', 'points'], true);

            db.bot.initSettings();

            db.addTable('commands', [{ name: 'name', unique: true },
                'cooldown', 'permission', 'status', 'price', 'module'
            ], true)
                .addTable('users', [{ name: 'name', unique: true },
                    'cooldown', 'permission', 'status', 'price', 'module', 'parent'
                ], true);

            Logger.bot('Bot ready.');
            Transit.emit('bot:ready');

            _loadModules();
        });
    }, delay);
};

const disconnect = (botDir) => {
    Logger.bot('Deactivating bot...');
    bot.disconnect();
    _unloadModules(botDir);
    Logger.bot('Deactivated bot.');
};

const reconfigure = (name, auth) => {
    updateAuth(name, auth);
};

const _loadModules = () => {
    userModules();
    loaders.sys = require('require-directory')(module, './modules');
    loaders.user = require('require-directory')(module, Settings.get('userModulePath'));
};

const _unloadModules = (botDir) => {
    const modules = [];
    const root = jetpack.cwd(botDir);
    root.find('./modules', { matching: ['**/*.js'] }).forEach((_path) => {
        const modulePath = path.resolve(botDir + '/' + _path);
        if (!modules.includes(modulePath)) {
            modules.push(modulePath);
            Logger.debug(`Module unloaded:: ./${path.relative(botDir, modulePath).replace('.js', '').replace(/\\/g, '/')}`);
        }
        delete require.cache[require.resolve(modulePath)];
    });

    const userDir = jetpack.cwd(Settings.get('userModulePath'));
    userDir.find({ matching: ['**/*.js'] }).forEach((_path) => {
        const modulePath = path.resolve(userDir + '/' + _path);
        if (!modules.includes(modulePath)) {
            modules.push(modulePath);
            Logger.debug(`Module unloaded:: ${modulePath}`);
        }
        delete require.cache[require.resolve(modulePath)];
    });

    loaders.sys = null;
    loaders.user = null;
    
    unregister(true);
};

module.exports.initialize = initialize;
module.exports.disconnect = disconnect;
module.exports.reconfigure = reconfigure;