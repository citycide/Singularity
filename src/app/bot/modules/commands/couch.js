/**
 * couch - lets users find random amounts of currency
 *
 * @command couch
 * @usage !couch
 * @param {object} event
 *
 * @source stock module
 * @author citycide
 */

module.exports.couch = event => {
    const multi = $.db.getModuleConfig('couch', 'multiplier', 1);
    const random = $.util.num.random;
    const num = random(1000);
    let payout = 0;

    if (!event.args.length) {
        if (num <= 500) {
            payout = random(3) * multi;
        }

        if (num > 500 && num <= 750) {
            payout = random(6) * multi;
        }

        if (num > 750 && num <= 920) {
            payout = random(3, 9) * multi;
        }

        if (num > 920 && num <= 990) {
            payout = random(6, 18) * multi;
        }

        if (num > 990 && num <= 1000) {
            payout = random(22, 100) * multi;
        }

        if (payout === 0) {
            $.say(event.sender, `You didn't find any ${$.points.getName()} in the couch this time.`);
        } else {
            $.points.add(event.sender, payout);
            $.say(event.sender, `You found ${$.points.str(payout)} in the couch.`);
        }

        return;
    }

    if (event.subcommand === 'multi') {
        if (!event.subArgs[0] || !$.util.str.isNumeric(event.subArgs[0])) {
            $.say(event.sender, `Usage: !couch multi (multiplier) » currently set to ${multi}`);
            return;
        }

        const newMulti = $.util.toNumber(event.subArgs[0]);

        $.db.setModuleConfig('couch', 'multiplier', newMulti);
        $.say(event.sender, `!couch multiplier set to ${newMulti}`);
    }
};

(() => {
    $.addCommand('couch', {
        cooldown: 300,
        status: true
    });

    $.addSubcommand('multi', 'couch', { permLevel: 0, status: true });
})();
