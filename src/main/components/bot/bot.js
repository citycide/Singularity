import moment from 'moment'
import Levers from 'levers'
import { client as Client } from 'tmi.js'
import db from 'common/components/db'

const settings = new Levers('app')
const channel = new Levers('twitch')

const getBotAuth = () => {
  return {
    name: settings.get('bot.name'),
    auth: settings.get('bot.auth')
  }
}

const bot = new Client({
  options: {
    debug: false
  },
  connection: {
    reconnect: true,
    cluster: 'aws'
  },
  identity: {
    username: getBotAuth().name,
    password: getBotAuth().auth.slice(6)
  },
  channels: [channel.get('name')]
})

const getPrefixLength = async () => (await $.command.getPrefix()).length || 1

const isCommand = async message => {
  const prefixLength = await getPrefixLength()
  return (
    message.substr(0, prefixLength) === await $.command.getPrefix() &&
    message.length > prefixLength &&
    message.charAt(prefixLength) !== ' '
  )
}

const getCommand = async message => {
  const prefixLength = await getPrefixLength()
  return message.slice(prefixLength).split(' ', 1)[0].toLowerCase()
}

const getCommandArgs = message => message.split(' ').slice(1)
const getCommandArgString = message => getCommandArgs(message).join(' ')

async function messageHandler (user, message) {
  const _user = {
    name: user['display-name'],
    permission: await $.user.getGroup(user),
    mod: (user['user-type'] === 'mod'),
    following: await $.user.isFollower(user['display-name']),
    seen: moment().valueOf(),
    points: await $.points.get(user['display-name']) || 0,
    time: await $.db.get('users', 'time', { name: user['display-name'] }) || 0,
    rank: await $.db.get('users', 'rank', { name: user['display-name'] }) || 1
  }

  db.bot.addUser(_user)

  if (await isCommand(message)) commandHandler(_user, message)
}

function whisperHandler (from, user, message, self) {
  // @TODO: handle commands in whisper messages, responses should be whispered
  // if (this.isCommand(message)) this.commandHandler(user, message)
}

async function commandHandler (user, message) {
  $.runCommand({
    sender: user.name,
    mod: user.mod,
    groupID: user.permission,
    rankID: user.rank,
    raw: message,
    command: await getCommand(message),
    args: getCommandArgs(message),
    argString: getCommandArgString(message)
  })
}

/**
 * Event listeners
 */
bot.on('chat', (channel, user, message, self) => {
  if (self) return
  messageHandler(user, message)
})

bot.on('whisper', whisperHandler)

bot.on('mods', (channel, mods) => {
  if (channel !== $.channel.name) return
  if (mods.length) console.log(mods)
})

bot.on('action', (channel, user, message, self) => {
  // @TODO: handle /me (colored) messages
})

export default bot
