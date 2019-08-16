<template>
  <q-page class="flex fixed-center">

<mllitegraph></mllitegraph>

  </q-page>
</template>
<script>
  import mllitegraph from '../components/ml-litegraph.vue'
  import VueJsonPretty from 'vue-json-pretty';
  export default {
    // name: 'ComponentName',
    data () {
      return {}
    },
    components: {
      mllitegraph,
      'vue-json-pretty' : VueJsonPretty

    }
  }
</script>
<style>
</style>

