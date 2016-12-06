<style lang="scss">
  .bot-switch {
    margin-top: 5px;
  }
</style>

<template>
  <ui-tabs type="text" fullwidth>
    <ui-tab header="Bot">
      <ui-alert type="error" :show="showError" @dismissed="showError = false">
        Sorry, the bot configuration is either incomplete or invalid. Please try again.
      </ui-alert>
      <div class="columns">
        <div class="column"></div>
        <div class="column">
          <ui-textbox
            name="bot name" type="text" :value.sync="bot.name"
            placeholder="your-bot-username" :disabled="!editing"
            validation-rules="required|min:4|max:25|regex:/^[a-zA-Z0-9][\w]/"
          ></ui-textbox>
        </div>
        <div class="column">
          <ui-textbox
            name="bot chat token" :type="oauthVisible ? 'text' : 'password'"
            :value.sync="bot.auth" placeholder="oauth:25xhi34oh3o48s9x5zod54hw9084hd"
            :disabled="!editing" validation-rules="required|size:36"
          ></ui-textbox>
        </div>
        <div class="column">
          <ui-icon-button
            :icon="oauthVisible ? 'visibility_off' : 'visibility'" type="flat"
            :tooltip="oauthVisible ? 'Hide oauth' : 'Show oauth (use caution)'"
            @click="oauthVisible = !oauthVisible"
          ></ui-icon-button>
          <ui-icon-button
            :icon="editing ? 'save' : 'mode_edit'" color="primary"
            :tooltip="editing ? 'Save' : 'Edit'" @click.stop.prevent="botConfigure"
          ></ui-icon-button>
        </div>
        <div class="column bot-switch">
          <ui-switch
            name="bot-enabled" :value.sync="bot.enabled" :disabled="!bot.auth"
          >bot {{ bot.enabled ? 'enabled' : 'disabled' }}</ui-switch>
        </div>
      </div>
    </ui-tab>
  </ui-tabs>
</template>

<script type="text/babel">
  import {
    UiAlert,
    UiButton,
    UiIconButton,
    UiSwitch,
    UiTabs,
    UiTab,
    UiTextbox
  } from 'keen-ui'

  import { mapGetters, mapActions } from 'vuex'

  export default {
    data () {
      return {
        editing: false,
        showError: false,
        oauthVisible: false
      }
    },

    methods: {
      ...mapActions(['enableBot', 'disableBot']),

      botConfigure () {
        this.editing = !this.editing
        if (this.editing) return

        if (!this.bot.name || !this.bot.auth) {
          this.showError = true
          return
        } else {
          this.showError = false
        }

        console.log('configuring bot with credentials: ')
        console.log(`name: ${this.bot.name}`)
        console.log(`token: ${this.bot.auth}`)
      },
    },

    watch: {
      botStatus (val/*, old*/) {
        if (val) {
          this.enableBot({
            name: this.bot.name,
            token: this.bot.auth
          })
        } else {
          this.disableBot()
        }
      }
    },

    computed: mapGetters(['bot']),

    components: {
      UiAlert,
      UiButton,
      UiIconButton,
      UiSwitch,
      UiTabs,
      UiTab,
      UiTextbox,
    }
  }
</script>
