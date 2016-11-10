<style lang="scss" scoped>
  s {
    text-decoration: line-through;
  }

  .chat-wrapper {
    background-color: #363636;
    overflow: hidden;
    top: 0;
    margin: 0;
    height: 630px;
    max-height: 630px;
    width: 100%;
    max-width: 100%;
  }

  .chat-container {
    display: flex;
    flex-flow: column;
    height: 100%;
    max-height: 100%;
    padding: 0.5em;

    & .ui-textbox {
      margin-top: 5px;
      padding: 1px;
      border: 1px solid #606060;
    }
  }

  .chat-box {
    background-color: #161616;
    border: 1px solid #606060;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 13px;
    font-style: normal;
    font-variant: normal;
    font-weight: normal;
    overflow: auto;
    height: 500px;
    color: #D3D3D3;
    border-radius: 0;
    width: 100%;
    display: flex;
    flex-flow: column;
    flex: 1 1 85%;

    &.dark {
      background: rgba(0,0,0,0.3);
      color: #fff;
    }

    &.light {
      background: rgba(255,255,255,0.3);
      color: #000;
    }
  }

  #chat-settings-button {
    top: -2px;
  }

  #chat-submit-button {
    top: -4px;
  }

  #msg-box {
    display: flex;
    flex: 1 1 10%;
    width: 100%;
    min-height: 50px;
    padding-bottom: 0.5em;
  }

  .chat-input {
    margin: 5px 0 10px 0;
    padding: 0.5em 1.5em 0.5em 0.5em;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    width: 100%;
    color: #fff;
    background-color: #161616;
    border: 1px solid #606060;
    resize: none;

    &:focus {
      outline: 1px solid #40BC96;
    }
  }
</style>

<template>
  <div class="chat-wrapper">
    <div class="chat-container">
      <div class="chat-box">
        <template v-for="message in messages">
          <message
            :user="message.user" :message="message.message"
            :channel="message.channel" :action="message.action"
            :self="message.self" :type="message.type"
          ></message>
        </template>
      </div>
      <textarea
        class="chat-input" placeholder="Send a message" v-model="messageInput"
        rows="3" maxlength="500" @keydown="messageAction"
      ></textarea>
      <div class="level">
        <div class="level-left">
          <div class="level-item">
            <ui-button
              id="chat-settings-button" icon="settings"
              :menu-options="chatSettings" @menu-option-selected="handleSettings"
              dropdown-position="top left" has-dropdown-menu show-menu-icons
            ></ui-button>
          </div>
        </div>
        <div class="level-right">
          <div class="level-item">
            <ui-button
              button-type="button" icon="insert_emoticon"
              dropdown-position="top right" has-popover
              id="chat-emoticons-button"
            >
              <div slot="popover" class="has-text-centered">
                EMOTICONS<br>COMING <s>SOON</s><br>EVENTUALLY
              </div>
            </ui-button>
            <ui-button
              @click.stop.prevent="messageAction"
              button-type="submit" color="accent"
              id="chat-submit-button" raised
            >SEND</ui-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import chat from './js/chat'
  import message from './chat/message'
  import { UiButton, UiTextbox } from 'keen-ui'
  import { mapGetters, mapActions } from 'vuex'

  // import { getTwitchEmoteList } from './chat/lib/emotes/twitch'
  // import getBTTVEmotes from './chat/lib/emotes/BTTV'
  // import getFFZEmotes from './chat/lib/emotes/FFZ'

  // import testMessages from './chat/lib/test-messages'

  export default {
    data () {
      return {
        chatSettings: [
          { id: 'theme', icon: 'color_lens', text: 'Change theme', disabled: true },
          { id: 'settings', icon: 'settings_applications', text: 'Settings', disabled: true },
          { type: 'divider' },
          { id: 'pop-out', icon: 'launch', text: 'Pop Out', disabled: true },
        ],
        chatActive: false,

        messageInput: '',
        messageIndex: 0,
        messageHistory: [],

        messages: [],

        emotes: {
          twitch: [],
          bttv: [],
          ffz: []
        }
      }
    },

    ready () {
      this.listen()
      chat.connect().then(() => { this.chatActive = true })
    },

    computed: mapGetters(['channel']),

    watch: {
      messageHistory (val) {
        if (val.length > 20) {
          this.messageHistory.pop()
        }
      }
    },

    methods: {
      handleSettings ({ id }) {
        switch (id) {
          case 'one': return console.log(id.toUpperCase())
          case 'two': return console.log(id.toUpperCase())
          case 'pop-out': return console.log(id.toUpperCase())
        }
      },

      messageAction (e, msg = this.messageInput) {
        if (e.keyCode === 38) {
          const i = this.messageIndex
          this.messageInput = this.messageHistory[i]

          if (i < this.messageHistory.length) {
            this.messageIndex += 1
          } else {
            this.messageIndex = 0
          }

          return
        }

        if (e.keyCode === 13 && msg.length) {
          e.preventDefault()
          this.messageIndex = 0
          if (msg.startsWith('/w ')) {
            this.sendWhisper(msg)
          } else {
            this.sendMessage(msg)
          }
        }
      },

      sendMessage (message) {
        chat.say(this.channel.name, message)
        this.messageHistory.unshift(message)
        this.messageInput = ''
      },

      sendWhisper (message) {
        const reg = /^(?:\/w)\s+(\w+)\s+(.+)$/
        const [, recipient, text] = reg.exec(message) || []
        if (recipient && text) {
          chat.whisper(recipient, text)
          this.messageHistory.unshift(message)
          this.messageInput = ''
        }
      },

      addMessage (user, message, channel, action, self) {
        const str = channel.startsWith('#') ? channel.slice(1) : channel
        this.messages.push({ user, message, channel: str, action, self })
      },

      addWhisper (from, user, message, self) {
        this.messages.push({ user, message, type: 'whisper', self })
      },

      addSystemMessage (message) {
        this.messages.push({ message, type: 'system' })
      },

      listen () {
        chat.on('whisper', this.addWhisper)
        chat.on('chat', (channel, user, message, self) => {
          this.addMessage(user, message, channel, false, self)
        })

        chat.on('action', (channel, user, message, self) => {
          this.addMessage(user, message, channel, true, self)
        })

        chat.on('connecting', (address, port) => {
          this.addSystemMessage('connecting...')
        })

        chat.on('connected', (address, port) => {
          console.info(`Connected to Twitch chat at ${address}:${port}`)
          this.addSystemMessage(`connected to ${this.channel.name}'s chat.`)
        })

        chat.on('disconnected', reason => this.addSystemMessage('disconnected'))
        chat.on('reconnect', () => this.addSystemMessage('reconnecting...'))

        chat.on('logon', () => {})

        chat.on('timeout', (channel, username, reason, duration) => {
          // $(`div[data-channel=${channel}][data-user=${username}]`).remove()
        })

        chat.once('emotesets', async sets => {
          // this.messages = testMessages
          // this.emotes.twitch = await getTwitchEmoteList(sets)
        })
      }
    },

    components: {
      message,
      UiButton,
      UiTextbox
    }
  }
</script>
