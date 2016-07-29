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
          <ui-collapsible id="collapse-followers" header="RECENT FOLLOWERS" :open="true">
            <follower-table @expand="resizeFollowers"></follower-table>
          </ui-collapsible>
        </div>
        <ui-collapsible id="three" header="STREAM PREVIEW">
          <div style="background-color: #202020; height: 300px;"></div>
        </ui-collapsible>
      </div>
      <div class="column is-half">
        <ui-collapsible id="collapse-chat" header="TWITCH CHAT" :open="true">
          <iframe id="chat-embed" :src="chatSrc"></iframe>
        </ui-collapsible>
      </div>
    </div>
  </div>
</template>

<script>
  import statsBar from './dashboard/stats-bar'
  import followerTable from './dashboard/follower-table'

  import { UiCollapsible, UiTextbox } from 'keen-ui'
  import { mapGetters } from 'vuex'

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
      ...mapGetters(['channel']),

      chatSrc () {
        this.resizeChat()
        return `https://www.twitch.tv/${this.channel.name}/chat`
      }
    },

    components: {
      statsBar,
      UiTextbox,
      UiCollapsible,
      followerTable
    }
  }
</script>
