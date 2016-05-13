/*********************************** CORE *************************************/

/* global $ */
/**
 * Load modules
 */
/*** node ***/
import path from 'path';
import moment from 'moment';
/*** app ***/
const db = require('../../app/db'),
      emitter = require('../../app/emitter.js');
/*** bot ***/
const bot = require('./bot'),
      loader = require('require-directory')(module, './modules'),
      mods = require('./moduleHandler'),
      registry = require('./modules/core/commandRegistry');

let core = {

    /**
     * @exports - Export core modules for global use
     */
    bot: bot,
    db: db,

    channel: {
        name: Settings.get('channel'),
        botName: Settings.get('botName')
    },

    say: function(user, message) {
        if (arguments.length === 1) {
            message = user;
            return bot.say(core.channel.name, message);
        }
        if (core.settings.get('whisperMode') === false) {
            return bot.say(core.channel.name, message);
        } else {
            return bot.whisper(user, message);
        }
    },
    whisper: (user, message) => {
        bot.whisper(user, message);
    },
    shout: (message) => {
        bot.say(core.channel.name, message);
    },

    command: {
        prefix: () => {
            return db.bot.getCommandPrefix() || '!';
        },
        getModule: (cmd) => {
            return mods.requireModule(registry[cmd].module);
        },
        getRunner: (cmd) => {
            return core.command.getModule(cmd)[registry[cmd].handler];
        },
        getCooldown: (cmd) => {
            // return botStore.get(`SELECT cooldown FROM commands WHERE name="${cmd}"`) || 30;
            return core.data.get('commands', 'cooldown', { name: cmd });
        },
        getPermLevel: (cmd) => {
            // return botStore.get(`SELECT permission FROM commands WHERE name="${cmd}"`) || 0;
            return core.data.get('commands', 'permission', { name: cmd });
        },
        setPermLevel: (cmd, level) => {
            
        },
        isEnabled: (cmd) => {
            return db.bot.getCommandStatus(cmd);
        },
        enableCommand: (cmd) => {
            if (!registry.hasOwnProperty(cmd)) {
                Logger.bot(`ERR in enableCommand:: ${cmd} is not a registered command.`);
                return 404;
            }
            db.bot.setCommandStatus(cmd, true);
            return 200;
        },
        disableCommand: (cmd) => {
            if (!registry.hasOwnProperty(cmd)) {
                Logger.bot(`ERR in disableCommand:: ${cmd} is not a registered command.`);
                return 404;
            }
            db.bot.setCommandStatus(cmd, false);
            return 200;
        }
    },
    
    settings: {
        whisperMode: () => {
            return db.bot.setting.get('whisperMode');
        },
        setWhisperMode: (bool) => {
            db.bot.setting.set('whisperMode', bool);
        },
        get: (key) => {
            return db.bot.setting.get(key);
        },
        set: (key, value) => {
            db.bot.setting.set(key, value);
        }
    },

    data: {
        get(table, what, where) {
            return db.bot.data.get(table, what, where);
        }
    },

    isFollower: (user) => {
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

    runCommand: (event) => {
        // Check if the specified command is registered
        if (!registry.hasOwnProperty(event.command)) {
            Logger.bot(`${event.command} is not a registered command.`);
            return;
        }
        // Check if the specified command is enabled
        if (core.command.isEnabled(event.command) === false) {
            Logger.bot(`${event.command} is installed but is not enabled.`);
            return;
        }
        // Check that the user has sufficient privileges to use the command
        if (event.permLevel > core.command.getPermLevel(event.command)) {
            Logger.bot(`${event.sender} does not have sufficient permissions to use !${event.command}.`);
            return core.say(event.sender, `You don't have what it takes to use !${event.command}.`);
        }

        try {
            core.command.getRunner(event.command)(event);
        } catch (err) {
            Logger.error(err);
        }
    }
};

global.core = core;
global.bot = bot;

const initialize = () => {
    setTimeout(() => {
        Logger.bot('Initializing bot...');
        bot.connect();

        db.initBotDB(() => {
            db.addTable('settings', true, { name: 'key', unique: true }, 'value', 'info');
            db.addTable('users', true, { name: 'name', unique: true }, 'permission', 'mod', 'following', 'seen');
            db.bot.initSettings();

            db.addTable('commands', true, { name: 'name', unique: true }, 'cooldown', 'permission', 'status', 'module');

            Logger.bot('Bot ready.');
            Transit.emit('bot:ready');
        });
    }, 5 * 1000);
};

module.exports.initialize = initialize;