<!-- Copyright ©2020 MarkLogic Corporation. -->
<template>
  <div class="rule-actions form-inline ">
    <div class="form-group row">
    <q-select
      name="collectionSelector" class="form-control mr-2  col" style="overflow: hidden;"
      v-if="value"
      v-model="value.selectedCollection"
      :options.sync="availableCollections"
      @input="collectionChanged"
      filled
      separator
      label="Source collection"
      new-value-mode="add"
      use-input
      use-chips
      stack-label
    >

    </q-select>
    <q-select class="form-control col" 
      name="attributeSelector"
      v-if="value"
      v-model="value.selectedAttribute"
      :options="availableAttributes"
      filled
      separator
      label="attribute"
      new-value-mode="add"
      use-input
      use-chips
      stack-label
    >
     </q-select>

    <q-select class="form-control col" 
      name="valueSelector"
      v-if="value"
      v-model="value.selectedValue"
      filled
      :options="availableValues"
      option-value="name"
      option-label="name"
      separator
      label="value"
      new-value-mode="add"
      use-input
      use-chips
      stack-label
    > </q-select>

    <q-select class="form-control col" 
      name="typeSelector"
      v-if="value"
      v-model="value.selectedType"
      filled
      value="string"
      :options="availableTypes"
      separator
      label="type"
      stack-label
    >

    </q-select>
    </div>
  </div>
</template>

<script>

export default {
  name: 'JsonPropertyValueQuery',
  props: ['value'],
  data () {
    return {
      selectedDB : null,
      availableCollections: [],
      availableAttributes: [],
      availableValues: [],
      availableTypes: ["string","number"]
    }
  },
  watch: {
    value: function (val) {
      this.value = val;
    }
  },
  methods: {
    getAttributeRecursively (json, result) {
      if (json.type != 18) {
        result.push(json.field)
      }
      if (json.children) {
        for (let child of json.children) {
          this.getAttributeRecursively(child, result)
        }
      }
    },
    loadCollection () {

        this.$axios.get('http://localhost:8085/v1/resources/vppBackendServices?rs:action=collectionDetails&rs:database=' + this.selectedDB.value)
          .then((response) => {
            this.availableCollections = response.data
      })
    },
    loadValues(){
      this.availableValues = this.value.valueOptions
    },
    collectionChanged () {

      this.discoverModel(this.value.selectedCollection)
    },
    discoverModel (collection) {

      let dbOption = "&rs:database="+ this.selectedDB.value


      if (collection !== null && collection.value != null)
        dbOption += "&rs:collection=" + collection.value


      this.$axios.get('/v1/resources/vppBackendServices?rs:action=collectionModel' + dbOption)
        .then((response) => {
          this.availableAttributes = []
          for (let r of response.data) {
            this.getAttributeRecursively(r, this.availableAttributes)
          }

        })
    },
    changeDatabase(newDB){
        this.selectedDB=newDB
        this.loadCollection ()
    }
  },
  created () {
    let vm = this;
    if(!this.selectedDB){
      this.selectedDB = this.$store.getters.queryBuilderDB
    }
    vm.$nextTick(function () {
      vm.loadCollection()
      vm.loadValues()
    }); 
  },  
  mounted () {
    this.$root.$on('updateSelectedDB', this.changeDatabase);
  },
  beforeDestroy () {
    this.$root.$off('updateSelectedDB', this.changeDatabase);
  }
}
</script>

<style>
</style>
