import moment from 'moment';
const tmi = require('tmi.js');
const config = require('../../app/configstore');

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
    api.messageHandler(user, message);
    if (api.isCommand(message)) api.commandHandler(user, message);
    // Logger.bot(api.checkPermLevel(user['display-name']));
});

let api = {
    isCommand: (message) => {
        return (message.charAt(0) === core.command.prefix());
    },

    messageHandler: (user, message) => {
        // api.checkPermLevel(user['display-name']);
        let _timestamp = moment().valueOf();
        let _mod = false;
        if (user['user-type'] === 'mod') _mod = true;
        let _user = {
            name: user['display-name'],
            permLevel: api.getPermissions(user),
            mod: _mod,
            following: core.isFollower(user['display-name']),
            seen: _timestamp
        };
        core.db.bot.addUser(_user);
    },

    commandHandler: (user, message) => {
        let _mod = false;
        if (user['user-type'] === 'mod') _mod = true;
        core.runCommand({
            sender: user['display-name'],
            mod: _mod,
            permLevel: api.checkPermLevel(user['display-name']),
            raw: message,
            command: api.getCommand(message),
            args: api.getCommandArgs(message),
            argString: api.getCommandArgString(message)
        });
    },

    /**
     * @function getCommand
     * @description returns the first word following the command prefix
     * @param message
     * @returns {string}
     */
    getCommand: (message) => {
        return message.slice(1).split(' ', 1)[0];
    },

    /**
     * @function getCommandArgs
     * @description returns an array containing the message's words, excluding the command
     * @param message
     * @returns {Array.<T>}
     */
    getCommandArgs: (message) => {
        return message.split(' ').slice(1);
    },

    /**
     * @function getCommandArgString
     * @description returns the message as a string, excluding the command
     * @param message
     * @returns {string}
     */
    getCommandArgString: (message) => {
        return message.split(' ').slice(1).join(' ');
    },

    checkPermLevel: (user) => {
        return core.db.bot.getPermLevel(user);
    },

    getPermissions: (user) => {
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
        if (user['display-name'] === core.channel.name) _permLevel = 0;
        if (user['display-name'] === core.channel.botName) _permLevel = 0;
        return _permLevel;
    }
};

module.exports = bot;