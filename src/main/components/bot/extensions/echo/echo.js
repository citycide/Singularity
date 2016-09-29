/**
 * echo - the bot will simply repeat whatever follows the command
 *
 * @source stock module
 * @author citycide
 */

/**
 * @command echo
 * @usage !echo [loudly|twice] (message)
 */
export function echo (e, $) {
  if (!e.argString) return

  if ($.is(e.subcommand, 'twice')) {
    $.say(e.sender, `${e.subArgString} ${e.subArgString}`)
    return
  }

  if ($.is(e.subcommand, 'loudly')) {
    $.say(e.sender, `${e.subArgString.toUpperCase()}`)
    return
  }

  $.say(e.sender, e.argString)
}

/**
 * Register the module & its commands with the core
 */
export default function ($) {
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

  $.addCommand('echo', { price: 2 })

  /**
   * $.addSubcommand
   * @param {string} name - what must be typed in chat following the parent command
   * @param {string} parent - the parent command
   * @param {object} [options] - same as the options for $.addCommand
   *
   * Pattern:
   * [command prefix][parent command] [subcommand] [...arguments]
   * Example:
   * !echo twice hello
   *
   * -> hello hello
   */

  $.addSubcommand('twice', 'echo', { cooldown: 10 })
  $.addSubcommand('loudly', 'echo', { cooldown: 10 })
}
