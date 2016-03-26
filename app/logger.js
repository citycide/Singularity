/*********************************** LOGGER ***********************************/
'use strict';

var config = require('./configstore');
var devMode = config.get('devMode');

function msg(msg) {
    if (devMode) {
        console.log(msg);
    }
}
function dash(msg) {
    if (devMode) {
        console.log('DASH: ' + msg);
    }
}
function alert(msg) {
    if (devMode) {
        console.log('ALERT: ' + msg);
    }
}
function debug(msg) {
    if (devMode) {
        console.log('DEBUG: ' + msg);
    }
}
function auth(msg) {
    if (devMode) {
        console.log('AUTH: ' + msg);
    }
}
function sys(msg) {
    if (devMode) {
        console.log('SYS: ' + msg);
    }
}

/**
 *** USAGES
 **/
// log.msg('Test of a console message.');
// > Test of a console message.
// log.dash('Test of a dashboard console message.');
// > DASH: Test of a dashboard console message.
// log.alert('Test of an alert console message.');
// > ALERT: Test of an alert console message.
// log.debug('Test of a debug console message.');
// > DEBUG: Test of a debug console message.
// log.sys('Test of an auth console message.');
// > AUTH: Test of a system console message.
// log.sys('Test of a system console message.');
// > SYS: Test of a system console message.

/**
 *** EXPORT FUNCTIONS
 **/
module.exports.msg = msg;
module.exports.dash = dash;
module.exports.alert = alert;
module.exports.debug = debug;
module.exports.auth = auth;
module.exports.sys = sys;