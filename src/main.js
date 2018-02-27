/**
 * @fileOverview Entry point the web-client.
 *
 * The Vue build version to load with the `import` command
 * (runtime-only or standalone) has been set in webpack.base.conf
 * with an alias.
 */

import Vue from 'vue'
import VueMaterial from 'vue-material'

import config from './config'
import router from './router'
import auth from './modules/auth'
import App from './App.vue'

Vue.config.productionTip = false
Vue.use(VueMaterial)
document.title = config.title

async function init () {
  if (config.isUser) {
    await auth.restoreLastUser()
  }
  return new Vue({
    el: '#app',
    router,
    template: '<App/>',
    components: {App}
  })
}

init()
