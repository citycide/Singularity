const url = require('url');
const _ = require('lodash');
const rp = require('request-promise');
const apiData = {
    names: {
        v1: {
            donations: 'donations',
            donationGoal: 'donationGoal'
        }
    },
    API: {
        v1: {
            base: 'http://www.twitchalerts.com/api/',
            endpoints: [
                {
                    name: 'donations',
                    auth: {
                        required: true,
                        qs: 'access_token'
                    },
                    method: 'GET',
                    path: 'donations',
                    contentType: '*/*',
                    queryOptions: []
                },
                {
                    name: 'donationGoal',
                    auth: {
                        required: true,
                        qs: 'token'
                    },
                    method: 'GET',
                    path: '../widgets/donation-goal',
                    contentType: 'json',
                    queryOptions: [
                        {
                            name: 'filemtime',
                            defaultValue: 1,
                            type: 'number',
                            required: true
                        },
                        {
                            name: 'hash',
                            defaultValue: "",
                            type: 'string',
                            required: false
                        }
                    ]
                }
            ]
        }
    }
};

export default class API {
	constructor(options) {
		this.token = options.token;
		this.defaultAPIVersion = 'v1';
		this.apiVersion = _.has(apiData.API, options.apiVersion) ? options.apiVersion : this.defaultAPIVersion;
		this.ad = apiData.API[this.apiVersion];
	}
}

API.prototype.locateEndpoint = function(options, result, resultDefault) {
    let lookup = _.find(this.ad.endpoints, options || {});
    if (!_.isEmpty(result)) {
        lookup = _.result(lookup, result, resultDefault);
    }
    return lookup;
};

API.prototype.resolve = function(options) {
    return url.resolve(this.ad.base, options.path || '');
};

API.prototype.request = function(options) {
    const api = apiData.names[this.apiVersion];
    const endpointName = api[options.name];
    const ep = this.locateEndpoint({ name: endpointName });
    if (ep !== undefined) {
        const uri = this.resolve({ path: ep.path });
        const auth = ep.auth;
        const headers = {
            Accept: ep.contentType,
            'Accept-Encoding': 'gzip, deflate, sdch',
            Connection: 'keep-alive'
        };
        const qs = {callback:'?'};
        const defaultQS = _.map(ep.queryOptions, function(e) {
            const b = {};
            if(e.required) {
                b[e.name] = e.defaultValue;
            }
            return b;
        });
        const qsOptions = _.defaults(options.qs || {}, defaultQS);
        if (auth.required) {
            qs[auth.qs] = this.token;
        }
        _.merge(qs, qsOptions);
        const opts = {
            uri: uri,
            method: ep.method,
            qs: qs,
            headers: headers,
            gzip: true,
            json: true
        };
        return rp(opts);
    }
    return false;
};