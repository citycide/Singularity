module.exports.alerts = (event) => {
    const param1 = event.args[1];

    if (event.subcommand === 'follow') {
        if (param1 === 'enable') {
            $.settings.set('followAlerts', true);
            $.say(event.sender, weave.get('bot:settings:alerts-follows:enabled:success'));
        } else if (param1 === 'disable') {
            $.settings.set('followAlerts', false);
            $.say(event.sender, weave.get('bot:settings:alerts-follows:disabled:success'));
        } else {
            const status = $.settings.get('followAlerts', true)
                ? weave.get('common-words:enabled')
                : weave.get('common-words:disabled');
            $.say(event.sender, weave.get('bot:modules:events:alerts:follow:usage', status));
        }

        return;
    }

    if (event.subcommand === 'host') {
        if (param1 === 'enable') {
            $.settings.set('hostAlerts', true);
            $.say(event.sender, weave.get('bot:settings:alerts-hosts:enabled:success'));
        } else if (param1 === 'disable') {
            $.settings.set('hostAlerts', false);
            $.say(event.sender, weave.get('bot:settings:alerts-hosts:disabled:success'));
        } else {
            const status = $.settings.get('hostAlerts', true)
                ? weave.get('common-words:enabled')
                : weave.get('common-words:disabled');
            $.say(event.sender, weave.get('bot:modules:events:alerts:host:usage', status));
        }

        return;
    }

    if (event.subcommand === 'sub') {
        if (param1 === 'enable') {
            $.settings.set('subAlerts', true);
            $.say(event.sender, weave.get('bot:settings:alerts-subs:enabled:success'));
        } else if (param1 === 'disable') {
            $.settings.set('subAlerts', false);
            $.say(event.sender, weave.get('bot:settings:alerts-subs:disabled:success'));
        } else {
            const status = $.settings.get('subAlerts', false)
                ? weave.get('common-words:enabled')
                : weave.get('common-words:disabled');
            $.say(event.sender, weave.get('bot:modules:events:alerts:sub:usage', status));
        }

        return;
    }

    if (event.subcommand === 'tip') {
        if (param1 === 'enable') {
            $.settings.set('tipAlerts', true);
            $.say(event.sender, weave.get('bot:settings:alerts-tips:enabled:success'));
        } else if (param1 === 'disable') {
            $.settings.set('tipAlerts', false);
            $.say(event.sender, weave.get('bot:settings:alerts-tips:disabled:success'));
        } else {
            const status = $.settings.get('tipAlerts', false)
                ? weave.get('common-words:enabled')
                : weave.get('common-words:disabled');
            $.say(event.sender, weave.get('bot:modules:events:alerts:tip:usage', status));
        }

        return;
    }

    if (event.subcommand === 'settings') {
        const cfg = [
            $.settings.get('followAlerts', true)
                ? weave.get('common-words:enabled')
                : weave.get('common-words:disabled'),
            $.settings.get('hostAlerts', true)
                ? weave.get('common-words:enabled')
                : weave.get('common-words:disabled'),
            $.settings.get('subAlerts', false)
                ? weave.get('common-words:enabled')
                : weave.get('common-words:disabled'),
            $.settings.get('tipAlerts', false)
                ? weave.get('common-words:enabled')
                : weave.get('common-words:disabled')
        ];

        $.say(event.sender, weave.get('bot:modules:events:alerts:settings', ...cfg));

        return;
    }

    $.say(event.sender, weave.get('bot:modules:events:alerts:usage'));
};

// Keep an array of events to prevent duplicates
const events = [];

Transit.on('alert:follow', (data) => {
    if ($.settings.get('followAlerts', true)) {
        if (!events.includes(`${data.display_name}:follow`)) {
            events.push(`${data.display_name}:follow`);
            const reward = $.settings.get('followReward', 50);

            if (reward > 0) {
                $.shout(weave.get('bot:settings:alerts-follows:response-reward',
                    data.display_name, $.points.str(reward));
            } else {
                $.shout(weave.get('bot:settings:alerts-follows:response-no-reward',
                    data.display_name));
            }
        }
    }
});

Transit.on('alert:host', (data) => {
    if ($.settings.get('hostAlerts', true)) {
        if (!events.includes(`${data.display_name}:host`)) {
            // Only consider hosts duplicates if the viewer count is the same
            events.push(`${data.display_name}:host:${data.viewers}`);
            const reward = $.settings.get('hostReward', 50);

            if (reward > 0) {
                $.shout(weave.get('bot:settings:alerts-hosts:response-reward',
                    data.display_name, data.viewers, $.points.str(reward));
            } else {
                $.shout(weave.get('bot:settings:alerts-hosts:response-no-reward',
                    data.display_name, data.viewers));
            }
        }
    }
});

Transit.on('alert:subscriber', (data) => {
    if ($.settings.get('subAlerts', false)) {
        if (!events.includes(`${data.display_name}:sub`)) {
            events.push(`${data.display_name}:sub`);
            const reward = $.settings.get('subReward', 50);
            let response = '';

            if (data.hasOwnProperty('months')) {
                // Event is a resub
                if (reward > 0) {
                    response = weave.get('bot:settings:alerts-resubs:response-reward',
                        data.display_name, data.months, $.points.str(reward));
                } else {
                    response = weave.get('bot:settings:alerts-resubs:response-no-reward',
                        data.display_name, data.months);
                }
            } else {
                // Event is a new subscription
                if (reward > 0) {
                    response = weave.get('bot:settings:alerts-subs:response-reward',
                        data.display_name, $.points.str(reward));
                } else {
                    response = weave.get('bot:settings:alerts-subs:response-no-reward',
                        data.display_name);
                }
            }

            $.shout(response);
        }
    }
});

Transit.on('alert:tip', (data) => {
    if ($.settings.get('tipAlerts', false)) {
        // Tip alerts are probably not duplicates, so don't check
        const reward = $.settings.get('tipReward', 50);

        if (reward > 0) {
            $.shout(weave.get('bot:settings:alerts-tips:response-reward',
                data.name, data.amount, $.points.str(reward));
        } else {
            $.shout(weave.get('bot:settings:alerts-tips:response-no-reward',
                data.name, data.amount));
        }
    }
});

(() => {
    $.addCommand('alerts', './modules/main/events', {
        permLevel: 0,
        status: true
    });
})();
