/**
 * Quotes are saved in the db table 'quotes' with columns:
 * id | message | credit | submitter | date | game
 */

module.exports.quote = (event) => {
    const [action, param1] = event.args;
    const regex = /~(\w+)/g;

    if (!event.args.length) {
        $.say(event.sender, `Usage: !quote [add | remove | edit | help]`);
    }

    if (action === 'add') {
        if (event.args.length < 3) {
            $.say(event.sender, `Usage: !quote add Something really wise. (~WhoSaidIt)`);
            return;
        }

        const thisQuote = {
            submitter: event.sender
        };

        if (event.subArgString.match(regex)) {
            thisQuote.message = event.subArgString.replace(regex, '').replace(/"/g, '');
            thisQuote.credit = regex.exec(event.subArgString)[1];
        } else {
            thisQuote.message = event.subArgString.replace(/"/g, '');
        }

        const quoteID = $.quote.add(thisQuote);

        if (quoteID) {
            $.say(event.sender, `Quote added as #${quoteID}`);
        } else {
            $.say(event.sender, `Failed to add quote.`);
        }

        return;
    }

    if (action === 'remove') {
        if (!$.util.num.isFinite(parseInt(param1)) || parseInt(param1) < 1) {
            $.say(event.sender, `Usage: !quote remove (number >/= 1)`);
            return;
        }

        if ($.quote.remove(parseInt(param1))) {
            const count = $.quote.getCount();
            $.say(event.sender, `Quote removed. ${count} quotes remaining.`);
        } else {
            $.say(event.sender, `Failed to remove quote #${parseInt(param1)}.`);
        }

        return;
    }

    if (action === 'edit') {
        if (!$.util.num.isFinite(parseInt(param1)) || parseInt(param1) < 1) {
            $.say(event.sender, `Usage: !quote edit (number > 1) [message] [~username]`);
            return;
        }

        // @TODO: allow for editing game & date somehow. separate command?

        const newQuote = {};

        if (event.subArgString.match(regex)) {
            newQuote.message = event.subArgs.slice(1).join(' ').replace(regex, '');
            newQuote.credit = regex.exec(event.subArgString)[1];
        } else {
            newQuote.message = event.subArgs.slice(1).join(' ');
        }

        if ($.quote.modify(parseInt(param1), newQuote)) {
            $.say(event.sender, `Quote #${parseInt(param1)} modified.`);
        } else {
            $.say(event.sender, `Failed to edit quote #${parseInt(param1)}`);
        }

        return;
    }

    if (action === 'help') {
        $.say(event.sender, `To save a quote, use '!quote add Something really wise.' ` +
            `To credit who said it, add '~username' with no space.`);
        return;
    }

    if (parseInt(action) && $.quote.exists(parseInt(action))) {
        const quote = $.quote.get(parseInt(action));

        /**
         * quote is now = {
         *      id: 1,
         *      message: 'string of wise text',
         *      credit: 'citycide',
         *      submitter: 'someuser39',
         *      date: '06/17/16',
         *      game: 'Destiny'
         * }
         */

        $.shout(`"${quote.message}" - ${quote.credit} (${quote.date})`);
    } else {
        $.say(`Usage: !quote [add | remove | edit | help]`);
    }
};

(() => {
    $.addCommand('quote', './modules/main/quotes', {
        cooldown: 60,
        status: true
    });

    $.addSubcommand('add', 'quote', { status: true });
    $.addSubcommand('remove', 'quote', { permLevel: 0, status: true });
    $.addSubcommand('edit', 'quote', { permLevel: 0, status: true });
    $.addSubcommand('help', 'quote', { status: true });
})();
