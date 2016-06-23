import db from '../../../app/db';

let modules = [];
let commands = {};

const _registerCommand = function(cmd, _module, parent = false) {
    if (!modules.includes(_module)) {
        modules.push(_module);
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
        Logger.absurd(`\`- Command loaded:: '${name}' (${_module})`);
    }
};

const registerCommand = function(name, module, options) {
    if (!name || !module) return;

    module = captureStack()[1].getFileName();

    const obj = {
        name: name.toLowerCase(),
        handler: name,
        cooldown: 30,
        permLevel: 5,
        status: false,
        price: 0
    };
    Object.assign(obj, options);

    _registerCommand(obj, module);
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

const addCustomCommand = function(name, response) {
    if (!name || !response) return false;
    name = name.toLowerCase();

    if (commands.hasOwnProperty(name)) {
        Logger.bot(`Could not add custom command '${name}'. Name already in use.`);
        return false;
    }

    _registerCustomCommand(name);
    _dbInsertCustomCommand(name, response);

    Logger.trace(`Added custom command:: '${name}'`);

    return true;
};

const deleteCustomCommand = function(name) {
    if (!name) return;
    name = name.toLowerCase();

    if (commands.hasOwnProperty(name) && commands[name].custom) {
        _unregisterCustomCommand(name);
        _dbDeleteCustomCommand(name);
        return true;
    } else {
        Logger.bot(`Could not remove command '${name}'. Doesn't exist or is not custom.`);
        return false;
    }
};

const _registerCustomCommand = function(name) {
    commands[name] = {
        name,
        custom: true
    };
    Logger.absurd(`Loaded custom command '${name}'.`);
};

const _unregisterCustomCommand = function(name) {
    delete commands[name];
};

const _dbInsertCustomCommand = function(name, response) {
    db.bot.addCommand(name, 30, 5, true, 0, 'custom', response);
};

const _dbDeleteCustomCommand = function(name) {
    db.bot.data.del('commands', { name, module: 'custom' });
};

const _loadCustomCommands = function() {
    const arr = db.bot.data.getRows('commands', { module: 'custom' });

    for (let cmd of arr) {
        _registerCustomCommand(cmd.name);
    }
};

const _unregister = function(all) {
    if (all) {
        modules = [];
        commands = {};
    }
};

const captureStack = function() {
    const _ = Error.prepareStackTrace;
    Error.prepareStackTrace = function(_, stack) {
        return stack;
    };
    const stack = new Error().stack.slice(1);
    Error.prepareStackTrace = _;
    return stack;
};

$.on('bot:ready', () => {
    $.addCommand = registerCommand;
    $.addSubcommand = registerSubcommand;
    $.command.addCustom = addCustomCommand;
    $.command.removeCustom = deleteCustomCommand;

    Logger.bot('Listening for commands.');
});

export {
    commands as default,
    addCustomCommand,
    deleteCustomCommand,
    _loadCustomCommands as loadCustomCommands,
    _unregister as unregister
};
