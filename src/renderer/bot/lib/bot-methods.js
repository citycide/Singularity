import bot from '../bot'
import { botDB as db } from 'common/components/db'

async function say ({ channel }, user, message) {
  const [mentions, whispers] = await Promise.all([
    db.getConfig('responseMention', false),
    db.getConfig('whisperMode', false)
  ])

  if (arguments.length === 2) {
    message = user
    shout({ channel }, message)
    return
  }

  const mention = mentions ? `${user}: ` : ''

  if (!whispers) {
    bot.say(channel.name, `${mention}${message}`)
  } else {
    whisper(user, message)
  }
}

async function whisper (user, message) {
  return bot.whisper(user, message)
}

async function shout ({ channel }, message) {
  return bot.say(channel.name, message)
}

const getPrefix = async () => db.getConfig('prefix', '!')

export default function ($, ctx) {
  return {
    say: say.bind(null, ctx),
    whisper,
    shout: shout.bind(null, ctx),

    command: {
      getPrefix
    }
  }
}
