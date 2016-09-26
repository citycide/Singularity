<style lang="scss">
  .username {
    font-weight: bold;
  }

  .colon {
    margin-left: -2px;
    padding-right: 2px;
  }

  .badge {
    display: inline-block;
    background: no-repeat 0 center;
    vertical-align: middle;
    height: 18px;
    min-width: 18px;
    padding: 0;
    margin: -2px 2px 0 2px;
    text-indent: -9999px;
    border-radius: 2px;
    overflow: hidden;

    &.turbo {
      background: #6441A5 url(https://chat-badges.s3.amazonaws.com/turbo.svg);
      background-size: 100%;
    }

    &.mod {
      background: #34AE0A url(https://chat-badges.s3.amazonaws.com/mod.svg);
      background-size: 100%;
    }

    &.broadcaster {
      background: #E71818 url(https://chat-badges.s3.amazonaws.com/broadcaster.svg);
      background-size: 100%;
    }

    &.staff {
      background: #200F33 url(https://chat-badges.s3.amazonaws.com/staff.svg);
      background-size: 100%;
    }

    &.admin {
      background: #FAAF19 url(https://http://chat-badges.s3.amazonaws.com/admin.svg);
      background-size: 100%;
    }

    &.global_mod {
      background: #0C6F20 url(https://chat-badges.s3.amazonaws.com/globalmod.svg);
      background-size: 100%;
    }
  }

  .chat-line-wrapper {
    background-color: #181818;

    &:nth-child(odd) {
      background-color: #101010;
    }
  }

  .chat-line {
    margin: 0;
    padding: 0.5em;
    line-height: 1.75em;
    border-bottom: 1px solid black;
    box-shadow: 0 1px 0 rgba(255,255,255,0.04) inset;

    .message-text {
      /*word-break: break-all;*/
      word-wrap: break-word;
    }

    .timestamp {
      color: #B3B3B3;
      font-size: 11px;
      padding-right: 3px;
    }
  }

  div.chat-line[data-type*="system"] {
    text-align: center;
    font-size: 12px;
  }

  div.chat-line[data-type*="whisper"] {
    background-color: #2C144C;
  }

  div.chat-line[data-type*="whisper"] i {
    vertical-align: middle;
    margin-top: 2px;
  }

  .emoticon {
    margin-bottom: 0;
    max-height: 2em;
    vertical-align: middle;
  }
</style>

<template>
  <div class="chat-line-wrapper">
    <div
      v-if="type === 'system'" class="chat-line" data-type="system"
    >
      <span class="message-text">{{ message }}</span>
    </div>
    <div
      v-if="type === 'whisper'" class="chat-line"
      data-type="whisper" :data-user="user['display-name']"
    >
      <span class="timestamp">{{ timestamp }}</span>
      <span class="username" :style="usernameStyle">{{ user['display-name'] }}</span>
      <span class="arrow">⟶ </span>
      <span class="colon">:  </span>
      <span class="message-text">{{ message }}</span>
    </div>
    <div
      v-if="type === 'chat'"
      :class="['chat-line', { action: action }]" :data-type="messageType"
      :data-user="user['display-name']" :data-channel="channel"
    >
      <span class="timestamp">{{ timestamp }}</span>
      <span v-for="badge in badgeList">
      <span :class="badge.classes"></span>
    </span>
      <span class="username" :style="usernameStyle">{{ user['display-name'] }}</span>
      <!--<span class="message-text" :style="messageStyle">{{ parsedMessage }}</span>-->
      <span v-for="element in messageElements">
      <span
        v-if="element.type === 'text'" class="message-text" :style="messageStyle"
      >{{ element.value }}</span>
      <img
        v-if="element.type === 'emote'" class="emoticon" :src="element.value"
      >
      <a v-if="element.type === 'link'" :href="element.value">{{ element.value }}</a>
    </span>
    </div>
  </div>
</template>

<script>
  import moment from 'moment'
  import Levers from 'levers'

  import parseMessage from './lib/message-parser'

  const twitch = new Levers('twitch')

  export default {
    data () {
      return {
        messageElements: []
      }
    },

    props: {
      user: Object,
      message: String,
      channel: String,
      action: Boolean,
      self: Boolean,
      type: {
        type: String,
        default: 'chat'
      }
    },

    async ready () {
      if (this.type === 'system') return
      this.messageElements = await parseMessage(this.user, this.message)
    },

    computed: {
      badgeList () {
        if (!this.user) return []
        const list = []
        const userType = this.user['user-type']

        if (userType && userType !== 'normal') {
          list.push({ classes: ['badge', userType] })
        }

        if (this.user.username === twitch.get('name')) {
          list.push({ classes: ['badge', 'broadcaster']})
        }

        ;['turbo', 'subscriber'].forEach(type => {
          if (this.user[type] === true) {
            list.push({ classes: ['badge', type] })
          }
        })

        return list
      },

      messageStyle () {
        if (!this.user) return {}
        return {
          color: this.action ? this.user.color : ''
        }
      },

      usernameStyle () {
        if (!this.user) return {}
        return {
          color: this.user.color
        }
      },

      parsedMessage () {
        return this.message || ''
      },

      timestamp () {
        return moment().format('h:mm')
      }
    },

    components: {}
  }
</script>
