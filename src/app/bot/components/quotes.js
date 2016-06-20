import _ from 'lodash';
import moment from 'moment';

const quotes = {
    add(quote) {
        if (!_.isPlainObject(quote) || !quote.hasOwnProperty('message')) return false;

        const obj = Object.assign({}, {
            credit: $.channel.name,
            submitter: '',
            date: moment().format('L'),
            game: $.stream.game || ''
        }, quote);

        $.db.set('quotes', {
            message: sanitizeText(obj.message),
            credit: obj.credit,
            submitter: obj.submitter,
            date: obj.date,
            game: obj.game
        });

        const result = $.db.getRow('quotes', obj);
        return result ? result.id : false;
    },
    get(id) {
        if (!_.isFinite(id)) return false;

        const response = $.db.getRow('quotes', { id });
        return _.isPlainObject(response) ? response : null;
    },
    remove(id) {
        if (!_.isFinite(id)) return false;

        $.db.del('quotes', { id });

        return !this.exists(id);
    },
    modify(id, newData) {
        if (!_.isFinite(id) || !_.isPlainObject(newData)) return false;

        $.db.set('quotes', newData, { id });

        return this.exists(id);
    },
    exists(id) {
        const response = $.db.getRow('quotes', { id });
        return _.isPlainObject(response);
    },
    getCount() {
        return $.db.countRows('quotes');
    }
};

function sanitizeText(str) {
    // remove surrounding double quotes
    // @DEV: if this pattern has issues try this one:
    // /^"(.+(?="$))"$/g
    if (str.match(/^"(.*)"$/g)) {
        str = str.replace(/^"(.*)"$/g, '$1');
    }

    return str;
}

$.on('bot:ready', () => {
    $.quote = {};
    Object.assign($.quote, quotes);

    $.db.addTableCustom('quotes', [
        { name: 'id', type: 'integer', primaryKey: true, autoIncrement: true },
        'message', 'credit', 'submitter', 'date', 'game'
    ]);
});

export default quotes;
