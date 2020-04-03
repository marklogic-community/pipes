<!-- Copyright ©2020 MarkLogic Corporation. -->
<template>

  <div class="column gutter-sm">

     <div class="row">
        <div class="col-10">

        </div>

        <div class="col-2" align="right" style="padding: 0px; margin: 0px;">
                <q-icon color="primary" style="font-size: 1.5em" name="far fa-question-circle">
                <q-tooltip content-class="pipes-tooltip tooltip-square">
                An Entity Block lets you use the data from the Entities defined in your Data Hub project
                </q-tooltip>
                </q-icon>
        </div>
      </div>

    <q-stepper
      v-model="createEntityBlockStep"
      vertical
      header-nav
      color="primary"
      animated
	    flat
    >

     <!--- STEP 1 Entity NAME -->
      <q-step
        :name="1"
        title="Select Entity to create block from"
        icon="chat_bubble_outline"
        active-icon="search"
        :done="createEntityBlockStep > 1"
        error-icon="error_outline"
      >

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

  <q-space></q-space>
  <q-space></q-space>

   <q-input disabled v-model="entityDescription"></q-input>
  <q-space></q-space>

<div v-if="showPropertyLabel">
 An Entity block with the following inputs will be created:
</div>
 <q-space></q-space>
 <q-space></q-space>
    <q-table v-if="selectedEntity !== null"
            @mouseover.stop=''

            :data="entityModel.children"
            :pagination.sync="pagination"
            :columns="columns"
            row-key="name"
            no-data-label="No properties defined for this entity"
            dense
            flat
    />

      <q-btn label="Create Entity Block" color="primary" :disable="! createEntityReady"
        @click="notifyBlockRequested()" :disabled="selectedEntity === null">
          <q-tooltip>
          Create block and add to library (Right click > Entities)
          </q-tooltip>
      </q-btn>

      </q-step>

    </q-stepper>

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
      createEntityBlockStep: 1,
      entityModel:{children:[]},
    columns: [
      {
        name: 'Property',
        required: true,
        label: 'Property Name',
        align: 'left',
        field: 'label',
        sortable: true,
        style: 'font-size: 1em'
      }, {
        name: 'Type',
        required: true,
        label: 'Type',
        align: 'left',
        field: 'displayType',
        sortable: true,
        style: 'font-size: 1em'
      },
      {
        name: 'Description',
        required: true,
        label: 'Description',
        align: 'left',
        field: 'description',
        sortable: true,
        style: 'font-size: 1em'
      }
            ],
    pagination: {
        descending: false,
        page: 2,
        rowsPerPage: 0
      },
    }
  },
  computed: {
    createEntityReady: function() {
      return (this.entityModel !== null && this.entityModel.children.length > 0)
    },
   showPropertyLabel: function() {
      return ( this.selectedEntity !== null )
    },
    entityDescription: function() {
      return (this.selectedEntity !== null && this.selectedEntity.description) ? this.selectedEntity.description : ""
    }
  },
  methods:{

    entityChanged(){
      console.log("Getting entity properties for Entity: " + this.selectedEntity.value)
      this.$axios.get('/v1/resources/vppBackendServices?rs:action=DHFEntityProperties&rs:entity=' +  this.selectedEntity.value)
              .then((response) => {
                this.entityModel = this.simplifyFields(response.data)
              })
    },

    simplifyFields(data) {

      var c = []

      data.children.map(item => {
        var field = {}
        field.propety = item.property
        field.label = item.label,
        field.type = item.type
        field.displayType = item.type.replace("http://www.w3.org/2001/XMLSchema#",'')
        field.description = item.description
        c.push(field)
      })

      data.children = c

      return data

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
