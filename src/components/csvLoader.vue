<template>
  <div class="column gutter-sm">
  <q-input filled v-model="filename" label="Mapping file (in statics)" >


    <q-tooltip>
      format: source;sourceField;target;targetField;type
    </q-tooltip>
  </q-input>
  <q-btn-group>
    <q-btn label="Create block" @click="createBlock()">
      <q-tooltip>
        Create and add the block top the library (right click)
      </q-tooltip>
    </q-btn>


  </q-btn-group>
  </div>
</template>

<script>
export default {
  // name: 'ComponentName',
  data () {
    return {

      filename: "mappingRules.csv"
    }
  },
  methods:{
    createBlock(){
    this.$axios.get('/statics/' + this.filename)
      .then((response) => {
        this.$root.$emit("csvLoadingRequested",response.data);
  })
    }
}
}
</script>

<style>
</style>
