/*********************************** CORE *************************************/

/* global $ */
/**
 * Load modules
 */
/*** node ***/
import path from 'path';
import moment from 'moment';
/*** app ***/
const dbstore = require('../../app/stores.js'),
      db = require('../../app/db'),
      config = require('../../app/configstore'),
      emitter = require('../../app/emitter.js');
/*** bot ***/
const bot = require('./bot'),
      loader = require('require-directory')(module, './modules'),
      mods = require('./moduleHandler'),
      registry = require('./modules/core/commandRegistry');

const botStore = dbstore(path.resolve(global.rootDir, 'db', 'bot.db'));

let core = {

    /**
     * @exports - Export core modules for global use
     */
    bot: bot,
    config: config,
    db: db,
    events: emitter,

    channel: {
        name: config.get('channel'),
        botName: config.get('botName')
    },

    say: (message) => {
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
            return core.command.getModule(cmd)[cmd];
        },
        getCooldown: (cmd) => {
            return botStore.get(`SELECT cooldown FROM commands WHERE name="${cmd}"`) || 30;
        },
        getPermLevel: (cmd) => {
            return botStore.get(`SELECT permission FROM commands WHERE name="${cmd}"`) || 0;
        },
        isEnabled: (cmd) => {
            return db.bot.getStatus(cmd);
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

    isFollower: (user) => {
        let _status = false;
        bot.api({
            url: `//api.twitch.tv/kraken/users/${user}/follows/channels/${core.channel.name}`,
            method: "GET",
            headers: {
                "Accept": "application/vnd.twitchtv.v3+json",
                "Authorization": "OAuth 3eb787117110834e079932bedfb8e6a7",
                "Client-ID": config.get('clientID')
            }
        }, (err, res, body) => {
            if (err) Logger.bot(err);
            if (body.error && body.status === 404) _status = false;
            // Logger.trace(body);
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
        /*
        if (event.sender.permLevel > core.command.getPermLevel(cmd)) {
            Logger.bot(`${user} does not have sufficient permissions to use !${cmd}`);
            return;
        }*/
        try {
            core.command.getModule(event.command)[event.command](event)
        } catch (err) {
            Logger.error(err);
        }
    }
};

global.core = core;
global.bot = bot;

const initialize = () => {
    Logger.bot('Initializing bot...');
    bot.connect();

    db.initBotDB();
    db.addTable('settings', true, { name: 'key', unique: true }, 'value', 'info');
    db.addTable('users', true, { name: 'name', unique: true }, 'permission', 'mod', 'following', 'seen');
    db.bot.initSettings();
    db.addTable('commands', true, { name: 'name', unique: true }, 'cooldown', 'permission', 'status', 'module');

    Logger.bot('Bot ready.');
    Transit.emit('bot:ready');
};

module.exports.initialize = initialize;