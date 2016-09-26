<style lang="scss">

</style>

<template>
  <table class="table is-striped">
    <tbody>
    <tr v-for="follower in followers">
      <td class="table-follower-time has-text-centered">{{ follower.age }}</td>
      <td class="table-follower-name">{{ follower.username }}</td>
    </tr>
    </tbody>
  </table>
</template>

<script type="babel">
  import transit from '../js/transit'
  import db, { initDB } from '../../../common/components/db'

  export default {
    data () {
      return {
        followers: []
      }
    },

    async init () {
      await initDB({ DEV: true })

      db.getRecentFollows().then(data => {
        if (!this.followers.length && Array.isArray(data) && data.length) {
          for (let item of data) {
            this.followers.push(item);
          }

          this.$dispatch('expand')
        }
      })

      transit.fire('data:req:recentFollowers')
    },

    components: {}
  }
</script>
