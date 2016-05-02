module.exports.command = (event) => {
    let action = event.args[0];
    let param1 = event.args[1];
    let param2 = event.args[2] || null;
    if (!action) return core.say(`Usage: !command [enable | disable | permission]`);
    switch (action) {
        case 'enable':
            if (event.args.length < 2) {
                return core.say(`Usage: !command [enable] [command name]`);
            }
            let status = core.command.enableCommand(param1);
            if (status === 404) return core.say(`That command is not registered.`);
            if (status === 200) return core.say(`Command '${param1}' enabled.`);
            break;
        case 'disable':
            if (event.args.length < 2) {
                return core.say(`Usage: !command [disable] [command name]`);
            }
            status = core.command.disableCommand(param1);
            if (status === 404) return core.say(`That command is not registered.`);
            if (status === 200) return core.say(`Command '${param1}' disabled.`);
            break;
        case 'permission':
            if (event.args.length < 2) {
                return core.say(`Usage: !command [permission] [command name] [level]`);
            }
            status = core.command.setPermLevel(param1, param2);
            if (status === 404) return core.say(`That command is not registered.`);
            if (status === 200) return core.say(`Permission level for '${param1}' set to ${param2}`);
            break;
        default:
            core.say(`Usage: !command [enable / disable] [command name]`);
    }
};

Transit.on('bot:command:listen', () => {
    Transit.emit('bot:command:register', [
        {
            name: 'command',
            handler: 'command',
            cooldown: 0,
            permLevel: 0
        }
    ], './modules/core/admin');
});