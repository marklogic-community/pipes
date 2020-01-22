<!-- Copyright ©2020 MarkLogic Corporation. -->
<template>

  <div class="column gutter-sm">
   
    <q-input ref="blockName" bottom-slots v-model="blockName" label="Block name" maxlength="40"/>

     <div class="spacer-div">
      <q-btn label="Create block" @click="notifyBlockRequested()" :disabled="cleanBlockName() == ''">
        <q-tooltip>
          Create block and add to library
        </q-tooltip>
      </q-btn>
      <q-toggle v-model="saveBlockToDB" label="Save block to database"/>
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
        <q-icon name="fas fa-tags" @click.stop />
      </template>
    </q-select>

    <q-input bottom-slots v-model="customURI" label="Analyze custom URI" >
      <template v-slot:append>
        <q-btn round dense flat icon="play_arrow" @click="collectionChanged()"/>
      </template>
    </q-input>

    <q-input ref="customFieldName" maxlength="40" bottom-slots v-model="newCustomFieldName" label="Add custom field" 
     :rules="[ val => (cleanCustomFieldName(val).length >= 0 ) || 'Invalid field name']" @blur="resetCustomFieldValidation()">
      <template v-slot:append>
        <q-btn round dense flat icon="add" :disabled="cleanCustomFieldName() == ''" @click="addCustomField()"/>
      </template>
    </q-input>

    <div>Fields to add</div>

    <q-tree
      ref="selectionTree"
      :nodes="collectionModel"
      node-key="label"
      tick-strategy="strict"
      :ticked.sync="selectedFields"
    />

    <div class="q-display-1">Generation options</div>
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

    <q-list class="q-mt-md" link>
      <q-item-label>Saved Blocks</q-item-label>
      <q-item tag="label" v-for="(item, index) in savedBlocks" v-bind:key="item.name"
              @click.native="getSavedBlock(item.uri)">
        <q-item-label>
          <q-item-section label>{{ item.name }}</q-item-section>
        </q-item-label>
      </q-item>
    </q-list>

  </div>
</template>

<script>
  import Notifications from '../components/notificationHandler.js';
  import DatabaseFilter from '../components/databaseFilter.js';
  import CollectionFilter from '../components/collectionFilter.js';

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
        newCustomFieldName:"",
        customURI:""

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
            if (this.blockLibrary[i].label == name) {
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
            "label":fieldName,
            "children":[],
            "field" : fieldName,
            "path":  "//"  + fieldName,
            "type": "custom"
        })

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


            }
          })
          .catch((error) => {
             self.notifyError("ListSavedBlock", error, self);
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
          collection: this.selectedCollection,
          source: "Sources",
          fields: updatedFields, //this.selectedFields,
          options: this.blockOptions,
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
                  "label":fieldName,
                  "children":[],
                  "field" : fieldName,
                  "path":  "//"  + fieldName,
                  "type": "custom"
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

            label: this.blockName,
            collection: this.blockName,
            source: "Sources",
            fields: this.$refs["selectionTree"].getTickedNodes(), //this.selectedFields,
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

       // }

      }
    },
    mounted() {
      console.log('Nothing gets called before me!')
      this.discoverDatabases()
      this.loadSavedBlocks();
    }
  }

</script>

<style>
.spacer-div { margin-bottom: 8px; } 
</style>