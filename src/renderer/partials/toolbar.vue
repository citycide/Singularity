<template>
  <nav class="toolbar is-unselectable" :class="{ 'sidebar-open': this.sidebarOpen }">
    <ui-toolbar
      type="colored" text-color="white" @nav-icon-clicked="sidebarToggle"
      :nav-icon="this.sidebarOpen ? 'arrow_back' : 'menu'"
    >
      <div slot="actions">
        <ui-icon-button
          type="clear" color="white" :icon="notificationIcon"
        ></ui-icon-button>

        <ui-icon-button
          type="clear" color="white" icon="more_vert" has-dropdown-menu
          :menu-options="menu" dropdown-position="bottom right" show-menu-icons
          @menu-option-selected="menuHandler"
        ></ui-icon-button>
      </div>
    </ui-toolbar>
  </nav>
</template>

<style lang="scss">
  nav.toolbar {
    position: relative;
    width: calc(100% - 70px);
    height: 60px;
    left: 65px;
    top: 30px;
    transition: 0.35s;
    transition-property: left, width;

    .ui-toolbar {
      -webkit-app-region: drag;

      &-left, &-right, &-center {
        -webkit-app-region: no-drag;
      }
    }

    .ui-toolbar-colored {
      background-color: #039BE5;
      height: 60px;
    }

    &.sidebar-open {
      width: calc(100% - 260px);
      left: 255px;
    }
  }

  .help {
    display: initial;
    font-size: initial;
    margin-top: initial;
  }
</style>

<script>
  import { UiToolbar, UiIconButton } from 'keen-ui'
  import { mapGetters, mapActions } from 'vuex'

  export default {
    data () {
      return {
        menu: [
          { id: 'profile', text: 'Profile', icon: 'launch' },
          { id: 'channel', text: 'Channel', icon: 'launch' },
          { id: 'logout', text: 'Logout', icon: 'exit_to_app' },
          { type: 'divider' },
          { id: 'settings', text: 'Settings', icon: 'settings' },
          { id: 'about', text: 'About', icon: 'info' },
          { id: 'help', text: 'Help', icon: 'help' }
        ]
      }
    },

    computed: {
      ...mapGetters(['sidebarOpen', 'channel']),

      notificationIcon () {
        // eventually changes based on notification count / settings
        return 'notifications_none'
      }
    },

    methods: {
      ...mapActions(['sidebarToggle', 'logout', 'toggleModal']),

      menuHandler (event) {
        switch (event.id) {
          case 'profile':
            this.$electron.remote.shell.openExternal(
              `https://www.twitch.tv/${this.channel.name}/profile`
            )
            break
          case 'channel':
            this.$electron.remote.shell.openExternal(
              `https://www.twitch.tv/${this.channel.name}`
            )
            break
          case 'logout':
            this.$store.subscribe(({ type }, state) => {
              if (type === 'LOGOUT' && !state.user.authorized) {
                this.$router.go('login')
              }
            })

            this.logout()
            break
          case 'settings':
            this.$router.go('settings')
            break
          case 'about':
            this.toggleModal('about')
            break
          case 'help':
            this.toggleModal('help')
            break
        }
      }
    },

    components: {
      UiToolbar,
      UiIconButton
    }
  }
</script>
