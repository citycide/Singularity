<style lang="scss">

</style>

<template>
  <div>
    <ui-modal
      :show.sync="show" header="help" :show-close-button="false" :backdrop-dismissible="false"
    >
      <p>
        The <span class="strong">Dashboard</span> is the main hub of singularity.
        This is probably the tab you'll keep active for the majority of your active
        streaming time. It helps you keep track of your followers, chat, and video
        quality as well as update your game or stream title.
      </p><br>
      <p>
        <span class="strong">Overlay Control</span> is where you'll want to go to
        trigger alerts (such as follower or host) on your overlay.
      </p><br>
      <p>
        Finally, the <span class="strong">Settings</span> tab allows you to configure
        singularity the way it works best for you - in terms of both the way it works and
        the way it looks.
      </p><br>
      <p>
        If you come across any issues, please file an <a @click="openGitHub">issue on GitHub</a>
        with as much detail as you can about the situation.
      </p>
      <div slot="footer">
        <!--<ui-button color="primary">Say Hi</ui-button>-->
        <ui-button @click="toggleModal('help')">CLOSE</ui-button>
      </div>
    </ui-modal>
  </div>
</template>

<script>
  import { mapGetters, mapActions } from 'vuex'
  import { UiButton, UiModal } from 'keen-ui'

  export default {
    data () {
      return {}
    },

    methods: {
      ...mapActions(['toggleModal']),

      openGitHub () {
        this.$electron.remote.shell.openExternal(
          'https://www.github.com/citycide/singularity/issues'
        )
      }
    },

    computed: mapGetters({
      show: 'modalHelp'
    }),

    components: {
      UiButton,
      UiModal
    }
  }
</script>
