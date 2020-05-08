<!-- Copyright ©2020 MarkLogic Corporation. -->
<template>
  <div class="flex flex-center">
    <canvas
      class="fixed"
      height='1000'
      ref="mycanvas"
      style='border: 1px solid'
      width='1800'
    ></canvas>

    <BlockPropertyEditDialog />
    <BlockMappingEditDialog />
    <GraphExecutePreview />
    <BlockDescription/>

    <q-dialog
      :content-css="{minWidth: '60vw', minHeight: '80vh'}" v-model="savePopUpOpened"
    >
      <q-card>
        <q-card-section class="row items-center">
          <div class="text-h6">Save current graph</div>
        </q-card-section>

        <q-card-section class="row">
          <div style="min-width: 250px; max-width: 300px">
            <q-input
              label="Graph name"
              v-model="graphTitle"
            />
          </div>
        </q-card-section>

        <div class="q-pa-sm">
          <q-btn
            @click="saveCurrentGraph()"
            color="primary"
            label="Save"
            :disabled="(graphTitle === null || graphTitle.trim() == '')"
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

          <q-list
            class="q-mt-md"
            link
          >
            <q-item-label :header="true">Click a graph from list to reload</q-item-label>
            <q-item
              @click.native.prevent="getSavedGraph(graph.uri,graph.name)"
              tag="label"
              v-bind:key="graph.name"
              v-for="(graph, index) in savedGraph"
            >
              <q-item-section avatar>
                <q-icon
                  style="font-size: 1.5em"
                  name="fas fa-project-diagram"
                />
              </q-item-section>

              <q-item-section>
                {{ graph.name }}
              </q-item-section>

              <q-item-section side>
                <q-btn
                  flat
                  outline
                  @click.native.stop="deleteGraphURI = graph.uri; deleteGraphName = graph.name + (graph.version != null && graph.version != '' ? '-' + graph.version : ''); confirmDeleteGraph = true"
                  size="sm"
                  icon="fas fa-trash-alt"
                >
                  <q-tooltip
                    self="top middle"
                    content-class="pipes-tooltip"
                  >Delete '{{graph.name}}-{{graph.version}}'</q-tooltip>
                </q-btn>
              </q-item-section>

            </q-item>
          </q-list>

          <div class="q-pa-md doc-container">
            <div class="row justify-center">
              <!--<div class="q-pa-sm">-->
              <q-btn
                class="center"
                @click="loadPopUpOpened = false"
                color="primary"
                label="Close"
              />
            </div>
          </div>
        </q-card>
      </div>
    </q-dialog>

    <q-dialog
      v-model="confirmDeleteGraph"
      persistent
    >
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar
            icon="fas fa-trash-alt"
            color="primary"
            text-color="red"
          ></q-avatar>
          <span class="q-ml-sm">Are you sure you want to delete <b>{{deleteGraphName}}</b>?</span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            label="Cancel"
            color="primary"
            v-close-popup
          ></q-btn>
          <q-btn
            flat
            label="Delete"
            color="primary"
            @click="deleteGraph(deleteGraphName,deleteGraphURI)"
            v-close-popup
          ></q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog
      v-model="confirmResetGraph"
      persistent
    >
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar
            icon="fas fa-trash-alt"
            color="primary"
            text-color="red"
          ></q-avatar>
          <span class="q-ml-sm">Are you sure you want to reset the graph?</span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            label="Cancel"
            color="primary"
            v-close-popup
          ></q-btn>
          <q-btn
            flat
            label="Reset"
            color="primary"
            @click=""
            v-close-popup
          ></q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog
      v-model="BlockDeletion.showBlockOnGraphNoDelete"
      persistent
    >
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar
            icon="fas fa-trash-alt"
            color="primary"
            text-color="red"
          ></q-avatar>
          <span class="q-ml-sm">You must remove all <b>{{ this.BlockDeletion.delBlockName }}</b> blocks from the graph before deleting</span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            label="OK"
            color="primary"
            v-close-popup
          ></q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog
      v-model="warnBlockOnGraph"
      persistent
    >
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar
            icon="fas fa-exclamation"
            color="primary"
            text-color="red"
          >
          </q-avatar>
          <span><b>{{ warnBlockName }}</b> is being used on the graph. All current instances must be removed before you can save a new definition</span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            label="OK"
            color="primary"
            v-close-popup
          ></q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showUploadGraph">
      <CSVLoader />
    </q-dialog>

    <q-dialog
      v-model="showConfigScreen"
      @hide="persistSettings()"
    >
      <q-card>
        <q-toolbar>
          <q-avatar>
            <q-icon name="fas fa-cog" />
          </q-avatar>
          <q-toolbar-title>Settings</q-toolbar-title>
        </q-toolbar>
        <q-card-section class="row">
          <div style="min-width: 250px; max-width: 300px">
            <q-checkbox
              label="Confirm browser refresh?"
              v-model="advancedSettings.confirmBrowserRefresh"
            />
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
          <q-btn
            flat
            label="OK"
            color="primary"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog
      v-model="BlockDeletion.confirmBlockDelete"
      persistent
    >
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar
            icon="fas fa-trash-alt"
            color="primary"
            text-color="red"
          ></q-avatar>
          <span class="q-ml-sm">Are you sure you want to delete source block <b>{{this.BlockDeletion.delBlockName}}</b>?</span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            label="Cancel"
            color="primary"
            v-close-popup
          ></q-btn>
          <q-btn
            flat
            label="Delete"
            color="primary"
            @click="BlockDeletion.deleteBlockNow = true; checkGraphBlockDelete(BlockDeletion.delBlock)"
            v-close-popup
          ></q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showCodeGenConfig">
      <q-card style="width: 400px">
        <q-card-section>
          <div class="text-h6">Export DHF module</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <code-generation-config
            :graph="graph"
            :models="this.blockModels"
            :is-exported="isExported"
          ></code-generation-config>
        </q-card-section>

        <q-card-actions
          align="right"
          class="bg-white text-teal"
        >

        </q-card-actions>
      </q-card>
    </q-dialog>

    <button
      v-shortkey.once="['ctrl','shift', 'x']"
      @shortkey="openSettingsDialog()"
    />
  </div>

