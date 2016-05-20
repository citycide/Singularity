import _ from 'lodash';
import API from './API'

export default class TwitchAlerts {
    constructor(options) {
        this.options = options || {};
        this.token = this.options.token || '';
        this.apiVersion = this.options.apiVersion || '';
        this.API = new API(this);
    }
}

const extendOptions = _.defaults;

TwitchAlerts.prototype.getRecentDonations = function(options) {
    const opts = {
        name: 'donations'
    };
    return this.API.request(extendOptions(opts, options));
};

/*
 * Doesn't work
TwitchAlerts.prototype.getDonationGoal = function(options) {
    const opts = {
        name: 'donationGoal'
    };
    return this.API.request(extendOptions(opts, options));
};*/
