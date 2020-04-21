<!-- Copyright ©2020 MarkLogic Corporation. -->
<template>
  <q-page class="flex fixed-center">

    <mllitegraph></mllitegraph>
    <q-dialog v-model="startup">

      <q-card style="padding: 10px; max-width: 500px">

      <div class="row" >
        <div class="col-11" align="center">
         <img style="max-width: 300px;" src="../statics/pipes_splash_logo.png"></img>
        </div>
         <div class="col-1" align="right">
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
          <br/>
          <span class="text-weight-bold">Disclaimer</span><br/>
          Pipes for MarkLogic Data Hub is a community tool<br/>
          As such, <b>Pipes for MarkLogic Data Hub is not supported by MarkLogic Corporation</b> and is updated and corrected on a best-effort basis.<br/>
          Any contribution or feedback is welcomed to make the tool better<br/>
          <br />

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
      showTime: 5
    }
  },
  computed: {
    version: function () {
      return this.val
  }
  },
  methods: {
    getVersion: function () {
       this.$axios.get('/version').then((response) => {
        this.val = response.data;
      })
        .catch((error) => {
        console.log("Warning: Couldn't get version information")
        })
    },
    countDownTimer() {
                if(this.showTime > 0) {
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
      this.getVersion()
      if (this.val === null || this.val.trim() == '' ) this.val = "Pipes version: 1.0-beta.4-201-g7462703 Build: 7462703"
      this.countDownTimer()
  }
}
</script>
