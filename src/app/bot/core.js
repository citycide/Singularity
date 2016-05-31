import jetpack from 'fs-jetpack';
import path from 'path';
import db from '../../app/db';
import bot from './bot';
import userModules from '../../app/main/utils/_userModuleSetup';
import mods from './moduleHandler';
import cooldown from './core/cooldown';
import { unregister, default as registry } from './core/commandRegistry';

const loaders = {
    sys: null,
    user: null
};

const core = {
    bot: bot,
    db: db,

    channel: {
        name: Settings.get('channel'),
        botName: Settings.get('botName')
    },

    say(user, message) {
        if (arguments.length === 1) {
            message = user;
            return bot.say(this.channel.name, message);
        }
        if (this.settings.get('whisperMode') === false) {
            return bot.say(this.channel.name, `${user}: ${message}`);
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
        prefix() {
            return db.bot.getCommandPrefix() || '!';
        },
        getModule(cmd) {
            return mods.requireModule(registry[cmd].module);
        },
        getRunner: (cmd) => {
            return core.command.getModule(cmd)[registry[cmd].handler];
        },
        getCooldown: (cmd) => {
            return core.data.get('commands', 'cooldown', { name: cmd });
        },
        getPermLevel: (cmd) => {
            return core.data.get('commands', 'permission', { name: cmd });
        },
        setPermLevel: (cmd, level) => {
            return core.data.set('commands', { permission: level }, { name: cmd });
        },
        isEnabled(cmd) {
            return db.bot.getCommandStatus(cmd);
        },
        enableCommand(cmd) {
            if (!registry.hasOwnProperty(cmd)) {
                Logger.bot(`ERR in enableCommand:: ${cmd} is not a registered command`);
                return 404;
            }
            db.bot.setCommandStatus(cmd, true);
            return 200;
        },
        disableCommand(cmd) {
            if (!registry.hasOwnProperty(cmd)) {
                Logger.bot(`ERR in disableCommand:: ${cmd} is not a registered command`);
                return 404;
            }
            db.bot.setCommandStatus(cmd, false);
            return 200;
        }
    },

    settings: {
        whisperMode() {
            return db.bot.settings.get('whisperMode');
        },
        setWhisperMode(bool) {
            db.bot.settings.set('whisperMode', bool);
        },
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
        }
    },

    isFollower(user) {
        let _status = false;
        bot.api({
            url: `https://api.twitch.tv/kraken/users/${user}/follows/channels/${this.channel.name}`,
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

    runCommand(event) {
        // Check if the specified command is registered
        if (!registry.hasOwnProperty(event.command)) {
            Logger.bot(`'${event.command}' is not a registered command`);
            return;
        }
        // Check if the specified command is enabled
        if (this.command.isEnabled(event.command) === false) {
            Logger.bot(`'${event.command}' is installed but is not enabled`);
            return;
        }

        // Check if the specified command is on cooldown for this user (or globally depending on settings)
        const cooldownActive = cooldown.isActive(event.command, event.sender);
        if (cooldownActive) {
            Logger.bot(`'${event.command}' is on cooldown for ${event.sender} (${cooldownActive} seconds)`);
            return this.say(event.sender, `You need to wait ${cooldownActive} seconds to use !${event.command} again.`);
        }

        // Check that the user has sufficient privileges to use the command
        // console.log(event.permLevel, core.command.getPermLevel(event.command));
        if (event.permLevel > this.command.getPermLevel(event.command)) {
            Logger.bot(`${event.sender} does not have sufficient permissions to use !${event.command}`);
            return this.say(event.sender, `You don't have what it takes to use !${event.command}.`);
        }

        try {
            this.command.getRunner(event.command)(event);
            cooldown.set(event.command, event.sender);
        } catch (err) {
            Logger.error(err);
        }
    }
};

global.core = core;
global.bot = bot;

const initialize = (instant = false) => {
    const delay = instant ? 1 : 5 * 1000;
    setTimeout(() => {
        if (!Settings.get('botName') || !Settings.get('botAuth')) return Logger.bot('Bot setup is not complete.');
        Logger.bot('Initializing bot...');
        bot.connect();

        db.initBotDB(() => {
            db.addTable('settings', true, { name: 'key', unique: true }, 'value', 'info');
            db.addTable('users', true, { name: 'name', unique: true }, 'permission', 'mod', 'following', 'seen');
            db.bot.initSettings();

            db.addTable('commands', true, { name: 'name', unique: true }, 'cooldown', 'permission', 'status', 'module');

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