import db from '../../../app/db';

let modules = [];
let commands = {};

Transit.on('bot:ready', () => {
    Logger.bot('Listening for commands.');
    Transit.emit('bot:command:listen');
});

Transit.on('bot:command:register', (data, _module) => {
    if (!modules.includes(_module)) {
        modules.push(_module);
        Logger.debug(`Module loaded:: ${_module}`);
    }
    for (let cmd of data) {
        let name = cmd.name.toLowerCase();
        let handler = (cmd.hasOwnProperty('handler')) ? cmd.handler : name;
        let cooldown = (cmd.hasOwnProperty('cooldown')) ? cmd.cooldown : 30;
        let permLevel = (cmd.hasOwnProperty('permLevel')) ? cmd.permLevel : 0;
        let status = (cmd.hasOwnProperty('status')) ? cmd.status : false;

        if (commands.hasOwnProperty(name)) {
            if (commands[name].module === _module) return;
            Logger.bot(`Duplicate command registration attempted by '${_module}'`);
            Logger.bot(`'${name}' already registered to '${commands[name].module}'`);
            return;
        }

        commands[name] = {
            name,
            handler,
            cooldown,
            permLevel,
            status,
            module: _module
        };
        db.bot.addCommand(name, cooldown, permLevel, status, _module);
        Logger.trace(`\`- Command loaded:: '${name}' (${_module})`);
    }
});

export default commands;

export function unregister(all) {
    if (all) {
        modules = [];
        commands = {};
    }
}