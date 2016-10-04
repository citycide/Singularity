<style lang="scss" scoped>
  .heading-large {
    font-size: 2em;
    font-weight: 700;
  }

  .heading-medium {
    font-size: 1.5em;
    font-weight: 700;
  }

  .changelog-title {
    font-size: 1em;
    font-weight: 700;
  }

  .changelog-list {
    list-style: square;
  }
</style>

<template>
  <div class="changelog-container has-text-left">
    <span class="heading-large">CHANGELOG</span>
    <span class="heading-medium">v{{ versionString }} :: released {{ releaseDate }}</span>
    <br>
    <span class="changelog-title">Initial Public Release</span>
    <ul class="changelog-list">
      <li>Extensible chat bot including commands, points, ranks, groups, etc.</li>
      <li>Dashboard with collapsible chat, stream preview, game & title updating, and more</li>
      <li>Overlay server for use in any broadcast application allowing local URLs</li>
      <li>Overlay control panel for triggering alerts on demand</li>
      <li>... and much more!</li>
    </ul>
  </div>
</template>

<script>
  export default {
    data () {
      return {
        releaseDate: 'Dec. 1, 2016'
      }
    },

    computed: {
      versionString () {
        return this.$electron.remote.app.getVersion()
      }
    },

    components: {}
  }
</script>
