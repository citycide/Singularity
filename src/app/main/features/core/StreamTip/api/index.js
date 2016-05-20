'use strict';

const debug = require('debug')('streamtip:api');
const extend = require('extend');
const request = require('request');

const BASEURL = 'https://streamtip.com/api/';

class API {
    constructor(clientId, accessToken) {
        this._authorization = `${clientId} ${accessToken}`;
    }

    get(url, options, callback) {
        if (!callback) {
            callback = options;
            options = {};
        }

        let defaults = {method: 'GET'};
        options = extend(true, defaults, options);

        return this._request(url, options, callback);
    }

    _request(url, options, callback) {
        debug(`requesting url '${url}'`, options);

        let defaults = {
            uri: `${BASEURL}${url}`,
            headers: {'Authorization': this._authorization},
            json: true,
            strictSSL: true
        };

        options = extend(true, defaults, options);

        return request(options, (error, response, body) => {
            debug(`received url ${url}`);

            callback(error, response, body);
        });
    }
}

const goals = require('./goals');
API.prototype.getGoal = goals.get;
API.prototype.getAllGoals = goals.getAll;

const tips = require('./tips');
API.prototype.getTip = tips.get;
API.prototype.getAllTips = tips.getAll;

module.exports = API;
