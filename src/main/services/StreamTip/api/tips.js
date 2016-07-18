'use strict';

const debug = require('debug')('streamtip:api:tips');

function get(id, callback) {
    debug(`getting tip by id ${id}`);
    this.get(`tips/${id}`, (err, response, body) => {
        if (err)  {
            debug(`error getting tip ${id}`, err);
            return callback(err);
        }

        if (response.statusCode !== 200) {
            debug(`unexpected status code ${response.statusCode} getting tip ${id}`);
            return callback(new Error(body));
        }

        callback(null, body.tip);
    });
}

function getAll(query, callback) {
    if (!callback) {
        callback = query;
        query = {};
    }

    debug('getting all tips', query);
    this.get('tips', {qs: query}, (err, response, body) => {
        if (err)  {
            debug('error getting tips', err);
            return callback(err);
        }
        
        if (response.statusCode !== 200) {
            debug(`unexpected status code ${response.statusCode} getting tips`);
            return callback(new Error(body));
        }

        callback(null, body.tips);
    });
}

module.exports = {
    get: get,
    getAll: getAll
};
