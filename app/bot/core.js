/*********************************** CORE *************************************/

/**
 * Load modules
 */
/*** node ***/
const path = require('path'),
      moment = require('moment');
/*** app ***/
const dbstore = require('../../app/stores.js'),
      db = require('../../app/db'),
      config = require('../../app/configstore'),
      emitter = require('../../app/emitter.js'),
      log = require('../../app/logger.js');
/*** bot ***/
const bot = require('./bot'),
      loader = require('require-directory')(module, './modules'),
      mods = require('./moduleHandler'),
      registry = require('./modules/core/commandRegistry');

const botStore = dbstore(path.resolve(global.rootDir, 'db', 'bot.db'));

module.exports = exports = global.$ = $ ={

    /**
     * @exports - Export core modules for global use
     */
    bot: bot,
    config: config,
    db: db,
    events: emitter,
    log: log,

    channel: {
        name: config.get('channel'),
        botName: config.get('botName')
    },

    command: {
        prefix: () => {
            return db.bot.getCommandPrefix() || '!';
        },
        getModule: (cmd) => {
            return mods.requireModule(registry[cmd].module);
        },
        getRunner: (cmd) => {
            return $.command.getModule(cmd)[cmd];
        },
        getCooldown: (cmd) => {
            return botStore.get(`SELECT cooldown FROM commands WHERE name=${cmd}`) || 30;
        },
        getPermLevel: (cmd) => {
            return botStore.get(`SELECT permission FROM commands WHERE name=${cmd}`) || 0;
        },
        isEnabled: (cmd) => {
            let status;
            try {
                status = db.bot.getStatus(cmd) || false;
            } catch (err) {
                console.log(err);
            }
            // return status;
            return true;
        }
    },

    isFollower: (user) => {
        let _status = false;
        bot.api({
            url: `//api.twitch.tv/kraken/users/${user}/follows/channels/${$.channel.name}`,
            method: "GET",
            headers: {
                "Accept": "application/vnd.twitchtv.v3+json",
                "Authorization": "OAuth 3eb787117110834e079932bedfb8e6a7",
                "Client-ID": config.get('clientID')
            }
        }, (err, res, body) => {
            if (err) log(err);
            if (body.error && body.status === 404) _status = false;
            log(body);
        });
        return _status;
    },

    runCommand: (event) => {
        console.log(event);
        // Check if the specified cmd was loaded.
        if (!registry.hasOwnProperty(event.command)) {
            log.bot(`${event.command} is not a registered command.`);
            return;
        }
        /*
        if (!$.command.isEnabled(cmd)) {
            log.bot(`${cmd} is installed but is not enabled.`);
            return;
        }
        if (event.sender.permLevel > $.command.getPermLevel(cmd)) {
            log.bot(`#{user} does not have sufficient permissions to use !${cmd}`);
            return;
        }
        */
        $.command.getModule(event.command)[event.command](event);
    }

    /*
    tryCommand: function() {
        $.runCommand({
            sender: 'citycide',
            mod: false,
            permLevel: 0,
            raw: 'Hello world!',
            command: 'echo',
            args: ['Hello', 'world!'],
            argString: 'Hello world!'
        });
    }
    */
};

module.exports.initialize = exports.initialize = function initialize() {
    log.bot('Initializing bot...');
    bot.connect();

    db.initBotDB();
    db.addTable('settings', true, { name: 'key', unique: true }, 'value', 'info');
    db.addTable('users', true, { name: 'name', unique: true }, 'permission', 'mod', 'following', 'seen');
    db.bot.initSettings();
    db.addTable('commands', true, { name: 'name', unique: true }, 'cooldown', 'permission', 'status', 'module');

    log.bot('Bot ready.');
    emitter.emit('botReady');
};