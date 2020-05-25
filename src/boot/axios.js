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
        title: 'No connection to MarkLogic',
        message: 'Pipes cannot connect to MarkLogic or the session has already expired. Make sure your MarkLogic host is running and try logging in again.',
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

