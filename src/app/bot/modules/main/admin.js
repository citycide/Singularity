import moment from 'moment';

module.exports.command = (event) => {
    const [, param1, param2] = event.args;

    if (event.subcommand === 'enable') {
        if (event.args.length < 2) {
            return $.say(event.sender, weave.get('bot:modules:admin:command:enable:usage'));
        }

        if (param1.includes('>')) {
            const pair = param1.split('>');

            if ($.command.exists(pair[0], pair[1])) {
                $.command.enable(pair[0], pair[1]);
                $.say(event.sender, weave.get('bot:commands:enable:success', param1));
            } else {
                $.say(event.sender, weave.get('bot:commands:does-not-exist'));
            }
        } else {
            if ($.command.exists(param1)) {
                $.command.enable(param1);
                $.say(event.sender, weave.get('bot:commands:enable:success', param1));
            } else {
                $.say(event.sender, weave.get('bot:commands:does-not-exist'));
            }
        }

        return;
    }

    if (event.subcommand === 'disable') {
        if (event.args.length < 2) {
            return $.say(event.sender, weave.get('bot:modules:admin:command:disable:usage'));
        }

        if (param1.includes('>')) {
            const pair = param1.split('>');

            if ($.command.exists(pair[0], pair[1])) {
                $.command.disable(pair[0], pair[1]);
                $.say(event.sender, weave.get('bot:commands:disable:success', param1));
            } else {
                $.say(event.sender, weave.get('bot:commands:does-not-exist'));
            }
        } else {
            if ($.command.exists(param1)) {
                $.command.disable(param1);
                $.say(event.sender, weave.get('bot:commands:disable:success', param1));
            } else {
                $.say(event.sender, weave.get('bot:commands:does-not-exist'));
            }
        }

        return;
    }

    if (event.subcommand === 'permission') {
        if (event.args.length < 2) {
            return $.say(event.sender, weave.get('bot:modules:admin:command:permission:usage'));
        }

        if ($.command.exists(param1)) {
            $.command.setPermLevel(param1, param2);
            $.say(event.sender, weave.get('bot:commands:permission:success', param1, param2));
        } else {
            $.say(event.sender, weave.get('bot:commands:does-not-exist'));
        }

        return;
    }

    if (event.subcommand === 'add') {
        if (event.subArgs.length < 2) {
            return $.say(event.sender, weave.get('bot:modules:admin:command:add:usage'));
        }

        if ($.command.exists(param1)) {
            return $.say(event.sender, weave.get('bot:commands:already-exists'));
        }

        const response = event.subArgs.slice(1).join(' ');

        $.command.addCustom(param1, response);
        $.say(event.sender, weave.get('bot:commands:add:success', param1));

        return;
    }

    if (event.subcommand === 'remove') {
        if (!event.subArgs[0]) {
            return $.say(event.sender, weave.get('bot:modules:admin:command:remove:usage'));
        }

        if (!$.command.exists(param1)) {
            return $.say(event.sender, weave.get('bot:commands:does-not-exist'));
        }

        if (!$.command.isCustom(param1)) {
            return $.say(event.sender, weave.get('bot:commands:is-module-command'));
        }

        $.command.removeCustom(param1);
        $.say(event.sender, weave.get('bot:commands:remove:success', param1));

        return;
    }

    if (event.subcommand === 'edit') {
        if (event.subArgs.length < 2) {
            return $.say(event.sender, weave.get('bot:modules:admin:command:edit:usage'));
        }

        if (!$.command.exists(param1)) {
            return $.say(event.sender, weave.get('bot:commands:does-not-exist'));
        }

        if (!$.command.isCustom(param1)) {
            return $.say(event.sender, weave.get('bot:commands:is-module-command'));
        }

        const newResponse = event.subArgs.slice(1).join(' ');

        $.db.set('commands', { response: newResponse }, { name: param1, module: 'custom' });
        $.say(event.sender, weave.get('bot:commands:edit:success', param1));

        return;
    }

    $.say(event.sender, weave.get('bot:modules:admin:command:usage'));
};

module.exports.whisperMode = (event) => {
    if (event.subcommand === 'enable') {
        $.settings.set('whisperMode', true);
        $.say(event.sender, weave.get('bot:settings:whisper-mode:enabled:success'));
        return;
    }

    if (event.subcommand === 'disable') {
        $.settings.set('whisperMode', false);
        $.say(event.sender, weave.get('bot:settings:whisper-mode:disabled:success'));
        return;
    }

    const status = $.settings.get('whisperMode')
        ? weave.get('common-words:enabled')
        : weave.get('common-words:disabled');
    $.say(event.sender, weave.get('bot:modules:admin:command:whisper-mode:usage', status));
};

module.exports.lastSeen = (event) => {
    let target = event.args[0];
    if (!target) return $.say(event.sender, weave.get('bot:modules:admin:last-seen:usage'));

    if ($.user.exists(target)) {
        let ts = $.db.get('users', 'seen', { name: target });
        let timeAgo = moment(ts, 'x').fromNow();

        $.say(event.sender, weave.get('bot:modules:admin:last-seen', target, timeAgo));
    } else {
        $.say(event.sender, weave.get('bot:modules:admin:last-seen:not-seen', target));
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
