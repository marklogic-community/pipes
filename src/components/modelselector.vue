<!-- Copyright ©2020 MarkLogic Corporation. -->
<template>

  <div class="column gutter-sm">
   
    <q-input ref="blockName" bottom-slots v-model="blockName" label="Block name" maxlength="40"/>

     <div class="spacer-div">
      <q-btn label="Create Source Block" @click="notifyBlockRequested()" :disabled="cleanBlockName() == ''">
        <q-tooltip class="pipes-tooltip">
          Create new Source block and add to the library
        </q-tooltip>
      </q-btn>
     <!-- <q-toggle v-model="saveBlockToDB" label="Save block to database"/>-->
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
        <q-icon name="fas fa-database" @click.stop />
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
        <q-icon name="fas fa-tags" @click.stop>
         <!-- <q-tooltip self="center right" content-class="tool-tip" v-model="toolTips">Collection the block reads data from</q-tooltip>-->
        </q-icon>
      </template>
    </q-select>

    <q-input bottom-slots v-model="customURI" label="Analyze custom URIs (space separated)" >
      <template v-slot:append>
        <q-btn round dense flat icon="play_arrow" @click="collectionChanged()"/>
      </template>
    </q-input>

    <q-input ref="customFieldName" maxlength="90" bottom-slots v-model="newCustomFieldName" label="Add custom field"
     :rules="[ val => (cleanCustomFieldName(val).length >= 0 ) || 'Invalid field name']" @blur="resetCustomFieldValidation()">
      <template v-slot:append>
        <q-btn round dense flat icon="add" :disabled="cleanCustomFieldName() == ''" @click="addCustomField()"/>
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

        <q-expansion-item
          expand-separator
          icon="fas fa-database"
          label="Source Blocks"
    >
    <q-list padding class="q-mt-md" link>
      <q-item tag="label" v-for="(block, index) in savedBlocks" v-bind:key="block.name" 
      @click.native.prevent="getSavedBlock(block.uri)">
         <q-item-section avatar>
              <div class="block">
                <div class="block-title block">abc</div>
                <div class="block-body block"></div>
              </div>
         </q-item-section>   

         <q-item-section label>
             <div class="text-left">
              {{ block.name }}
              </div>
         </q-item-section>

          <q-item-section side>
           <q-btn flat outline @click.capture.stop="deleteBlockURI = block.uri; deleteBlockName = block.name; confirmBlockDelete = true" size="sm" icon="fas fa-trash-alt">
              <q-tooltip self="top middle" content-class="pipes-tooltip">Delete '{{block.name}}'</q-tooltip>
           </q-btn>
         </q-item-section>

      </q-item>
    </q-list>

    <q-dialog v-model="confirmBlockDelete" persistent>
          <q-card>
            <q-card-section class="row items-center">
              <q-avatar icon="fas fa-trash-alt" color="primary" text-color="red"></q-avatar>
            <span class="q-ml-sm">Are you sure you want to delete <b>{{deleteBlockName}}</b>?</span>
            </q-card-section>
            <q-card-actions align="right">
              <q-btn flat label="Cancel" color="primary" v-close-popup></q-btn>
              <q-btn flat label="Delete" color="primary" @click="deleteBlock(deleteBlockURI,deleteBlockName)" v-close-popup></q-btn>
            </q-card-actions>
            </q-card>
        </q-dialog>
      </q-expansion-item>


  </div>
</template>

