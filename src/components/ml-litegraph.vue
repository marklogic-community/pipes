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

    <q-dialog :content-css="{minWidth: '30vw', minHeight: '40vh'}" v-model="savePopUpOpened">
      <q-layout class="bg-white" container>


        <div class="layout-padding">
          <q-item-label :header="true">Save current graph</q-item-label>
          <div>
            <q-input stack-label="true" label="Graph name" v-model="graphName"/>
          </div>
          <div class="q-pa-sm">
            <q-btn
              @click="saveCurrentGraph()"
              color="primary"
              label="Save"
            />
            <q-btn
              @click="savePopUpOpened = false"
              color="primary"
              label="Close"
            />
          </div>

        </div>
      </q-layout>
    </q-dialog>


    <q-dialog :content-css="{minWidth: '30vw', minHeight: '40vh'}" v-model="loadPopUpOpened">
      <q-layout class="bg-white" container>


        <div class="layout-padding">

          <q-list class="q-mt-md" link>
            <q-item-label :header="true">List of saved graph</q-item-label>
            <q-item @click.native="getSavedGraph(item.uri)" tag="label" v-bind:key="item.name"
                    v-for="(item, index) in savedGraph">

              <q-item-label>
                <q-item-section label>{{ item.name }}</q-item-section>

              </q-item-label>
            </q-item>
          </q-list>


          <div class="q-pa-sm">

            <q-btn
              @click="loadPopUpOpened = false"
              color="primary"
              label="Close"
            />
          </div>
        </div>
      </q-layout>
    </q-dialog>


    <q-dialog v-model="showPreview">
      <q-card >
        <q-card-section class="row items-center">
          <div class="text-h6">Preview</div>
        </q-card-section>
        <q-card-section class="row"  >
          <div style="min-width: 250px; max-width: 300px">

            <q-select :options="availableDB"  filled label="Use Database for input"
                      v-model="selectedDB" @input="dbChanged()">

              <template v-slot:prepend>
                <q-icon name="fas fa-database" @click.stop />
              </template>

            </q-select>
            <q-select :options="availableCollections" filled label="Use collection as input"
                      v-model="collectionForPreview">

              <template v-slot:prepend>
                <q-icon name="fas fa-tags" @click.stop />
              </template>
            </q-select>

            <q-select v-if="saveToDB" :options="availableDB"  filled label="Save to Database"
                      v-model="selectedTargetDB">

              <template v-slot:prepend>
                <q-icon name="fas fa-database" @click.stop />
              </template>

            </q-select>
            <q-input v-if="!randomDocPreview"   v-model="docUri" label="Optional doc URI" />
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

            <q-btn @click="executeGraph()" color="primary" label="Execute Preview"/>
          </div>
        </q-card-section>
        <q-card-section>
          <q-scroll-area style="height: 500px; max-width: 500px;">
            <div class="q-py-xs">
          <vue-json-pretty
            :data="jsonFromPreview"
          >
          </vue-json-pretty>
            </div>
          </q-scroll-area>
        </q-card-section>
      </q-card>
    </q-dialog>



    <q-dialog v-model="isExported">
      <q-card>
        <q-card-section>
          <div class="text-h6">Information</div>
        </q-card-section>

        <q-card-section>
         The code of you Data Hub Custom step is now available in your browser downloads folder (main.sjs file).
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="OK" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </div>


