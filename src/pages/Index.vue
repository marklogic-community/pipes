<template>
  <q-page class="flex fixed-center">

<mllitegraph></mllitegraph>
    <q-dialog v-model="startup">
      <q-card>
        <q-toolbar>


          <q-toolbar-title><span class="text-weight-bold">Disclaimer</span> Visual Programming Plugin</q-toolbar-title>

          <q-btn flat round dense icon="close" v-close-popup />
        </q-toolbar>

        <q-card-section>
          Visual Programming Plugin (VPP) for MarkLogic DataHub is a community tool.<br/>
          As such, <b>VPP is not supported by MarkLogic Corporation</b> and is only updated and corrected based on best effort approach.
          Any contribution or feedback is welcomed to make the tool better.<br/>
          <b>VPP Team</b>
          <br/>
          <br/>
          Version 0.8 / What's new :
          <ul>
            <li>New highlight block on string</li>
            <li>New entity enrichment block on string</li>
            <li>New XML and Json schema validation block</li>
          </ul>
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
          startup:true
      }
    },
    components: {
      mllitegraph,
      'vue-json-pretty' : VueJsonPretty

    }
  }
</script>
<style>
</style>

