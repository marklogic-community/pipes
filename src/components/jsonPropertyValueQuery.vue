<!-- Copyright ©2020 MarkLogic Corporation. -->
<template>
  <div class="rule-actions form-inline">
    <div class="form-group ">
    
    <q-select
      name="collectionSelector" class="form-control mr-2"
      v-if="value"
      v-model="value.selectedCollection"
      :options.sync="availableCollections"
      @input="collectionChanged"
      filled
      separator
      label="Source collection"
      stack-label
    >

    </q-select>
    <q-select class="form-control"
      name="attributeSelector"
       v-if="value"
      v-model="value.selectedAttribute"
      :options.sync="availableAttributes"
      filled
      separator
      label="attribute"
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
      availableCollections: [],
      availableAttributes: []
    }
  },
  watch: {
    query: function (val) {
      this.value = val;
    }
  },
  methods: {
    getAttributeRecursively (json, result) {
      if (json.type == 3) {
        result.push(json.field)
      }
      if (json.children) {
        for (let child of json.children) {
          this.getAttributeRecursively(child, result)
        }
      }
    },
    loadCollection () {
      this.$axios.get('http://localhost:8085/v1/resources/vppBackendServices?rs:action=collectionDetails&rs:database=' + this.value.selectedDB.value)
        .then((response) => {
          this.availableCollections = response.data
        })
    },
    collectionChanged () {

      this.discoverModel(this.value.selectedCollection)
    },
    discoverModel (collection) {

      let dbOption = "&rs:database="+ this.value.selectedDB.value


      if (collection !== null && collection.value != null)
        dbOption += "&rs:collection=" + collection.value


      this.$axios.get('/v1/resources/vppBackendServices?rs:action=collectionModel' + dbOption)
        .then((response) => {
          this.availableAttributes = []
          for (let r of response.data) {
            this.getAttributeRecursively(r, this.availableAttributes)
          }

        })
    }
  },
  created () {
    let vm = this;

    vm.$nextTick(function () {
      vm.loadCollection()
    });
  }
}
</script>

<style>
</style>
