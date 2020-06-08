

const routes = [
  {
    path: '/',
    component: () => import('layouts/MyLayout.vue'),
    children: [
      // { path: '', component: () => import('pages/login.vue') },
      { name: 'home', path: 'home', component: () => import('pages/Index.vue') },
      { name: 'login', path: 'login', component: () => import('pages/login.vue') }
    ]
  }
]


// Always leave this as last one
if (process.env.MODE !== 'ssr') {
  routes.push({
    path: '*',
    component: () => import('pages/Error404.vue')
  })
}

export default routes
