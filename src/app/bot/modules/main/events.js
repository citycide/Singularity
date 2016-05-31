const events = [];

Transit.on('alert:follow', (data) => {
    if (core.settings.get('followAlerts')) {
        if (!events.includes(`${data.display_name}:follow`)) {
            events.push(`${data.display_name}:follow`);
            return core.shout(`Thanks for the follow, ${data.display_name}!`);
        }
    }
});

Transit.on('alert:host', (data) => {
    if (core.settings.get('hostAlerts')) {
        if (!events.includes(`${data.display_name}:host`)) {
            events.push(`${data.display_name}:host`);
            return core.shout(`${data.display_name} fired up the host machine. Thanks!`);
        }
    }
});

Transit.on('alert:subscriber', (data) => {
    if (core.settings.get('subAlerts')) {
        if (!events.includes(`${data.display_name}:sub`)) {
            events.push(`${data.display_name}:sub`);
            return core.shout(`Thanks for subscribing, ${data.display_name}!`);
        }
    }
});

Transit.on('alert:tip', (data) => {
    if (core.settings.get('tipAlerts'))
        return core.shout(`${data.name} tipped ${data.amount}. Thank you! PogChamp`);
});

module.exports.alerts = (event) => {
    let action = event.args[0];
    let param1 = event.args[1];
    let toggle = '';
    if (!action) return core.say(event.sender, `Usage: !alerts [follow | host | sub | tip]`);
    switch (action) {
        case 'follow':
            switch (param1) {
                case 'enable':
                    core.settings.set('followAlerts', true);
                    core.say(event.sender, `Follow alerts enabled.`);
                    break;
                case 'disable':
                    core.settings.set('followAlerts', false);
                    core.say(event.sender, `Follow alerts disabled.`);
                    break;
                default:
                    return core.say(event.sender, `Usage: !alerts follow [enable | disable]`);
            }
            break;
        case 'host':
            if (!param1) return core.say(event.sender, `Usage: !alerts host [enable | disable]`);
            if (param1 === 'enable') {
                toggle = true;
            } else if (param1 === 'disable') {
                toggle = false;
            } else {
                return core.say(event.sender, `Usage: !alerts host [enable | disable]`);
            }
            core.settings.set('hostAlerts', toggle);
            break;
        case 'sub':
            if (!param1) return core.say(event.sender, `Usage: !alerts sub [enable | disable]`);
            if (param1 === 'enable') {
                toggle = true;
            } else if (param1 === 'disable') {
                toggle = false;
            } else {
                return core.say(event.sender, `Usage: !alerts sub [enable | disable]`);
            }
            core.settings.set('subAlerts', toggle);
            break;
        case 'tip':
            if (!param1) return core.say(event.sender, `Usage: !alerts tip [enable | disable]`);
            if (param1 === 'enable') {
                toggle = true;
            } else if (param1 === 'disable') {
                toggle = false;
            } else {
                return core.say(event.sender, `Usage: !alerts tip [enable | disable]`);
            }
            core.settings.set('tipAlerts', toggle);
            break;
    }
};

(() => {
    Transit.emit('bot:command:register', [
        {
            name: 'alerts',
            cooldown: 0,
            permLevel: 0
        }
    ], './modules/main/events');
})();