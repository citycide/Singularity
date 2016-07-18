import Vue from 'vue'

export default {
  '/': {
    component: Vue.component('dashboard', require('./components/dashboard')),
    name: 'dashboard',
    auth: true
  },
  '/login': {
    component: Vue.component('login', require('./components/login')),
    name: 'login'
  }
}
