<!-- Copyright ©2020 MarkLogic Corporation. -->
<template>

  <div class="column gutter-sm">

<div class="spacer-div">
      <q-btn label="Create Entity Block" @click="notifyBlockRequested()" :disabled="selectedEntity === null">
        <q-tooltip>
          Create block and add to library (right click)
        </q-tooltip>
      </q-btn>
</div>      

  <q-select
          name="collectionSelector"
          v-model="selectedEntity"
          :options.sync="availableEntities"
          @input="entityChanged"
          filled
          separator
          stack-label
          label="Select an entity"
  />
    <q-table
            title="Entity Properties"
            :data="entityModel.children"
            :columns="columns"
            row-key="name"
    />


  </div>
</template>

<script>
  import Notifications from '../components/notificationHandler.js';
  import { ENTITY_BLOCK_TYPE, BLOCK_FIELDS, BLOCK_FIELD, BLOCK_LABEL, BLOCK_PATH, BLOCK_TYPE,BLOCK_COLLECTION,BLOCK_SOURCE,BLOCK_OPTIONS,BLOCK_OPTION_FIELDS_INPUT, BLOCK_OPTION_NODE_OUTPUT } from '../components/constants.js'
  import EntityManager from '../components/entityManager.js';

export default {
  mixins: [
      Notifications,
      EntityManager
    ],
  data () {
    return {
      availableEntities :[],
      selectedEntity:null,
      entityModel:{children:[]},
    columns: [
      { 
        name: 'Property',
        required: true,
        label: 'Property',
        align: 'left',
        field: 'label',
        sortable: true,
        style: 'font-size: 10px'
      },      {
        name: 'Type',
        required: true,
        label: 'Type',
        align: 'left',
        field: 'type',
        sortable: true,
        style: 'font-size: 8px'
      }
            ]
    }

  },
  methods:{
    
    entityChanged(){
      console.log("Getting entity properties for Entity: " + this.selectedEntity.value)
      this.$axios.get('/v1/resources/vppBackendServices?rs:action=DHFEntityProperties&rs:entity=' +  this.selectedEntity.value)
              .then((response) => {
                this.entityModel = response.data
              })
    },

      notifyBlockRequested() {

          let entity = this.availableEntities.filter(item => { return item.value == this.selectedEntity.value })[0]

          let blockDef = {

              [BLOCK_LABEL]: entity.label,
              [BLOCK_COLLECTION]: entity.label,
              [BLOCK_SOURCE]: ENTITY_BLOCK_TYPE,
              [BLOCK_FIELDS] : this.entityModel.children.map(item => { return  {
              [BLOCK_LABEL] : item.label,
              [BLOCK_FIELD] : item.label,
              [BLOCK_PATH]:  "//"  + item.label
                }
              }),
              [BLOCK_OPTIONS] : [BLOCK_OPTION_FIELDS_INPUT,BLOCK_OPTION_NODE_OUTPUT]

          }
          this.$root.$emit("blockRequested",blockDef);
      },
      saveBlock() {
          var self = this;
          let entity = this.availableEntities.filter(item => { return item.value == this.selectedEntity.value })[0]

          let blockDef = {

              [BLOCK_LABEL]: entity.label,
              [BLOCK_COLLECTION]:  entity.label,
              [BLOCK_SOURCE]: ENTITY_BLOCK_TYPE,
              [BLOCK_FIELDS] : this.entityModel.children.map(item => { return item.label}),
              [BLOCK_OPTIONS] : [BLOCK_OPTION_FIELDS_INPUT,BLOCK_OPTION_NODE_OUTPUT]
          }

          this.$axios.put('/v1/resources/savedBlock',blockDef)
              .then((response) => {
                  this.savedGraph = response.data
              })
              .catch((error) => {
                 self.notifyError("savedBlock", error, self);
              })
      }
  },
  mounted() {
 
 this.getEntities()
      .then( (response) => {
        this.availableEntities = response.data
              }).catch((error) => {
                self.notifyError("LoadingEntities", error, self);
       })

  }

}
</script>

<style>
.spacer-div { margin-bottom: 8px; } 
</style>
