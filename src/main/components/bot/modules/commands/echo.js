/**
 * Echo - The bot will simply repeat whatever follows the command
 *
 * @command echo
 * @usage !echo [message]
 * @param {object} event
 *
 * @source stock module
 * @author citycide
 */

module.exports.echo = event => {
  if (event.subcommand === 'twice') {
    $.say(event.sender, `${event.subArgString} ${event.subArgString}`)
    return
  }

  if (event.subcommand === 'loudly') {
    $.say(event.sender, `${event.subArgString.toUpperCase()}`)
    return
  }

  $.say(event.sender, event.argString)
}

/**
 * Register the module & its commands with the bot
 */
;(() => {
  /**
   * $.addCommand
   * @param {string} name - what must be typed in chat to run the command
   * @param {object} [options] - override the defaults when registering the command
   *   @param {string} [options.handler] - name of the exported function that runs the command
   *   @param {number} [options.cooldown] - the default cooldown time for the command (seconds)
   *   @param {number} [options.permLevel - the default permissions required to use the command
   *   @param {number} [options.price] - the default number of points paid to use the command
   *   @param {boolean} [options.status] - whether the command is enabled / disabled by default
   */
  $.addCommand('echo', {
    status: true,
    price: 2
  })

  /**
   * $.addSubcommand
   * @param {string} name - what must be typed in chat following the parent command
   * @param {string} parent - the parent command
   * @param {object} [options] - same as the options for $.addCommand
   *
   * Pattern:
   * [command prefix][parent command] [subcommand] [arguments]
   * Example:
   * !echo twice hello
   *
   * -> hello hello
   */
  $.addSubcommand('twice', 'echo', {
    status: true,
    cooldown: 10
  })
  $.addSubcommand('loudly', 'echo', {
    status: true,
    cooldown: 10
  })
})()
