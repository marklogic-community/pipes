<!-- Copyright ©2020 MarkLogic Corporation. -->
<template>
  <q-dialog
    v-model="showPreview"
    style="width: 1032px;max-width:1032px"
  >
    <q-card>

      <q-card-section
        class="row items-center"
        style="padding-top: 0"
      >

        <div
          class="col-11 text-h6"
          align="left"
        >Preview Graph Execution</div>
        <div
          class="col-1"
          align="right"
        >
          <q-icon
            color="primary"
            style="font-size: 1.5em"
            name="far fa-question-circle"
          >
            <q-tooltip content-class="pipes-tooltip tooltip-square">
              Preview lets you choose a data source and test your graph to confirm the results before deploying to DHF
            </q-tooltip>
          </q-icon>
        </div>

        <div style="width: 1032px;max-width:1032px">
          <q-stepper
            v-model="previewWizardStep"
            vertical
            flat
            color="primary"
            animated
            v-if="previewWizardStep < 4"
          >
            <q-step
              :name="1"
              title="Select the source of the document for preview"
              icon="settings"
              :done="previewWizardStep > 1"
            >
              <q-list>
                <q-item
                  tag="label"
                  v-ripple
                >
                  <q-item-section avatar>
                    <q-radio
                      v-model="previewSource"
                      val="collection"
                      color="teal"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Documents Collection</q-item-label>
                    <q-item-label caption>Select this option if you want to run the preview on document(s) from a DB collection</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item
                  tag="label"
                  v-ripple
                >
                  <q-item-section avatar>
                    <q-radio
                      v-model="previewSource"
                      val="uri"
                      color="teal"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Document URI</q-item-label>
                    <q-item-label caption>Select this option if you want to run the preview on a specific document whose URI you know</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item
                  tag="label"
                  v-ripple
                >
                  <q-item-section avatar>
                    <q-radio
                      v-model="previewSource"
                      val="dhfStep"
                      color="teal"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Custom DHF Step</q-item-label>
                    <q-item-label caption>Select this option if you already have a custom DHF step definition for your Pipes graph</q-item-label>
                  </q-item-section>
                </q-item>

              </q-list>

              <q-stepper-navigation>
                <q-btn
                  @click="previewWizardStep = 2"
                  color="primary"
                  label="Continue"
                  :disable="isStep1ContinueDisabled"
                />
              </q-stepper-navigation>
            </q-step>

            <q-step
              :name="2"
              title="Select details"
              caption=""
              icon="settings"
              :done="previewWizardStep > 2"
            >

              <div v-if="isCollectionSelected || isUriSelected">

                <DatabaseCollectionSelector
                  :showCollectionDropDown="!isUriSelected"
                  :selectedDatabase="selectedDB"
                  :selectedCollection="collectionForPreview"
                  @databaseChanged="databaseChanged"
                  @collectionChanged="collectionChanged"
                  databaseLabel="Source Database"
                  collectionLabel="Source Collection"
                />

                <q-tooltip
                  content-style="font-size: 1em"
                  content-class="pipes-tooltip"
                >
                  Preview will be executed on documents from this collection
                </q-tooltip>
                </q-select>

                <q-toggle
                  label="Random document"
                  v-model="randomDocPreview"
                >
                  <q-tooltip
                    content-style="font-size: 1em"
                    content-class="pipes-tooltip tooltip-square"
                  >
                    When checked, a random document from the collection will be used. Otherwise, the first document in the collection will be used.
                    If the data is re-ingested, the order of documents is not guaranteed.
                  </q-tooltip>
                </q-toggle>
              </div>

              <div
                id="uriGroup"
                v-if="isUriSelected"
              >
                <q-input
                  v-model="docUri"
                  label="document URI"
                />
              </div>

              <div
                id="dhfStepGroup"
                v-if="isDhfStepSelected"
              >
                <div>Select a DHF step from your project</div>
                <q-select
                  v-if="this.previewSource==='dhfStep'"
                  dense
                  outlined
                  v-model="selectedStep"
                  :options="dhfStepSelectOptions"
                  label="Select the DHF 5.x Step"
                />
                <q-toggle
                  label="Random document"
                  v-model="randomDocPreview"
                >
                  <q-tooltip
                    content-style="font-size: 1em"
                    content-class="pipes-tooltip"
                  >
                    When checked, a random document from collection will be picked. Otherwise, the first document in the collection will be used.
                  </q-tooltip>
                </q-toggle>
              </div>

              <q-stepper-navigation>
                <q-btn
                  @click="previewWizardStep = 3"
                  color="primary"
                  label="Continue"
                  :disable="isStep2ContinueDisabled"
                />
                <q-btn
                  flat
                  @click="previewWizardStep = 1"
                  color="primary"
                  label="Back"
                  class="q-ml-sm"
                />
              </q-stepper-navigation>
            </q-step>

            <q-step
              :name="3"
              title="Save result to a Database?"
              icon="settings"
            >
              <q-toggle
                label="Save to DB"
                v-model="saveToDB"
              />

              <div v-if="saveToDB">
                <DatabaseCollectionSelector
                  :showCollectionDropDown="false"
                  :selectedDatabase="selectedTargetDB"
                  @databaseChanged="targetDatabaseChanged"
                  databaseLabel="Target Database"
                />
              </div>

              <q-stepper-navigation>
                <q-btn
                  @click="previewWizardStep = 4"
                  color="primary"
                  label="Continue"
                  :disable="isStep3ContinueDisabled"
                />
                <q-btn
                  flat
                  @click="previewWizardStep = 2"
                  color="primary"
                  label="Back"
                  class="q-ml-sm"
                />
              </q-stepper-navigation>

            </q-step>

            <q-step
              :name="4"
              title="Summary"
              icon="list"
            >

            </q-step>
          </q-stepper>
        </div>
      </q-card-section>

      <q-card bordered>
        <q-card-section v-if="previewWizardStep == 4">

          <div>Source Database: <q-chip icon="storage"> {{summarySelectedDB}}</q-chip>
          </div>
          <div
            id="collectionGroupSummary"
            v-if="isCollectionSelected || isDhfStepSelected"
          >
            <div>Source Document Collection: <q-chip icon="collections">{{summaryCollectionForPreview}}</q-chip>
            </div>
            <div>Random Document:
              <q-toggle
                v-model="randomDocPreview"
                checked-icon="check"
                color="green"
                unchecked-icon="clear"
              />
            </div>
          </div>

          <div
            id="uriGroup"
            v-if="isUriSelected"
          >
            Source Document URI: <q-chip icon="menu_book">{{docUri}}</q-chip>
          </div>

          <div
            id="saveToDbGroup"
            v-if="saveToDB"
          >
            Save result to Database: <q-chip icon="storage"> {{summarySaveDB}}</q-chip>
          </div>

          <q-stepper-navigation style="padding-top: 0">
            <q-btn
              :loading="graphPreviewExecuting"
              v-bind:disabled="graphPreviewExecuting"
              @click="executeGraph()"
              color="primary"
              label="Execute Preview"
            />

            <q-btn
              flat
              @click="previewWizardStep = 3"
              color="primary"
              label="Back"
              class="q-ml-sm"
            />
          </q-stepper-navigation>
          <!--- END -->
        </q-card-section>
      </q-card>

      <q-list
        dense
        padding
        class="rounded-borders"
      >
        <q-item
          clickable
          v-for="(item, index) in validationInfos"
          v-bind:key="index"
        >
          <q-item-section avatar>
            <q-icon
              dense
              :color="(item.type=='error')?'negative':'primary'"
              :name="item.type"
            />
          </q-item-section>
          <q-item-section>{{item.msg}}</q-item-section>
        </q-item>
      </q-list>

      <div
        class="row"
        style="white-space: nowrap;"
      >
        <div
          class="col-11"
          v-bind:class="{ error : errorOccured }"
          style="overflow: hidden;text-overflow: ellipsis"
        >{{ jsonFromPreview.uri }}</div>
        <div class="col-1">
          <q-btn
            style="font-size:0.7em"
            @click="copyResultToClipboard(jsonFromPreview.uri)"
            :ripple="{ color: 'green' }"
            icon="fas fa-paste"
            dense
          >
            <q-tooltip
              self="top middle"
              content-class="pipes-tooltip"
            >Copy source URI to clipboard</q-tooltip>
          </q-btn>
        </div>
      </div>

      </q-card-section>

      <q-separator></q-separator>

      <div
        class="row"
        style="white-space: nowrap;"
      >
        <div class="col-1">
          <q-icon
            :color="executionStatus"
            name="fas fa-check-circle"
          >
            <q-tooltip content-class="pipes-tooltip">{{statusPopup}}</q-tooltip>
          </q-icon>
        </div>
        <div
          class="col-10"
          style="font-weight:bold"
        >{{executionLabel}}</div>
        <div class="col-1">
          <q-btn
            style="font-size:0.7em"
            @click="copyResultToClipboard(jsonFromPreview.result)"
            :ripple="{ color: 'green' }"
            icon="fas fa-paste"
            dense
            :disabled="jsonFromPreview.result == null && jsonFromPreview.result == []"
          >
            <q-tooltip
              self="top middle"
              content-class="pipes-tooltip"
            >Copy document to clipboard</q-tooltip>
          </q-btn>
        </div>
      </div>

      <div
        class="q-py-xs"
        style='color: red'
        v-if="this.errorMessage !== null && this.errorMessage.length > 0"
      >{{this.errorMessage}}</div>

      <q-scroll-area style="height: 600px; padding: 0px;">

        <div class="q-py-xs">
          <vue-json-pretty
            id="prettyJSON"
            :data="jsonPreview"
          >
          </vue-json-pretty>
        </div>
      </q-scroll-area>
    </q-card>
  </q-dialog>
