<style lang="scss" scoped>
  #bg-container {
    background-color: #202020;
    position: fixed;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
  }

  .hero {
    background-color: unset;
    position: absolute;
    padding: 0;
    width: 100%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .twitch-connect {
    background-color: #6441A5;

    &:hover:not([disabled]) {
      background-color: #7c57bf;
    }
  }

  .hero-body .container {

  }
</style>

<template>
  <div>
    <div id="bg-container">
      <canvas id="star-canvas" width="100%" height="100%"></canvas>
    </div>
    <div class="bg-curtain" :style="curtain"></div>
    <div class="hero">
      <div class="hero-body">
        <div class="container has-text-centered">
          <ui-button
            class="twitch-connect" color="primary" @click="authenticate"
            text="Connect with Twitch" raised
          ></ui-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import gsap from 'gsap'
  import { UiButton } from 'keen-ui'
  import { mapGetters, mapActions } from 'vuex'

  export default {
    data () {
      return {
        curtain: {
          position: 'fixed',
          width: '100%',
          height: '100%',
          backgroundColor: '#202020',
          transition: 'opacity .5s',
          opacity: 1
        }
      }
    },

    ready () {
      this.$store.subscribe(({ type }, state) => {
        if (type === 'AUTHENTICATE' && state.user.authorized) {
          this.$router.go('dashboard')
        }
      })

      setTimeout(() => {
        require('./js/constellation')
        this.curtain.opacity = 0
      }, 500)
    },

    computed: mapGetters(['authorized']),

    methods: mapActions(['authenticate']),

    components: {
      UiButton
    }
  }
</script>
