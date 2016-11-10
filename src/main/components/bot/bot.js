import Levers from 'levers'
import { client as Client } from 'tmi.js'
import { botDB as db } from 'common/components/db'

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

async function dispatcher (source, user, message, self) {
  if (self) return
  // TODO: handle '/me' (colored) messages
  if ($.is(this, 'action')) return

  const _user = await processUser(user)
  _user.whispered = $.is(this, 'whisper')

  if (await isCommand(message)) {
    commandHandler(_user, message)
  }
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
    argString: getCommandArgString(message),
    whispered: user.whispered
  })
}

async function processUser (user) {
  const obj = Object.assign({}, {
    name: user['display-name'],
    mod: $.is(user['user-type'], 'mod'),
    seen: Date.now(),
    points: 0,
    time: 0,
    rank: 1
  }, await Promise.props({
    permission: $.user.getGroup(user),
    following: $.user.isFollower(user['display-name']),
    points: $.points.get(user['display-name']),
    time: $.db.get('users', 'time', { name: user['display-name'] }),
    rank: $.db.get('users', 'rank', { name: user['display-name'] })
  }))

  await db.addUser(obj)
  return obj
}

/**
 * Event listeners
 */
bot.on('chat', 'chat'::dispatcher)
bot.on('whisper', 'whisper'::dispatcher)
bot.on('action', 'action'::dispatcher)

bot.on('mods', (channel, mods) => {
  if (!$.is(channel, '#' + $.channel.name)) return
  if (mods.length) console.log(mods)
})

export default bot
