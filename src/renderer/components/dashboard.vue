<style lang="scss">
  .ui-collapsible-body {
    &#collapse-chat, &#collapse-followers {
      padding: 0;
    }

    &#collapse-followers {
      max-height: 185px;
      overflow: scroll;
    }

    .table {
      margin-bottom: 0;
    }
  }

  .ui-textbox-icon {
    color: rgba(0, 0, 0, 0.75)
  }

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

  .group {
    &.inline {
      .ui-icon {
        margin-top: -5px;
        margin-right: 9px;
      }
    }
  }

  #chat-embed {
    height: 675px;
    width: 100%;
  }
</style>

<template>
  <div>
    <stats-bar></stats-bar>
    <div class="columns">
      <div class="column">
        <ui-collapsible id="one" header="STREAM INFO" :open="true" >
          <div slot="header" class="group inline">
            <ui-icon icon="edit"></ui-icon>
            <strong>STREAM</strong> INFO
          </div>
          <ui-textbox
            name="game" placeholder="No game set on Twitch"
            icon="videogame_asset" :value.sync="channel.game" hide-label
            @blurred="" @keydown=""
          ></ui-textbox>
          <ui-textbox
            name="status" placeholder="No status set on Twitch"
            icon="label" :value.sync="channel.status" hide-label
            @blurred="" @keydown=""
          ></ui-textbox>
        </ui-collapsible>
        <div class="collapse-followers-container">
          <ui-collapsible id="collapse-followers":open="true">
            <div slot="header" class="group inline">
              <ui-icon icon="av_timer"></ui-icon>
              <strong>RECENT</strong> FOLLOWERS
            </div>
            <follower-table @expand="resizeFollowers"></follower-table>
          </ui-collapsible>
        </div>
        <ui-collapsible id="three">
          <div slot="header" class="group inline">
            <ui-icon icon="videocam"></ui-icon>
            <strong>STREAM</strong> PREVIEW
          </div>
          <div style="background-color: #202020; height: 300px;"></div>
        </ui-collapsible>
      </div>
      <div class="column is-half">
        <ui-collapsible id="collapse-chat" :open="true">
          <div slot="header" class="group inline">
            <ui-icon icon="question_answer"></ui-icon>
            <strong>TWITCH</strong> CHAT
          </div>
          <chat style="height: 630px;"></chat>
        </ui-collapsible>
      </div>
    </div>
  </div>
</template>

<script>
  import chat from './chat'
  import statsBar from './dashboard/stats-bar'
  import followerTable from './dashboard/follower-table'

  import { UiCollapsible, UiIcon, UiTextbox } from 'keen-ui'
  import { mapGetters, mapActions } from 'vuex'

  export default {
    data () {
      return {}
    },

    methods: {
      resizeFollowers () {
        this.$nextTick(() => {
          this.$broadcast('ui-collapsible::refresh-height', 'collapse-followers')
        })
      },
      resizeChat () {
        this.$nextTick(() => {
          this.$broadcast('ui-collapsible::refresh-height', 'collapse-chat')
        })
      }
    },

    computed: {
      ...mapGetters(['channel'])
    },

    components: {
      chat,
      statsBar,
      UiIcon,
      UiTextbox,
      UiCollapsible,
      followerTable
    }
  }
</script>
