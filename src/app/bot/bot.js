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

const api = {
    isCommand(message) {
        // @TODO change this to allow prefixes of more than 1 character
        return (message.charAt(0) === $.command.getPrefix());
    },

    messageHandler(user, message) {
        let _timestamp = moment().valueOf();
        let _mod = false;
        if (user['user-type'] === 'mod') _mod = true;
        let _user = {
            name: user['display-name'],
            permission: $.users.getGroup(user),
            mod: _mod,
            following: $.users.isFollower(user['display-name']),
            seen: _timestamp,
            points: $.points.get(user['display-name']) || 0,
            time: $.data.get('users', 'time', { name: user['display-name'] }) || 0,
            rank: $.data.get('users', 'rank', { name: user['display-name'] }) || 1
        };

        db.bot.addUser(_user);

        if (this.isCommand(message)) this.commandHandler(_user, message);
    },

    whisperHandler(user, message) {
        // @TODO: handle commands in whisper messages, responses should be whispered
        // if (this.isCommand(message)) this.commandHandler(user, message);
    },

    commandHandler(user, message) {
        $.runCommand({
            sender: user.name,
            mod: user.mod,
            groupID: user.permission,
            rankID: user.rank,
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
        const prefixLength = $.command.getPrefix().length || 1;
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
    }
};

/**
 * Event listeners
 */
bot.on('chat', (channel, user, message, self) => {
    if (self) return;
    api.messageHandler(user, message);
});

bot.on('whisper', api.whisperHandler);

bot.on('mods', (channel, mods) => {
    if (channel !== $.channel.name) return;
    if (mods.length) {
        for (let mod of mods) {
            console.log(mod);
        }
    }
});

bot.on('action', (channel, user, message, self) => {
    // @TODO: handle /me (colored) messages
});

/**
 * Exports
 */

export default bot;

export function updateAuth(name, auth) {
    OPTIONS.identity.username = name;
    OPTIONS.identity.password = auth.slice(6);
}
