const params = function(event, text) {
    if (typeof event !== 'object' || !hasTags.test(text)) return text;

    if ((/\(sender\)/g).test(text)) {
        text = text.replace(/\(sender\)/g, event.sender);
    }

    if ((/\(@sender\)/g).test(text)) {
        text = text.replace(/\(@sender\)/g, `@${event.sender}`);
    }

    if ((/\(random\)/g).test(text)) {
        text = text.replace(/\(random\)/g, $.util.arr.random($.user.list) || $.channel.name);
    }

    if ((/\(pointname\)/g).test(text)) {
        text = text.replace(/\(pointname\)/g, $.points.getName());
    }

    if ((/\(#\)/g).test(text)) {
        text = text.replace(/\(#\)/g, $.util.num.random(100));
    }

    if ((/\(uptime\)/g).test(text)) {
        text = text.replace(/\(uptime\)/g, $.stream.uptime);
    }

    if ((/\(followers\)/g).test(text)) {
        text = text.replace(/\(followers\)/g, 'TODO');
    }

    if ((/\(game\)/g).test(text)) {
        text = text.replace(/\(game\)/g, $.stream.game);
    }

    if ((/\(status\)/g).test(text)) {
        text = text.replace(/\(status\)/g, $.stream.status);
    }

    if ((/\(target\)/g).test(text)) {
        text = text.replace(/\(target\)/g, 'TODO');
    }

    if ((/\(echo\)/g).test(text)) {
        text = text.replace(/\(echo\)/g, event.argString);
    }

    if ((/\(readfile\)/g).test(text)) {
        text = text.replace(/\(readfile\)/g, 'TODO');
    }

    if ((/\(count\)/g).test(text)) {
        const count = $.db.incr();
        text = text.replace(/\(count\)/g, count);
    }

    if ((/\(price\)/g).test(text)) {
        const price = $.command.getPrice(event.command, event.subcommand);
        text = text.replace(/\(price\)/g, price);
    }

    return text;
};

const tagList = [
    `(age)`,
    `(sender)`,
    `(@sender)`,
    `(random)`,
    `(count)`,
    `(pointname)`,
    `(price)`,
    `(#)`,
    `(uptime)`,
    `(followers)`,
    `(game)`,
    `(status)`,
    `(target)`,
    `(echo)`,
    `(readfile `
];

const hasTags = new RegExp(escape(tagList.join('|')));

function escape(str) {
    // Normally this would also contain a pipe (|) character
    // I've excluded it so the joined tagList escapes correctly
    return str.replace(/[-\/\\^$*+?.()[\]{}]/g, '\\$&');
}

export default params;

$.params = params;
