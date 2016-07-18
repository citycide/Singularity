<style lang="scss">
  .ui-collapsible-body {
    padding: 0;
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
        <ui-collapsible id="one" header="PLACEHOLDER ONE">
          <div style="background-color: black; height: 300px;"></div>
        </ui-collapsible>
        <ui-collapsible id="two" header="PLACEHOLDER TWO">
          <div style="background-color: black; height: 300px;"></div>
        </ui-collapsible>
      </div>
      <div class="column is-half">
        <ui-collapsible id="collapse-chat" header="TWITCH CHAT"
                        :open="true">
          <iframe id="chat_embed" src="https://www.twitch.tv/citycide/chat"
                   style="height: 675px; width: 100%;"
          ></iframe>
        </ui-collapsible>
      </div>
    </div>
  </div>
</template>

<script>
  import statsBar from './dashboard/stats-bar'
  import { UiCollapsible } from 'keen-ui'

  export default {
    data () {
      return {}
    },
    components: {
      statsBar,
      UiCollapsible
    }
  }
</script>
