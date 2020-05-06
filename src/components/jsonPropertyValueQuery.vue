<!-- Copyright ©2020 MarkLogic Corporation. -->
<template>
  <div class="row ">
    <q-select
      name="collectionSelector"
      v-model="value.selectedCollection"
      :options.sync="availableCollections"
      @input="collectionChanged"
      filled
      separator
      label="Source collection"
      stack-label
    >

    </q-select>
    <q-select
      name="attributeSelector"
      v-model="value.selectedAttribute"
      :options.sync="availableAttributes"
      filled
      separator
      label="attribute"
      stack-label
    >

    </q-select>
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
      console.log('test')
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
      console.log(this.value)
      this.$axios.get('http://localhost:8085/v1/resources/vppBackendServices?rs:action=collectionDetails&rs:database=10536821899429496394')
        .then((response) => {
          this.availableCollections = response.data
        })
    },
    collectionChanged () {

      this.discoverModel(this.value.selectedCollection)
    },
    discoverModel (collection) {

      let dbOption = "&rs:database=10536821899429496394"


      if (collection !== null && collection.value != null)
        dbOption += "&rs:collection=" + collection.value


      this.$axios.get('/v1/resources/vppBackendServices?rs:action=collectionModel' + dbOption)
        .then((response) => {
          this.availableAttributes = []
          for (let r of response.data) {
            this.getAttributeRecursively(r, this.availableAttributes)
          }

          console.log(this.availableAttributes)

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