</template>

<script>
import VueJsonPretty from 'vue-json-pretty';
import Notifications from '../components/notificationHandler.js';
import CollectionFilter from '../components/collectionFilter.js';
import DatabaseCollectionSelector from '../components/databaseCollectionSelector.vue';
import { LocalStorage, copyToClipboard } from 'quasar';
import { Vuex } from "vuex";
export default {
  components: {
    VueJsonPretty,
    DatabaseCollectionSelector
  },
  mixins: [
    Notifications,
    CollectionFilter
  ],
  data () {
    return {
      graph: null,
      serializedGraph: '',
      dhfStepSelectOptions: [],
      dhfSteps: null,
      blocks: null,
      showPreview: false,
      selectedDB: null,     // Preview Database
      collectionForPreview: null,
      selectedTargetDB: null, // Target Database where result will be saved
      selectedStep: null,
      randomDocPreview: false,
      previewWizardStep: 1,
      docUri: null,
      errorOccured: false,
      executionRun: false,
      errorMessage: '',
      statusHoverText: '',
      previewSource: null,
      jsonFromPreview: {},
      executionTime: null,
      saveToDB: false,
      graphPreviewExecuting: false,
      validationConfigs: [
        {
          block: "DHF/output",
          mandatoryInputs: [
            {
              name: "output",
              msg: "The final output of the graph is not connected to Custom Step Output. You won't get any result",
              type: "error"
            }],
          mandatoryOutputs: [],
          count: {
            "N": {
              msg: "You should have only one Custom Step Output block in the graph",
              type: "error"
            },
            0: {
              msg: "You should have at least one Custom Step Output block in the graph.",
              type: "error"
            }
          }

        },
        {
          block: "DHF/envelope",
          mandatoryInputs: [
            {
              name: "instance",
              msg: "The input '${input.name}' of the ${config.block} block should be connected",
              type: "error"
            },
            {
              name: "uri",
              msg: "If the '${input.name}' input of the ${config.block} block is not set, you might get conflicting URIs",
              type: "info"
            }
          ],
          mandatoryOutputs: [],
          count: {
            0: {
              msg: "There should usually be at least one ${config.block} in a graph.",
              type: "info"
            }
          }
        }
      ],
      validationInfos: []
    }
  },
  methods: {
    openDialog (graph, blockList, dhfSteps, dhfStepOptions) {
      this.showPreview = true
      this.graph = graph
      this.blocks = blockList
      this.dhfSteps = dhfSteps
      this.dhfStepSelectOptions = dhfStepOptions
    },
    databaseChanged: function (db) {
      this.selectedDB = db
    },
    targetDatabaseChanged: function (db) {
      this.selectedTargetDB = db
    },
    collectionChanged: function (col) {
      console.log("collectionChanged: " + JSON.stringify(col))
      this.collectionForPreview = col
    },
    copyResultToClipboard (result) {
      var document;
      document = ((typeof result == "object") ? JSON.stringify(result, null, 2) : result)
      copyToClipboard(document).then(() => {
      }).catch(() => {
      })
    },
    checkConfiguration (graph, configs) {
      let result = []

      for (let config of configs) {

        let blocks = this.findBlock(graph, config.block)
        let ok = true
        if (blocks) {
          if (blocks.length > 1) {
            console.log("Blocks > 1")
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
    findBlock (graph, nodeType) {
      let node = graph.nodes.filter(node => node.type == nodeType)
      if (node.length > 0)
        return node
      else null
    },
    findIO (node, type, IOName) {
      let IO = node[type].filter(input => input.name == IOName)
      if (IO.length > 0)
        return IO[0]
      else null
    },
    addInfos (validationInfos, type, msg) {
      validationInfos.push({
        type: type,
        msg: msg
      })
    },
    executeGraph () {

      console.log("Executing graph..")

      this.validationInfos = []
      this.jsonFromPreview = {};
      this.errorOccured = false
      this.errorMessage = ''

      const graphDef = this.createGraphDef()
      const graphDetail = this.graph.serialize();

      this.validationInfos = this.checkConfiguration(graphDetail, this.validationConfigs)

      if (this.validationInfos.filter(item => item.type == "error").length == 0) {

        this.executionRun = true

        var self = this; // keep reference for notifications called from catch block
        let dbOption = ""
        if (this.selectedDB !== null) {
          dbOption += "&rs:database=" + this.selectedDB.label
        }

        if (this.saveToDB) {

          if (dbOption != "")
            dbOption += "&rs:toDatabase=" + this.selectedTargetDB.label + "&rs:save=true"
          else
            dbOption += "?rs:toDatabase=" + this.selectedTargetDB.label + "&rs:save=true"
        }
        let request = {
          jsonGraph: graphDef,
          collection: this.collectionForPreview === null || this.collectionForPreview.value === null ? null : this.collectionForPreview.value,
          collectionRandom: this.randomDocPreview,
          previewUri: this.docUri
        }

        this.executionTime = null

        this.$axios.post('/v1/resources/vppBackendServices?rs:action=ExecuteGraph' + dbOption, request)
          .then((response) => {
            this.jsonFromPreview = response.data
            if (response.data.execTime) {
              this.executionTime = response.data.execTime
              console.log("Execution finished normally in " + this.executionTime + "ms")
            }

            if (response.data.error) {

              this.executionTime = null

              if (response.data.error.stack) {
                console.log("Error executing graph")
                this.errorOccured = true
                var error = JSON.stringify(response.data.error.stack);
                error = (error.split("in "))[0]
                if (error.length > 50) error = error.substring(0, 50) // if we don't capture message correctly truncate
                this.errorMessage = error
              } else {
                this.errorOccured = true
                this.errorMessage = response.data.error
              }
            }

          })
          .catch((error) => {
            self.notifyError("ExecuteGraph", error, self);
          })
      }
    },
    createGraphDef () {
      const jsonGraph = this.graph
      return {
        pipesFileVersion: 2,
        models: this.blocks,
        executionGraph: jsonGraph.serialize(),
        name: this.$store.getters.graphTitle
      }
    }
  },
  watch: {
    previewSource: function (val) {
      if (val !== null) {
        if (this.previewSource == "uri") {
          this.collectionForPreview = null;
          this.randomDocPreview = false;
        }
        else if (this.previewSource == 'collection' || this.previewSource == 'dhfStep') {
          this.docUri = null;
        }
        this.previewWizardStep = 2;
      }
    },
    selectedStep: function (val) {
      let availableDbHash = this.availableDB.reduce(function (map, obj) {
        map[obj.label] = obj.value;
        return map;
      }, {});
      this.selectedDB = { "label": this.dhfSteps[val.label].database, "value": availableDbHash[this.dhfSteps[val.label].database] };
      this.collectionForPreview = { "label": this.dhfSteps[val.label].collection, "value": this.dhfSteps[val.label].collection };
    }
  },
  computed: {
    executionLabel: function () {
      if (this.executionTime === null) return "Result from graph execution:"
      else return "Result from graph execution in " + this.executionTime + "ms:"
    },
    statusPopup: function () {
      return this.statusHoverText.length > 0 ? this.statusHoverText : ''
    },
    executionStatus: function () {
      var statusColor = ''
      if (this.executionRun) {
        if (this.errorOccured) {
          statusColor = 'red'
          this.statusHoverText = 'Error in graph execution'

        }
        else {
          statusColor = 'green'
          this.statusHoverText = 'Graph execution ran without error'
        }
      } else {
        statusColor = 'grey'
      }
      return statusColor
    },
    jsonPreview: function () {
      return (this.jsonFromPreview !== null && this.jsonFromPreview.result == undefined) ? {} : this.jsonFromPreview.result
    },
    availableDB: function () {
      return this.$store.getters.availableDatabases
    },
    summarySelectedDB: function () {
      return (this.selectedDB !== null) ? this.selectedDB.label : ""
    },
    summarySaveDB: function () {
      return (this.selectedTargetDB !== null) ? this.selectedTargetDB.label : ""
    },
    summaryCollectionForPreview: function () {
      return (this.collectionForPreview !== null) ? this.collectionForPreview.value : ""
    },
    isCollectionSelected: function () {
      return (this.previewSource == "collection")
    },
    isDhfStepSelected: function () {
      return (this.previewSource == "dhfStep")
    },
    isStep1ContinueDisabled: function () {
      return (this.previewSource == null)
    },
    isStep2ContinueDisabled: function () {
      let disabled = true;
      if (this.previewSource == 'collection' || this.previewSource == 'dhfStep') {
        if (this.selectedDB !== null && this.collectionForPreview !== null) {
          disabled = false;
        }
      } else if (this.previewSource == 'uri') {
        if (this.selectedDB !== null && this.docUri !== null && this.docUri.length > 0) {
          disabled = false;
        }
      }
      return disabled;
    },
    isStep3ContinueDisabled: function () {
      return (this.saveToDB == true && this.selectedTargetDB == null)
    },
    isUriSelected: function () {
      return (this.previewSource == "uri")
    }
  },
  mounted () {
    this.$root.$on("openExecutionPreview", this.openDialog)
  },
  beforeDestroy () {
    this.$root.$off("openExecutionPreview", this.openDialog)
  }
}
</script>
<style>
.pipes-tooltip {
  background-color: #7397d1;
  font-size: 1em;
}

.tooltip-square {
  max-width: 200px;
}

.error {
  color: red;
}
</style>