</template>
<script>

import { LiteGraph } from 'litegraph.js';
import { saveAs } from 'file-saver';
import { Vuex } from "vuex";
import Notifications from '../components/notificationHandler.js';
import DatabaseFilter from '../components/databaseFilter.js';
import CollectionFilter from '../components/collectionFilter.js';
import codeGenerationConfig from '../components/codeGenerationConfig.vue'
import CSVLoader from '../components/csvLoader.vue';
import EntityManager from '../components/entityManager.js';
import LiteGraphHelper from '../components/liteGraphHelper.js';
import BlockPropertyEditDialog from '../components/propertyEditDialog.vue';
import BlockMappingEditDialog from '../components/mappingEditDialog.vue';
import GraphExecutePreview from '../components/graphExecutePreview.vue';
import BlockDescription from '../components/blockDescription.vue';
import { LocalStorage } from 'quasar';
import Vue from 'vue';
Vue.use(require('vue-shortkey'))
import {  ENTITY_BLOCK_TYPE, SOURCE_BLOCK_TYPE, BLOCK_PATH, BLOCK_LABEL, BLOCK_FIELDS, BLOCK_FIELD, BLOCK_COLLECTION, BLOCK_SOURCE, BLOCK_OPTIONS,
  BLOCK_OPTION_FIELDS_INPUT, BLOCK_OPTION_FIELDS_OUTPUT, BLOCK_OPTION_NODE_INPUT, BLOCK_OPTION_NODE_OUTPUT} from '../components/constants.js'
const ADVANCED_SETTINGS_KEY = "pipes.settings"
const qs = require('querystring')

