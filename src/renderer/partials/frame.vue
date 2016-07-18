<style lang="scss" scoped>
  .window-frame {
    background-color: #039BE5;
    position: fixed;
    z-index: 100;
    -webkit-app-region: no-drag;

    .left { left: 0; }
    .right { right: 0; }

    .left, .right {
      top: 0;
      bottom: 0;
      width: 5px;
    }

    .top { top: 0; }
    .bottom { bottom: 0; }

    .top, .bottom {
      left: 0;
      right: 0;
      height: 5px;
    }

    .title-bar {
      background-color: #039BE5;
      position: fixed;
      z-index: 95;
      top: 0;
      width: 100%;
      min-height: 25px;
      -webkit-app-region: drag;

      .controls {
        float: right;
        height: 25px;
        padding: 3px 10px 0 0;

        .control-win {
          float: left;
          display: inline-flex;
          margin: 0;
          color: white;
          padding: 0 5px 0 5px;
          min-width: 30px;
          max-width: 30px;
          cursor: pointer;
          text-align: center;
          -webkit-app-region: no-drag;

          &:hover {
            background-color: rgba(255, 255, 255, .3);
          }

          &.refresh svg {
            margin-top: 3px;
          }

          &.minimize svg {
            margin-top: 4px;
          }

          &.maximize i {
            margin-top: 2px;
            font-size: 18px;
          }

          &.close i {
            margin-top: 2px;
            font-size: 20px;
          }
        }
      }
    }

    .level {
      display: inline-block;
    }
  }
</style>

<template>
  <div class="window-frame is-unselectable">
    <div class="window-frame left"></div>
    <div class="window-frame right"></div>
    <div class="window-frame top"></div>
    <div class="window-frame bottom"></div>

    <header class="title-bar level">
      <div class="controls level-right">
        <div class="control-win refresh level-item"
             @click="refresh">
          <icon name="refresh"></icon>
        </div>
        <div class="control-win minimize level-item"
             @click="minimize">
          <icon name="minus"></icon>
        </div>
        <div class="control-win maximize level-item"
             @click="maximize">
          <i class="material-icons">crop_square</i>
        </div>
        <div class="control-win close level-item"
             @click="close">
          <i class="material-icons">close</i>
        </div>
      </div>
    </header>
  </div>
</template>

<script>
  import icon from 'vue-awesome'
  import transit from '../components/js/transit'

  export default {
    data () {
      return {}
    },

    methods: {
      refresh () {
        transit.fire('window:refresh', this.$electron.remote.getCurrentWindow().id)
      },
      minimize () {
        transit.fire('window:minimize', this.$electron.remote.getCurrentWindow().id)
      },
      maximize () {
        transit.fire('window:maximize', this.$electron.remote.getCurrentWindow().id)
      },
      close () {
        transit.fire('window:close', this.$electron.remote.getCurrentWindow().id)
      },
    },

    components: {
      icon
    }
  }
</script>
