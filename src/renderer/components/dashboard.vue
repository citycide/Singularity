<style lang="scss">
  .ui-collapsible-body#collapse-chat {
    padding: 0;
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
</style>

<template>
  <div>
    <stats-bar></stats-bar>
    <div class="columns">
      <div class="column">
        <ui-collapsible id="one" header="STREAM INFO" :open="true" >
          <ui-textbox
            name="game" placeholder="No game set on Twitch"
            icon="videogame_asset" :value="channel.game" hide-label
            @blurred="" @keydown=""
          ></ui-textbox>
          <ui-textbox
            name="status" placeholder="No status set on Twitch"
            icon="label" :value="channel.status" hide-label
            @blurred="" @keydown=""
          ></ui-textbox>
        </ui-collapsible>
        <ui-collapsible id="two" header="PLACEHOLDER TWO">
          <div style="background-color: #202020; height: 300px;"></div>
        </ui-collapsible>
        <ui-collapsible id="three" header="STREAM PREVIEW">
          <div style="background-color: #202020; height: 300px;"></div>
        </ui-collapsible>
      </div>
      <div class="column is-half">
        <ui-collapsible id="collapse-chat" header="TWITCH CHAT"
                        :open="true">
          <iframe id="chat_embed" :src="chatSrc()"
                  style="height: 675px; width: 100%;"
          ></iframe>
        </ui-collapsible>
      </div>
    </div>
  </div>
</template>

<script>
  import statsBar from './dashboard/stats-bar'
  import { UiCollapsible, UiTextbox } from 'keen-ui'
  import { mapGetters } from 'vuex'

  export default {
    data () {
      return {}
    },

    methods: {
      chatSrc () {
        return `https://www.twitch.tv/${this.channel.name}/chat`
      }
    },

    computed: mapGetters(['channel']),

    components: {
      statsBar,
      UiTextbox,
      UiCollapsible
    }
  }
</script>
