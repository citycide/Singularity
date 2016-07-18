'use strict';

const debug = require('debug')('streamtip:api:goals');

function get(id, callback) {
    debug(`getting goal by id ${id}`);
    this.get(`goals/${id}`, (err, response, body) => {
        if (err)  {
            debug(`error getting goal ${id}`, err);
            return callback(err);
        }

        if (response.statusCode !== 200) {
            debug(`unexpected status code ${response.statusCode} getting goal ${id}`);
            return callback(new Error(body));
        }

        callback(null, body.goal);
    });
}

function getAll(query, callback) {
    if (!callback) {
        callback = query;
        query = {};
    }

    debug('getting all goals', query);
    this.get('goals', {qs: query}, (err, response, body) => {
        if (err)  {
            debug('error getting goals', err);
            return callback(err);
        }
        
        if (response.statusCode !== 200) {
            debug(`unexpected status code ${response.statusCode} getting goals`);
            return callback(new Error(body));
        }

        callback(null, body.goals.map(g => g.goal));
    });
}

module.exports = {
    get: get,
    getAll: getAll
};
