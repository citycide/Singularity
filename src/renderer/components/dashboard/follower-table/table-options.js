import moment from 'moment'

export default {
  // dateColumns: ['followDate'],

  compileTemplates: true,

  pagination: {
    dropdown: false,
    chunk: 10
  },

  filterByColumn: true,

  texts: {
    filter: 'Search:',
    count: '{count} followers'
  },

  datepickerOptions: {
    showDropdowns: true
  },

  headings: {
    username: 'USERNAME',
    followDate: 'DATE',
    followAge: 'AGE',
    notif: 'NOTIFICATIONS',
    resend: 'RESEND'
  },

  templates: {
    followDate (row) {
      return moment(row.timestamp, 'x').format('ll')
    },
    followAge (row) {
      return moment(row.timestamp, 'x').fromNow(' ')
    },
    notif (row) {
      return (row.notifications === 'true')
        ? `<i class="fa fa-check" style="color: green;"></i></a>`
        : `<i class="fa fa-close" style="color: red;"></i></a>`
    },
    resend:
      `<a href="" @click.stop.prevent="$parent.$parent.$parent.sendFollow(null, '{username}')">
        <i class="fa fa-paper-plane" style="color: #039BE5"></i>
      </a>`
  },

  customFilters: [{
    name: 'alphabet',
    callback (row, query) {
      return row.username[0] === query
    }
  }],

  trackBy: 'twitchid',

  sortIcon: {
    base: 'fa',
    up: 'fa-chevron-up',
    down: 'fa-chevron-down'
  },

  orderBy: {
    column: 'username',
    ascending: true
  }
}
