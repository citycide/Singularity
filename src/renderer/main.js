import Vue from 'vue'
import Electron from 'vue-electron'
import Resource from 'vue-resource'
import Router from 'vue-router'

import App from './App'
import routes from './routes'
import store from './vuex/store'
import './components/js/context'

Vue.use(Electron)
Vue.use(Resource)
Vue.use(Router)
Vue.config.debug = true

const router = new Router()

router.map(routes)

router.beforeEach(transition => {
  window.scrollTo(0, 0)

  if (transition.to.auth && !store.getters.authorized) {
    transition.redirect('/login')
  } else {
    transition.next()
  }
})

router.redirect({
  '*': '/'
})

router.start(App, 'app')
