module.exports.echo = (event) => {
    core.say(event.argString);
};

Transit.on('bot:command:listen', () => {
    Transit.emit('bot:command:register', [
        {
            name: 'echo',
            handler: 'echo',
            cooldown: 30,
            permLevel: 0
        }
    ], './modules/commands/echo');
});