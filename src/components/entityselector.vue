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
  import { ENTITY_BLOCK_TYPE } from '../components/constants.js'

export default {
  // name: 'ComponentName',
  mixins: [
      Notifications
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


    getEntities() {
      var self = this;
      this.$axios.get('/v1/resources/vppBackendServices?rs:action=DHFEntities')
              .then((response) => {
                this.availableEntities = response.data
              })
              .catch((error) => {
                self.notifyError("LoadingEntities", error, self);
              })
    },
    entityChanged(){
      this.$axios.get('/v1/resources/vppBackendServices?rs:action=DHFEntityProperties&rs:entity=' +  this.selectedEntity.value)
              .then((response) => {
                this.entityModel = response.data
              })
             /* .catch(() => {
                this.$q.notify({
                  color: 'negative',
                  position: 'top',
                  message: 'Entity Block creation failed',
                  icon: 'report_problem'
                })
              })*/

    },


      notifyBlockRequested() {

          let entity = this.availableEntities.filter(item => { return item.value == this.selectedEntity.value })[0]

          let blockDef = {

              label: entity.label,
              collection: entity.label,
              source: ENTITY_BLOCK_TYPE,
              fields : this.entityModel.children.map(item => { return  {
                  "label" : item.label,
                  "field" : item.label,
                  "path":  "//"  + item.label
                }
              }),
              options : ["fieldsInputs","nodeOutput"]

          }
          this.$root.$emit("blockRequested",blockDef);
      },
      saveBlock() {
          var self = this;
          let entity = this.availableEntities.filter(item => { return item.value == this.selectedEntity.value })[0]

          let blockDef = {

              label: entity.label,
              collection:  entity.label,
              source: ENTITY_BLOCK_TYPE,
              fields : this.entityModel.children.map(item => { return item.label}),
              options : ["fieldsInputs","nodeOutput"]

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
    console.log('Nothing gets called before me!')
    this.getEntities();
  }
}
</script>

<style>
.spacer-div { margin-bottom: 8px; } 
</style>
