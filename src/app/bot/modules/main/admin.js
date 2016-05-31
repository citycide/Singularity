import moment from 'moment';

module.exports.command = (event) => {
    let action = event.args[0];
    let param1 = event.args[1];
    let param2 = event.args[2] || null;
    if (!action) return core.say(event.sender, `Usage: !command [enable | disable | permission]`);
    let status;
    switch (action) {
        case 'enable':
            if (event.args.length < 2) {
                return core.say(event.sender, `Usage: !command [enable] [command name]`);
            }
            status = core.command.enableCommand(param1);
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
    if (!action) return core.say(event.sender, `Whisper mode is currently ${core.settings.get('whisperMode') ? 'enabled' : 'disabled'}.`);
    switch (action) {
        case 'enable':
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

module.exports.lastSeen = (event) => {
    let target = event.args[0];
    if (!target) return core.say(event.sender, `Usage: !lastseen [user]`);

    let ts = core.data.get('users', 'seen', { name: target });
    if (ts === 404) return core.say(event.sender, `We haven't seen ${target} yet.`);

    let time = moment(ts, 'x').fromNow();
    core.say(event.sender, `${target} was last seen ${time}.`);
};

module.exports.setPerm = (event) => {
    let target = event.args[0];
    let level = parseInt(event.args[1]);
    core.db.bot.data.setPermissionTest(target, level);
};

(() => {
    Transit.emit('bot:command:register', [
        {
            name: 'command',
            handler: 'command',
            cooldown: 0,
            permLevel: 0,
            status: true
        },
        {
            name: 'whispermode',
            handler: 'whisperMode',
            cooldown: 0,
            permLevel: 0,
            status: true
        },
        {
            name: 'lastseen',
            handler: 'lastSeen',
            cooldown: 30,
            permLevel: 0,
            status: true
        },
        {
            name: 'setperm',
            handler: 'setPerm',
            cooldown: 0,
            permLevel: 0,
            status: true
        }
    ], './modules/main/admin');
})();