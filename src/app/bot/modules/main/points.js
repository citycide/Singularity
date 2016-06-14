module.exports.points = (event) => {
    let action = event.args[0];
    let param1 = event.args[1];
    let param2 = event.args[2];

    if (action) {
        if (action === 'add') {
            if (event.args.length < 3 || !$.util.num.validate(param2)) {
                $.say(event.sender, `Usage: !points add (username) (amount)`);
                return;
            }

            $.points.add(param1, param2);
            $.say(event.sender, `${param1} now has ${$.points.get(param1, true)}.`);

            return;
        }

        if (action === 'remove') {
            if (event.args.length < 3 || !$.util.num.validate(param2)) {
                $.say(event.sender, `Usage: !points remove (username) (amount)`);
                return;
            }

            $.points.sub(param1, param2);
            $.say(event.sender, `${param1} now has ${$.points.get(param1, true)}.`);

            return;
        }

        if (action === 'gift') {
            if (event.args.length < 3 || !$.util.num.validate(param2)) {
                $.say(event.sender, `Usage: !points gift (username) (amount)`);
                return;
            }

            if ($.points.get(event.sender) < parseInt(param2)) {
                $.say(event.sender, `You only have ${$.points.get(event.sender)}`);
                return;
            }

            $.points.sub(event.sender, param2);
            $.points.add(param1, param2);

            if ($.settings.get('whisperMode')) {
                $.whisper(event.sender,
                    `You gave ${$.points.str(param2)} to ${param1} (${$.points.get(event.sender, true)} left)`);
                $.whisper(param1,
                    `${event.sender} gave you ${$.points.str(param2)} (you now have ${$.points.get(event.sender, true)})`);
            } else {
                $.say(event.sender,
                    `You gave ${$.points.str(param2)} to ${param1} (${$.points.get(event.sender, true)} left)`);
            }
        }

        if ($.users.exists(action)) {
            $.say(event.sender, `${action} has ${$.points.get(action, true)}.`);
        } else {
            $.say(event.sender, `${action} hasn't visited the chat yet.`);
        }
    } else {
        $.say(event.sender, `You have ${$.points.get(event.sender, true)}.`);
    }
};

(() => {
    $.addCommand('points', './modules/main/points', {
        cooldown: 0
    });

    $.addSubcommand('add', 'points', { permLevel: 0 });
    $.addSubcommand('remove', 'points', { permLevel: 0 });
})();
