<!-- Copyright ©2020 MarkLogic Corporation. -->
<template>

  <div class="column gutter-sm">

    <q-form @submit="notifyBlockRequested">
   
    <q-input style="font-size: 1.5em" ref="blockName" bottom-slots v-model="blockName" label="Block name" maxlength="40"/>

    <div class="spacer-div">

    <q-btn type="submit" :label="blockButtonLabel" :disabled="cleanBlockName() == ''">
      <q-tooltip class="pipes-tooltip">Create new Source block and add to the library</q-tooltip>
    </q-btn>
    
    </div>

    <q-select
      name="databaseSelector"
      v-model="selectedDatabase"
      :options.sync="availableDatabases"
      @input="databaseChanged"
      filled
      separator
      label="Source database"
      stack-label
    >
   <!-- <q-tooltip self="center right" content-class="tool-tip" v-model="toolTips">Database the block reads documents from</q-tooltip>-->
       <template v-slot:prepend>
        <q-icon name="fas fa-database"/>
      </template>
    </q-select>

    <q-select
      name="collectionSelector"
      v-model="selectedCollection"
      :options.sync="availableCollections"
      @input="collectionChanged"
      filled
      separator
      label="Source collection"
      stack-label
    >
      <template v-slot:prepend>
        <q-icon name="fas fa-tags">
         <!-- <q-tooltip self="center right" content-class="tool-tip" v-model="toolTips">Collection the block reads data from</q-tooltip>-->
        </q-icon>
      </template>
    </q-select>

    <q-input bottom-slots v-model="customURI" label="Analyze custom URIs (space separated)" >
      <template v-slot:append>
        <q-btn round dense flat icon="play_arrow" @click="collectionChanged"/>
      </template>
    </q-input>

    <q-input ref="customFieldName" maxlength="60" bottom-slots v-model="newCustomFieldName" label="Add custom field"
     :rules="[ val => (cleanCustomFieldName(val).length >= 0 ) || 'Invalid field name']" @blur="resetCustomFieldValidation">
      <template v-slot:append>
        <q-btn round dense flat icon="add" :disabled="cleanCustomFieldName() == ''" @click="addCustomField"/>
      </template>
    </q-input>

    <div>Fields</div>
    <q-tree class="spacer-div"
      ref="selectionTree"
      :nodes="collectionModel"
      node-key="label"
      tick-strategy="strict"
      :ticked.sync="selectedFields"
    />

    <!-- Block options -->
        <q-expansion-item
          expand-separator
          icon="settings"
          label="Block Input/Output Options"
        >
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

      </q-expansion-item>
   </q-form>

        <q-expansion-item
          expand-separator
          icon="fas fa-database"
          label="Source Blocks"
    >
    <q-list padding>

      <q-item tag="label" v-for="(block, index) in this.sourceBlocks" v-bind:key="block.source + '/' + block.label" @click.native.prevent="">

         <q-item-section avatar>
              <div class="block">
                <q-tooltip self="top middle" content-class="pipes-tooltip">{{block}}</q-tooltip>
                <div class="block-title block">abc</div>
                <div class="block-body block">
                  <div :class="block.source"/>
                </div>
              </div>
         </q-item-section>  

       <q-item-section label>
             <div class="text-left">
              {{ block.label }}
              </div>
         </q-item-section>

         <q-item-section top side>
            <div class="text-grey-8 q-gutter-xs">
            <q-btn @click.capture.stop="restoreBlockToForm(block)" flat outline size="sm" style="color: #419e5a" icon="fas fa-arrow-up">
              <q-tooltip self="top middle" content-class="pipes-tooltip">Restore block settings to form above</q-tooltip>
            </q-btn> 
            <q-btn @click.capture.stop="deleteBlock(block,block.label,true)" flat outline size="sm" style="color: #b81220" icon="fas fa-trash-alt">
              <q-tooltip self="top middle" content-class="pipes-tooltip">Delete '{{block.label}}'</q-tooltip>
            </q-btn>
            </div>
         </q-item-section>

      </q-item>
    </q-list>

    </q-expansion-item>

  </div>
</template>

