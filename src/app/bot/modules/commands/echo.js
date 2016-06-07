/**
 * ECHO - a simple example command module
 */

/**
 * The bot will simply repeat whatever follows the command
 * @command echo
 * @usage !echo [message]
 * @commandArgs {string} - the message to repeat
 * @param {object} event
 */
module.exports.echo = (event) => {
    if (event.args[0] === 'twice') {
        $.say(event.sender, `${event.subArgString} ${event.subArgString}`);
        return;
    }
    if (event.args[0] === 'loudly') {
        $.say(event.sender, `${event.subArgString.toUpperCase()}`);
        return;
    }
    $.say(event.sender, event.argString);
};

/**
 * Register the module & its commands with the bot
 * @function {IIFE}
 */
(() => {
    /**
     * $.addCommand
     * @param {string} name - what must be typed in chat to run the command
     * @param {string} path - path to this file
     * @param {object} options - override the defaults when registering the command
     *      @property {string} handler - the exported function that actually runs the command
     *      @property {number} cooldown - the default cooldown time for the command
     *      @property {number} permLevel - the default permissions required to use the command
     *      @property {boolean} status - whether the command is enabled / disabled by default
     *      @property {number} price - the default number of points paid to use the command
     */
    $.addCommand('echo', './modules/commands/echo', {
        status: true,
        price: 2
    });

    $.addSubcommand('twice', 'echo', {
        status: true,
        cooldown: 10
    });
    $.addSubcommand('loudly', 'echo', {
        status: true,
        cooldown: 10
    });

    /**
     * Modules included in the app package use a relative file path as above
     * User-installed modules should use the variable `__filename`
     */
})();