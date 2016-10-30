import { is } from 'common/utils/helpers'

async function isFollower (user) {
  const name = this.channel.name
  const data = this.api(`users/${user}/follows/channels/${name}`)
  return is.object(data.channel)
}

async function exists (user) {
  return this.db.exists('users', { name: user })
}

async function isAdmin (user) {
  const { name, botName } = this.channel
  // refactor to pull from some kind of Map or from the database
  return is.oneOf([name, botName], user)
}

export default function (core) {
  return {
    user: {
      isFollower: core::isFollower,
      exists: core::exists,
      isAdmin: core::isAdmin
    }
  }
}