<script>
  import Notifications from '../components/notificationHandler.js';
  import DatabaseFilter from '../components/databaseFilter.js';
  import CollectionFilter from '../components/collectionFilter.js';
  import { SOURCE_BLOCK_TYPE, BLOCK_FIELDS, BLOCK_FIELD, BLOCK_LABEL, BLOCK_TYPE, BLOCK_OPTIONS,
  BLOCK_OPTION_NODE_INPUT, BLOCK_OPTION_FIELDS_OUTPUT, BLOCK_CHILDREN, BLOCK_PATH, BLOCK_COLLECTION, BLOCK_SOURCE } from '../components/constants.js'
  import LiteGraphHelper from '../components/liteGraphHelper.js'

  export default {
    // name: 'ComponentName',
    mixins: [
      Notifications,
      DatabaseFilter,
      CollectionFilter,
      LiteGraphHelper
    ],
    data() {
      return {
        blockButtonLabel: "Create Source Block",
        selectedCollection: "",
        saveBlockToDB:false,
        selectedDatabase:null,
        selectedFields: [],
        selectedFieldsNodes:null,
        selectedCollection: null,
        availableCollections: [],
        availableDatabases: [],
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
        blockOptions: [BLOCK_OPTION_NODE_INPUT, BLOCK_OPTION_FIELDS_OUTPUT],
        savedGraph: [],
        blockName: "",
        newCustomFieldName:"",
        customURI:"",
        toolTips:true
      }
    },
    computed: {
      sourceBlocks: function () {
        return this.$store.state.models.filter(function (block) {
        return block.source == "Sources"
    })
  }
    },
    methods: {

      logBlock(block) {
        console.log(JSON.stringify(block))
      },

      setDatabaseCollectionsDropdowns(dbName, collectionName) {
        console.log( "setDatabaseDropdown: " + dbName + "," + collectionName )
        if ( dbName == null || dbName == '') return;
        for (var x = 0; x < this.availableDatabases.length; x++) {
          if ( this.availableDatabases[x].label == dbName ) {
            this.selectedDatabase = this.availableDatabases[x]

            var self = this
            this.discoverCollectionsPromise().then((response) => {
            this.availableCollections = self.filterCollections(response.data)
            if (collectionName !== null && collectionName !== '') {
              console.log("Trying to auto-select block collection " + collectionName)
              for (var x = 0; x < self.availableCollections.length; x++) {
                  if ( self.availableCollections[x].label == collectionName ) {
                  self.selectedCollection = self.availableCollections[x]
                  self.discoverModel( this.selectedCollection,"")
                  return
                  }
              }
            }
          })
          .catch((error) => {
            self.notifyError("collectionDetails", error, self);
          })
          }
        }
      },
      selectFieldPath(node){
        console.log(node)
      }
      ,
      collectionChanged() {
       // console.log(this.selectedCollection)
        this.discoverModel(this.selectedCollection,this.customURI)
      },
       resetBlockFields() {
        this.newCustomFieldName = null
        this.blockName = null
        this.selectedDatabase = null
        this.$refs.customFieldName.resetValidation()
      },
      resetCustomFieldValidation() {
        this.newCustomFieldName= this.cleanCustomFieldName()
        this.$refs.customFieldName.resetValidation()
      },
      cleanCustomFieldName() {
        // must be a valid javascript property name. Possible further cleaning to come
        var name = ''
        if ( this.newCustomFieldName !== null) {
           name = this.newCustomFieldName.trim().replace(/  +/g, ' ');
        }
        return name
      },
      cleanBlockName() {
        return this.blockName.trim().replace(/  +/g, ' ');
      },

      addCustomField(){

        if ( this.cleanCustomFieldName() !== '' ) {

        var fieldName = this.cleanCustomFieldName()
        // disallow duplicate custom field names
        if ( ! this.$refs.selectionTree.getNodeByKey(fieldName) ) {

        this.collectionModel[1].children.push({
            [BLOCK_LABEL]:fieldName,
            [BLOCK_CHILDREN]:[],
            [BLOCK_FIELD] : fieldName,
            [BLOCK_PATH]:  "//"  + fieldName,
            [BLOCK_TYPE]: "custom"
        })

        console.log("collectionModel = " + JSON.stringify( this.collectionModel[1] ))

        this.$refs.selectionTree.setExpanded("custom",true)
        
        } 
          this.newCustomFieldName = ''
          this.resetCustomFieldValidation()
        }
      },
      discoverCollections() {
        var self = this;
        let dbOption =""
        if(this.selectedDatabase!=null && this.selectedDatabase!="") {
          dbOption += "&rs:database=" + this.selectedDatabase.value
        }
          this.$axios.get('/v1/resources/vppBackendServices?rs:action=collectionDetails' + dbOption )
          .then((response) => {
            this.availableCollections = self.filterCollections(response.data)
          })
          .catch((error) => {
            self.notifyError("collectionDetails", error, self);
          })
      },
      // same as discoverCollections but returns promise so we can set dropdown after retreiving collection list
       discoverCollectionsPromise() {
        let dbOption =""
        if(this.selectedDatabase!=null && this.selectedDatabase!="") {
          dbOption += "&rs:database=" + this.selectedDatabase.value
        }
          return this.$axios.get('/v1/resources/vppBackendServices?rs:action=collectionDetails' + dbOption )
      },
      discoverDatabases() {
        var self = this;
        this.$axios.get('/v1/resources/vppBackendServices?rs:action=databasesDetails')
          .then((response) => {
            this.availableDatabases = this.filterDatabases(response.data)
          })
          .catch((error) => {
            self.notifyError("databasesDetails", error,self);
          })
      },
      
      // Restore block to main editing panel. Formerly from db, now from graph
      restoreBlockToForm(block) {
        console.log("Restoring source block to form: " + block.label)

              this.collectionModel[0].children=[] // clear model and selected fields
              this.collectionModel[1].children=[]
              this.selectedFields=[]
              this.blockName = block.label
          //    this.selectedDatabase=block.database  -- GRAPH BLOCK DOES NOT HAVE DB DETAIL

          if (block.metadata && block.metadata.customURIs && block.metadata.customURIs !== null) {
              this.customURI = block.metadata.customURIs
          }

          var blockSourceDatabase, blockSourceCollection
          if (block.metadata && block.metadata.sourceDatabase && block.metadata.sourceDatabase != '') blockSourceDatabase = block.metadata.sourceDatabase
          if (block.metadata && block.metadata.sourceCollection && block.metadata.sourceCollection != '') blockSourceCollection = block.metadata.sourceCollection

          this.setDatabaseCollectionsDropdowns(blockSourceDatabase,blockSourceCollection)

            this.discoverModel( this.selectedCollection,"")
            this.blockOptions = block.options;
            this.restoreFields(block) // restore fields from block

      },
      
      // remove block Model list
      deleteBlock(block, showDialog) {
        this.$root.$emit("checkGraphBlockDelete",block)
      },
      // Restore collection fields and custom fields after block reload 
      restoreFields(reloadedBlock) {

          if ( reloadedBlock.fields.length > 0) {
          for (var i = 0; i < reloadedBlock.fields.length; i++) {
            if ( (reloadedBlock.fields[i].type == 'custom') ) {
                var fieldName = reloadedBlock.fields[i].label
                
                this.collectionModel[1].children.push({
                  [BLOCK_LABEL]:fieldName,
                  [BLOCK_CHILDREN]:[],
                  [BLOCK_FIELD] : fieldName,
                  [BLOCK_PATH]:  "//"  + fieldName,
                  [BLOCK_TYPE]: "custom"
                })
                
            } 
            // add all field regardless of type to "selected" so check boxes in tree are filled in
            console.log("Adding field back to tree:" + reloadedBlock.fields[i].label)
            this.selectedFields.push(reloadedBlock.fields[i].label)

         }

            if ( this.collectionModel[1].children.length > 0 )
            this.$refs["selectionTree"].setExpanded("custom",true) 
          }
      },
      discoverModel(collection,customURI) {
        let dbOption =""
        if (this.selectedDatabase!=null && this.selectedDatabase!="") {
          dbOption += "&rs:database=" + this.selectedDatabase.value
        }

        if(collection!=null && collection.value!=null)
          dbOption += "&rs:collection=" + collection.value

        if(customURI!=null && customURI!="")
          dbOption += "&rs:customURI=" + customURI

        this.$axios.get('/v1/resources/vppBackendServices?rs:action=collectionModel' + dbOption)
          .then((response) => {
            this.collectionModel[0].children = response.data
            if ( response.data != null && response.data.length > 0  ) {
              this.$refs.selectionTree.setExpanded("source",true)
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
      databaseChanged(){
        this.selectedCollection = []
        this.discoverCollections()
         this.$root.$emit("databaseChanged",
           {selectedDatabase: this.selectedDatabase,availableDatabases:this.availableDatabases
           }

          );
      },

      notifyBlockRequested() {

        console.log( 'notifyBlockRequested called' )

        this.blockName = this.cleanBlockName()
           
          let blockMetadata = { 
            "dateCreated" : new Date().toISOString(),
            "sourceDatabase" : this.selectedDatabase != null ? this.selectedDatabase.label : '' ,
            "sourceCollection" : this.selectedDatabase != null ? this.selectedCollection.value : '',
            "customURIs" : this.customURI  
          }

          let blockDef = { 

            [BLOCK_LABEL]: this.blockName,
            collection: this.blockName,
            source: SOURCE_BLOCK_TYPE,
            [BLOCK_FIELDS]: this.$refs["selectionTree"].getTickedNodes(), //this.selectedFields,
            options: this.blockOptions,
            metadata: blockMetadata
          }

          this.$root.$emit("blockRequested", blockDef);

      }

    },
    mounted() {
      this.discoverDatabases()
    }
  }

</script>

<style>
.spacer-div { margin-bottom: 8px; } 

.block {
  width: 30px;
  border-top-left-radius: 5px; 
  border-top-right-radius: 5px;
}

.block-title {
  height: 8px;
  background: rgb(236,75,43);
  color:white;
  font-size:0.2em;
}

.block-body {
  background: rgb(176,165,143);
  height: 20px;
  border-top-right-radius: 0px;
  border-top-left-radius: 0px;
  border-bottom-right-radius: 5px;
  border-bottom-left-radius: 5px; 
}

.pipes-tooltip {
  background-color: #7397d1;
  font-size: 1.0em;
}

.Entities {
   background: red;
}

.Sources {
  background: blue;
}
</style>