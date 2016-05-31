import db from '../../../app/db';

let modules = [];
let commands = {};

Transit.on('bot:ready', () => {
    Logger.bot('Listening for commands.');
    Transit.emit('bot:command:listen');
});

Transit.on('bot:command:register', (data, module) => {
    if (!modules.includes(module)) {
        modules.push(module);
        Logger.debug(`Module loaded:: ${module}`);
    }
    for (let cmd of data) {
        let name = cmd.name.toLowerCase();
        let handler = (cmd.handler) ? (cmd.handler) : (name);
        let status = (cmd.hasOwnProperty('status')) ? cmd.status : false;

        if (commands.hasOwnProperty(name)) {
            if (commands[name].module === module) return;
            Logger.bot(`Duplicate command registration attempted by '${module}'`);
            Logger.bot(`'${name}' already registered to '${commands[name].module}'`);
            return;
        }

        commands[name] = {
            name: name,
            handler: handler,
            cooldown: cmd.cooldown,
            permLevel: cmd.permLevel,
            status: status,
            module: module
        };
        db.bot.addCommand(name, cmd.cooldown, cmd.permLevel, status, module);
        Logger.trace(`\`- Command loaded:: '${name}' (${module})`);
    }
});

export default commands;

export function unregister(all) {
    if (all) {
        modules = [];
        commands = {};
    }
}