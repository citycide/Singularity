import db from '../../../app/db';

let modules = [];
let commands = {};

const registerCommand = (cmd, _module, parent = false) => {
    if (!modules.includes(_module)) {
        modules.push(_module);
        Logger.debug(`Module loaded:: ${_module}`);
    }

    let name = cmd.name.toLowerCase();
    let handler = (cmd.hasOwnProperty('handler')) ? cmd.handler : name;
    let cooldown = (cmd.hasOwnProperty('cooldown')) ? cmd.cooldown : 30;
    let permLevel = (cmd.hasOwnProperty('permLevel')) ? cmd.permLevel : 7;
    let status = (cmd.hasOwnProperty('status')) ? cmd.status : false;
    let price = (cmd.hasOwnProperty('price')) ? cmd.price : 0;

    if (commands.hasOwnProperty(name)) {
        if (commands[name].module === _module) return;
        Logger.bot(`Duplicate command registration attempted by '${_module}'`);
        Logger.bot(`'${name}' already registered to '${commands[name].module}'`);
        return;
    }

    if (parent) {
        commands[parent].subcommands[cmd.name] = {
            name,
            parent,
            module: _module,
            subcommands: {}
        };
        db.bot.addSubcommand(name, cooldown, permLevel, status, price, _module, parent);
    } else {
        commands[name] = {
            name,
            handler,
            module: _module,
            subcommands: {}
        };

        db.bot.addCommand(name, cooldown, permLevel, status, price, _module);
        Logger.trace(`\`- Command loaded:: '${name}' (${_module})`);
    }

    if (cmd.hasOwnProperty('subcommands')) {
        for (let subcmd of cmd.subcommands) {
            registerCommand(subcmd, _module, cmd);
        }
    }
};

const _registerCommand = (name, module, options) => {
    const obj = {
        name,
        handler: name,
        cooldown: 30,
        permLevel: 7,
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
        permLevel: 7,
        status: false,
        price: 0
    };
    Object.assign(obj, options);

    const parentModule = commands[parent].module;

    registerCommand(obj, parentModule, parent);
};

Transit.on('bot:ready', () => {
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
