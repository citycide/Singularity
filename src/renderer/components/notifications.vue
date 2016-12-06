<style lang="scss" scoped>
  .notification-container {
    position: fixed;
    bottom: 10px;
    right: 30px;
    z-index: 80;
    height: auto;
    width: calc(100% - 115px);
  }
</style>

<template>
  <div class="notification-container" >
    <ui-snackbar-container
      :position="position" queue-snackbars
    ></ui-snackbar-container>
  </div>
</template>

<script type="text/babel">
  import { UiSnackbar, UiSnackbarContainer } from 'keen-ui'
  import transit from './js/transit'

  export default {
    data () {
      return {
        // TODO: allow customization
        position: 'right'
      }
    },

    ready () {
      // events from renderer process
      this.$events.on('notification', props => this.notify(props))

      // events from main process
      transit.event('notification', (e, props) => {
        if (props.listener) {
          // functions can't be passed over electron's IPC
          // this is a workaround to get that functionality
          // basically, emit an event back with the provided name
          props.onActionClick = e.sender.send.bind(
            e.sender, `notification:triggered:${props.listener}`
          )
        }
        this.notify(props)
      })
    },

    methods: {
      notify (props) {
        this.$broadcast('ui-snackbar::create', Object.assign({
          actionColor: 'primary'
        }, props))
      }
    },

    components: {
      UiSnackbar,
      UiSnackbarContainer
    }
  }
</script>
