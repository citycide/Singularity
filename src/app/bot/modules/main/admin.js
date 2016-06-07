import moment from 'moment';

module.exports.command = (event) => {
    let action = event.args[0];
    let param1 = event.args[1];
    let param2 = event.args[2] || null;
    if (!action) return $.say(event.sender, `Usage: !command [enable | disable | permission]`);
    let status;
    switch (action) {
        case 'enable':
            if (event.args.length < 2) {
                return $.say(event.sender, `Usage: !command [enable] [command name]`);
            }

            if (param1.includes('>')) {
                const pair = param1.split('>');
                status = $.command.enable(pair[0], pair[1]);
            } else {
                status = $.command.enable(param1);
            }
            
            if (status === 404)
                return $.say(event.sender, `That command is not registered.`);
            if (status === 200)
                return $.say(event.sender, `Command '${param1}' enabled.`);
            
            break;
        case 'disable':
            if (event.args.length < 2) {
                return $.say(event.sender, `Usage: !command [disable] [command name]`);
            }

            if (param1.includes('>')) {
                const pair = param1.split('>');
                status = $.command.disable(pair[0], pair[1]);
            } else {
                status = $.command.disable(param1);
            }
            
            if (status === 404)
                return $.say(event.sender, `That command is not registered.`);
            if (status === 200)
                return $.say(event.sender, `Command '${param1}' disabled.`);
            
            break;
        case 'permission':
            if (event.args.length < 2) {
                return $.say(event.sender, `Usage: !command [permission] [command name] [level]`);
            }
            status = $.command.setPermLevel(param1, param2);
            if (status === 404) return $.say(event.sender, `That command is not registered.`);
            if (status === 200) return $.say(event.sender, `Permission level for '${param1}' set to ${param2}`);
            break;
        default:
            $.say(event.sender, `Usage: !command [enable | disable] [command name]`);
    }
};

module.exports.whisperMode = (event) => {
    let action = event.args[0];
    if (!action) return $.say(event.sender, `Whisper mode is currently ${$.settings.get('whisperMode') ? 'enabled' : 'disabled'}.`);
    switch (action) {
        case 'enable':
            $.settings.set('whisperMode', true);
            $.say(event.sender, 'Whisper mode enabled.');
            break;
        case 'disable':
            $.settings.set('whisperMode', false);
            $.say(event.sender, 'Whisper mode disabled.');
            break;
        default:
            $.say(event.sender, `Usage: !whispermode [enable | disable]`);
    }
    
};

module.exports.lastSeen = (event) => {
    let target = event.args[0];
    if (!target) return $.say(event.sender, `Usage: !lastseen [user]`);

    let ts = $.data.get('users', 'seen', { name: target });
    if (ts === 404) return $.say(event.sender, `We haven't seen ${target} yet.`);

    let time = moment(ts, 'x').fromNow();
    $.say(event.sender, `${target} was last seen ${time}.`);
};

/*
module.exports.setPerm = (event) => {
    let target = event.args[0];
    let level = parseInt(event.args[1]);
    $.db.bot.data.setPermissionTest(target, level);
};
*/

(() => {
    $.addCommand('command', './modules/main/admin', {
        cooldown: 0,
        permLevel: 0,
        status: true
    });
    $.addCommand('whispermode', './modules/main/admin', {
        handler: 'whisperMode',
        cooldown: 0,
        permLevel: 0,
        status: true
    });
    $.addCommand('lastseen', './modules/main/admin', {
        handler: 'lastSeen',
        status: true
    });
    $.addCommand('setperm', './modules/main/admin', {
        handler: 'setPerm',
        cooldown: 0,
        permLevel: 0,
        status: true
    });
})();