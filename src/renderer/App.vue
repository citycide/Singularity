<style lang="scss">
  @import url(https://fonts.googleapis.com/css?family=Lato:300);
  @import './components/styles/app.css';

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
    margin-left: calc(60px + 5px);
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
  <div class="app-container" v-if="authState === 0">
    <h2>WE NEED SETUP YO</h2>
  </div>
  <div class="app-container" v-if="authState === 1">
    <window-frame></window-frame>
    <toolbar></toolbar>
    <sidebar></sidebar>
    <div class="view-container is-fluid">
      <router-view
        class="animated"
        transition="fade"
        transition-mode="out-in"
        keep-alive
      ></router-view>
    </div>
  </div>
  <div class="app-container" v-if="authState === 2">
    <window-frame></window-frame>
    <div class="view-container is-fluid frameless">
      <router-view
        class="animated"
        transition="fade"
        transition-mode="out-in"
        keep-alive
      ></router-view>
    </div>
  </div>
</template>

<script>
  import { mapGetters } from 'vuex'

  import windowFrame from './partials/frame'
  import toolbar from './partials/toolbar'
  import sidebar from './partials/sidebar'
  import store from './vuex/store'

  export default {
    store,

    data () {
      return {}
    },

    computed: {
      ...mapGetters(['authorized', 'setupComplete']),

      authState () {
//        if (!this.setupComplete) return 0
        return (this.authorized) ? 1 : 2
      }
    },

    components: {
      windowFrame,
      toolbar,
      sidebar
    }
  }
</script>
