if (process.cwd() !== __dirname) {
    console.warn(`WARN: process.cwd is ${process.cwd()}, expected ${__dirname}`);
    process.chdir(__dirname);
    console.info(`INFO: Changed process.cwd to ${__dirname}`);
}

process.on('uncaughtException', err => {
    console.error(err);
    /*
    if (!global.rollbarEnabled) {
        console.error('UNCAUGHT EXCEPTION! NodeCG will now exit.');
        console.error(err.stack);
        process.exit(1);
    }
    */
});

const server = require('./server');