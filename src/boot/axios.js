import axios from 'axios'
import { Dialog } from 'quasar'


export default async ({ Vue, router, store }) => {
  Vue.prototype.$axios = axios

  // Add a response interceptor
  axios.interceptors.response.use(function (response) {
    // Do something with response data

    return response;
  }, function (error) {

    if (401 === error.response.status) {
      Dialog.create({
        title: 'Session expired',
        message: 'You will have to log in again.',
        persistent: true

      }).onOk(() => {
        store.dispatch('authenticated', { auth: false }).then(() => {
          // this.$q.loading.hide()
          router.push({ name: "login" })
        })
      })

    }
    // Do something with response error



    return Promise.reject(error);
  });
}

