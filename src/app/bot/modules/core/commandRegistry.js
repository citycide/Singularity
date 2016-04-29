/****************************** COMMAND REGISTRY ******************************/

const db = require('../../../../app/db'),
      emitter = require('../../../../app/emitter'),
      log = require('../../../../app/logger');

let commands = {};

emitter.on('botReady', function() {
    log.debug('Listening for commands.');
});

emitter.on('commandRegistry', function(data) {
    for (let cmd of data.name) {
        commands[cmd] = {
            name: cmd,
            module: data.module
        };
        db.bot.addCommand(cmd, data.cooldown, data.permLevel, false, data.module);
    }
});

module.exports = commands;