/**
 * coin - bet currency on the outcome of a coin flip
 *
 * @command coin
 * @usage !coin [amount]
 * @param {object} event
 *
 * @source stock module
 * @author citycide
 */

module.exports.coin = event => {
    if (!event.args.length) {
        $.say(event.sender, `Usage: !coin (bet amount)`);
        return;
    }

    const risk = $.db.getModuleConfig('coin', 'risk', 1);
    const reward = $.db.getModuleConfig('coin', 'reward', 1);
    const maxBet = $.db.getModuleConfig('coin', 'maxBet', 50);

    if ($.util.str.isNumeric(event.args[0])) {
        const betAmount = parseInt(event.args[0]);
        const userPoints = $.points.get(event.sender);

        if (betAmount > maxBet) {
            $.say(event.sender, `The max bet for !coin is ${$.points.str(maxBet)}. ` +
                `Try again with a smaller bet.`);
            return;
        }

        if (betAmount > userPoints * risk) {
            $.say(event.sender, `You don't have enough ${$.points.getName()} FeelsBadMan ` +
                `(${$.points.get(event.sender, true)} available, risk multiplier of ${risk})`);
            return;
        }

        const result = $.util.num.random(1000) < 500;

        if (result) {
            const result = betAmount * reward;
            $.points.add(event.sender, result);
            $.say(event.sender, `You won ${$.points.str(result)} from the coin flip! PogChamp`);
        } else {
            const result = betAmount * risk;
            $.points.sub(event.sender, result);
            $.say(event.sender, `You lost ${$.points.str(result)} from the coin flip! BibleThump`);
        }

        return;
    }

    if (event.subcommand === 'risk') {
        if (!event.subArgs[0] || !$.util.str.isNumeric(event.subArgs[0])) {
            $.say(event.sender, `Usage: !coin risk (multiplier) » currently set to ${risk}`);
            return;
        }

        const newRisk = $.util.toNumber(event.subArgs[0]);
        $.db.setModuleConfig('coin', 'risk', newRisk);

        $.say(event.sender, `Risk multiplier for !coin updated to ${$.points.str(newRisk)}.`);

        return;
    }

    if (event.subcommand === 'reward') {
        if (!event.subArgs[0] || !$.util.str.isNumeric(event.subArgs[0])) {
            $.say(event.sender, `Usage: !coin reward (multiplier) » currently set to ${reward}`);
            return;
        }

        const newReward = $.util.toNumber(event.subArgs[0]);
        $.db.setModuleConfig('coin', 'reward', newReward);

        $.say(event.sender, `Reward multiplier for !coin updated to ${$.points.str(newReward)}.`);

        return;
    }

    if (event.subcommand === 'max') {
        if (!event.subArgs[0] || !$.util.str.isNumeric(event.subArgs[0])) {
            $.say(event.sender, `Usage: !coin max (number) » currently set to ${maxBet}`);
            return;
        }

        const newMax = $.util.toNumber(event.subArgs[0], true);
        $.db.setModuleConfig('coin', 'maxBet', newMax);

        $.say(event.sender, `Max bet for !coin updated to ${$.points.str(newMax)}.`);
    }

};

(() => {
    $.addCommand('coin', {
        cooldown: 60,
        status: true
    });

    $.addSubcommand('risk', 'coin', { permLevel: 0, status: true });
    $.addSubcommand('reward', 'coin', { permLevel: 0, status: true });
    $.addSubcommand('max', 'coin', { permLevel: 0, status: true });
})();
