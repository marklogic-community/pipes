<!-- Copyright ©2020 MarkLogic Corporation. -->
<template>
  <q-page class="flex fixed-center">

    <mllitegraph></mllitegraph>
    <q-dialog v-model="startup">

      <q-card style="padding: 10px; max-width: 500px">

        <div class="row">
          <div
            class="col-11"
            align="center"
          >
            <img
              style="max-width: 300px; padding-top:20px"
              src="../statics/pipes_splash_logo.png"
            ></img>
          </div>
          <div
            class="col-1"
            align="right"
          >
            <q-btn
              flat
              round
              dense
              icon="close"
              v-close-popup
            />
          </div>
        </div>

        <q-card-section>
          <pre>{{version}}</pre>
          <div>Host: <strong>{{host}}</strong></div>
          <span class="q-pr-md">Environment: <strong>{{environment}}</strong></span>
          <span>Logged as: <strong>{{user}}</strong></span>
          <br />
          <span class="q-pr-md">Database: <strong>{{database}}</strong></span>
          <span>Port: <strong>{{port}}</strong></span>
          <br /><br />
          Learn how to use Pipes: <a
            href="https://github.com/marklogic-community/pipes/wiki"
            target="_blank"
          >Pipes documentation</a>
          <br />
          Found a bug? <a
            href="https://github.com/marklogic-community/pipes/issues"
            target="_blank"
          >Report it here</a>
          <br /><br />
          <span class="
            text-weight-bold">Pipes for MarkLogic Data Hub is a community tool</span><br />
          <br />
          As such, <b>Pipes is not supported by MarkLogic Corporation</b> and is updated and corrected on a best-effort basis.<br />
          Any contribution or feedback is welcomed to make Pipes better.<br />

        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>
<script>
import mllitegraph from '../components/ml-litegraph.vue'
export default {
  components: {
    mllitegraph
  },
  data () {
    return {
      val: "",
      startup: true,
      showTime: 7
    }
  },
  computed: {
    version: function () {
      return this.val
    },
    user: function () {
      return this.$store.getters.user
    },
    environment: function () {
      return this.$store.getters.environment
    },
    port: function () {
      return this.$store.getters.port
    },
    database: function () {
      return this.$store.getters.database
    },
    host: function () {
      return this.$store.getters.host
    }
  },
  methods: {
    showSplashScreen: function () {
      this.showTime = 0;
      this.startup = true;
    },
    getVersion: function () {
      this.$axios.get('/version').then((response) => {
        this.val = response.data;
      })
        .catch((error) => {
          console.log("Warning: Couldn't get version information")
        })
    },
    countDownTimer () {
      if (this.showTime > 0) {
        setTimeout(() => {
          this.showTime -= 1
          this.countDownTimer()
        }, 1000)
      } else {
        this.startup = false
      }
    }
  },
  mounted: function () {
    this.$root.$on("showSplashScreen", this.showSplashScreen)
    this.getVersion()
    //  if (this.val === null || this.val.trim() == '' ) this.val = "Pipes version: Development\nBuild: xxxxxxx"
    this.countDownTimer()
  }
}
</script>
