import moment from 'moment';

module.exports.command = (event) => {
    const [action, param1, param2] = event.args;

    if (action === 'enable') {
        if (event.args.length < 2) {
            return $.say(event.sender, `Usage: !command enable [command name]`);
        }

        if (param1.includes('>')) {
            const pair = param1.split('>');

            if ($.command.exists(pair[0], pair[1])) {
                $.command.enable(pair[0], pair[1]);
                $.say(event.sender, `Command '${param1}' enabled.`);
            } else {
                $.say(event.sender, `That command is not registered.`);
            }
        } else {
            if ($.command.exists(param1)) {
                $.command.enable(param1);
                $.say(event.sender, `Command '${param1}' enabled.`);
            } else {
                $.say(event.sender, `That command is not registered.`);
            }
        }

        return;
    }

    if (action === 'disable') {
        if (event.args.length < 2) {
            return $.say(event.sender, `Usage: !command disable [command name]`);
        }

        if (param1.includes('>')) {
            const pair = param1.split('>');

            if ($.command.exists(pair[0], pair[1])) {
                $.command.disable(pair[0], pair[1]);
                $.say(event.sender, `Command '${param1}' disabled.`);
            } else {
                $.say(event.sender, `That command is not registered.`);
            }
        } else {
            if ($.command.exists(param1)) {
                $.command.disable(param1);
                $.say(event.sender, `Command '${param1}' disabled.`);
            } else {
                $.say(event.sender, `That command is not registered.`);
            }
        }

        return;
    }

    if (action === 'permission') {
        if (event.args.length < 2) {
            return $.say(event.sender, `Usage: !command permission [command name] [level]`);
        }

        if ($.command.exists(param1)) {
            $.command.setPermLevel(param1, param2);
            $.say(event.sender, `Permission level for '${param1}' set to ${param2}`);
        } else {
            $.say(event.sender, `That command is not registered.`);
        }

        return;
    }

    $.say(event.sender, `Usage: !command [enable | disable | permission]`);
};

module.exports.whisperMode = (event) => {
    let action = event.args[0];

    if (action === 'enable') {
        $.settings.set('whisperMode', true);
        $.say(event.sender, 'Whisper mode enabled.');
        return;
    }

    if (action === 'disable') {
        $.settings.set('whisperMode', false);
        $.say(event.sender, 'Whisper mode disabled.');
        return;
    }

    const status = $.settings.get('whisperMode') ? 'enabled' : 'disabled';
    $.say(event.sender, `Usage: !whispermode [enable | disable] (currently ${status}`);
};

module.exports.lastSeen = (event) => {
    let target = event.args[0];
    if (!target) return $.say(event.sender, `Usage: !lastseen [user]`);

    if ($.user.exists(target)) {
        let ts = $.db.get('users', 'seen', { name: target });
        let timeAgo = moment(ts, 'x').fromNow();

        $.say(event.sender, `${target} was last seen ${timeAgo}.`);
    } else {
        $.say(event.sender, `We haven't seen ${target} in chat yet.`);
    }
};

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
})();
