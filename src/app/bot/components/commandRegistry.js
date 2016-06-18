import db from '../../../app/db';

let modules = [];
let commands = {};

const registerCommand = (cmd, _module, parent = false) => {
    if (!modules.includes(_module)) {
        modules.push(_module);
        Logger.debug(`Module loaded:: ${_module}`);
    }

    let { name, handler, cooldown, permLevel, status, price } = cmd;

    if (parent) {
        commands[parent].subcommands[cmd.name] = {
            name,
            parent,
            module: _module,
            subcommands: {}
        };
        db.bot.addSubcommand(name, cooldown, permLevel, status, price, _module, parent);
    } else {
        if (commands.hasOwnProperty(name)) {
            if (commands[name].module === _module) return;
            Logger.bot(`Duplicate command registration attempted by '${_module}'`);
            Logger.bot(`'${name}' already registered to '${commands[name].module}'`);
            return;
        }

        commands[name] = {
            name,
            handler,
            module: _module,
            subcommands: {}
        };

        db.bot.addCommand(name, cooldown, permLevel, status, price, _module);
        Logger.trace(`\`- Command loaded:: '${name}' (${_module})`);
    }
};

const _registerCommand = (name, module, options) => {
    const obj = {
        name: name.toLowerCase(),
        handler: name,
        cooldown: 30,
        permLevel: 5,
        status: false,
        price: 0
    };
    Object.assign(obj, options);

    registerCommand(obj, module);
};

const _registerSubcommand = (name, parent, options) => {
    const obj = {
        name,
        parent,
        cooldown: 30,
        permLevel: 5,
        status: false,
        price: 0
    };
    Object.assign(obj, options);

    const parentModule = commands[parent].module;

    registerCommand(obj, parentModule, parent);
};

$.on('bot:ready', () => {
    $.addCommand = _registerCommand;
    $.addSubcommand = _registerSubcommand;

    Logger.bot('Listening for commands.');
});

export default commands;

export function unregister(all) {
    if (all) {
        modules = [];
        commands = {};
    }
}
