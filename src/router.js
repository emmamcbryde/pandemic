import Vue from 'vue'
import Router from 'vue-router'

import Home from './components/Home'
import EpiModel from './components/EpiModel'
import Login from './components/Login'
import Register from './components/Register'
import EditUser from './components/EditUser'
import About from './components/About'

Vue.use(Router)

let router = new Router({
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/epimodel',
      name: 'epimodel',
      component: EpiModel
    },
    {
      path: '/login',
      name: 'login',
      component: Login
    },
    {
      path: '/register',
      name: 'register',
      component: Register
    },
    {
      path: '/edit-user',
      name: 'editUser',
      component: EditUser
    },
    {
      path: '/about',
      name: 'about',
      component: About
    }
  ]
})

export default router
