module.exports.command = (event) => {
    let action = event.args[0];
    let param1 = event.args[1];
    let param2 = event.args[2] || null;
    if (!action) return core.say(event.sender, `Usage: !command [enable | disable | permission]`);
    switch (action) {
        case 'enable':
            if (event.args.length < 2) {
                return core.say(event.sender, `Usage: !command [enable] [command name]`);
            }
            let status = core.command.enableCommand(param1);
            if (status === 404) return core.say(event.sender, `That command is not registered.`);
            if (status === 200) return core.say(event.sender, `Command '${param1}' enabled.`);
            break;
        case 'disable':
            if (event.args.length < 2) {
                return core.say(event.sender, `Usage: !command [disable] [command name]`);
            }
            status = core.command.disableCommand(param1);
            if (status === 404) return core.say(event.sender, `That command is not registered.`);
            if (status === 200) return core.say(event.sender, `Command '${param1}' disabled.`);
            break;
        case 'permission':
            if (event.args.length < 2) {
                return core.say(event.sender, `Usage: !command [permission] [command name] [level]`);
            }
            status = core.command.setPermLevel(param1, param2);
            if (status === 404) return core.say(event.sender, `That command is not registered.`);
            if (status === 200) return core.say(event.sender, `Permission level for '${param1}' set to ${param2}`);
            break;
        default:
            core.say(event.sender, `Usage: !command [enable | disable] [command name]`);
    }
};

module.exports.whisperMode = (event) => {
    let action = event.args[0];
    let param1 = event.args[1];
    let param2 = event.args[2] || null;
    if (!action) return core.say(event.sender, `Usage: !whispermode [enable | disable]`);
    switch (action) {
        case 'enable':
            // core.setWhisperMode(true);
            core.settings.set('whisperMode', true);
            core.say(event.sender, 'Whisper mode enabled.');
            break;
        case 'disable':
            core.settings.set('whisperMode', false);
            core.say(event.sender, 'Whisper mode disabled.');
            break;
        default:
            core.say(event.sender, `Usage: !whispermode [enable | disable]`);
    }
    
};

Transit.on('bot:command:listen', () => {
    Transit.emit('bot:command:register', [
        {
            name: 'command',
            handler: 'command',
            cooldown: 0,
            permLevel: 0
        },
        {
            name: 'whispermode',
            handler: 'whisperMode',
            cooldown: 0,
            permLevel: 0
        }
    ], './modules/core/admin');
});