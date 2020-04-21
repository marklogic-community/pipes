<!-- Copyright ©2020 MarkLogic Corporation. -->
<template>
  <q-page class="flex fixed-center">

    <mllitegraph></mllitegraph>
    <q-dialog v-model="startup">
      <q-card>
        <q-toolbar>

          <q-toolbar-title><span class="text-weight-bold">Disclaimer</span> Pipes for MarkLogic Data Hub</q-toolbar-title>

          <q-btn
            flat
            round
            dense
            icon="close"
            v-close-popup
          />
        </q-toolbar>

        <q-card-section>
          Pipes for MarkLogic DataHub is a community tool.<br />
          Pipes is designed to create the logic of a DHF Custom step with a "no code" approach.<br />
          As such, <b>Pipes for MarkLogic DataHub is not supported by MarkLogic Corporation</b> and is only updated and corrected based on best effort approach.
          Any contribution or feedback is welcomed to make the tool better.<br />
          <b>Pipes Team</b>
          <br />
          <pre>{{version}}</pre>

          <!-- / What's new :
          <ul>
            <li>Preview wizard</li>
            <li>Improved notifications</li>
          </ul> -->
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>
<script>
import mllitegraph from '../components/ml-litegraph.vue'
import VueJsonPretty from 'vue-json-pretty';
export default {
  // name: 'ComponentName',
  data () {
    return {
      val: "",
      startup: true
    }
  },
  computed: {
    version: function () {

      var self = this;
      var val = ""
      this.$axios.get('/version').then((response) => {

        this.val = response.data;
      })
        .catch((error) => {
          self.notifyError("databasesDetails", error, self);
        })
      console.log("this.val=", this.val)
      return this.val;
    }
  },
  components: {
    mllitegraph,
    'vue-json-pretty': VueJsonPretty

  }
}
</script>
<style>
</style>

