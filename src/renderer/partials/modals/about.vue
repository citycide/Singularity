<style lang="scss">

</style>

<template>
  <div>
    <ui-modal
      :show.sync="show" header="about" :show-close-button="false" :backdrop-dismissible="false"
    >
      <p>
        <span class="strong">singularity</span> is an alerts, overlay, and
        chat bot platform created for Twitch broadcasters to allow for more
        advanced stream features with a lower barrier to entry.
      </p><br>
      <p>
        It's an open platform - which means you can make and share your very
        own chat extensions and contribute to any part of the main app's code!
      </p><br>
      <p>
        If you want to learn more, visit the <a @click="openGitHub">GitHub repository</a>.
      </p>
      <div slot="footer">
        <!--<ui-button color="primary">Say Hi</ui-button>-->
        <ui-button @click="toggleModal('about')">CLOSE</ui-button>
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
          'https://www.github.com/citycide/singularity'
        )
      }
    },

    computed: mapGetters({
      show: 'modalAbout'
    }),

    components: {
      UiButton,
      UiModal
    }
  }
</script>