<script>
  import Notifications from '../components/notificationHandler.js';
  import DatabaseFilter from '../components/databaseFilter.js';
  import CollectionFilter from '../components/collectionFilter.js';
  import { SOURCE_BLOCK_TYPE, BLOCK_FIELDS, BLOCK_FIELD, BLOCK_LABEL, BLOCK_TYPE, BLOCK_OPTIONS,
  BLOCK_OPTION_NODE_INPUT, BLOCK_OPTION_FIELDS_OUTPUT, BLOCK_CHILDREN, BLOCK_PATH, BLOCK_COLLECTION, BLOCK_SOURCE } from '../components/constants.js'

  export default {
    // name: 'ComponentName',
    mixins: [
      Notifications,
      DatabaseFilter,
      CollectionFilter
    ],
    data() {
      return {
        selectedCollection: "",
        saveBlockToDB:false,
        blockSaved: false,
        blockLibrary: [], // keep track of created blocks for pre-existance check
        selectedDatabase:null,
        selectedFields: [],
        selectedFieldsNodes:null,
        selectedCollection: null,
        availableCollections: [],
        availableDatabases: [],
        confirmBlockDelete: false,
        deleteBlockName: "",
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
        savedBlocks: [],
        blockName: "",
        newCustomFieldName:"",
        customURI:"",
        toolTips:true

      }
    },
    computed: {
      blockStatusIcon() {
    	    return (this.blockSaved ? 'check' : 'sticky-note');
    }
    },
    methods: {
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
      blockIsInLibrary(name) {
          var found = false;
          for(var i = 0; i < this.blockLibrary.length; i++) {
            if (this.blockLibrary[i][BLOCK_LABEL] == name) {
            found = true;
            break;
        }
      }
        return found
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
      loadSavedBlocks() {
         var self = this
         this.$axios.get('/v1/resources/vppBackendServices?rs:action=ListSavedBlock')
          .then((response) => {
            this.savedBlocks = response.data;
          })
          .catch((error) => {
            self.notifyError("ListSavedBlock", error, self);
          })
      },
      getSavedBlock(uri) {
        //if(uri!=null)
        var self = this;
       this.$axios.get('/v1/resources/vppBackendServices?rs:action=GetSavedBlock&rs:uri=' + encodeURI(uri))
          .then((response) => {
            let block = response.data;
            if (block != null) {
              self.collectionModel[0].children=[] // clear model and selected fields
              self.collectionModel[1].children=[]
              this.selectedFields=[]
              this.blockName = block.name
              this.selectedDatabase=block.database
              this.selectedCollection =block.collection
              this.discoverModel( this.selectedCollection,"")
              this.blockOptions = block.options;
              this.restoreFields(block) // restore fields from block
              this.$refs.selectionTree.expandAll()
              this.blockLibrary.push(block.name)

              // for reload of blocks from db
              var collection = ""
              if ( block.collection == null || block.collection == '' ) collection = block.name
              else collection = block.collection

              let blockDef = {
                    label: block.name,
                    collection: collection,
                    source: SOURCE_BLOCK_TYPE,
                    fields: block.fields,
                    options: block.options
              }

              this.$root.$emit("blockRequested", blockDef);
            }
          })
          .catch((error) => {
             self.notifyError("ListSavedBlock", error, self);
          })
      },
      deleteBlock(blockURI, blockName) {
          console.log("Deleting block: " + JSON.stringify(blockName))
           var self = this

         this.$axios.delete('/v1/resources/vppBackendServices?rs:action=deleteBlock&rs:URI=' + blockURI)
          .then((response) => {
              this.$q.notify({
              color: 'positive',
              position: 'top',
              message: "Source Block <b>'" + blockName + "'</b> deleted",
              icon: 'code'
  })
      this.loadSavedBlocks()
          })
          .catch((error) => {
            self.notifyError("Deleting Block", error, self);
          })

      },
      saveBlock() {
        var self = this;

        let blockMetadata = { "dateCreated" : new Date().toISOString() }
         var updatedFields = []

        if ( this.selectedFields !== null) {

        // Identify collection and custom fields

        for (var x = 0; x < this.selectedFields.length; x++) {
    
        var field = this.selectedFields[x]
        var isCustomField = false;
        for (var i = 0; isCustomField == false && i < self.collectionModel[1].children.length; i++) {
                isCustomField = (this.selectedFields[i] == field) 
          }
                updatedFields.push({"label" : field, "customField" : isCustomField});
        }
        }

        let blockDef = {
          name: this.blockName,
          database: this.selectedDatabase,
          [BLOCK_COLLECTION]: this.selectedCollection,
          [BLOCK_SOURCE]: SOURCE_BLOCK_TYPE,
          [BLOCK_FIELDS]: updatedFields, //this.selectedFields,
          [BLOCK_OPTIONS]: this.blockOptions,
          metadata: blockMetadata
        }

        return this.$axios.post('/v1/resources/vppBackendServices?rs:action=SaveBlock', blockDef)
          .then((response) => {
            this.savedGraph = response.data
          })
          .catch((error) => {
            self.notifyError("SaveBlock", error, self);
          })
      },
      // Restore collection fields and custom fields after block reload 
      restoreFields(reloadedBlock) {
          if ( reloadedBlock.fields.length > 0) {
          for (var i = 0; i < reloadedBlock.fields.length; i++) {
            if ( (reloadedBlock.fields[i].customField == true) ) {
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
            this.selectedFields.push(reloadedBlock.fields[i].label)
         } 
          }
      },
      discoverModel(collection,customURI) {
        let dbOption =""
        if(this.selectedDatabase!=null && this.selectedDatabase!="") {
          dbOption += "&rs:database=" + this.selectedDatabase.value
        }

        if(collection!=null && collection.value!=null)
          dbOption += "&rs:collection=" + collection.value

        if(customURI!=null && customURI!="")
          dbOption += "&rs:customURI=" + customURI

        this.$axios.get('/v1/resources/vppBackendServices?rs:action=collectionModel' + dbOption)
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
      databaseChanged(){
        this.selectedCollection = []
        this.discoverCollections()
         this.$root.$emit("databaseChanged",
           {selectedDatabase: this.selectedDatabase,availableDatabases:this.availableDatabases
           }

          );
      },

      notifyBlockRequested() {

        this.blockName = this.cleanBlockName()

            if ( this.blockIsInLibrary(this.blockName) )
            {
                this.$q.notify({
                    color: 'negative',
                    position: 'top',
                    message: 'Block with this name already in library. Please use another name',
                    icon: 'report_problem'
                })
            }

            else {
           
          let blockMetadata = { "dateCreated" : new Date().toISOString() }

          let blockDef = { 

            [BLOCK_LABEL]: this.blockName,
            collection: this.blockName,
            source: SOURCE_BLOCK_TYPE,
            [BLOCK_FIELDS]: this.$refs["selectionTree"].getTickedNodes(), //this.selectedFields,
            options: this.blockOptions,
            metadata: blockMetadata

          }

          if (this.saveBlockToDB) { 
            var ref = this
            this.saveBlock().then(() => {
                  ref.loadSavedBlocks()
          });
           
          }
          this.blockLibrary.push(blockDef)
          this.$root.$emit("blockRequested", blockDef);
          this.blockSaved = true; 
        }

      }
    },
    mounted() {
      console.log('Nothing gets called before me!')
      this.discoverDatabases()
      this.loadSavedBlocks();
      this.$refs.selectionTree.getNodeByKey("custom")
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
</style>
