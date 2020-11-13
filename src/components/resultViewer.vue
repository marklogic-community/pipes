<!-- Copyright ©2020 MarkLogic Corporation. -->
<template>
  <div>
    <q-modal v-model="opened"  position="right">
      <q-modal-layout>
        <q-toolbar slot="header">
          <q-btn
            flat
            round
            dense
            v-close-overlay
            icon="keyboard_arrow_left"
          />
          <q-toolbar-title>
            Result
          </q-toolbar-title>
        </q-toolbar>




        <div class="layout-padding">
          <h6>Execution graph result</h6>
          <p>This is the result of the execution</p>
          <vue-json-pretty

            :data="json2Render"
          >
          </vue-json-pretty>
          <q-btn
            color="primary"
            v-close-overlay
            label="Close"
            @click="opened=false"
          />


        </div>
        <q-toolbar slot="footer">
          <q-toolbar-title>

          </q-toolbar-title>
        </q-toolbar>
      </q-modal-layout>


    </q-modal>


    </div>
</template>

<script>
  import VueJsonPretty from 'vue-json-pretty'
  import 'vue-json-pretty/lib/styles.css'
export default {
  // name: 'ComponentName',
  data () {
    return {
      opened: false,
      json2Render:{},
      search : ""

    }
  },
  methods:{

    showResult(result){

      this.opened=true;
      this.json2Render=result

    }
  },
  mounted() {
    this.$root.$on('resultReceived', this.showResult)
  },
  components: {
    VueJsonPretty
  }
}
</script>

<style>
</style>
