const tmi = require('tmi.js');
const config = require('../../app/configstore');
const log = require('../../app/logger');
const moment = require('moment');

const OPTIONS = {
    options: {
        debug: false
    },
    connection: {
        reconnect: true,
        cluster: 'aws'
    },
    identity: {
        username: config.get('botName'),
        password: config.get('botAuth').slice(6)
    },
    channels: [config.get('channel')]
};

const bot = new tmi.client(OPTIONS);

bot.on('chat', (channel, user, message, self) => {
    if (self) return;
    if (_.isCommand(message)) _.commandHandler(user, message);
    _.messageHandler(user, message);
    console.log(_.checkPermLevel(user['display-name']));
});

module.exports._ = exports._ = _ = {
    isCommand: function(message) {
        return (message.charAt(0) === global.$.command.prefix());
    },

    messageHandler: function(user, message) {
        let _timestamp = moment().valueOf();
        let _mod = false;
        if (user['user-type'] === 'mod') _mod = true;
        let _user = {
            name: user['display-name'],
            permLevel: _.getPermissions(user),
            mod: _mod,
            following: global.$.isFollower(user['display-name']),
            seen: _timestamp
        };
        global.$.db.bot.addUser(_user);
    },

    commandHandler: function(user, message) {
        let _mod = false;
        if (user['user-type'] === 'mod') _mod = true;
        global.$.runCommand({
            sender: user['display-name'],
            mod: _mod,
            permLevel: _.checkPermLevel(user['display-name']),
            raw: message,
            command: _.getCommand(message),
            args: _.getCommandArgs(message),
            argString: _.getCommandArgString(message)
        });
    },

    /**
     * @function getCommand
     * @description returns the first word following the command prefix
     * @param message
     * @returns {string}
     */
    getCommand: function(message) {
        return message.slice(1).split(' ', 1)[0];
    },

    /**
     * @function getCommandArgs
     * @description returns an array containing the message's words, excluding the command
     * @param message
     * @returns {Array.<T>}
     */
    getCommandArgs: function(message) {
        return message.split(' ').slice(1);
    },

    /**
     * @function getCommandArgString
     * @description returns the message as a string, excluding the command
     * @param message
     * @returns {string}
     */
    getCommandArgString: function(message) {
        return message.split(' ').slice(1).join(' ');
    },

    checkPermLevel: function(user) {
        console.log(global.$.db.bot.getPermLevel(user));
        return global.$.db.bot.getPermLevel(user);
    },

    getPermissions: function(user) {
        /**
         * Viewer permission levels:
         *     7: 'viewer'
         *     6: 'regular'
         *     5: ' '
         *     4: ' '
         *     3: ' '
         *     2: 'subscriber'
         *     1: 'moderator'
         *     0: 'admin'
         */
        let _permLevel = 7;
        if (user['user-type'] === 'mod') _permLevel = 1;
        if (user['display-name'] === global.$.channel.name) _permLevel = 0;
        if (user['display-name'] === global.$.channel.botName) _permLevel = 0;
        return _permLevel;
    }
};

module.exports = bot;