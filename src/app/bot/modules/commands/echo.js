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
    core.say(event.sender, event.argString);
};

/**
 * Register the module & its commands with the bot
 * @function {IIFE}
 */
(() => {
    // Sends a message over the global 'Transit' emitter
    // The command registry listens for this event
    Transit.emit('bot:command:register', [
        // an array of objects
        // each object should represent a command
        {
            /**
             * @property {string} name - what must be typed in chat to run the command
             */
            name: 'echo',
            /**
             * @property {string} handler - the exported function that actually runs the command
             * @description if absent the handler defaults to using the name property
             */
            handler: 'echo',
            /**
             * @property {number} cooldown - the default cooldown time for the command
             */
            cooldown: 30,
            /**
             * @property {number} permLevel - the default permissions required to use the command
             */
            permLevel: 0
        }
    ], './modules/commands/echo'); // the path to this file
    /**
     * Modules included in the app package use a relative file path as above
     * User-installed modules should use the variable __filename
     */
})();