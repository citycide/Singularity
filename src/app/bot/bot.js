import moment from 'moment';
import tmi from 'tmi.js';
import db from '../db';

const OPTIONS = {
    options: {
        debug: false
    },
    connection: {
        reconnect: true,
        cluster: 'aws'
    },
    identity: {
        username: Settings.get('botName'),
        password: Settings.get('botAuth').slice(6)
    },
    channels: [Settings.get('channel')]
};

const bot = new tmi.client(OPTIONS);

bot.on('chat', (channel, user, message, self) => {
    if (self) return;
    api.messageHandler(user, message);
    if (api.isCommand(message)) api.commandHandler(user, message);
});

const api = {
    isCommand(message) {
        return (message.charAt(0) === core.command.getPrefix());
    },

    messageHandler(user, message) {
        let _timestamp = moment().valueOf();
        let _mod = false;
        if (user['user-type'] === 'mod') _mod = true;
        let _user = {
            name: user['display-name'],
            permLevel: this.getPermissions(user),
            mod: _mod,
            following: core.users.isFollower(user['display-name']),
            seen: _timestamp,
            points: core.points.get(user['display-name']) || 0
        };
        db.bot.addUser(_user);
    },

    commandHandler(user, message) {
        let _mod = false;
        if (user['user-type'] === 'mod') _mod = true;
        core.runCommand({
            sender: user['display-name'],
            mod: _mod,
            permLevel: this.getPermissions(user),
            raw: message,
            command: this.getCommand(message),
            args: this.getCommandArgs(message),
            argString: this.getCommandArgString(message)
        });
    },

    /**
     * @function getCommand
     * @description returns the first word following the command prefix
     * @param message
     * @returns {string}
     */
    getCommand(message) {
        const prefixLength = core.command.getPrefix().length || 1;
        return message.slice(prefixLength).split(' ', 1)[0].toLowerCase();
    },

    /**
     * @function getCommandArgs
     * @description returns an array containing the message's words, excluding the command
     * @param message
     * @returns {Array.<T>}
     */
    getCommandArgs(message) {
        return message.split(' ').slice(1);
    },

    /**
     * @function getCommandArgString
     * @description returns the message as a string, excluding the command
     * @param message
     * @returns {string}
     */
    getCommandArgString(message) {
        return message.split(' ').slice(1).join(' ');
    },

    /**
     * @function getPermissions
     * @description returns the user's permission level
     * @param {object} user
     * @returns {number}
     **/
    getPermissions(user) {
        return db.bot.getPermLevel(user);
    }
};

export default bot;

export function updateAuth(name, auth) {
    OPTIONS.identity.username = name;
    OPTIONS.identity.password = auth.slice(6);
}
