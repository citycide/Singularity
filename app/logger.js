/*********************************** LOGGER ***********************************/
const config = require('./configstore');

function log(msg) {
    console.log(msg);
}

log.info = function(msg) {
    console.log(`INFO: ${msg}`);
};
log.dash = (msg) => {
    console.log(`DASH: ${msg}`);
};
log.alert = (msg) => {
    console.log(`ALERT: ${msg}`);
};
log.bot = (msg) => {
    console.log(`BOT: ${msg}`);
};
log.debug = (msg) => {
    console.log(`DEBUG: ${msg}`);
};
log.auth = (msg) => {
    console.log(`AUTH: ${msg}`);
};
log.sys = (msg) => {
    console.log(`SYS: ${msg}`);
};
log.err = (msg) => {
    console.log(`ERROR: ${msg}`);
};

log.level = 0;

module.exports = exports = log;

/*
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
function bot(msg) {
    if (DEV_MODE) {
        console.log(`BOT: ${msg}`);
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
function err(msg) {
    if (DEV_MODE) {
        console.log(`ERROR: ${msg}`);
    }
}
module.exports.info = msg;
module.exports.dash = dash;
module.exports.alert = alert;
module.exports.bot = bot;
module.exports.debug = debug;
module.exports.auth = auth;
module.exports.info = sys;
module.exports.err = err;
*/