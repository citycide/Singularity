module.exports.alerts = (event) => {
    const param1 = event.args[1];

    if (event.subcommand === 'follow') {
        if (param1 === 'enable') {
            $.settings.set('followAlerts', true);
            $.say(event.sender, `Follow alerts enabled.`);
        } else if (param1 === 'disable') {
            $.settings.set('followAlerts', false);
            $.say(event.sender, `Follow alerts disabled.`);
        } else {
            const status = $.settings.get('followAlerts', true) ? 'enabled' : 'disabled';
            $.say(event.sender, `Usage: !alerts follow [enable | disable] (currently ${status})`);
        }

        return;
    }

    if (event.subcommand === 'host') {
        if (param1 === 'enable') {
            $.settings.set('hostAlerts', true);
            $.say(event.sender, `Host alerts enabled.`);
        } else if (param1 === 'disable') {
            $.settings.set('hostAlerts', false);
            $.say(event.sender, `Host alerts enabled.`);
        } else {
            const status = $.settings.get('hostAlerts', true) ? 'enabled' : 'disabled';
            $.say(event.sender, `Usage: !alerts host [enable | disable] (currently ${status})`);
        }

        return;
    }

    if (event.subcommand === 'sub') {
        if (param1 === 'enable') {
            $.settings.set('subAlerts', true);
            $.say(event.sender, `Subscriber alerts enabled.`);
        } else if (param1 === 'disable') {
            $.settings.set('subAlerts', false);
            $.say(event.sender, `Subscriber alerts disabled.`);
        } else {
            const status = $.settings.get('subAlerts', false) ? 'enabled' : 'disabled';
            $.say(event.sender, `Usage: !alerts sub [enable | disable] (currently ${status})`);
        }

        return;
    }

    if (event.subcommand === 'tip') {
        if (param1 === 'enable') {
            $.settings.set('tipAlerts', true);
            $.say(event.sender, `Tip alerts enabled.`);
        } else if (param1 === 'disable') {
            $.settings.set('tipAlerts', false);
            $.say(event.sender, `Tip alerts disabled.`);
        } else {
            const status = $.settings.get('tipAlerts', false) ? 'enabled' : 'disabled';
            $.say(event.sender, `Usage: !alerts tip [enable | disable] (currently ${status})`);
        }

        return;
    }

    if (event.subcommand === 'settings') {
        const cfg = [
            $.settings.get('followAlerts', true) ? 'enabled' : 'disabled',
            $.settings.get('hostAlerts', true) ? 'enabled' : 'disabled',
            $.settings.get('subAlerts', false) ? 'enabled' : 'disabled',
            $.settings.get('tipAlerts', false) ? 'enabled' : 'disabled'
        ];

        $.say(event.sender,
            `Follows: ${cfg[0]}, Hosts: ${cfg[1]}, Subs: ${cfg[2]}, Tips: ${cfg[3]}`);

        return;
    }

    $.say(event.sender, `Usage: !alerts [follow | host | sub | tip]`);
};

// Keep an array of events to prevent duplicates
const events = [];

Transit.on('alert:follow', (data) => {
    if ($.settings.get('followAlerts', true)) {
        if (!events.includes(`${data.display_name}:follow`)) {
            events.push(`${data.display_name}:follow`);
            return $.shout(`Thanks for the follow, ${data.display_name}!`);
        }
    }
});

Transit.on('alert:host', (data) => {
    // eslint-disable-next-line
    const { name: display_name, viewers } = data;
    if ($.settings.get('hostAlerts', true)) {
        if (!events.includes(`${name}:host`)) {
            // Only consider hosts duplicates if the viewer count is the same
            events.push(`${name}:host:${viewers}`);
            return $.shout(`${name} fired up the host machine for ${viewers} viewers. Thanks!`);
        }
    }
});

Transit.on('alert:subscriber', (data) => {
    if ($.settings.get('subAlerts', false)) {
        if (!events.includes(`${data.display_name}:sub`)) {
            events.push(`${data.display_name}:sub`);

            if (data.hasOwnProperty('months')) {
                // Event is a resub
                return $.shout(`${data.display_name} has been subbed for ${data.months} months!`);
            } else {
                // Event is a new subscription
                return $.shout(`Thanks for subscribing, ${data.display_name}!`);
            }
        }
    }
});

Transit.on('alert:tip', (data) => {
    if ($.settings.get('tipAlerts', false)) {
        // Tip alerts are probably not duplicates, so don't check
        return $.shout(`${data.name} tipped ${data.amount}. Thank you! PogChamp`);
    }
});

(() => {
    $.addCommand('alerts', {
        permLevel: 0,
        status: true
    });
})();
