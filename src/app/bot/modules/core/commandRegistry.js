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
        let name = cmd.name.toLowerCase();
        let handler = (cmd.handler) ? (cmd.handler) : (name);
        commands[name] = {
            name: name,
            handler: handler,
            cooldown: cmd.cooldown,
            permLevel: cmd.permLevel,
            module: module
        };
        db.bot.addCommand(name, cmd.cooldown, cmd.permLevel, false, module);
        Logger.trace(`Loaded command '${name}' from ${module}`);
    }
});

module.exports = commands;