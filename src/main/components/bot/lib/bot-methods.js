import bot from '../bot'
import { botDB as db } from 'common/components/db'

export default function ($, { channel }) {
  return {
    async say (user, message) {
      if (arguments.length === 1) {
        message = user
        return bot.say(channel.name, message)
      }

      const mention = (await db.getConfig('responseMention', false)) ? '' : `${user}: `

      if (!await db.getConfig('whisperMode', false)) {
        return bot.say(channel.name, `${mention}${message}`)
      } else {
        return bot.whisper(user, message)
      }
    },

    whisper (user, message) {
      return bot.whisper(user, message)
    },

    shout (message) {
      return bot.say(channel.name, message)
    },

    command: {
      async getPrefix () {
        return db.getConfig('prefix', '!')
      }
    }
  }
}
