<style lang="scss" scoped>
  .level {
    margin-left: -10px;
    margin-right: -10px;
  }

  .level-item {
    background-color: #1ABC9C;
    color: white;
    padding: 10px;
    margin: 10px;

    .heading {
      font-size: 18px;
    }

    .title {
      color: #fff;
    }
  }
</style>

<template>
  <div class="level">
    <div class="level-item has-text-centered">
      <p class="heading follow-badge" v-el:follow>FOLLOWERS</p>
      <!--<ui-ripple-ink :trigger="$els.follow"></ui-ripple-ink>-->
      <p class="title">10</p>
    </div>
    <div class="level-item has-text-centered">
      <p class="heading">VIEWS</p>
      <p class="title">1,060</p>
    </div>
    <div class="level-item has-text-centered">
      <p class="heading">SUBSCRIBERS</p>
      <p class="title">23</p>
    </div>
    <div class="level-item has-text-centered">
      <p class="heading">SOMETHING ELSE</p>
      <p class="title">789</p>
    </div>
  </div>
</template>

<script>
  import { UiRippleInk } from 'keen-ui'
  import { mapGetters } from 'vuex'

  export default {
    data () {
      return {}
    },

    ready () {
      // Vuex module for hitting the Twitch API
      // this.getUserStats()
    },

    // computed: mapGetters(['getUserStats']),

    components: {
      UiRippleInk
    }
  }
</script>
