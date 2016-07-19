<template>
  <aside class="sidebar" :class="{ open: this.sidebarOpen }">
    <div class="sidebar-header is-unselectable">
      <div class="sidebar-brand">
        <img src="./partials/sidebar/assets/singularity_brand.png" />
      </div>
      <span class="sidebar-brand-label">singularity</span>
    </div>
    <ul class="sidebar-items">
      <li v-for="item in menuItems">
        <a class="sidebar-item" v-link="{ name: item.link }"
           @click="toggle(item, $event)"
           :aria-expanded="isExpanded(item) ? 'true' : 'false'"
        >
          <icon class="sidebar-item-icon" :name="item.icon" scale="1.5"></icon>
          <span class="sidebar-item-label is-unselectable">{{ item.label }}</span>
          <span class="sidebar-item-drop" v-if="item.subMenu">
            <icon name="angle-down"></icon>
          </span>
        </a>
        <ul v-show="isReady && item.expanded" :class="{ collapse: item.subMenu }"
            @click="autoClose" transition="menu-expand"
        >
          <li v-for="subItem in item.subMenu">
            <a class="is-unselectable" v-link="{ name: 'sub' }">
              {{ subItem.label }}
            </a>
          </li>
        </ul>
      </li>
    </ul>
  </aside>
</template>

<style lang="scss">
  .sidebar {
    box-sizing: initial;
    overflow-x: hidden;
    position: fixed;
    background-color: #353d47;
    z-index: 5;
    text-align: left;
    top: 30px;
    left: 5px;
    width: 60px;
    height: 100%;
    transition: width 0.35s;

    &:hover, &.open {
      width: 250px;
    }
  }

  .sidebar-header {
    background-color: #039BE5;
    width: 250px;
    margin-bottom: 1em;
  }

  .sidebar-brand {
    display: inline;
    color: #19B5FE;

    img {
      padding: 10px;
      width: 40px;
      text-align: center;
      display: inline-block;
    }
  }

  .sidebar-brand-label {
    display: inline;
    color: #FFF;
    vertical-align: top;
    margin-left: 10px;
    line-height: 1.8em;
    font-size: 2em;
  }

  .sidebar-items li {
    display: block;
    width: 100%;
    height: 1.8em;
    overflow: hidden;
    padding-bottom: 1.5em;
  }

  .sidebar-item {
    color: #FFF;

    .sidebar-item-icon {
      padding: 10px 15px 10px 0;
      margin-left: 16px;
      min-width: 30px;
      max-width: 30px;
    }

    .sidebar-item-label {
      vertical-align: top;
      line-height: 3.2em;
    }

    .sidebar-item-drop {
      float: right;
      margin: 7px 10px 0 0;
    }
  }

  .sidebar-item:hover {
    color: #039BE5;
  }

  .sidebar-item.v-link-active {
    border-left: 4px solid #039BE5;
    padding-top: 2em;
    color: #FFF;

    .sidebar-item-icon {
      margin-left: 12px;
      min-width: 30px;
      max-width: 30px;
    }
  }
</style>

<script>
  import icon from 'vue-awesome'
  import { mapGetters } from 'vuex'
  import menuItems from './sidebar/sidebar-items'

  let count = 0

  export default {
    data () {
      return {
        menuItems,
        steps: menuItems.filter(i => !!i.subMenu).length,
        isReady: false
      }
    },

    ready () {
      this.isReady = true
    },

    computed: {
      ...mapGetters(['sidebarOpen'])
    },

    methods: {
      toggle (item, $e) {
        if (this.hasCollapse(item)) {
          $e.preventDefault()
          item.expanded = !item.expanded
        } else {
          this.autoClose()
        }
      },

      hasCollapse (item) {
        return !!item.subMenu
      },

      isExpanded (item) {
        let hasCollapse = this.hasCollapse(item)
        if (!hasCollapse) return
        if (count < this.steps) {
          count += 1
          item.expanded = !!(item.subMenu.filter(i => i.link === this.$route.name).length)
        }
        return this.isReady & item.expanded
      },

      autoClose () {
        this.sidebarOpen = false
      }
    },

    components: {
      icon
    }
  }
</script>
