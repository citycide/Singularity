/****************************** COMMAND REGISTRY ******************************/

const db = require('../../../../app/db');

let commands = {};

Transit.on('bot:ready', () => {
    Logger.bot('Listening for commands.');
    Transit.emit('bot:command:listen');
});

Transit.on('bot:command:register', (data, module) => {
    Logger.debug(`Module loaded:: ${module}`);
    for (let cmd of data) {
        let handler = (cmd.handler) ? (cmd.handler) : (cmd.name);
        commands[cmd.name] = {
            name: cmd.name,
            handler: handler,
            cooldown: cmd.cooldown,
            permLevel: cmd.permLevel,
            module: module
        };
        db.bot.addCommand(cmd.name, cmd.cooldown, cmd.permLevel, false, module);
        Logger.trace(`Loaded command '${cmd.name}' from ${module}`);
    }
});

module.exports = commands;