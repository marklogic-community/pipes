<template>

  <div class="column gutter-sm">
    <div class="q-title">Create block from Sources</div>


    <q-input v-model="blockName" stack-label label="Block name"/>


    <q-select
      name="collectionSelector"
      v-model="selectedCollection"
      :options.sync="availableCollections"
      @input="collectionChanged"
      inverted
      class="bg-secondary"
      separator
      label="Select a collection"
      stack-label
    />


    <div class="q-body-1">Select the generation options</div>
    <q-option-group
      color="secondary"
      type="toggle"
      v-model="blockOptions"
      :options="[
      { label: 'Get doc by URI', value: 'getByUri' },
      { label: 'Node as input', value: 'nodeInput' },
      { label: 'Node as output', value: 'nodeOutput' },
      { label: 'Create fields inputs', value: 'fieldsInputs' },
      { label: 'Create fields outputs', value: 'fieldsOutputs' }
    ]"
    />

    <q-input bottom-slots v-model="newCustomFieldName" label="Add custom field" :dense="dense">

      <template v-slot:append>
        <q-btn round dense flat icon="add" @click="addCustomField()"/>
      </template>
    </q-input>

    <div class="q-body-1"><p>Select the fields to add</p></div>
    <q-tree
      :nodes="collectionModel"
      node-key="label"
      tick-strategy="strict"
      :ticked.sync="selectedFields"
    />

    <q-btn-group>
      <q-btn label="Create block" @click="notifyBlockRequested()">
        <q-tooltip>
          Create and add the block top the library
        </q-tooltip>
      </q-btn>
      <q-btn label="Save" @click="saveBlock()">

        <q-tooltip>
          Save the block definition to the staging DB
        </q-tooltip>
      </q-btn>

    </q-btn-group>

    <q-list class="q-mt-md" link>
      <q-item-label>Existing model definitions</q-item-label>
      <q-item tag="label" v-for="(item, index) in savedBlocks" v-bind:key="item.name"
              @click.native="getSavedBlock(item.uri)">

        <q-item-main>
          <q-item-tile label>{{ item.name }}</q-item-tile>

        </q-item-main>
      </q-item>
    </q-list>


  </div>
</template>

<script>


  export default {
    // name: 'ComponentName',
    data() {
      return {
        selectedCollection: "",
        selectedFields: null,
        selectedCollection: null,
        availableCollections: [],
        collectionModel: [
          {
          label: 'source',
            children: []
        },
          {
            label: 'custom',
            children: []
          }

        ],
        blockOptions: ["nodeInput", "fieldsOutputs"],
        savedGraph: [],
        savedBlocks: [],
        blockName: "",
        newCustomFieldName:""

      }
    },
    methods: {
      collectionChanged() {
        console.log(this.selectedCollection)
        this.discoverModel(this.selectedCollection)

      },
      addCustomField(){

        this.collectionModel[1].children.push({label:this.newCustomFieldName,children:[]})

      },
      discoverCollections() {
        this.$axios.get('/v1/resources/collectionsDiscovery')
          .then((response) => {
            this.availableCollections = response.data
          })
          .catch(() => {
            this.$q.notify({
              color: 'negative',
              position: 'top',
              message: 'Loading failed',
              icon: 'report_problem'
            })
          })
      },
      loadSavedBlocks() {

        this.$axios.post('/v1/resources/savedBlock')
          .then((response) => {
            this.savedBlocks = response.data;

          })
          .catch(() => {
            this.$q.notify({
              color: 'negative',
              position: 'top',
              message: 'Loading failed',
              icon: 'report_problem'
            })
          })
      },
      getSavedBlock(uri) {
        //if(uri!=null)
        this.$axios.get('/v1/resources/savedBlock?rs:uri=' + encodeURI(uri))
          .then((response) => {
            let block = response.data;
            if (block != null) {
              this.blockName = block.name
              this.selectedCollection.value =block.collection
              this.selectedFields = block.fields;
              this.blockOptions = block.options;
            }
          })
          .catch(() => {
            this.$q.notify({
              color: 'negative',
              position: 'top',
              message: 'Loading failed',
              icon: 'report_problem'
            })
          })
      },
      saveBlock() {

        let blockDef = {

          name: this.blockName,
          collection: this.selectedCollection,
          source: "Sources",
          fields: this.selectedFields,
          options: this.blockOptions

        }

        this.$axios.put('/v1/resources/savedBlock', blockDef)
          .then((response) => {
            this.savedGraph = response.data
          })
          .catch(() => {
            this.$q.notify({
              color: 'negative',
              position: 'top',
              message: 'Loading failed',
              icon: 'report_problem'
            })
          })
      },
      discoverModel(collection) {
        this.$axios.get('/v1/resources/modelDiscovery?rs:collection=' + collection.value)
          .then((response) => {
            this.collectionModel[0].children = response.data
          })
          .catch(() => {
            this.$q.notify({
              color: 'negative',
              position: 'top',
              message: 'Loading failed',
              icon: 'report_problem'
            })
          })
      },


      notifyBlockRequested() {

        /*this.$q.notify({
          color: 'negative',
          position: 'top',
          message: 'Loading failed',
          icon: 'report_problem'
        })*/
        let blockDef = {

          label: this.blockName,
          collection: (this.selectedCollection!=null && this.selectedCollection!="" )?this.selectedCollection.value :this.blockName,
          source: "Sources",
          fields: this.selectedFields,
          options: this.blockOptions

        }
        this.$root.$emit("blockRequested", blockDef);
      }
    },
    mounted() {
      console.log('Nothing gets called before me!')
      this.discoverCollections()
      //Vue.set(vm.userProfile, 'age', 27)
      this.loadSavedBlocks();
    }
  }

</script>

<style>
</style>
