/*********************************** LOGGER ***********************************/
'use strict';

const config = require('./configstore');
const DEV_MODE = config.get('devMode');

function msg(msg) {
    if (DEV_MODE) {
        console.log(msg);
    }
}
function dash(msg) {
    if (DEV_MODE) {
        console.log(`DASH: ${msg}`);
    }
}
function alert(msg) {
    if (DEV_MODE) {
        console.log(`ALERT: ${msg}`);
    }
}
function debug(msg) {
    if (DEV_MODE) {
        console.log(`DEBUG: ${msg}`);
    }
}
function auth(msg) {
    if (DEV_MODE) {
        console.log(`AUTH: ${msg}`);
    }
}
function sys(msg) {
    if (DEV_MODE) {
        console.log(`SYS: ${msg}`);
    }
}

/**
 *  EXPORT FUNCTIONS
 */
module.exports.msg = msg;
module.exports.dash = dash;
module.exports.alert = alert;
module.exports.debug = debug;
module.exports.auth = auth;
module.exports.sys = sys;