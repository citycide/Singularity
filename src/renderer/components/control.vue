<style lang="scss" scoped>
  .ui-collapsible-header {
    color: white;
    background-color: #1ABC9C;

    &:hover:not(.disabled) {
      background-color: #52BCA6;
    }

    i {
      color: white;
    }
  }

  button[type='submit'] {
    padding-bottom: 10px;
  }

  .media.current-song {
    background-color: #e8e8e8;
    margin-bottom: 20px;
    padding: 10px;
  }
</style>

<style>
  .ui-collapsible-body {
    float: left;
  }
</style>

<template>
  <div>
    <div class="columns">
      <div class="column is-half">
        <ui-collapsible id="control-follower" header="FOLLOWER" :open="true">
          <form @submit.prevent="sendFollow">
            <ui-textbox
              name="username" icon="person" type="text" v-bind:value.sync="follow.name"
              :max-length="25" validation-rules="required|min:4|max:25|regex:/^[a-zA-Z0-9][\w]/"
              help-text="Enter the user's name, minimum 4 characters, maximum 25 characters"
            ></ui-textbox>
            <ui-button
              @click.stop.prevent="sendFollow" color="primary" class="is-pulled-right"
            >SEND</ui-button>
          </form>
        </ui-collapsible>
        <ui-collapsible id="control-subscriber" header="SUBSCRIBER" :open="true">
          <form @submit.prevent="sendSub">
            <ui-textbox
              name="username" icon="person" type="text" v-bind:value.sync="sub.name"
              :max-length="25" validation-rules="required|min:4|max:25|regex:/^[a-zA-Z0-9][\w]/"
              help-text="Enter the user's name, minimum 4 characters, maximum 25 characters"
            ></ui-textbox>
            <ui-textbox
              name="resub duration" icon="event_note" type="number"
              v-bind:value.sync="sub.months"
              help-text="(optional) Enter the resub duration"
            ></ui-textbox>
            <ui-button
              @click.stop.prevent="sendSub" color="primary" class="is-pulled-right"
            >SEND</ui-button>
          </form>
        </ui-collapsible>
        <ui-collapsible id="control-now-playing" header="NOW PLAYING" :open="true">
          <div class="media current-song">
            <div class="media-left">
              <p class="is-24x24">
                <icon name="music" color="black"></icon>
              </p>
            </div>
            <div class="media-content">
              <div class="content">
                <span class="strong">CURRENT SONG</span><br>
                {{ music.current }}
              </div>
            </div>
            <div class="media-right">
              <ui-icon-button
                @click.stop.prevent="sendSong(true)" color="primary" icon="send"
                type="flat" tooltip="RESEND CURRENT SONG" tooltip-position="left middle"
              ></ui-icon-button>
            </div>
          </div>

          <form @submit.prevent="sendSong(false)">
            <ui-textbox
              name="song info" icon="music_note" type="text"
              v-bind:value.sync="music.test" help-text="Enter song information"
            ></ui-textbox>
            <ui-button
              @click.stop.prevent="sendSong(false)" color="primary" class="is-pulled-right"
            >SEND</ui-button>
          </form>
        </ui-collapsible>
      </div>
      <div class="column is-half">
        <ui-collapsible id="control-host" header="HOST" :open="true">
          <form @submit.prevent="sendHost">
            <ui-textbox
              name="username" icon="person" type="text" v-bind:value.sync="host.name"
              :max-length="25" validation-rules="required|min:4|max:25|regex:/^[a-zA-Z0-9][\w]/"
              help-text="Enter the user's name, minimum 4 characters, maximum 25 characters"
            ></ui-textbox>
            <ui-textbox
              name="viewer amount" icon="remove_red_eye" type="number"
              v-bind:value.sync="host.viewers" validation-rules="required|min:1"
              help-text="Enter the number of viewers"
            ></ui-textbox>
            <ui-button
              @click.stop.prevent="sendHost" color="primary" class="is-pulled-right"
            >SEND</ui-button>
          </form>
        </ui-collapsible>
        <ui-collapsible id="control-tip" header="TIP" :open="true">
          <form @submit.prevent="sendTip">
            <ui-textbox
              name="username" icon="person" type="text" v-bind:value.sync="tip.name"
              :max-length="25" validation-rules="required|min:4|max:25|regex:/^[a-zA-Z0-9][\w]/"
              help-text="Enter the user's name, minimum 4 characters, maximum 25 characters"
            ></ui-textbox>
            <ui-textbox
              name="tip amount" icon="attach_money" type="number" step="0.01"
              v-bind:value.sync="tip.amount" validation-rules="required|min:1"
              help-text="Enter the tip amount"
            ></ui-textbox>
            <ui-textbox
              name="tip message" icon="message" type="text"
              v-bind:value.sync="tip.message" help-text="(optional) Enter a message"
            ></ui-textbox>
            <ui-button
              @click.stop.prevent="sendTip" color="primary" class="is-pulled-right"
            >SEND</ui-button>
          </form>
        </ui-collapsible>
      </div>
    </div>
  </div>
</template>

<script type="text/babel">
  import { UiButton, UiIconButton, UiCollapsible, UiTextbox } from 'keen-ui'
  import { mapGetters } from 'vuex'
  import icon from 'vue-awesome'

  import transit from './js/transit'

  export default {
    data () {
      return {}
    },

    methods: {
      sendFollow (event, username) {
        const name = username ? username : this.follow.name
        transit.fire('alert:follow:test', name)
      },
      sendHost () {
        transit.fire('alert:host:test', {
          user: {
            display_name: this.host.name
          },
          viewers: this.host.viewers
        })
      },
      sendSub () {
        if (!this.sub.months) {
          transit.fire('alert:sub:test', this.sub.name)
        } else {
          transit.fire('alert:resub:test', {
            user: {
              display_name: this.sub.name
            },
            months: this.sub.months
          })
        }
      },
      sendTip () {
        const formattedAmount = '$' + this.tip.amount
          .toFixed(2)
          .replace(/(\d)(?=(\d{3})+\.)/g, '$1,')

        transit.fire('alert:tip:test', {
          user: {
            name: this.tip.name
          },
          amount: formattedAmount,
          message: this.tip.message
        })
      },
      sendSong (current) {
        const song = current ? this.music.current : this.music.test
        transit.fire('alert:music:test', song)
      }
    },

    computed: {
      ...mapGetters(['channel', 'nowPlaying']),

      follow () {
        return {
          name: this.channel.name
        }
      },

      host () {
        return {
          name: this.channel.name,
          viewers: 10
        }
      },

      sub () {
        return {
          name: this.channel.name,
          months: 10
        }
      },

      tip () {
        return {
          name: this.channel.name,
          amount: 10,
          message: ''
        }
      },

      music () {
        return {
          current: this.nowPlaying,
          test: 'Never Gonna Give You Up - Rick Astley'
        }
      }
    },

    components: {
      UiButton,
      UiIconButton,
      UiCollapsible,
      UiTextbox,
      icon
    }
  }
</script>
