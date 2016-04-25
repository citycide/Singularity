const http = require('http'),
      path = require('path'),
      express = require('express'),
      chokidar = require('chokidar'),
      socketio = require('socket.io'),
      ejs = require('ejs');

const emitter = require(__dirname + '/app/emitter'),
      config = require(__dirname + '/app/configstore'),
      log = require(__dirname + '/app/logger');

let twitch, tipeee, bot;

/********************************** EXPRESS ***********************************/

const app = express();
const server = http.createServer(app);
const io = global.io = socketio(server);

const ROUTES = require('./app/routes')(app);
const SOCKETS = require('./app/sockets');
const PORT = config.get('port');

server.listen(PORT, () => {
    log.sys(`listening on *:${PORT}`);
});

setTimeout(() => {
    if (config.get('channel') && config.get('isLoggedIn')) {
        twitch = require(__dirname + '/app/twitch');
        twitch.initAPI();
    }
    if (config.get('tipeeeActive') && config.get('channel') && config.get('isLoggedIn')) {
        tipeee = require(__dirname + '/app/tipeee');
    }
    if (config.get('botEnabled') && config.get('isLoggedIn')) {
        global.rootDir = __dirname;
        bot = require(__dirname + '/app/bot/core');
        bot.initialize();
    }
}, 5 * 1000);

/******************************** FILE WATCHER *********************************/

const watcher = chokidar.watch('./app/*.js', {
    persistent: true
});

watcher.on('change', (_path, stats) => {
    log.debug('File updated.');
    let _module = '.' + path.sep + path.relative(__dirname, _path);
    delete require.cache[_path];
});