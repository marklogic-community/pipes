<!-- Copyright ©2020 MarkLogic Corporation. -->
<template>
  <div class="flex flex-center">
    <canvas class="fixed" height='1000' ref="mycanvas" style='border: 1px solid' width='1800'></canvas>

    <q-dialog persistent v-model="editQuery">
      <q-card>
        <q-card-section>
          <div class="text-h6">Edit Query</div>
        </q-card-section>

        <q-card-section>
          <div class="q-pa-md" style="max-width: 600px;min-width:500px">
            <q-input
              v-model="currentCtsQuery.ctsQuery"
              filled
              type="textarea"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn color="primary" flat label="OK" v-close-popup/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog persistent v-model="editCases">
      <q-card>
        <q-card-section>
          <div class="text-h6">Edit Cases</div>
        </q-card-section>

        <q-card-section>
          <div class="q-pa-md" style="max-width: 600px;min-width:500px">
            <q-input
              v-model="currentCases"
              filled
              type="textarea"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn color="primary" flat label="OK" v-close-popup/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog persistent v-model="editJson">
      <q-card>
        <q-card-section>
          <div class="text-h6">Edit data mapping</div>
        </q-card-section>

        <q-card-section>
          <q-table
            :columns="columns"
            :data="currentProperties"
            binary-state-sort
            row-key="name"
            title="Mappings"
          >
            <template v-slot:body="props">
              <q-tr :props="props">
                <q-td :props="props" key="source">
                  {{ props.row.source }}
                  <q-popup-edit buttons title="Update mapping" v-model="props.row.source">
                    <q-input autofocus dense type="string" v-model="props.row.source"/>
                  </q-popup-edit>
                </q-td>
                <q-td :props="props" key="target">
                  {{ props.row.target }}
                  <q-popup-edit buttons title="Update mapping" v-model="props.row.target">
                    <q-input autofocus dense type="string" v-model="props.row.target"/>
                  </q-popup-edit>
                </q-td>

              </q-tr>
            </template>
          </q-table>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn @click="addMapping()" color="primary" flat label="Add mapping"/>
          <q-btn color="primary" flat label="OK" v-close-popup/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog :content-css="{minWidth: '60vw', minHeight: '80vh'}" v-model="savePopUpOpened">
      <q-card>
        <q-card-section class="row items-center">
          <div class="text-h6">Save current graph</div>
        </q-card-section>

        <q-card-section class="row">
          <div style="min-width: 250px; max-width: 300px">
            <q-input label="Graph name" v-model="graphMetadata.title"/>
          </div>
        </q-card-section>

        <div class="q-pa-sm">
          <q-btn
            @click="saveCurrentGraph()"
            color="primary"
            label="Save"
            :disabled="(graphMetadata.title === null || graphMetadata.title === '' || graphMetadata.title.trim() === '')"
          />
          <q-btn
            @click="savePopUpOpened = false"
            color="primary"
            label="Close"
          />
        </div>

      </q-card>

    </q-dialog>

    <q-dialog v-model="loadPopUpOpened">
      <div style="min-width: 400px; max-width: 600px">
        <q-card>
          <q-card-section class="row items-center">
            <div class="text-h6">Reload Graph</div>
          </q-card-section>

          <q-list class="q-mt-md" link>
            <q-item-label :header="true">Click a graph from list to reload</q-item-label>
            <q-item @click.native.prevent="getSavedGraph(graph.uri,graph.name)" tag="label" v-bind:key="graph.name" v-for="(graph, index) in savedGraph">
               <q-item-section avatar>
                  <q-icon style="font-size: 1.5em" name="fas fa-project-diagram"/>
                </q-item-section>

               <q-item-section>
                  {{ graph.name }}
                </q-item-section>

                 <q-item-section side>
                  <q-btn flat outline @click.native.stop="deleteGraphURI = graph.uri; deleteGraphName = graph.name + (graph.version != null && graph.version != '' ? '-' + graph.version : ''); confirmDeleteGraph = true" size="sm" icon="fas fa-trash-alt">
                    <q-tooltip self="top middle" content-class="pipes-tooltip">Delete '{{graph.name}}-{{graph.version}}'</q-tooltip>
                  </q-btn>
                </q-item-section>

            </q-item>
          </q-list>

        <div class="q-pa-md doc-container">
          <div class="row justify-center">
         <!--<div class="q-pa-sm">-->
            <q-btn class="center"
              @click="loadPopUpOpened = false"
              color="primary"
              label="Close"
            />
         </div>
         </div>
        </q-card>
      </div>
    </q-dialog>

        <q-dialog v-model="confirmDeleteGraph" persistent>
          <q-card>
            <q-card-section class="row items-center">
              <q-avatar icon="fas fa-trash-alt" color="primary" text-color="red"></q-avatar>
            <span class="q-ml-sm">Are you sure you want to delete <b>{{deleteGraphName}}</b>?</span>
            </q-card-section>
            <q-card-actions align="right">
              <q-btn flat label="Cancel" color="primary" v-close-popup></q-btn>
              <q-btn flat label="Delete" color="primary" @click="deleteGraph(deleteGraphName,deleteGraphURI)" v-close-popup></q-btn>
            </q-card-actions>
            </q-card>
        </q-dialog>

       <q-dialog v-model="confirmResetGraph" persistent>
          <q-card>
            <q-card-section class="row items-center">
              <q-avatar icon="fas fa-trash-alt" color="primary" text-color="red"></q-avatar>
            <span class="q-ml-sm">Are you sure you want to reset the graph?</span>
            </q-card-section>
            <q-card-actions align="right">
              <q-btn flat label="Cancel" color="primary" v-close-popup></q-btn>
              <q-btn flat label="Reset" color="primary" @click="" v-close-popup></q-btn>
            </q-card-actions>
            </q-card>
        </q-dialog>

        <q-dialog v-model="BlockDeletion.showBlockOnGraphNoDelete" persistent>
          <q-card>
            <q-card-section class="row items-center">
              <q-avatar icon="fas fa-trash-alt" color="primary" text-color="red"></q-avatar>
            <span class="q-ml-sm">You must remove this block from the graph before deleting</span>
            </q-card-section>
            <q-card-actions align="right">
              <q-btn flat label="OK" color="primary" v-close-popup></q-btn>
            </q-card-actions>
            </q-card>
        </q-dialog>

       <q-dialog v-model="warnBlockOnGraph" persistent>
          <q-card>
            <q-card-section class="row items-center">
              <q-avatar icon="fas fa-exclamation" color="primary" text-color="red">
              </q-avatar>
            <span><b>{{ warnBlockName }}</b> is being used on the graph. All current instances must be removed before you can save a new definition</span>
            </q-card-section>
            <q-card-actions align="right">
              <q-btn flat label="OK" color="primary" v-close-popup></q-btn>
            </q-card-actions>
            </q-card>
        </q-dialog>

    <q-dialog v-model="showPreview">
      <q-card>
        <q-card-section class="row items-center">
          <div class="text-h6">Preview Graph Execution</div>
        </q-card-section>
        <q-card-section class="row">
          <div style="min-width: 250px; max-width: 300px">

            <q-select :options="availableDB" filled label="Source Database"
                      v-model="selectedDB" @input="dbChanged()">

              <template v-slot:prepend>
                <q-icon name="fas fa-database" @click.stop/>
              </template>

            </q-select>
            <q-select :options="availableCollections" filled label="Source Collection"
                      v-model="collectionForPreview">

              <template v-slot:prepend>
                <q-icon name="fas fa-tags" @click.stop/>
              </template>
            </q-select>

            <q-select v-if="saveToDB" :options="availableDB" filled label="Save to Database"
                      v-model="selectedTargetDB">

              <template v-slot:prepend>
                <q-icon name="fas fa-database" @click.stop/>
              </template>

            </q-select>
            <q-input v-if="!randomDocPreview" v-model="docUri" label="Optional doc URI"/>
          </div>

          <q-toggle
            label="Random doc"
            v-model="randomDocPreview"
          />

          <q-toggle
            label="Save to DB"
            v-model="saveToDB"
          />


          <div class="q-pa-md q-gutter-sm">

            <q-btn :loading="graphPreviewExecuting" v-bind:disabled="graphPreviewExecuting" @click="executeGraph()" color="primary" label="Execute Preview"
                   :disabled="( (saveToDB === false) && ((selectedDB === '' || selectedDB === null) || (collectionForPreview === '' || collectionForPreview === null)) ) ||
            ((saveToDB === true) && (selectedTargetDB === '' || selectedTargetDB === null) || (selectedDB === '' || selectedDB === null) || (collectionForPreview === '' || collectionForPreview === null))"/>
          </div>

        </q-card-section>
        <q-list dense bordered padding class="rounded-borders">
          <q-item clickable v-ripple v-for="(item, index) in validationInfos" v-bind:key="index">
            <q-item-section avatar>
              <q-icon :color="(item.type=='error')?'negative':'primary'" :name="item.type"/>
            </q-item-section>

            <q-item-section>{{item.msg}}</q-item-section>
          </q-item>

        </q-list>

      <q-card align="right">
      <q-btn @click="copyResultToClipboard(jsonFromPreview)" :ripple="{ color: 'green' }">
         <q-tooltip self="top middle" content-class="pipes-tooltip">Copy to clipboard</q-tooltip>
        <q-icon name="fas fa-paste"/>
      </q-btn>
      </q-card>


       <q-scroll-area style="height: 500px; max-width: 500px;">
            <div class="q-py-xs">
              <vue-json-pretty id="prettyJSON" :data="jsonFromPreview">
              </vue-json-pretty>
            </div>
          </q-scroll-area>
        </q-card-section>
      </q-card>
    </q-dialog>

     <q-dialog v-model="showUploadGraph">
      <CSVLoader/>
    </q-dialog>

   <q-dialog v-model="showConfigScreen" @hide="persistSettings()">
     <q-card>
        <q-toolbar>
          <q-avatar>
            <q-icon name="fas fa-cog"/>
          </q-avatar>
          <q-toolbar-title>Settings</q-toolbar-title>
        </q-toolbar>
       <q-card-section class="row">
          <div style="min-width: 250px; max-width: 300px">
            <q-checkbox label="Confirm browser refresh?" v-model="advancedSettings.confirmBrowserRefresh"/>
          </div>
      </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="isExported">
      <q-card>
        <q-card-section>
          <div class="text-h6">Information</div>
        </q-card-section>

        <q-card-section>
          The code of your Data Hub Custom step is now available in the browser downloads folder (main.sjs file).
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="OK" color="primary" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="BlockDeletion.confirmBlockDelete" persistent>
          <q-card>
            <q-card-section class="row items-center">
              <q-avatar icon="fas fa-trash-alt" color="primary" text-color="red"></q-avatar>
            <span class="q-ml-sm">Are you sure you want to delete <b>{{this.BlockDeletion.delBlockName}}</b>?</span>
            </q-card-section>
            <q-card-actions align="right">
              <q-btn flat label="Cancel" color="primary" v-close-popup></q-btn>
              <q-btn flat label="Delete" color="primary" @click="BlockDeletion.deleteBlockNow = true; checkGraphBlockDelete(BlockDeletion.delBlock)" v-close-popup></q-btn>
            </q-card-actions>
            </q-card>
        </q-dialog>

    <q-dialog
      v-model="showCodeGenConfig"
    >
      <q-card style="width: 400px">
        <q-card-section>
          <div class="text-h6">Export DHF module</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <code-generation-config :graph="graph" :models="this.blockModels" :is-exported="isExported"></code-generation-config>
        </q-card-section>

        <q-card-actions align="right" class="bg-white text-teal">

        </q-card-actions>
      </q-card>
    </q-dialog>

     <button v-shortkey.once="['ctrl','shift', 'x']" @shortkey="openSettingsDialog()"/>
  </div>

