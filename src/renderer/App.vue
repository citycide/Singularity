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
    margin-top: 25px;
    margin-left: calc(60px + .4em);
    padding: 15px;
    height: calc(100% - 60px - 2em);
    width: calc(100% - 70px);
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
</template>

<script>
  import windowFrame from './partials/frame'
  import toolbar from './partials/toolbar'
  import sidebar from './partials/sidebar'
  import store from './vuex/store'

  export default {
    store,

    components: {
      windowFrame,
      toolbar,
      sidebar
    }
  }
</script>
