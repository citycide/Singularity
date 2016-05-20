import request from 'request';
import extend from 'extend';

const BASE_URL = 'https://api.tipeeestream.com/';
const VERSION = 'v1.0/';

class API {
    constructor(key) {
        this.key = key;
    }

    get(url, options, callback) {
        if (!callback) {
            callback = options;
            options = {};
        }

        const defaults = { method: 'GET' };
        options = extend(true, defaults, options);

        return this._request(url, options, callback);
    }

    _request(url, options, callback) {
        const defaults = {
            uri: `${BASE_URL}${VERSION}${url}`,
            headers: {'apiKey': this.key},
            json: true,
            strictSSL: true
        };

        options = extend(true, defaults, options);

        return request(options, (err, res, body) => {
            callback(err, res, body);
        });
    }
}

export default API;