</template>
<script>

  import {LiteGraph} from 'litegraph.js';
  import {saveAs} from 'file-saver';
  import VueJsonPretty from 'vue-json-pretty';


  export default {
    components: {
      VueJsonPretty
    },
    name: 'PageIndex',
    data() {
      return {
        currentCtsQuery:"",
        currentCases:"",
          selectedTargetDB:null,
        editQuery:false,
        editJson: false,
        editCases:false,
          saveToDB:false,
        graphMetadata:{
          title:"",
          version:"00.01",
          author:"",
          description:""
        },
        columns: [
          {name: 'source', align: 'left', label: 'Source', field: 'source', sortable: true},
          {name: 'target', label: 'Target', field: 'target', sortable: true, align: 'left'},
        ],
        opened: true,
        isExported:false,
        graph: null,
        results: null,
        models: [],
        showPreview: false,
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
        selectedDB:null,
        availableDB:[],
          docUri:null


      }
    },
    methods: {

      registerModel(blockDef) {
        console.log("register model")
        this.createBlock(blockDef)
        this.models.push(blockDef)
      },

      createBlock(blockDef) {
        console.log(blockDef)

        let newBlock = this.createGraphNodeFromModel(blockDef);
        LiteGraph.registerNodeType(blockDef.source + "/" + blockDef.collection, newBlock);
        this.models.push(blockDef)

        this.$q.notify({
          color: 'positive',
          position: 'top',
          message: "The new block is now available in the library (right click)",
          icon: 'code'
        })

      },
      addMapping() {
        this.currentProperties.push({source: "val", target: "newVal"})
      },
      loadGraphFromJson(graph){

        for (let model of graph.models) {
          let newBlock = this.createGraphNodeFromModel(model);
          LiteGraph.registerNodeType(model.source + "/" + model.collection, newBlock);
        }
        this.models = graph.models

        this.graph.configure(graph.executionGraph)



          if(graph.metadata && graph.metadata.title !=null) this.graphMetadata.title = graph.metadata.title; else this.graphMetadata.title =""
          if(graph.metadata && graph.metadata.author !=null) this.graphMetadata.author = graph.metadata.author; else this.graphMetadata.author =""
          if(graph.metadata && graph.metadata.version !=null) this.graphMetadata.version = graph.metadata.version;else this.graphMetadata.version =""
          if(graph.metadata && graph.metadata.description !=null) this.graphMetadata.description = graph.description; else this.graphMetadata.description =""
          this.$root.$emit("initGraphMetadata",this.graphMetadata)

      }

      ,
      getSavedGraph(uri) {
        //if(uri!=null)
        this.$axios.get('/v1/resources/savedGraph?rs:uri=' + encodeURI(uri))
          .then((response) => {
            let graph = response.data;

             this.loadGraphFromJson(graph)

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
      loadSavedGraph() {

        this.$axios.post('/v1/resources/savedGraph')
          .then((response) => {
            this.savedGraph = response.data;

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
      dbChanged(){

        this.discoverCollections()
      },
      discoverCollections() {
        let dbOption =""
        if(this.selectedDB!=null && this.selectedDB!="") {
          dbOption += "&rs:database=" + this.selectedDB.value

          this.$axios.get('/v1/resources/vppBackendServices?rs:action=collectionDetails' + dbOption)
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
      createGraphFromMapping(csvData) {


        // this.$axios.get('/statics/mappingRulesFR.csv')
        // .then((response) => {

        //console.log(response.data)

        let mappings = this.csvJSON(csvData)

        /*mappings =[

              {
                source : "mySrc",
                sourceField:"s1",
                target:"myTarget",
                targetField:"t1"
              },
              {
                source : "mySrc",
                sourceField:"s2",
                target:"myTarget",
                targetField:"t2"

              }


            ]*/
        let blocks = {}
        let inputs = {}
        let inputIdCount = 0
        let outputs = {}
        let outputIdCount = 0

        for (let map of mappings) {


          if (map.source != null && blocks[map.source] == null)
            blocks[map.source] = {
              "label": map.source,
              "collection": map.source,
              "source": "Sources",
              "fields": [],
              "options": ["fieldsOutputs", "nodeInput"]
            }

          if (map.target != null && blocks[map.target] == null)
            blocks[map.target] = {
              "label": map.target,
              "collection": map.target,
              "source": "Entities",
              "fields": [],
              "options": ["fieldsInputs", "nodeOutput"]
            }


          if (map.sourceField != null && map.sourceField != "") blocks[map.source].fields.push(

          {
            "label": map.sourceField,
            "field" :  map.sourceField,
            "path":  "//text('"  +  map.sourceField + "')"
          }



          )
          if (map.targetField != null && map.targetField != "") blocks[map.target].fields.push(


          {
            "label": map.targetField,
            "field" :  map.targetField,
            "path":  "//text('"  +  map.targetField + "')"
          }
          )

        }

        let ii = 0
        let oi = 0
        let blockCache ={}
        Object.keys(blocks).map(item => {

          this.createBlock(blocks[item])
          let tmpBlock = LiteGraph.createNode(blocks[item].source + "/" + blocks[item].collection);
          tmpBlock.pos = [400 + (ii++) * 200, 200 + (ii++) * 200];
          this.graph.add(tmpBlock);
          blockCache[item] = tmpBlock;
        })
        /*
            Object.keys(outputs).map(item => {

              this.createBlock(outputs[item])
              let tmpBlock = LiteGraph.createNode(outputs[item].source + "/" + outputs[item].collection);
              tmpBlock.pos = [600, 200 + (oi++) * 200];
              this.graph.add(tmpBlock);
              outputs[item].block=tmpBlock;
            })
            */

     for (let map of mappings) {


          if (map.source != null && map.target != null && map.sourceField != null && map.targetField != null && map.source != "" && map.target != "" && map.sourceField != "" && map.targetField != "") {
           // console.log(map.sourceField)
           // console.log(blocks[map.target].block.ioSetup)
            blockCache[map.source].connect(
              blockCache[map.source].ioSetup.outputs["//text('" + map.sourceField +"')"],
              blockCache[map.target].id,
              blockCache[map.target].ioSetup.inputs["//text('" + map.targetField +"')"])

          }

        }
      }
      //  })


      //  }


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
      downloadGraph(){


        let jsonGraph = this.graph.serialize()
        let graphDef = {
          models: (this.models != null) ? this.models : [],
          executionGraph: jsonGraph,
          name: this.graphName,
          metadata: this.graphMetadata

        }


        var blob = new Blob([JSON.stringify(graphDef)], {
          type: "text/plain;charset=utf-8",
          endings: "transparent"
        });
        let name =""
        if(this.graphMetadata && this.graphMetadata.title!=null && this.graphMetadata.title!="") name +=this.graphMetadata.title; else name += "currentGraph"
        if(this.graphMetadata && this.graphMetadata.version!=null && this.graphMetadata.version!="") name += "-" + this.graphMetadata.version
        saveAs(blob, name  + ".json");

      },
      exportDHFModule() {
        //console.log("export DHF module")
        let jsonGraph = this.graph.serialize()
        let request = {
          models: (this.models != null) ? this.models : [],
          executionGraph: jsonGraph

        }

        let begin = "const DataHub = require(\"/data-hub/5/datahub.sjs\");\n" +
            "var gHelper  = require(\"/custom-modules/graphHelper\")\n" +
          "const datahub = new DataHub();\n" +
          "\n" +
          "\n" +
          "function getGraphDefinition() {\n" +
          "\n" +
          "  return "

        let end = "}\n" +
          "\n" +
          "function main(content, options) {\n" +
          "\n" +
          "  //grab the doc id/uri\n" +
          "  let id = content.uri;\n" +
          "\n" +
          "  //here we can grab and manipulate the context metadata attached to the document\n" +
          "  let context = content.context;\n" +
          "\n" +
          "  //let's set our output format, so we know what we're exporting\n" +
          "  let outputFormat = options.outputFormat ? options.outputFormat.toLowerCase() : datahub.flow.consts.DEFAULT_FORMAT;\n" +
          "\n" +
          "  //here we check to make sure we're not trying to push out a binary or text document, just xml or json\n" +
          "  if (outputFormat !== datahub.flow.consts.JSON && outputFormat !== datahub.flow.consts.XML) {\n" +
          "    datahub.debug.log({\n" +
          "      message: 'The output format of type ' + outputFormat + ' is invalid. Valid options are ' + datahub.flow.consts.XML + ' or ' + datahub.flow.consts.JSON + '.',\n" +
          "      type: 'error'\n" +
          "    });\n" +
          "    throw Error('The output format of type ' + outputFormat + ' is invalid. Valid options are ' + datahub.flow.consts.XML + ' or ' + datahub.flow.consts.JSON + '.');\n" +
          "  }\n" +
          "\n" +
          "  /*\n" +
          "  This scaffolding assumes we obtained the document from the database. If you are inserting information, you will\n" +
          "  have to map data from the content.value appropriately and create an instance (object), headers (object), and triples\n" +
          "  (array) instead of using the flowUtils functions to grab them from a document that was pulled from MarkLogic.\n" +
          "  Also you do not have to check if the document exists as in the code below.\n" +
          "\n" +
          "  Example code for using data that was sent to MarkLogic server for the document\n" +
          "  let instance = content.value;\n" +
          "  let triples = [];\n" +
          "  let headers = {};\n" +
          "   */\n" +
          "\n" +
          "  //Here we check to make sure it's still there before operating on it\n" +
          "  if (!fn.docAvailable(id)) {\n" +
          "    datahub.debug.log({message: 'The document with the uri: ' + id + ' could not be found.', type: 'error'});\n" +
          "    throw Error('The document with the uri: ' + id + ' could not be found.')\n" +
          "  }\n" +
          "\n" +
          "  //grab the 'doc' from the content value space\n" +
          "  let doc = content.value;\n" +
          "\n" +
          "  // let's just grab the root of the document if its a Document and not a type of Node (ObjectNode or XMLNode)\n" +
          "  //if (doc && (doc instanceof Document || doc instanceof XMLDocument)) {\n" +
          "  //  doc = fn.head(doc.root);\n" +
          "  //}\n" +
          "\n" +
          "  /*\n" +
          "  //get our instance, default shape of envelope is envelope/instance, else it'll return an empty object/array\n" +
          "  let instance = datahub.flow.flowUtils.getInstance(doc) || {};\n" +
          "\n" +
          "  // get triples, return null if empty or cannot be found\n" +
          "  let triples = datahub.flow.flowUtils.getTriples(doc) || [];\n" +
          "\n" +
          "  //gets headers, return null if cannot be found\n" +
          "  let headers = datahub.flow.flowUtils.getHeaders(doc) || {};\n" +
          "\n" +
          "  //If you want to set attachments, uncomment here\n" +
          "  // instance['$attachments'] = doc;\n" +
          "  */\n" +
          "\n" +
          "\n" +
          "\n" +
          "  //insert code to manipulate the instance, triples, headers, uri, context metadata, etc.\n" +
          "\n" +
          "\n" +
          "  let results = gHelper.executeGraphStep(doc,id,getGraphDefinition(),{collections: xdmp.documentGetCollections(id)})\n" +
          /* "\n" +
           "  //form our envelope here now, specifying our output format\n" +
           " // let envelope = datahub.flow.flowUtils.makeEnvelope(instance, headers, triples, outputFormat);\n" +
           "\n" +
           "  //assign our envelope value\n" +
           "  content.value = instance.output;\n" +
           "\n" +
           "  //assign the uri we want, in this case the same\n" +
           "  content.uri = (instance.uri!=null)?instance.uri:id;\n" +
           "\n" +
           "context.collections = (instance.collections!=null)?instance.collections:context.collections;" +
           "  //assign the context we want\n" +
           "  content.context = context;\n" +
           "\n" +
           "  //now let's return out our content to be written\n" +*/
          "  return results;\n" +
          "}\n" +
          "\n" +
          "module.exports = {\n" +
          "  main: main\n" +
          "};\n"

        var blob = new Blob([begin + JSON.stringify(request) + end], {
          type: "text/plain;charset=utf-8",
          endings: "transparent"
        });
        saveAs(blob, "main.sjs");
        this.isExported=true

      },
      saveCurrentGraph() {

        let jsonGraph = this.graph.serialize()
        let graphDef = {
          models: (this.models != null) ? this.models : [],
          executionGraph: jsonGraph,
          name: this.graphName,
          metadata: this.graphMetadata

        }

        this.$axios.put('/v1/resources/savedGraph', graphDef)
          .then((response) => {

            this.$q.notify({
              color: 'positive',
              position: 'top',
              message: "Current graph is saved",
              icon: 'code'
            })
          })
          .catch(() => {
            this.$q.notify({
              color: 'negative',
              position: 'top',
              message: 'Current graph save failed',
              icon: 'report_problem'
            })
          })


      }
      ,
      resetDhfDefaultGraph(){


        this.$axios.get('/statics/graph/dhfDefaultGraph.json')
          .then((response) => {
            let defaultGraph = response.data
              defaultGraph.models = this.models
            this.loadGraphFromJson(defaultGraph)

          })
      }
      ,
      executeGraph() {

        let dbOption =""
        if(this.selectedDB!=null && this.selectedDB!="") {
          dbOption += "?rs:database=" + this.selectedDB.value
          //this.$root.$emit("databaseChanged",
           // {selectedDatabase: this.selectedDatabase,availableDatabases:this.availableDatabases
           // }

          //);
        }

        if(this.saveToDB){

            if(dbOption!="")
                dbOption += "&rs:toDatabase=" + this.selectedTargetDB.value + "&rs:save=true"
else
                dbOption += "?rs:toDatabase=" + this.selectedTargetDB.value+ "&rs:save=true"
        }

        let jsonGraph = this.graph.serialize()
        let request = {
          jsonGraph: {
            models: (this.models != null) ? this.models : [],
            executionGraph: jsonGraph

          },
          collection: this.collectionForPreview.value,
          collectionRandom: this.randomDocPreview,
            previewUri : this.docUri
        }



        console.log(jsonGraph)
        this.$axios.post('/v1/resources/executeGraph' + dbOption , request)
          .then((response) => {

            this.jsonFromPreview = response.data

          })
        /*  .catch(() => {
            this.$q.notify({
              color: 'negative',
              position: 'top',
              message: 'Graph execution failed',
              icon: 'report_problem'
            })
          })*/

      },
      saveGraph(event) {

        this.savePopUpOpened = true;

      },
      loadGraph(event) {

        this.loadSavedGraph()
        this.loadPopUpOpened = true;

      },
        selectNode(block){
          console.log(block)
            let message = null
            if ( block.properties.testCases)
                message= 'Double click the box to edit the test cases'


            if ( block.properties.mapping)
                message= 'Double click the box to edit the mapping rules'

            if (block.properties.ctsQuery)
                message= 'Double click the box to edit the lookup query'

            if(message!=null)
                this.$q.notify({
                    color: 'secondary',
                    position: 'center',
                    message: message,
                    icon: 'info',
                    timeout:800
                })
        },
      discoverDatabases() {
        this.$axios.get('/v1/resources/vppBackendServices?rs:action=databasesDetails')
          .then((response) => {
            this.availableDB = response.data

            this.$axios.get('/statics/library/core.json')
              .then((response) => {
                //console.log(response.data)
                this.registerBlocksByConf(response.data, LiteGraph)

              })

            this.$axios.get('/statics/library/user.json')
              .then((response) => {
//console.log(response.data)

                this.registerBlocksByConf(response.data, LiteGraph)

              })
            console.log("emit init")
            this.$root.$emit("initGraphMetadata",this.graphMetadata)

            this.discoverCollections()


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
      discoverCollections() {
        let dbOption =""
        if(this.selectedDB!=null && this.selectedDB!="") {
          dbOption += "&rs:database=" + this.selectedDB.value
         // this.$root.$emit("databaseChanged",
         //   {selectedDatabase: this.selectedDatabase,availableDatabases:this.availableDatabases
         //   }

         // );
        }

        this.$axios.get('/v1/resources/vppBackendServices?rs:action=collectionDetails' + dbOption )
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
      DblClickNode(block) {

        if (block.node_over && block.node_over.properties && block.node_over.properties.mapping) {

          if (block.node_over.properties != null) this.currentProperties = block.node_over.properties.mapping
          this.editJson = true


          //console.log(this.$refs)

        }

        if (block.node_over && block.node_over.properties && block.node_over.properties.ctsQuery) {

          if (block.node_over.properties != null) this.currentCtsQuery = block.node_over.properties
          this.editQuery = true


          //console.log(this.$refs)

        }

        if (block.node_over && block.node_over.properties && block.node_over.properties.testCases) {

          if (block.node_over.properties != null) this.currentCases = block.node_over.properties.testCases
          this.editCases = true


          //console.log(this.$refs)

        }


      },
      setCurrrentDatabase(db){

        this.selectedDB=db.selectedDatabase;
        this.availableDB=db.availableDatabases;
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
            return "this.addWidget('" + widget.type + "','" + widget.name + "','" + widget.default + "', function(v){"+ (widget.callback?widget.callback:"") +"}.bind(this), { values:" + JSON.stringify(widget.values) + "} );"
          }).join("") : "";
          if (config.width)
            code += "    this.size = [" + config.width + "," + config.height + "];\n"
          code += "    this.serialize_widgets = true;"

          //code += (config.properties)?"config.properties = " +  config.properties +";":"";
          code += "};"

          code += config.functionName + ".title = '" + config.blockName + "';";
          code += config.functionName + ".prototype.notify = function(node){this.$root.$emit(\"nodeSelected\",node)}.bind(this);";
          code+= config.functionName + ".prototype.onSelected = function(){this.notify(this) };"
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

        /*

          function fn_collection(uri)
          {
              return fn.collection(uri);
          }
          LiteGraph.wrapFunctionAsNode('fn/fn_collection',fn_collection,
              ['xs:string'],'node()*')
      */


      }
    },
    created() {

    },

    mounted: function () {
      console.log("mounted")

      this.$root.$on("csvLoadingRequested", this.createGraphFromMapping)
      this.$root.$on("registerModel", this.registerModel);
      this.$root.$on('executeGraphCall', function () {
        this.showPreview = true
      }.bind(this))
      this.$root.$on("databaseChanged", this.setCurrrentDatabase);
      this.$root.$on("saveGraphCall", this.saveGraph);
      this.$root.$on("downloadGraphCall", this.downloadGraph);
      this.$root.$on("loadGraphCall", this.loadGraph);
      this.$root.$on("loadGraphJsonCall", this.loadGraphFromJson);
      this.$root.$on("exportGraphCall", this.exportDHFModule);
      this.$root.$on("nodeDblClicked", this.DblClickNode);
        this.$root.$on("nodeSelected", this.selectNode);
      this.$root.$on("loadDHFDefaultGraphCall", this.resetDhfDefaultGraph);
      this.discoverDatabases()
      this.graph = new LiteGraph.LGraph();
      this.graph_canvas = new LiteGraph.LGraphCanvas(this.$refs["mycanvas"], this.graph);







      /*
       node_const.pos = [200,200];
       this.graph.add(node_const);
       node_const.setValue(4.5);

       var node_watch = LiteGraph.createNode("graph/output","result");
       //node_watch.inputs[0].name=


       node_watch.pos = [700,200];
       this.graph.add(node_watch);




       node_const.connect(0, node_watch, 0 );
       */
      //this.graph.renameGlobalOutput(node_watch.inputs[0].name,"result")
      //node_watch.inputs[0].name="result"
      // this.graph.start()
      //this.result=this.graph.global_outputs["result"].value
      // console.log(this.$refs["mycanvas"])


      //const myJSON = {ans: 42};

      // const formatter = new JSONFormatter(myJSON);

      //  this.viewer.appendChild(formatter.render());

    }
    ,
    created() {
      this.$root.$on('blockRequested', this.createBlock)

    }

  }
</script>


<style>
</style>