</template>
<script>

  import {LiteGraph} from 'litegraph.js';
  import {saveAs} from 'file-saver';
  import {Vuex} from "vuex";
  import { LocalStorage, copyToClipboard } from 'quasar';
  import VueJsonPretty from 'vue-json-pretty';
  import Notifications from '../components/notificationHandler.js';
  import DatabaseFilter from '../components/databaseFilter.js';
  import CollectionFilter from '../components/collectionFilter.js';
  import codeGenerationConfig from '../components/codeGenerationConfig.vue'
  import CSVLoader from '../components/csvLoader.vue';
  import EntityManager from '../components/entityManager.js';
  import LiteGraphHelper from '../components/liteGraphHelper.js'
  import Vue from 'vue';
  Vue.use(require('vue-shortkey'))
  import { ENTITY_BLOCK_TYPE, SOURCE_BLOCK_TYPE, BLOCK_PATH, BLOCK_LABEL, BLOCK_FIELDS, BLOCK_FIELD,BLOCK_COLLECTION,BLOCK_SOURCE,BLOCK_OPTIONS, 
  BLOCK_OPTION_FIELDS_INPUT, BLOCK_OPTION_FIELDS_OUTPUT, BLOCK_OPTION_NODE_INPUT, BLOCK_OPTION_NODE_OUTPUT } from '../components/constants.js'
  const ADVANCED_SETTINGS_KEY = "pipes.settings"

  export default {
    components: {
      VueJsonPretty,
      codeGenerationConfig,
      CSVLoader
    },
    name: 'PageIndex',
    mixins: [
      Notifications,
      DatabaseFilter,
      CollectionFilter,
      EntityManager,
      LocalStorage,
      LiteGraphHelper
    ],
    data() {
      return {
        currentCtsQuery: "",
        currentCases: "",
        selectedTargetDB: null,
        editQuery: false,
        editJson: false,
        editCases: false,
        saveToDB: false,
        confirmDeleteGraph: false,
        confirmResetGraph: false,
        warnBlockOnGraph: false,
        warnBlockName: "",
        deleteGraphName: "",
        deleteGraphURI: "",
        BlockDeletion: {
            showBlockOnGraphNoDelete: false,
            confirmBlockDelete: false,
            deleteBlockNow: false,
            delBlock: null,
            delBlockName: ""
        },
        dbEntities: [],
        graphMetadata: {
          title: "My Graph",
          version: "00.01",
          author: "",
          description: ""
        },
        columns: [
          {name: 'source', align: 'left', label: 'Source', field: 'source', sortable: true},
          {name: 'target', label: 'Target', field: 'target', sortable: true, align: 'left'},
        ],
        opened: true,
        isExported: false,
        graph: null,                // LiteGraphObject
        results: null,
        showPreview: false,
        showCodeGenConfig: false,
        showUploadGraph: false,
        collectionForPreview: "",
        jsonFromPreview: {},
        randomDocPreview: false,
        jsonSource: {test: "test"},
        savePopUpOpened: false,
        loadPopUpOpened: false,
        graphName: "",
        savedGraph: [],
        currentProperties: [],
        jsoneditor: null,
        availableCollections: [],
        selectedDB: null,
        availableDB: [],
        docUri: null,
        graphPreviewExecuting: false,
        advancedSettings: {
          confirmBrowserRefresh: true
        },
        showConfigScreen: false,
        validationConfigs: [
          {
            block: "dhf/output",
            mandatoryInputs: [
              {
                name: "output",
                msg: "The final output of the graph is not connected to Custom Step Output. You won't get any result.",
                type: "error"
              }],
            mandatoryOutputs: [],
            count: {
              "N": {
                msg: "You should have only one Custom Step Output block in the graph.",
                type: "error"
              },
              0: {
                msg: "You should have at least one Custom Step Output block in the graph.",
                type: "error"
              }
            }

          },
          {
            block: "dhf/envelope",
            mandatoryInputs: [
              {
                name: "instance",
                msg: "The input '${input.name}' of the ${config.block} block should be connected.",
                type: "error"
              },
              {
                name: "uri",
                msg: "If the input '${input.name}' of the ${config.block} block is not set, you might have conflicting URIs.",
                type: "info"
              }
            ],
            mandatoryOutputs: [],
            count: {
              0: {
                msg: "Usually there is at least one ${config.block} in the graph.",
                type: "info"
              }
            }
          }
        ],
        validationInfos: []

      }

    },
     computed: {
    blockModels: function () {
      return this.$store.getters.models
  }
     },
    methods: {

      createBlock(blockDef) {

        var blockInList = false;

       console.log("createBlock request to create block: " + JSON.stringify(blockDef))
       blockInList = this.isblockInModelList(this.graph,blockDef.source + "/" + blockDef.collection )

       if ( this.isblockOnGraph(this.graph,blockDef.source + "/" + blockDef.collection )) {
         console.log("Warning: Block is being used on the graph")
         this.warnBlockName = blockDef.label
         this.warnBlockOnGraph = true
       } else {
         if (blockInList) {
            console.log("Replacing the block")
            this.$store.commit('removeBlock',blockDef)
         } else {
           console.log("Adding new block")
         }
         this.doBlockAdd(blockDef)
       }

      },

      doBlockAdd(blockDef) {
       console.log("Adding block: " + JSON.stringify(blockDef))

       let newBlock = this.createGraphNodeFromModel(blockDef);
       this.$store.commit('addBlock', blockDef)

       console.log("Block model list now has " + this.blockModels.length + " blocks")

       console.log("newBlock : " + JSON.stringify(newBlock) )
       LiteGraph.registerNodeType(blockDef.source + "/" + blockDef.collection, newBlock);

        this.$q.notify({
          color: 'positive',
          position: 'top',
          message: "New block is now available in the library (right click)",
          icon: 'code'
        })
      },

      addMapping() {
        this.currentProperties.push({source: "val", target: "newVal"})
      },

      getDatabaseEntities() {
      var self = this;
      this.$axios.get('/v1/resources/vppBackendServices?rs:action=DHFEntities')
              .then((response) => {
                this.availableEntities = response.data
                console.log("Got entities: " + JSON.stringify(this.availableEntities))
              })
              .catch((error) => {
                self.notifyError("LoadingEntities", error, self);
              })
      },
      
      loadGraphFromJson(graph) {

       this.checkEntityBlocks(graph)
       this.graphStatistics(graph.executionGraph)
       this.$store.commit('clearBlocks')

      // Filter blocks to remove any duplicates from graph (take latest. legacy bug?)
       var blockMap = new Map();
        for (let model of graph.models) {
          blockMap.set(model.source + "/" + model.collection, model);
        }

        for (let blockKey of blockMap.keys()) {
             // console.log("block in map: " + blockKey)
              var model = blockMap.get(blockKey)
              let newBlock = this.createGraphNodeFromModel(model);
              this.$store.commit('addBlock', model)
              LiteGraph.registerNodeType(model.source + "/" + model.collection, newBlock);
          }

        this.findDuplicateBlocks(graph.models)

        try {
          this.graph.configure(graph.executionGraph)
        } catch (e) {
          console.log("Caught warning during litegraph.configure: " + e)
        }

        if (graph.metadata && graph.metadata.title != null) this.graphMetadata.title = graph.metadata.title; else this.graphMetadata.title = ""
        if (graph.metadata && graph.metadata.author != null) this.graphMetadata.author = graph.metadata.author; else this.graphMetadata.author = ""
        if (graph.metadata && graph.metadata.version != null) this.graphMetadata.version = graph.metadata.version; else this.graphMetadata.version = ""
        if (graph.metadata && graph.metadata.description != null) this.graphMetadata.description = graph.description; else this.graphMetadata.description = ""
        this.$root.$emit("initGraphMetadata", this.graphMetadata)

        this.notifyPositive(self,"Loaded graph " + this.graphMetadata.title)
        this.showUploadGraph = false
      }
      ,
      getSavedGraph(uri, graphName) {
        //if(uri!=null)
        var self = this; // keep reference for notifications called from catch block
        this.$axios.get('/v1/resources/vppBackendServices?rs:action=GetSavedGraph&rs:uri=' + encodeURI(uri))
          .then((response) => {
            let graph = response.data;
            this.loadGraphFromJson(graph)
            this.notifyPositive(self,"Loaded graph '" + graphName + "'")
            this.loadPopUpOpened = false
          })
          .catch((error) => {
            self.notifyError("GetSavedGraph", error, self);
          })
      },
      listSavedGraphs() {

        var self = this; // keep reference for notifications called from catch block
        this.$axios.get('/v1/resources/vppBackendServices?rs:action=ListSavedGraph')
          .then((response) => {
            this.savedGraph = response.data;

          })
          .catch((error) => {
            self.notifyError("ListSavedGraph", error, self);
          })
      },
      dbChanged() {
        this.collectionForPreview = ""
        this.availableCollections = []
        this.discoverCollections()
      },
      discoverCollections() {

        var self = this; // keep reference for notifications called from catch block
        let dbOption = ""
        if (this.selectedDB != null && this.selectedDB != "") {
          dbOption += "&rs:database=" + this.selectedDB.value

          this.$axios.get('/v1/resources/vppBackendServices?rs:action=collectionDetails' + dbOption)
            .then((response) => {
              this.availableCollections = self.filterCollections(response.data)
            })
            .catch((error) => {
              self.notifyError("collectionDetails", error, self);
            })
        }
      },
      csvJSON(csv) {

        var lines = csv.split("\n");

        var result = [];

        var headers = lines[0].split(";");


        headers = headers.map(function (h) {
          return h.trim();
        });

        for (var i = 1; i < lines.length; i++) {

          var obj = {};
          var currentline = lines[i].split(";");
          if (currentline.length == headers.length)
            for (var j = 0; j < headers.length; j++) {
              obj[headers[j]] = currentline[j].trim();
            }

          result.push(obj);
        }

        return result; //JavaScript object
        // return JSON.stringify(result); //JSON
      },
      openSettingsDialog() {
        this.showConfigScreen = true
      },
      persistSettings() {
        this.$q.localStorage.set(ADVANCED_SETTINGS_KEY, this.advancedSettings) 
      },
      createGraphFromMapping(csvData) {

        console.log("loading CSV")

        let mappings = this.csvJSON(csvData)

        let blocks = {}
        let inputs = {}
        let inputIdCount = 0
        let outputs = {}
        let outputIdCount = 0

        for (let map of mappings) {

          if (map.source != null && blocks[map.source] == null) {
            var block = {
              [BLOCK_LABEL]: map.source,
              [BLOCK_COLLECTION]: map.source,
              [BLOCK_SOURCE]: SOURCE_BLOCK_TYPE,
              [BLOCK_FIELDS]: [],
              [BLOCK_OPTIONS]: [BLOCK_OPTION_FIELDS_OUTPUT, BLOCK_OPTION_NODE_INPUT]
            }
            console.log("Adding block [1] : " + JSON.stringify(block))
            blocks[map.source] = block
          }

          if (map.target != null && blocks[map.target] == null) {
             var block =
             {
              [BLOCK_LABEL]: map.target,
              [BLOCK_COLLECTION]: map.target,
              [BLOCK_SOURCE]: ENTITY_BLOCK_TYPE,
              [BLOCK_FIELDS]: [],
              [BLOCK_OPTIONS]: [BLOCK_OPTION_FIELDS_INPUT, BLOCK_OPTION_NODE_OUTPUT]
            }
            console.log("Adding block [2] : " + JSON.stringify(block))
            blocks[map.target] = block
          }

          if (map.sourceField != null && map.sourceField != "") {
              var block =  
              {
                [BLOCK_LABEL]: map.sourceField,
                [BLOCK_FIELD]: map.sourceField,
                [BLOCK_PATH]: "//text('" + map.sourceField + "')"
              }
              console.log("Adding block [3] : " + JSON.stringify(block))
              blocks[map.source].fields.push(block)
          }

          if (map.targetField != null && map.targetField != "") {
            var block =             
            {
              [BLOCK_LABEL]: map.targetField,
              [BLOCK_FIELD]: map.targetField,
              [BLOCK_PATH]: "//text('" + map.targetField + "')"
            }
            console.log("Adding block [4] : " + JSON.stringify(block))
            blocks[map.target].fields.push(block)
        }
        }

        let ii = 0
        let oi = 0
        let blockCache = {}
        Object.keys(blocks).map(item => {

          this.createBlock(blocks[item])
          let tmpBlock = LiteGraph.createNode(blocks[item].source + "/" + blocks[item].collection);
          tmpBlock.pos = [400 + (ii++) * 200, 200 + (ii++) * 200];
          this.graph.add(tmpBlock);
          blockCache[item] = tmpBlock;
        })

        for (let map of mappings) {


          if (map.source != null && map.target != null && map.sourceField != null && map.targetField != null && map.source != "" && map.target != "" && map.sourceField != "" && map.targetField != "") {
            // console.log(map.sourceField)
            // console.log(blocks[map.target].block.ioSetup)
            blockCache[map.source].connect(
              blockCache[map.source].ioSetup.outputs["//text('" + map.sourceField + "')"],
              blockCache[map.target].id,
              blockCache[map.target].ioSetup.inputs["//text('" + map.targetField + "')"])

          }

        }
      }
      ,
      createGraphNodeFromModel(blockDef) {

        let block = function () {
          this.blockDef = Object.assign({}, blockDef, {})
          this.doc = {
            input: null,
            output: null
          }

          this.ioSetup = {
            inputs: {
              _count: 0
            },
            outputs: {
              _count: 0
            }
          }

          if (this.blockDef.options.indexOf("getByUri") > -1) {
            this.ioSetup.inputs["Uri"] = this.ioSetup.inputs._count++;
            this.addInput("Uri");
          }

          if (this.blockDef.options.indexOf("nodeInput") > -1) {
            this.ioSetup.inputs["Node"] = this.ioSetup.inputs._count++;
            this.addInput("Node") //, "Node");
          }

          if (this.blockDef.options.indexOf("nodeOutput") > -1) {
            this.ioSetup.outputs["Node"] = this.ioSetup.outputs._count++;
            this.ioSetup.outputs["Prov"] = this.ioSetup.outputs._count++;
            this.addOutput("Node", "Node");
            this.addOutput("Prov", null);
          }

          if (this.blockDef.options.indexOf("fieldsOutputs") > -1) {
            for (let field of blockDef.fields) {
              //this.ioSetup.outputs[field] = this.ioSetup.outputs._count++;
              this.ioSetup.outputs[field.path] = this.ioSetup.outputs._count++;
              this.addOutput(field.field)
            }
          }

          if (blockDef.options.indexOf("fieldsInputs") > -1) {
            for (let field of blockDef.fields) {
              this.ioSetup.inputs[field.path] = this.ioSetup.inputs._count++;
              //this.ioSetup.inputs[field] = this.ioSetup.inputs._count++;
              this.addInput(field.field);
            }
          }
          this["WithInstanceRoot"] = this.addWidget("toggle", "WithInstanceRoot", true, function (v) {
          }, {on: "enabled", off: "disabled"});
          this.serialize_widgets = true;
          this.computeSize();
          this.size = [this.size[0] + 50, this.size[1] + 30]

        }

        block.title = blockDef.collection;
        block.nodeType = blockDef.collection;
        return block

      },
          deleteGraph(graphName, graphURI) {
          console.log("Deleting graph " + graphName + " (" + graphURI +")")
           var self = this

         this.$axios.delete('/v1/resources/vppBackendServices?rs:action=deleteGraph&rs:URI=' +graphURI)
          .then((response) => {
              this.$q.notify({
              color: 'positive',
              position: 'top',
              message: "Graph <b>'" + graphName + "'</b> deleted",
              icon: 'code'
              })
              this.listSavedGraphs()
          }
          ) .catch((error) => {
              self.notifyError("Deleting Graph", error, self);
            })
     },
      downloadGraph() {

        let jsonGraph = this.graph.serialize()
        let graphDef = {
          models: this.blockModels,
          executionGraph: jsonGraph,
          name: this.graphName,
          metadata: this.graphMetadata
        }

        var blob = new Blob([JSON.stringify(graphDef)], {
          type: "text/plain;charset=utf-8",
          endings: "transparent"
        });
        let name = ""
        if (this.graphMetadata && this.graphMetadata.title != null && this.graphMetadata.title != "") name += this.graphMetadata.title; else name += "currentGraph"
        if (this.graphMetadata && this.graphMetadata.version != null && this.graphMetadata.version != "") name += "-" + this.graphMetadata.version
        saveAs(blob, name + ".json");

      },
      exportDHFModule() {
        this.showCodeGenConfig = true
      },
      saveCurrentGraph() {

        var self = this; // keep reference for notifications called from catch block
        let jsonGraph = this.graph.serialize()
        var graphName = this.graphMetadata.title.replace(/[&#]/g, "_"); // & # causes error at download time
        const blocks = this.blockModels
        let graphDef = {
          models: blocks,
          executionGraph: jsonGraph,
          name: graphName,
          metadata: this.graphMetadata
        }

        this.$axios.post('/v1/resources/vppBackendServices?rs:action=SaveGraph', graphDef)
          .then((response) => {
            this.savePopUpOpened = false; // close dialog 
            this.$q.notify({
              color: 'positive',
              position: 'top',
              message: "Saved graph " + graphName,
              icon: 'code'
            })
          })
          .catch((error) => {
            self.notifyError("SaveGraph", error, self);
          })


      },
      resetDhfDefaultGraph() {

        this.$axios.get('/statics/graph/dhfDefaultGraph.json')
          .then((response) => {
            let defaultGraph = response.data
            defaultGraph.models = this.blockModels
            this.loadGraphFromJson(defaultGraph)
          })
      }
      ,
      findBlock(graph, nodeType) {

        let node = graph.nodes.filter(node => node.type == nodeType)
        if (node.length > 0)
          return node
        else null
      },

      findIO(node, type, IOName) {

        let IO = node[type].filter(input => input.name == IOName)
        if (IO.length > 0)
          return IO[0]
        else null
      },
      addInfos(validationInfos, type, msg) {

        validationInfos.push({
          type: type,
          msg: msg
        })
      },
      checkConfiguration(graph, configs) {
        let result = []
        for (let config of configs) {

          let blocks = this.findBlock(graph, config.block)
          let ok = true
          if (blocks) {

            if (blocks.length > 1) {
              if (config.count["N"])
                this.addInfos(result, config.count["N"].type, eval("`" + config.count["N"].msg + "`"))
            }

            for (let block of blocks) {
              for (let input of config.mandatoryInputs) {
                let inputIO = this.findIO(block, "inputs", input.name)
                if (!inputIO || inputIO.link == null) this.addInfos(result, input.type, eval("`" + input.msg + "`"))
                ok = ok && inputIO
              }

              for (let output of config.mandatoryOutputs) {
                let outputIO = this.findIO(block, "outputs", output)
                if (!outputIO || outputIO.link == null) this.addInfos(result, output.type, eval("`" + output.msg + "`"))
                ok = ok && outputIO
              }
            }
          } else {

            if (config.count[0])
              this.addInfos(result, config.count[0].type, eval("`" + config.count[0].msg + "`"))
          }
        }
        return result
      },
      executeGraph() {

        console.log("Executing graph..")

        this.validationInfos = []
        this.jsonFromPreview = {};
        const graphDetail = this.graph.serialize()

        this.validationInfos = this.checkConfiguration(graphDetail, this.validationConfigs)

        if (this.validationInfos.filter(item => item.type == "error").length == 0) {


          var self = this; // keep reference for notifications called from catch block
          let dbOption = ""
          if (this.selectedDB != null && this.selectedDB != "") {
            dbOption += "&rs:database=" + this.selectedDB.value
          }

          if (this.saveToDB) {

            if (dbOption != "")
              dbOption += "&rs:toDatabase=" + this.selectedTargetDB.value + "&rs:save=true"
            else
              dbOption += "?rs:toDatabase=" + this.selectedTargetDB.value + "&rs:save=true"
          }

          let jsonGraph = this.graph.serialize()
          let request = {
            jsonGraph: {
              models: this.blockModels,
              executionGraph: jsonGraph

            },
            collection: this.collectionForPreview.value,
            collectionRandom: this.randomDocPreview,
            previewUri: this.docUri
          }

          this.$axios.post('/v1/resources/vppBackendServices?rs:action=ExecuteGraph' + dbOption, request)
            .then((response) => {
              this.jsonFromPreview = response.data
            })
            .catch((error) => {
              self.notifyError("ExecuteGraph", error, self);
            })
        }
      },
      saveGraph(event) {
        this.savePopUpOpened = true;
      },
      loadGraph(event) {

        this.listSavedGraphs()
        this.loadPopUpOpened = true;

      }, 
      
    // Remove block from modelList, checking the graph first  
    checkGraphBlockDelete(block) {

      if ( block == null ) return;

       const blockKey = block.source + "/" + block.label

      console.log("checkGraphBlockDelete " + blockKey )

      this.BlockDeletion.delBlockName = block.label;
      this.BlockDeletion.delBlock = block;

      if ( this.BlockDeletion.deleteBlockNow ) {

        this.BlockDeletion.deleteBlockNow = false;
        this.BlockDeletion.delBlock = null;
        this.BlockDeletion.delBlockName = '';
        console.log("Deleting block from list: " + blockKey)
        this.$store.commit('removeBlock',blockKey)

      } else {
 
      if ( this.isblockOnGraph(this.graph,blockKey) ) {
        this.BlockDeletion.showBlockOnGraphNoDelete = true
      } else {
        this.BlockDeletion.confirmBlockDelete = true
      }
      }
    },
    browserRefreshConfirm(event) {
      // browser alert when screen refreshed
      if ( this.advancedSettings.confirmBrowserRefresh == true ) {
        event.preventDefault()
        event.returnValue = ""
      }
    },
      selectNode(block) {
        console.log(block)
        let message = null
        if (block.properties.testCases)
          message = 'Double click block to edit the test cases'

        if (block.properties.mapping)
          message = 'Double click block to edit the mapping rules'

        if (block.properties.ctsQuery)
          message = 'Double click block to edit the lookup query'

        if (message != null)
          this.$q.notify({
            color: 'secondary',
            position: 'center',
            message: message,
            icon: 'info',
            timeout: 800
          })
      },
      discoverDatabases() {
        var self = this;
        this.$axios.get('/v1/resources/vppBackendServices?rs:action=databasesDetails')
          .then((response) => {
            this.availableDB = this.filterDatabases(response.data)

            this.$axios.get('/statics/library/core.json')
              .then((response) => {
                //console.log(response.data)
                this.registerBlocksByConf(response.data, LiteGraph)

              })

            this.$axios.get('/statics/library/custom/user.json')
              .then((response) => {

                this.registerBlocksByConf(response.data, LiteGraph)

              })
            console.log("emit init")
            this.$root.$emit("initGraphMetadata", this.graphMetadata)

            this.discoverCollections()


          })
          .catch((error) => {
            self.notifyError("databasesDetails", error, self);
          })
      },
      listGraphBlocks() {
          this.listTheGraphBlocks(this.graph, this.blockModels)
      },
      discoverCollections() {
        var self = this;
        let dbOption = ""
        if (this.selectedDB != null && this.selectedDB != "") {
          dbOption += "&rs:database=" + this.selectedDB.value
        }

        this.$axios.get('/v1/resources/vppBackendServices?rs:action=collectionDetails' + dbOption)
          .then((response) => {
            this.availableCollections = self.filterCollections(response.data)
          })
          .catch((error) => {
            self.notifyError("collectionDetails", error, self);
          })
      },
      DblClickNode(block) {

        if (block.node_over && block.node_over.properties && block.node_over.properties.mapping) {

          if (block.node_over.properties != null) this.currentProperties = block.node_over.properties.mapping
          this.editJson = true


          //console.log(this.$refs)

        }

        if (block.node_over && block.node_over.properties && block.node_over.properties.ctsQuery) {

          if (block.node_over.properties != null) this.currentCtsQuery = block.node_over.properties
          this.editQuery = true
        }

        if (block.node_over && block.node_over.properties && block.node_over.properties.testCases) {

          if (block.node_over.properties != null) this.currentCases = block.node_over.properties.testCases
          this.editCases = true
        }


      },
      copyResultToClipboard(result) {
        var document;
        document = ((typeof result == "object") ? JSON.stringify(result) : result)
      copyToClipboard(document)
  .then(() => {
   console.log("Copied to clip board!")
  })
  .catch(() => {
    console.log("Faild to copy to clip board!")
  })
      },
      setCurrrentDatabase(db) {

        this.selectedDB = db.selectedDatabase;
        this.availableDB = db.availableDatabases;
        this.discoverCollections()

      },
      registerBlocksByConf(configs, LiteGraph) {


        let code = ""
        for (let config of configs) {

          code += "function " + config.functionName + "(){"
          code += config.inputs.map((input) => {
            return "this.addInput('" + input.name + ((input.type == "ee") ? "','" + input.type + "');" : "');")
          }).join("")
          code += config.outputs.map((output) => {
            return "this.addOutput('" + output.name + ((output.type == "ee") ? "','" + output.type + "');" : "');")
          }).join("")
          code += (config.properties != null) ? config.properties.map((property) => {
            return "this.addProperty('" + property.name + ((property.type) ? "'," + JSON.stringify(property.type) + ");" : "');")
          }).join("") : ""
          code += (config.widgets != null) ? config.widgets.map((widget) => {
            return "this.addWidget('" + widget.type + "','" + widget.name + "','" + widget.default + "', function(v){" + (widget.callback ? widget.callback : "") + "}.bind(this), { values:" + JSON.stringify(widget.values) + "} );"
          }).join("") : "";
          if (config.width)
            code += "    this.size = [" + config.width + "," + config.height + "];\n"
          code += "    this.serialize_widgets = true;"

          //code += (config.properties)?"config.properties = " +  config.properties +";":"";
          code += "};"

          code += config.functionName + ".title = '" + config.blockName + "';";
          code += config.functionName + ".prototype.notify = function(node){this.$root.$emit(\"nodeSelected\",node)}.bind(this);";
          code += config.functionName + ".prototype.onSelected = function(){this.notify(this) };"
          code += config.functionName + ".prototype.onDblClick = function(e,pos,object){this.$root.$emit(\"nodeDblClicked\",object) }.bind(this);"
          code += config.functionName + ".prototype.onExecute = function(){  ";

          if (config.function != null && config.function.ref != null) {
            let i = 0;
            code += "this.setOutputData( 0, " + config.function.ref + "(" + config.inputs.map((input) => {
              return "this.getInputData(" + i++ + ")"
            }).join(",") + "));"
          } else {
            code += config.function.code;

          }
          code += "};"
//register in the syst em
          code += "LiteGraph.registerNodeType('" + config.library + "/" + config.blockName + "', " + config.functionName + " );"
        }

        //xdmp.log(code)
        eval(code)


      }
    },
    created() {

    },

    mounted: function () {
      console.log("mounted")

      this.$root.$on("csvLoadingRequested", this.createGraphFromMapping)
    //  this.$root.$on("registerModel", this.registerModel);
      this.$root.$on('executeGraphCall', function () {
        this.showPreview = true
      }.bind(this))
      this.$root.$on("databaseChanged", this.setCurrrentDatabase);
      this.$root.$on("saveGraphCall", this.saveGraph);
      this.$root.$on("downloadGraphCall", this.downloadGraph);
      this.$root.$on("uploadGraphCall", function () {
        this.showUploadGraph = true
      }.bind(this))
      this.$root.$on("loadGraphCall", this.loadGraph);
      this.$root.$on("loadGraphJsonCall", this.loadGraphFromJson);
      this.$root.$on("exportGraphCall", this.exportDHFModule);
      this.$root.$on("nodeDblClicked", this.DblClickNode);
      this.$root.$on("nodeSelected", this.selectNode);
      this.$root.$on("loadDHFDefaultGraphCall", this.resetDhfDefaultGraph);
      this.$root.$on("listGraphBlocks", this.listGraphBlocks);
      this.$root.$on("checkGraphBlockDelete", this.checkGraphBlockDelete);
      this.$root.$on('blockRequested', this.createBlock);

      this.discoverDatabases()

      this.graph = new LiteGraph.LGraph();
      this.graph_canvas = new LiteGraph.LGraphCanvas(this.$refs["mycanvas"], this.graph);

      this.$store.commit('clearBlocks')

      if (this.$q.localStorage.getItem(ADVANCED_SETTINGS_KEY) == null) {
          this.persistSettings()
      } else {
          console.log("Restoring settings:")
          var storedSettings = this.$q.localStorage.getItem(ADVANCED_SETTINGS_KEY)
          this.advancedSettings.confirmBrowserRefresh = storedSettings.confirmBrowserRefresh != null ? storedSettings.confirmBrowserRefresh : true
      }
        
  },
beforeMount() {
    window.addEventListener("beforeunload", this.browserRefreshConfirm)
    this.$once("hook:beforeDestroy", () => {
      window.removeEventListener("beforeunload", this.browserRefreshConfirm);
    }
    )
},
beforeDestroy() {
  this.$root.$off('blockRequested', this.createBlock); // de-register otherwise double events occur
}

  }
</script>

<style>
</style>