export default {
  components: {
    codeGenerationConfig,
    CSVLoader,
    BlockPropertyEditDialog,
    BlockMappingEditDialog,
    GraphExecutePreview,
    BlockDescription
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
  data () {
    return {
      loggedIn: false,
      dhfSteps: [],
      dhfStepSelectOptions: [],
      selectedStep: null,
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
      isExported: false,
      graph: null,                // LiteGraphObject
      showCodeGenConfig: false,
      showUploadGraph: false,
      savePopUpOpened: false,
      loadPopUpOpened: false,
      graphName: "",
      savedGraph: [],
      advancedSettings: {
        confirmBrowserRefresh: true
      },
      showConfigScreen: false
    }
  },
  computed: {
    blockModels: function () {
      return this.$store.getters.models
    },
    availableDB: function () {
      return this.$store.getters.availableDatabases
    },
    graphTitle: {
      get: function() {
       return this.$store.getters.graphTitle
      },
      set: function(t) {
      this.$store.commit('graphTitle', t)
      }
    },
    graphVersion: {
      get: function() {
       return this.$store.getters.graphVersion
      },
      set: function(v) {
      this.$store.commit('graphVersion', v)
      }
      },
    graphDescription: {
      get: function() {
       return this.$store.getters.graphDescription
      },
      set: function(d) {
      this.$store.commit('graphDescription', d)
      }
      },
     graphAuthor: {
      get: function() {
       return this.$store.getters.graphAuthor
      },
      set: function(a) {
      this.$store.commit('graphAuthor', a)
      }
     }
  },
  methods: {
    // Open the Preview Graph Dialog. Pass graph details
    openGraphPreviewDialog () {
      this.$root.$emit("openExecutionPreview", this.graph, this.blockModels, this.dhfSteps, this.dhfStepSelectOptions)
    },
    createBlock (blockDef) {
      var blockInList = false;
      const BLOCK_KEY = blockDef.source + "/" + blockDef.collection
      blockInList = this.isblockInModelList(this.blockModels, BLOCK_KEY)

      if (this.isblockOnGraph(this.graph, BLOCK_KEY)) {
        console.log("Warning: Block " + BLOCK_KEY + " is being used on the graph")
        this.warnBlockName = blockDef.label
        this.warnBlockOnGraph = true
      } else {
        if (blockInList) {
          console.log("Block " + BLOCK_KEY + " was already in list. Replacing.")
          this.$store.commit('removeBlock', BLOCK_KEY)
        }
        this.doBlockAdd(blockDef)
      }

    },
    doBlockAdd (blockDef) {

      console.log("Adding block: " + JSON.stringify(blockDef))
      this.$store.commit('addBlock', blockDef)

      const BLOCK_KEY = blockDef.source + "/" + blockDef.collection
      const liteGraphNode = this.createGraphNodeFromModel(blockDef);

      console.log("Registering block into LiteGraph as " + BLOCK_KEY + ": " + JSON.stringify(liteGraphNode))
      LiteGraph.registerNodeType(BLOCK_KEY, liteGraphNode);

      this.$root.$emit("resetBlockFormFields")

      this.notifyPositive(this, blockDef.label + " is now available in the library (right click)")
    },

    getDatabaseEntities () {
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

    clearGraphBlocks() {
      // Clears blocks from source block wizard panel and LiteGraph right-click library menu
      for (var m = 0; m < this.blockModels.length; m++ ) {
        var model = this.blockModels[m]
        LiteGraph.deregisterNode( model.source + "/" + model.collection )
      }
      this.$store.commit('clearBlocks')
    },

    // Reload a graph
    loadGraphFromJson (graph, notifyLoaded) {

      this.updateGraph(graph)

      this.checkEntityBlocks(graph)

      this.clearGraphBlocks()

      // Filter blocks to remove any duplicates from graph (take latest. legacy bug?)
      var blockMap = new Map();
      for (let model of graph.models) {
        blockMap.set(model.source + "/" + model.collection, model);
      }

      for (let blockKey of blockMap.keys()) {
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

      this.graphTitle = (graph.metadata && graph.metadata.title !== null) ? graph.metadata.title : ""
      this.graphAuthor = (graph.metadata && graph.metadata.author !== null) ? graph.metadata.author : ""
      this.graphVersion = (graph.metadata && graph.metadata.version !== null) ? graph.metadata.version : ""
      this.graphDescription = (graph.metadata && graph.metadata.description !== null) ?graph.metadata.description : ""

      if (notifyLoaded) this.notifyPositive(self, "Loaded graph " + this.graphTitle)
      this.$root.$emit("resetGraphTitle") // reset the titlebar to top graph (remove all subgraph history)
      this.showUploadGraph = false

      this.resetView() // reset view to 100%
    },
    getSavedGraph (uri, graphName) {
      //if(uri!=null)
      console.log("Reloading saved graph " + graphName)
      var self = this; // keep reference for notifications called from catch block
      this.$axios.get('/v1/resources/vppBackendServices?rs:action=GetSavedGraph&rs:uri=' + encodeURI(uri))
        .then((response) => {
          let graph = response.data;
          this.loadGraphFromJson(graph, true)
          //self.notifyPositive(this, "Loaded graph '" + graphName + "'")
          this.$q.notify({
            color: 'positive',
            position: 'top',
            message: "Loaded graph '" + graphName + "'",
            icon: 'code'
          })
          this.loadPopUpOpened = false
        })
        .catch((error) => {
          self.notifyError("GetSavedGraph", error, self);
        })
    },
    listSavedGraphs () {

      var self = this; // keep reference for notifications called from catch block
      this.$axios.get('/v1/resources/vppBackendServices?rs:action=ListSavedGraph')
        .then((response) => {
          this.savedGraph = response.data;
          console.log("this.savedGraph = " + JSON.stringify(this.savedGraph))

        })
        .catch((error) => {
          self.notifyError("ListSavedGraph", error, self);
        })
    },
    csvJSON (csv) {

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
    openSettingsDialog () {
      this.showConfigScreen = true
    },
    persistSettings () {
      this.$q.localStorage.set(ADVANCED_SETTINGS_KEY, this.advancedSettings)
    },
    createGraphFromMapping (csvData) {

      console.log("loading CSV")

      let mappings = this.csvJSON(csvData)

      let blocks = {}
      let inputs = {}
      let inputIdCount = 0
      let outputs = {}
      let outputIdCount = 0

      for (let map of mappings) {

        if (map.source !== null && blocks[map.source] == null) {
          var block = {
            [BLOCK_LABEL]: map.source,
            [BLOCK_COLLECTION]: map.source,
            [BLOCK_SOURCE]: SOURCE_BLOCK_TYPE,
            [BLOCK_FIELDS]: [],
            [BLOCK_OPTIONS]: [BLOCK_OPTION_FIELDS_OUTPUT, BLOCK_OPTION_NODE_INPUT]
          }
          //console.log("Adding block [1] : " + JSON.stringify(block))
          blocks[map.source] = block
        }

        if (map.target !== null && blocks[map.target] == null) {
          var block =
          {
            [BLOCK_LABEL]: map.target,
            [BLOCK_COLLECTION]: map.target,
            [BLOCK_SOURCE]: ENTITY_BLOCK_TYPE,
            [BLOCK_FIELDS]: [],
            [BLOCK_OPTIONS]: [BLOCK_OPTION_FIELDS_INPUT, BLOCK_OPTION_NODE_OUTPUT]
          }
          //console.log("Adding block [2] : " + JSON.stringify(block))
          blocks[map.target] = block
        }

        if (map.sourceField != null && map.sourceField != "") {
          var block =
          {
            [BLOCK_LABEL]: map.sourceField,
            [BLOCK_FIELD]: map.sourceField,
            [BLOCK_PATH]: "//text('" + map.sourceField + "')"
          }
          //console.log("Adding block [3] : " + JSON.stringify(block))
          blocks[map.source].fields.push(block)
        }

        if (map.targetField != null && map.targetField != "") {
          var block =
          {
            [BLOCK_LABEL]: map.targetField,
            [BLOCK_FIELD]: map.targetField,
            [BLOCK_PATH]: "//text('" + map.targetField + "')"
          }
          //console.log("Adding block [4] : " + JSON.stringify(block))
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
    },
    deleteGraph (graphName, graphURI) {
      console.log("Deleting graph " + graphName + " (" + graphURI + ")")
      var self = this

      this.$axios.delete('/v1/resources/vppBackendServices?rs:action=deleteGraph&rs:URI=' + graphURI)
        .then((response) => {
          this.$q.notify({
            color: 'positive',
            position: 'top',
            message: "Graph <b>'" + graphName + "'</b> deleted",
            icon: 'code'
          })
          this.listSavedGraphs()
        }
        ).catch((error) => {
          self.notifyError("Deleting Graph", error, self);
        })
    },
    createGraphDef () {
      const jsonGraph = this.graph.serialize()
      var meta = {
          "version": this.graphVersion,
          "author": this.graphAuthor,
          "title": this.graphTitle,
          "description" : this.graphDescription,
          "dateExported": (new Date()).toLocaleString()
      }
      return {
        pipesFileVersion: 2,
        models: this.blockModels,
        executionGraph: jsonGraph,
        name: this.graphTitle,
        metadata: meta
      }

    },
    downloadGraph () {
      const graphDef = this.createGraphDef();
      var blob = new Blob([JSON.stringify(graphDef,null,2)], {
        type: "text/plain;charset=utf-8",
        endings: "transparent"
      });
      let name = ""
      if (this.graphTitle !== null && this.graphTitle != "") name += this.graphTitle; else name += "currentGraph"
      if (this.graphVersion !== null && this.graphVersion != "") name += "-" + this.graphVersion
      saveAs(blob, name + ".json");
    },
    exportDHFModule () {
      this.showCodeGenConfig = true
    },
    saveCurrentGraph () {

      var self = this; // keep reference for notifications called from catch block
      var graphName = this.graphTitle.replace(/[&#]/g, "_"); // & # causes error at download time
      const blocks = this.blockModels
      const graphDef = this.createGraphDef();

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
    resetDhfDefaultGraph () {
      this.$store.commit('clearBlocks')
      this.$axios.get('/statics/graph/dhfDefaultGraph.json')
        .then((response) => {
          let defaultGraph = response.data
          defaultGraph.models = this.blockModels
          this.loadGraphFromJson(defaultGraph, false)
        })
    },
    saveGraph (event) {
      this.savePopUpOpened = true;
    }, loadGraph (event) {
      this.listSavedGraphs()
      this.loadPopUpOpened = true;
    },

    // Remove block from modelList, checking the graph first
    checkGraphBlockDelete (block) {

      if (block == null) return;

      const blockKey = block.source + "/" + block.label

      console.log("checkGraphBlockDelete " + blockKey)

      this.BlockDeletion.delBlockName = block.label;
      this.BlockDeletion.delBlock = block;

      if (this.BlockDeletion.deleteBlockNow) {

        this.BlockDeletion.deleteBlockNow = false;
        this.BlockDeletion.delBlock = null;
        this.BlockDeletion.delBlockName = '';
        console.log("Deleting block from list: " + blockKey)
        this.$store.commit('removeBlock', blockKey)
        LiteGraph.deregisterNode(blockKey)
      } else {

        if (this.isblockOnGraph(this.graph, blockKey)) {
          this.BlockDeletion.showBlockOnGraphNoDelete = true
        } else {
          this.BlockDeletion.confirmBlockDelete = true
        }
      }
    },
    browserRefreshConfirm (event) {
      // browser alert when screen refreshed
      if (this.advancedSettings.confirmBrowserRefresh == true) {
        event.preventDefault()
        event.returnValue = ""
      }
    },
    selectNode (block) {

      if (this.isNotEmpty(block.properties) && block.properties.hoverText) {

        let message = this.isNotEmpty(block.properties) && block.properties.hoverText ? block.properties.hoverText : ""
        if (this.isNotEmpty(message)) {
          this.$q.notify({
            color: 'secondary',
            position: 'center',
            message: message,
            icon: 'info',
            timeout: 500
          })
        }
      }
    },
    discoverDhfSteps () {
      var self = this;
      this.$axios.get('/customSteps').then((response) => {

        function alphabeticalOrder(a, b) {
          if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
          if (b.name.toLowerCase() > a.name.toLowerCase()) return -1;
          return 0;
        }

        var steps = response.data.customSteps
        steps.sort(alphabeticalOrder);

        this.dhfSteps = steps.reduce(function (map, obj) {
          map[obj.name] = { "database": obj.database, "collection": obj.collection };
          return map;
        }, {});

        this.dhfStepSelectOptions = response.data.customSteps.map(item => { return { "label": item.name, "value": item.name } })

      })
        .catch((error) => {
          self.notifyError("databasesDetails", error, self);
        })
    },
    discoverDatabases (showError) {
      var self = this;
      this.$axios.get('/v1/resources/vppBackendServices?rs:action=databasesDetails')
        .then((response) => {

          this.$store.commit('availableDatabases', this.filterDatabases(response.data))

          this.$axios.get('/statics/library/core.json')
            .then((response) => {
              this.registerBlocksByConf(response.data, LiteGraph)
            })

          this.$axios.get('/statics/library/custom/user.json')
            .then((response) => {
              this.registerBlocksByConf(response.data, LiteGraph)
            })
        })
        .catch((error) => {
          if (showError) self.notifyError("databasesDetails", error, self)
          else console.log("discoverDatabases triggered error but suppressed: " + error)
        })
    },
    listGraphBlocks () {
      this.listTheGraphBlocks(this.graph, this.blockModels)
    },
    // Double click on nodes
    nodeDoubleClick (block) {
      if (block.node_over && block.node_over.properties) {

        // Mapping edit (string/Mapvalues block)
        if (block.node_over.properties.mapping) {
          this.$root.$emit("openMappingEdit", block.node_over.properties.mapping)
        } else  if (block.node_over.properties.mappingRange) {
            this.$root.$emit("openMappingEdit", block.node_over.properties.mappingRange, true)

          } else   if (block.node_over.properties.mappingCase) {
            this.$root.$emit("openMappingEdit", block.node_over, false, true)

              // Property edit. selectCase, Lookup, EvalJavaScript, & generic edit window hook
            }else if (this.isNotEmpty(block.node_over.properties.pipesDblClickProp) && block.node_over.properties.editProp) {
              this.$root.$emit("openPropertyEdit", block.node_over)
            }

      }
    },
    // Re-center and re-zoom graph
    resetView() {
      this.graph_canvas.ds.reset()
    },
    // Re-center
    recenterView() {
      this.graph_canvas.ds.offset[0] = 0;
      this.graph_canvas.ds.offset[1] = 0;
    },
    isNotEmpty (prop) {
      return (prop !== null && prop != '')
    },
    // Block description popup
    showBlockDetails(block) {
         if ( block.description && block.description != '')
         this.$root.$emit('showBlockDescription',block)
    },
    // Process blocks from old version of pipes and update
    updateGraph(graph) {
     graph.executionGraph = this.remapBlocks(LiteGraph,graph)
    },
    registerBlocksByConf (configs, LiteGraph) {

      const availableDatabases = [...this.availableDB]

      for (let config of configs) {

        // Generate LiteGraph node from config
        var blockCode = this.createGraphNodeFromConfig(config,availableDatabases)
        try { eval(blockCode) } catch (e) {
          console.log("Error occured registering block " + config.blockName + ": " + e)
        }
      }
    },
    checkLoggedIn () {
      this.$axios.get('/status').then(response => {
        if (response.data && response.data.authenticated) {
          console.log("Logged in")
          this.$store.commit('authenticated', true)
        } else {
          console.log("Not logged in. Redirecting to login page")
          this.$router.push({ path: "/" })
        }
      })
    }
  },
  mounted: function () {
    this.checkLoggedIn()

    this.$root.$on("csvLoadingRequested", this.createGraphFromMapping)
    this.$root.$on("openGraphPreview", this.openGraphPreviewDialog)
    this.$root.$on("executeGraph", this.openGraphPreviewDialog);
    this.$root.$on("saveGraphCall", this.saveGraph);
    this.$root.$on("downloadGraphCall", this.downloadGraph);
    this.$root.$on("uploadGraphCall", function () {
      this.showUploadGraph = true
    }.bind(this))
    this.$root.$on("loadGraphCall", this.loadGraph);
    this.$root.$on("loadGraphJsonCall", this.loadGraphFromJson);
    this.$root.$on("exportGraphCall", this.exportDHFModule);
    this.$root.$on("nodeDblClicked", this.nodeDoubleClick);
    this.$root.$on("nodeSelected", this.selectNode);
    this.$root.$on("loadDHFDefaultGraphCall", this.resetDhfDefaultGraph);
    this.$root.$on("listGraphBlocks", this.listGraphBlocks);
    this.$root.$on("checkGraphBlockDelete", this.checkGraphBlockDelete);
    this.$root.$on('blockRequested', this.createBlock);
    this.$root.$on('blockDetails', this.showBlockDetails);



    this.graph = new LiteGraph.LGraph();
    this.graph_canvas = new LiteGraph.LGraphCanvas(this.$refs["mycanvas"], this.graph);

    this.discoverDatabases(false)
    this.discoverDhfSteps()

    // catch just in case problems. shouldn't stop tool working
    try {
      LiteGraph.registerPipesListener(this) // register any component so LiteGraph can emit events
    } catch (e) {
      console.log("Error calling registerPipesListener: " + e)
    }

    this.$store.commit('clearBlocks')

    if (this.$q.localStorage.getItem(ADVANCED_SETTINGS_KEY) == null) {
      this.persistSettings()
    } else {
      var storedSettings = this.$q.localStorage.getItem(ADVANCED_SETTINGS_KEY)
      this.advancedSettings.confirmBrowserRefresh = storedSettings.confirmBrowserRefresh != null ? storedSettings.confirmBrowserRefresh : true
    }

    //console.log("Registered blocks : " + JSON.stringify(LiteGraph.getRegisteredNodes()))

    this.resetDhfDefaultGraph()
  },
  beforeMount () {
    window.addEventListener("beforeunload", this.browserRefreshConfirm)
    this.$once("hook:beforeDestroy", () => {
      window.removeEventListener("beforeunload", this.browserRefreshConfirm);
    }
    )
  },
  beforeDestroy () {
    // de-register events otherwise multiple events get fired
    this.$root.$off('blockRequested', this.createBlock);
    this.$root.$off("loadGraphJsonCall", this.loadGraphFromJson);
    this.$root.$off("openGraphPreview", this.openGraphPreviewDialog)
    this.$root.$off("csvLoadingRequested", this.createGraphFromMapping)
    this.$root.$off("executeGraph", this.openGraphPreviewDialog);
    this.$root.$off("saveGraphCall", this.saveGraph);
    this.$root.$off("downloadGraphCall", this.downloadGraph);
    this.$root.$off("uploadGraphCall", function () {
      this.showUploadGraph = true
    }.bind(this))
    this.$root.$off("loadGraphCall", this.loadGraph);
    this.$root.$off("loadGraphJsonCall", this.loadGraphFromJson);
    this.$root.$off("exportGraphCall", this.exportDHFModule);
    this.$root.$off("nodeDblClicked", this.DblClickNode);
    this.$root.$off("nodeSelected", this.selectNode);
    this.$root.$off("loadDHFDefaultGraphCall", this.resetDhfDefaultGraph);
    this.$root.$off("listGraphBlocks", this.listGraphBlocks);
    this.$root.$off("checkGraphBlockDelete", this.checkGraphBlockDelete);
    this.$root.$off('blockDetails', this.showBlockDetails,node);
  }

}
</script>
