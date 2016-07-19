<template>
  <nav class="toolbar is-unselectable" :class="{ 'sidebar-open': this.sidebarOpen }">
    <ui-toolbar type="colored" text-color="white" @nav-icon-clicked="sidebarToggle"
                :nav-icon="this.sidebarOpen ? 'arrow_back' : 'menu'"
    >
      <div slot="actions">
        <ui-icon-button
          type="clear" color="white" icon="star_border"
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

    .ui-toolbar-colored {
      background-color: #039BE5;
      height: 60px;
    }

    &.sidebar-open {
      width: calc(100% - 260px);
      left: 255px;
    }
  }
</style>

<script>
  import { UiToolbar, UiIconButton } from 'keen-ui'
  import { mapGetters, mapActions, mapMutations } from 'vuex'

  export default {
    data () {
      return {
        menu: [
          { id: 'profile', text: 'Profile', icon: 'launch' },
          { id: 'channel', text: 'Channel', icon: 'launch' },
          { type: 'divider' },
          { id: 'logout', text: 'Logout', icon: 'exit_to_app' },
          { id: 'settings', text: 'Settings', icon: 'settings' },
          { id: 'HELP', text: 'Help', icon: 'help' }
        ],
        user: {
          channel: 'citycide'
        }
      }
    },

    computed: mapGetters(['sidebarOpen']),

    methods: {
      ...mapActions(['sidebarToggle', 'logout']),

      menuHandler (event) {
        switch (event.id) {
          case 'profile':
            this.$electron.remote.shell.openExternal(
              `https://www.twitch.tv/${this.user.channel}`
            )
            break
          case 'channel':
            this.$electron.remote.shell.openExternal(
              `https://www.twitch.tv/${this.user.channel}/channel`
            )
            break
          case 'logout':
            this.logout()
            this.$router.go('login')
            break
          case 'settings':
            break
          case 'help':
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
