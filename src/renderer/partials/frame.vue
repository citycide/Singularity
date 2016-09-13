<style lang="scss" scoped>
  .window-frame {
    background-color: #039BE5;
    position: fixed;
    z-index: 96;
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
      z-index: 100;
      top: 0;
      left: 5px;
      width: calc(100% - 10px);
      min-height: 30px;
      -webkit-app-region: drag;

      .controls {
        float: right;
        height: 30px;
        z-index: 100;

        .control-win {
          float: left;
          display: inline-flex;
          margin: 0;
          color: white;
          fill: currentColor;
          stroke: currentColor;
          min-width: 45px;
          max-width: 45px;
          min-height: 30px;
          cursor: pointer;
          text-align: center;
          -webkit-app-region: no-drag;

          &:hover {
            background-color: rgba(255, 255, 255, .3);
          }

          &.close:hover {
            background-color: rgba(189, 61, 54, 1);
          }

          &.refresh svg {
            margin: 6px 0 0 15px;
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
        <div class="control-win refresh level-item" @click="refresh">
          <icon name="refresh"></icon>
        </div>
        <div class="control-win minimize level-item" @click="minimize">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 45 30" width="45" height="30">
            <path d="M0 0v1h10v-1h-10z" transform="translate(17 15)"/>
          </svg>
        </div>
        <div class="control-win maximize level-item" @click="maximize">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 45 30" width="45" height="30">
            <rect
              x="17.5" y="10"
              width="10" height="10"
              style="fill:none;stroke-miterlimit:10;"
            />
          </svg>
        </div>
        <div class="control-win close level-item" @click="close">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 45 30" width="45" height="30">
            <path d="M27.5,20l-10-10 M17.5,20l10-10"/>
          </svg>
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
