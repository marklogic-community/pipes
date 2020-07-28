import Vue from 'vue'
import VueRouter from 'vue-router'
import { sync } from 'vuex-router-sync';

import routes from './routes'
import store from '../store/index.js'


Vue.use(VueRouter)

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation
 */


export default function (/* { store, ssrContext } */) {
  let Router = new VueRouter({
    scrollBehavior: () => ({ x: 0, y: 0 }),
    routes,

    // Leave these as is and change from quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    mode: process.env.VUE_ROUTER_MODE,
    base: process.env.VUE_ROUTER_BASE
  })

  // // Keep the router in sync with vuex store
  // sync(store, Router);

  Router.beforeEach((to, from, next) => {
    console.log('store.state.authenticated.auth=', store.state.authenticated.auth)
    console.log("to=", to, " from=", from, " next=", next)
    if (to.name !== 'login' && !store.state.authenticated.auth) {
      next({ name: 'login' })
    }
    else next()
  })

  return Router
}


