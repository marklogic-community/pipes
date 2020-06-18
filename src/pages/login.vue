<template>
  <q-page class="column items-center">

    <div style="padding-top:30px;max-width: 500px; min-width: 300px">

      <q-form
        class="q-gutter-md "
        @submit="loginToPipes"
      >
        <q-input
          filled
          v-model="username"
          label="Username"
          hint="Your MarkLogic username and password"
          lazy-rules
          :rules="[ val => val && val.length > 0 || 'Please type something']"
        />

        <q-input
          filled
          type="password"
          v-model="password"
          label="Password"
        />

        <div>
          <q-btn
            label="Login"
            type="submit"
            color="primary"
          />
          <q-btn
            label="Reset"
            type="reset"
            color="primary"
            flat
            class="q-ml-sm"
            @click="function(){this.username=''; this.password=''}.bind(this)"
          />

        </div>
      </q-form>

    </div>
  </q-page>
</template>


<script>
import { Vuex } from "vuex";
export default {
  // name: 'PageName',
  data () {
    return {
      username: "",
      password: "",
      loginmessage: ""
    }
  },
  methods: {

    loginToPipes (evt) {
      evt.preventDefault();

      this.$q.loading.show({
        delay: 400, // ms
        message: 'Reticulating splines.<br/><span>Hang on...</span>'
      })

      let payload = { "username": this.username, "password": this.password }

      // TO-DO: this axios call should happen from inside the store (action)
      this.$axios.post('/login', payload).then(response => {
        console.log('response.data:', response.data)
        this.$store.dispatch('authenticated', {
          auth: true,
          user: response.data.username,
          environment: response.data.environment,
          port: response.data.port,
          database: response.data.database,
          host: response.data.host,
          startingGraph: response.data.startingGraph
        }).then(() => {
          this.$q.loading.hide()
          this.$router.push({ name: "home" })
        })
      })
        .catch((error) => {
          this.$q.loading.hide()
          this.$store.commit('authenticated', false)
          this.$q.notify({
            color: 'negative',
            position: 'center',
            message: "Login failed",
            icon: 'info',
            timeout: 800
          })
        })

    }
  },
}
</script>
