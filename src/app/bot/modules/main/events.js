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
    if ($.settings.get('hostAlerts', true)) {
        if (!events.includes(`${data.display_name}:host`)) {
            events.push(`${data.display_name}:host`);
            return $.shout(`${data.display_name} fired up the host machine. Thanks!`);
        }
    }
});

Transit.on('alert:subscriber', (data) => {
    if ($.settings.get('subAlerts', false)) {
        if (!events.includes(`${data.display_name}:sub`)) {
            events.push(`${data.display_name}:sub`);
            return $.shout(`Thanks for subscribing, ${data.display_name}!`);
        }
    }
});

Transit.on('alert:tip', (data) => {
    if ($.settings.get('tipAlerts', false))
        return $.shout(`${data.name} tipped ${data.amount}. Thank you! PogChamp`);
});

module.exports.alerts = (event) => {
    let action = event.args[0];
    let param1 = event.args[1];
    let toggle = '';
    if (!action) return $.say(event.sender, `Usage: !alerts [follow | host | sub | tip]`);
    switch (action) {
        case 'follow':
            switch (param1) {
                case 'enable':
                    $.settings.set('followAlerts', true);
                    $.say(event.sender, `Follow alerts enabled.`);
                    break;
                case 'disable':
                    $.settings.set('followAlerts', false);
                    $.say(event.sender, `Follow alerts disabled.`);
                    break;
                default:
                    return $.say(event.sender, `Usage: !alerts follow [enable | disable]`);
            }
            break;
        case 'host':
            if (!param1) return $.say(event.sender, `Usage: !alerts host [enable | disable]`);
            if (param1 === 'enable') {
                toggle = true;
            } else if (param1 === 'disable') {
                toggle = false;
            } else {
                return $.say(event.sender, `Usage: !alerts host [enable | disable]`);
            }
            $.settings.set('hostAlerts', toggle);
            break;
        case 'sub':
            if (!param1) return $.say(event.sender, `Usage: !alerts sub [enable | disable]`);
            if (param1 === 'enable') {
                toggle = true;
            } else if (param1 === 'disable') {
                toggle = false;
            } else {
                return $.say(event.sender, `Usage: !alerts sub [enable | disable]`);
            }
            $.settings.set('subAlerts', toggle);
            break;
        case 'tip':
            if (!param1) return $.say(event.sender, `Usage: !alerts tip [enable | disable]`);
            if (param1 === 'enable') {
                toggle = true;
            } else if (param1 === 'disable') {
                toggle = false;
            } else {
                return $.say(event.sender, `Usage: !alerts tip [enable | disable]`);
            }
            $.settings.set('tipAlerts', toggle);
            break;
    }
};

(() => {
    $.addCommand('alerts', './modules/main/events', {
        permLevel: 0,
        status: true
    });
})();