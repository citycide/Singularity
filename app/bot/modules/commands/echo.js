const emitter = require(rootDir + '/app/emitter');

emitter.on('botReady', function() {
    emitter.emit('commandRegistry', {
        name: ['echo'],
        module: './modules/commands/echo',
        cooldown: 30,
        permLevel: 0
    });
});

module.exports.echo = function(event) {
    global.$.bot.say(global.$.channel.name, event.argString);
};