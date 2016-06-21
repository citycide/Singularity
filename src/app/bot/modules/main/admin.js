import moment from 'moment';

module.exports.command = (event) => {
    const [, param1, param2] = event.args;

    if (event.subcommand === 'enable') {
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

    if (event.subcommand === 'disable') {
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

    if (event.subcommand === 'permission') {
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

    if (event.subcommand === 'add') {
        if (event.subArgs.length < 2) {
            return $.say(event.sender, `Usage: !command add [command name] [response]`);
        }

        if ($.command.exists(param1)) {
            return $.say(event.sender, `A command by that name already exists.`);
        }

        const response = event.subArgs.slice(1).join(' ');

        $.command.addCustom(param1, response);
        $.say(event.sender, `Custom command '${param1}' added.`);

        return;
    }

    if (event.subcommand === 'remove') {
        if (!event.subArgs[0]) {
            return $.say(event.sender, `Usage: !command remove [command name]`);
        }

        if (!$.command.exists(param1)) {
            return $.say(event.sender, `There is no command by the name of '${param1}'.`);
        }

        if (!$.command.isCustom(param1)) {
            return $.say(event.sender, `That command is installed in a module.`);
        }

        $.command.removeCustom(param1);
        $.say(event.sender, `Custom command '${param1}' removed.`);

        return;
    }

    if (event.subcommand === 'edit') {
        if (event.subArgs.length < 2) {
            return $.say(event.sender, `Usage: !command edit [command name] [response]`);
        }

        if (!$.command.exists(param1)) {
            return $.say(event.sender, `There is no command by the name of '${param1}'.`);
        }

        if (!$.command.isCustom(param1)) {
            return $.say(event.sender, `That command is installed in a module.`);
        }

        const newResponse = event.subArgs.slice(1).join(' ');

        $.db.set('commands', { response: newResponse }, { name: param1, module: 'custom' });
        $.say(event.sender, `Custom command '${param1}' edited.`);

        return;
    }

    $.say(event.sender, `Usage: !command [add | remove | edit | enable | disable | permission]`);
};

module.exports.whisperMode = (event) => {
    if (event.subcommand === 'enable') {
        $.settings.set('whisperMode', true);
        $.say(event.sender, 'Whisper mode enabled.');
        return;
    }

    if (event.subcommand === 'disable') {
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

    $.addSubcommand('enable', 'command', { permLevel: 0, status: true });
    $.addSubcommand('disable', 'command', { permLevel: 0, status: true });
    $.addSubcommand('permission', 'command', { permLevel: 0, status: true });
    $.addSubcommand('add', 'command', { permLevel: 0, status: true });
    $.addSubcommand('remove', 'command', { permLevel: 0, status: true });
    $.addSubcommand('edit', 'command', { permLevel: 0, status: true });

    $.addCommand('whispermode', './modules/main/admin', {
        handler: 'whisperMode',
        cooldown: 0,
        permLevel: 0,
        status: true
    });

    $.addSubcommand('enable', 'whispermode', { permLevel: 0, status: true });
    $.addSubcommand('disable', 'whispermode', { permLevel: 0, status: true });

    $.addCommand('lastseen', './modules/main/admin', {
        handler: 'lastSeen',
        status: true
    });
})();
