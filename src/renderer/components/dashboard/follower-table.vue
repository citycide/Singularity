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

<script>
  import transit from '../js/transit'

  export default {
    data () {
      return {
        followers: []
      }
    },

    init () {
      transit.on('data:res:recentFollowers', data => {
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
