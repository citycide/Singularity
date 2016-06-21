import db from '../../../app/db';

let modules = [];
let commands = {};

const _registerCommand = function(cmd, _module, parent = false) {
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
            Logger.bot(`!${name} already registered to '${commands[name].module}'`);
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

const registerCommand = function(name, module, options) {
    if (!name || !module) return;

    const obj = {
        name: name.toLowerCase(),
        handler: name,
        cooldown: 30,
        permLevel: 5,
        status: false,
        price: 0
    };
    Object.assign(obj, options);

    _registerCommand(obj, response);
};

const registerSubcommand = function(name, parent, options) {
    if (!name || !parent || !commands.hasOwnProperty(parent)) return;

    const obj = {
        name: name.toLowerCase(),
        parent,
        cooldown: 30,
        permLevel: 5,
        status: false,
        price: 0
    };
    Object.assign(obj, options);

    const parentModule = commands[parent].module;

    _registerCommand(obj, parentModule, parent);
};

const registerCustomCommand = function(name, response) {
    if (!name || !response) return false;
    if (commands.hasOwnProperty(name)) {
        Logger.bot(`Could not add custom command '${name}'. Name already in use.`);
        return false;
    }

    commands[name] = {
        name: name.toLowerCase(),
        custom: true
    };
    
    const obj = {
        name: name.toLowerCase(),
        cooldown: 30,
        permLevel: 5,
        status: true,
        price: 0,
        custom: true
    };

    db.bot.addCommand(obj.name, obj.cooldown, obj.permLevel, obj.status, obj.price, 'custom', response);
    Logger.trace(`Added custom command:: '${name}'`);
    
    return true;
};

const _unregister = function(all) {
    if (all) {
        modules = [];
        commands = {};
    }
}

$.on('bot:ready', () => {
    $.addCommand = registerCommand;
    $.addSubcommand = registerSubcommand;
    $.command.addCustom = registerCustomCommand;

    Logger.bot('Listening for commands.');
});

export {
    commands as default,
    registerCustomCommand as addCustomCommand,
    _unregister as unregister
};
