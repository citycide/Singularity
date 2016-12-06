<style lang="scss">
  @import url(https://fonts.googleapis.com/css?family=Lato:300);
  @import './components/styles/app.scss';

  .app-container {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
  }

  .view-container {
    overflow: auto;
    margin-top: 30px;
    margin-left: 65px;
    padding: 15px;
    height: calc(100% - 95px);
    width: calc(100% - 70px);
  }

  .view-container.frameless {
    padding: 0;
    margin-left: 5px;
    height: calc(100% - 30px);
    width: calc(100% - 5px);
  }

  .setup-container {
    overflow: auto;
    padding: 0;
    margin: 28px 0 0 5px;
    height: calc(100% - 30px);
    width: calc(100% - 10px);
  }

  .loading-curtain {
    background-color: #039BE5;
    position: fixed;
    z-index: 29;
    width: 100%;
    height: 100%;

    .ui-progress-circular {
      background-color: #fff;
      border-radius: 100px;
      position: fixed;
      z-index: 30;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
  }
</style>

<style scoped>
  .fade-transition {
    transition: opacity .2s ease;
  }

  .fade-enter, .fade-leave {
    opacity: 0;
  }
</style>

<template>
  <div class="app-container">
    <window-frame></window-frame>
    <div v-if="loading" class="loading-curtain" transition="fade">
      <ui-progress-circular
        color="multi-color" :size="100" :stroke="3" :show="loading"
      ></ui-progress-circular>
    </div>
    <toolbar v-if="showBars"></toolbar>
    <sidebar v-if="showBars"></sidebar>
    <about-modal></about-modal>
    <help-modal></help-modal>
    <div
      v-if="authState > 0"
      :class="['view-container', 'is-fluid', { 'frameless': isFrameless }]"
    >
      <router-view
        class="animated"
        transition="fade"
        transition-mode="out-in"
        keep-alive
      ></router-view>
    </div>
    <div v-if="authState === 0" class="setup-container is-fluid" >
      <setup></setup>
    </div>
    <notifications></notifications>
  </div>
</template>

<script type="text/babel">
  import { mapGetters } from 'vuex'
  import { UiProgressCircular } from 'keen-ui'

  import setup from './components/setup'
  import notifications from './components/notifications'
  import windowFrame from './partials/frame'
  import toolbar from './partials/toolbar'
  import sidebar from './partials/sidebar'
  import aboutModal from './partials/modals/about'
  import helpModal from './partials/modals/help'
  import store from './vuex/store'

  export default {
    store,

    data () {
      return {
        loading: true
      }
    },

    ready () {
      // hide the preloader
      setTimeout(() => { this.loading = false }, 200)
    },

    computed: {
      ...mapGetters(['authorized', 'setupComplete']),

      authState () {
        if (!this.setupComplete) return 0
        return (this.authorized) ? 1 : 2
      },

      showBars () {
        return this.authState === 1
      },

      isFrameless () {
        return this.authState === 2
      }
    },

    components: {
      UiProgressCircular,
      notifications,
      windowFrame,
      aboutModal,
      helpModal,
      toolbar,
      sidebar,
      setup
    }
  }
</script>
