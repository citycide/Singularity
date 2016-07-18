<style lang="scss" scoped>
  .login-view {
    display: flex;
    align-content: center;
    justify-content: center;
  }

  .twitch-connect {
    background-color: #6441A5;

    &:hover:not([disabled]) {
      background-color: #7c57bf;
    }
  }
</style>

<template>
  <div class="login-view">
    <ui-button
      class="twitch-connect" color="primary" @click="authenticate"
      text="Connect with Twitch" raised
    ></ui-button>
  </div>
</template>

<script>
  import { UiButton } from 'keen-ui'
  import { mapGetters, mapActions } from 'vuex'

  export default {
    data () {
      return {}
    },

    ready () {
      this.$store.subscribe(({ type }, state) => {
        if (type === 'AUTHENTICATE' && state.auth.authorized) {
          this.$router.go('dashboard')
        }
      })
    },

    computed: mapGetters(['authorized']),

    methods: mapActions(['authenticate']),

    components: {
      UiButton
    }
  }
</script>
