<template>
  <div class="flex flex-center">
    <canvas ref="mycanvas" width='1800' height='1000' style='border: 1px solid' class="fixed"></canvas>


    <q-dialog v-model="editJson" persistent>
      <q-card>
        <q-card-section>
          <div class="text-h6">Edit data mapping</div>
        </q-card-section>

        <q-card-section>
          <q-table
            title="Mappings"
            :data="currentProperties"
            :columns="columns"
            row-key="name"
            binary-state-sort
          >
            <template v-slot:body="props">
              <q-tr :props="props">
                <q-td key="source" :props="props">
                  {{ props.row.source }}
                  <q-popup-edit v-model="props.row.source" title="Update mapping" buttons>
                    <q-input type="string" v-model="props.row.source" dense autofocus/>
                  </q-popup-edit>
                </q-td>
                <q-td key="target" :props="props">
                  {{ props.row.target }}
                  <q-popup-edit v-model="props.row.target" title="Update mapping" buttons>
                    <q-input type="string" v-model="props.row.target" dense autofocus/>
                  </q-popup-edit>
                </q-td>

              </q-tr>
            </template>
          </q-table>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Add mapping" color="primary" @click="addMapping()"/>
          <q-btn flat label="OK" color="primary" v-close-popup/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="savePopUpOpened" :content-css="{minWidth: '30vw', minHeight: '40vh'}">
      <q-layout container class="bg-white">


        <div class="layout-padding">
          <q-item-label :header="true">Save current graph</q-item-label>
          <div>
            <q-input v-model="graphName" stack-label="Graph name"/>
          </div>
          <div class="q-pa-sm">
            <q-btn
              color="primary"
              @click="saveCurrentGraph()"
              label="Save"
            />
            <q-btn
              color="primary"
              @click="savePopUpOpened = false"
              label="Close"
            />
          </div>

        </div>
      </q-layout>
    </q-dialog>


    <q-dialog v-model="loadPopUpOpened" :content-css="{minWidth: '30vw', minHeight: '40vh'}">
      <q-layout container class="bg-white">


        <div class="layout-padding">

          <q-list class="q-mt-md" link>
            <q-item-label :header="true">List of saved graph</q-item-label>
            <q-item tag="label" v-for="(item, index) in savedGraph" v-bind:key="item.name"
                    @click.native="getSavedGraph(item.uri)">

              <q-item-label>
                <q-item-section label>{{ item.name }}</q-item-section>

              </q-item-label>
            </q-item>
          </q-list>


          <div class="q-pa-sm">

            <q-btn
              color="primary"
              @click="loadPopUpOpened = false"
              label="Close"
            />
          </div>
        </div>
      </q-layout>
    </q-dialog>


    <q-dialog v-model="showPreview">
      <q-card>
        <q-card-section class="row items-center">
          <div class="text-h6">Preview</div>
        </q-card-section>
        <q-card-section class="row">
          <div style="min-width: 250px; max-width: 300px">


            <q-select filled v-model="collectionForPreview" :options="availableCollections"
                      label="Use collection as input"/>
          </div>

          <q-toggle
            v-model="randomDocPreview"
            label="Random doc"
          />

          <div class="q-pa-md q-gutter-sm">

            <q-btn color="primary" label="Execute Preview" @click="executeGraph()"/>
          </div>
        </q-card-section>
        <q-card-section>

          <vue-json-pretty
            :data="jsonFromPreview"
          >
          </vue-json-pretty>
        </q-card-section>
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
        editJson: false,
        columns: [
          {name: 'source', align: 'left', label: 'Source', field: 'source', sortable: true},
          {name: 'target', label: 'Target', field: 'target', sortable: true, align: 'left'},
        ],
        opened: true,
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
        availableCollections: []


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
      getSavedGraph(uri) {
        //if(uri!=null)
        this.$axios.get('/v1/resources/savedGraph?rs:uri=' + encodeURI(uri))
          .then((response) => {
            let graph = response.data;

            for (let model of graph.models) {
              let newBlock = this.createGraphNodeFromModel(model);
              LiteGraph.registerNodeType(model.source + "/" + model.collection, newBlock);
            }
            this.models = graph.models

            this.graph.configure(graph.executionGraph)

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
      discoverCollections() {
        this.$axios.get('/v1/resources/collectionsDiscovery')
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


          if (map.sourceField != null && map.sourceField != "") blocks[map.source].fields.push(map.sourceField)
          if (map.targetField != null && map.targetField != "") blocks[map.target].fields.push(map.targetField)

        }

        let ii = 0
        let oi = 0
        Object.keys(blocks).map(item => {

          this.createBlock(blocks[item])
          let tmpBlock = LiteGraph.createNode(blocks[item].source + "/" + blocks[item].collection);
          tmpBlock.pos = [400 + (ii++) * 200, 200 + (ii++) * 200];
          this.graph.add(tmpBlock);
          blocks[item].block = tmpBlock;
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
            console.log(map.sourceField)
            console.log(blocks[map.source].block.ioSetup.outputs[map.sourceField])
            blocks[map.source].block.connect(
              blocks[map.source].block.ioSetup.outputs[map.sourceField],
              blocks[map.target].block.id,
              blocks[map.target].block.ioSetup.inputs[map.targetField])

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
            this.addOutput("Node");
          }

          if (this.blockDef.options.indexOf("fieldsOutputs") > -1) {
            for (let field of blockDef.fields) {
              this.ioSetup.outputs[field] = this.ioSetup.outputs._count++;
              this.addOutput(field)
            }
          }

          if (blockDef.options.indexOf("fieldsInputs") > -1) {
            for (let field of blockDef.fields) {
              this.ioSetup.inputs[field] = this.ioSetup.inputs._count++;
              this.addInput(field);
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
      exportDHFModule() {
        console.log("export DHF module")
        let jsonGraph = this.graph.serialize()
        let request = {
          models: (this.models != null) ? this.models : [],
          executionGraph: jsonGraph

        }

        let begin = "const DataHub = require(\"/data-hub/5/datahub.sjs\");\n" +
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
          "  if (doc && (doc instanceof Document || doc instanceof XMLDocument)) {\n" +
          "    doc = fn.head(doc.root);\n" +
          "  }\n" +
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
          "  let gHelper  = require(\"/custom-modules/graphHelper\")\n" +
          "\n" +
          "  let results = gHelper.executeGraphStep(doc,id,getGraphDefinition(),context)\n" +
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

      },
      saveCurrentGraph() {

        let jsonGraph = this.graph.serialize()
        let graphDef = {
          models: (this.models != null) ? this.models : [],
          executionGraph: jsonGraph,
          name: this.graphName

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
      executeGraph() {
        console.log("executeGraph")

        let jsonGraph = this.graph.serialize()
        let request = {
          jsonGraph: {
            models: (this.models != null) ? this.models : [],
            executionGraph: jsonGraph

          },
          collection: this.collectionForPreview.value,
          collectionRandom: this.randomDocPreview
        }

        this.$axios.post('/v1/resources/executeGraph', request)
          .then((response) => {

            this.jsonFromPreview = response.data

          })
          .catch(() => {
            this.$q.notify({
              color: 'negative',
              position: 'top',
              message: 'Graph execution failed',
              icon: 'report_problem'
            })
          })

      },
      saveGraph(event) {

        this.savePopUpOpened = true;

      },
      loadGraph(event) {

        this.loadSavedGraph()
        this.loadPopUpOpened = true;

      },
      DblClickNode(block) {

        if (block) {
          console.log(block)
          if (block.node_over.properties != null) this.currentProperties = block.node_over.properties.mapping
          this.editJson = true


          console.log(this.$refs)


        }

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
            return "this.addWidget('" + widget.type + "','" + widget.name + "','" + widget.default + "', function(v){}, { values:[" + JSON.stringify(widget.values) + "]} );"
          }).join("") : "";
          if (config.width)
            code += "    this.size = [" + config.width + "," + config.height + "];\n"
          code += "    this.serialize_widgets = true;"

          //code += (config.properties)?"config.properties = " +  config.properties +";":"";
          code += "};"

          code += config.functionName + ".title = '" + config.blockName + "';";

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

      this.$root.$on("saveGraphCall", this.saveGraph);
      this.$root.$on("loadGraphCall", this.loadGraph);
      this.$root.$on("exportGraphCall", this.exportDHFModule);
      this.$root.$on("nodeDblClicked", this.DblClickNode);

      this.graph = new LiteGraph.LGraph();
      this.graph_canvas = new LiteGraph.LGraphCanvas(this.$refs["mycanvas"], this.graph);


      var node_const = LiteGraph.createNode("basic/const");

      let configs = [
        {
          "functionName": "GeoReproject",
          "blockName": "GeoReproject",
          "library": "geo",
          "inputs": [
            {
              name: "srcCoordinateSystem",
              type: "xs:string"
            },
            {
              name: "targetCoordinateSystem",
              type: "xs:string"
            },
            {
              name: "strWKT",
              type: "xs:string"
            }
          ],
          "outputs": [
            {
              "name": "strWKT",
              "type": "node"
            }
          ],
          "function": {
            "ref": "fn.doc",
            "code": null
          }


        },
        {
          "functionName": "fn_doc",
          "blockName": "doc",
          "library": "fn",
          "inputs": [
            {
              name: "uri",
              type: "xs:string"
            }
          ],
          "outputs": [
            {
              "name": "doc",
              "type": "node"
            }
          ],
          "function": {
            "ref": "fn.doc",
            "code": null
          }


        },
        {
          "functionName": "fn_collection",
          "blockName": "collection",
          "library": "fn",
          "inputs": [
            {
              name: "collectionName",
              type: "xs:string"
            }
          ],
          "outputs": [
            {
              "name": "docs",
              "type": "node()*"
            }
          ],
          "function": {
            "ref": "fn.collection",
            "code": null
          }


        },
        {
          "functionName": "fn_baseUri",
          "blockName": "baseUri",
          "library": "fn",
          "inputs": [
            {
              name: "node",
              type: "node"
            }
          ],
          "outputs": [
            {
              "name": "uri",
              "type": "xs:string"
            }
          ],
          "function": {
            "ref": "fn.baseUri",
            "code": null
          }


        },
        {
          "functionName": "fn_head",
          "blockName": "head",
          "library": "fn",
          "inputs": [
            {
              name: "nodes",
              type: null
            }
          ],
          "outputs": [
            {
              "name": "node",
              "type": null
            }
          ],
          "function": {
            "ref": "fn.head",
            "code": null
          }


        },
        {
          "functionName": "FormatDate",
          "blockName": "FormatDate",
          "library": "date",
          "inputs": [
            {
              name: "inputDate",
              type: "xs:string"
            }
          ],

          "widgets": [
            {
              "type": "text",
              "name": "format",
              "default": "DD/MM/YYYY",
              "values": []

            }

          ],
          "outputs": [
            {
              "name": "IsoDate",
              "type": "xs:string"
            }
          ],
          "function": {
            "ref": null,
            "code": null
          }
        },
        {
          "functionName": "CreateTriple",
          "blockName": "CreateTriple",
          "library": "triples",
          "inputs": [
            {
              name: "subject",
              type: "xs:string"
            },
            {
              name: "object",
              type: "xs:string"
            }
          ],

          "widgets": [

            {
              "type": "toggle",
              "name": "subjectIsIRI",
              "default": true,
              "values": []

            },
            {
              "type": "text",
              "name": "predicate",
              "default": "myPredicate",
              "values": []

            },
            {
              "type": "toggle",
              "name": "objectIsIRI",
              "default": true,
              "values": []

            }

          ],
          "outputs": [
            {
              "name": "triple",
              "type": null
            }
          ],
          "function": {
            "ref": null,
            "code": null
          }
        },
        {
          "functionName": "FormatDateAuto",
          "blockName": "FormatDateAuto",
          "library": "date",
          "inputs": [
            {
              name: "inputDate",
              type: "xs:string"
            }
          ],
          "outputs": [
            {
              "name": "IsoDate",
              "type": "xs:string"
            }
          ],
          "function": {
            "ref": null,
            "code": ""
          }
        },
        {
          "functionName": "Lookup",
          "blockName": "Lookup",
          "library": "feature",
          "inputs": [
            {
              name: "query",
              type: null
            },
            {
              name: "var1",
              type: null
            },
            {
              name: "var2",
              type: null
            }

          ],

          "widgets": [
            {
              "type": "text",
              "name": "query",
              "default": 'cts.collectionQuery("${v1}")',
              "values": []

            },

            {
              "type": "text",
              "name": "valuePath",
              "default": '/path/to/value/string()")',
              "values": []

            }],

          "outputs": [
            {
              "name": "value",
              "type": null
            }
          ],
          "function": {
            "ref": null,
            "code": ""
          }
        },
        {
          "functionName": "FormatDateTimeAuto",
          "blockName": "FormatDateTimeAuto",
          "library": "date",
          "inputs": [
            {
              name: "inputDateTime",
              type: "xs:string"
            }
          ],
          "outputs": [
            {
              "name": "IsoDateTime",
              "type": "xs:string"
            }
          ],
          "function": {
            "ref": null,
            "code": null
          }
        },

        {
          "functionName": "fn_upperCase",
          "blockName": "UpperCase",
          "library": "string",
          "inputs": [
            {
              name: "string",
              type: "xs:string"
            }
          ],
          "outputs": [
            {
              "name": "STRING",
              "type": "xs:string"
            }
          ],
          "function": {
            "ref": "fn.upperCase",
            "code": null
          }


        },
        {
          "functionName": "fn_lowerCase",
          "blockName": "LowerCase",
          "library": "string",
          "inputs": [
            {
              name: "STRING",
              type: "xs:string"
            }
          ],
          "outputs": [
            {
              "name": "string",
              "type": "xs:string"
            }
          ],
          "function": {
            "ref": "fn.lowerCase",
            "code": null
          }


        }
        ,
        {
          "functionName": "fn_count",
          "blockName": "count",
          "library": "fn",
          "inputs": [
            {
              name: "list",
              type: null
            }
          ],
          "outputs": [
            {
              "name": "nbItems",
              "type": "number"
            }
          ],
          "function": {
            "ref": "fn.count",
            "code": null
          }


        },
        {
          "functionName": "cts_andQuery",
          "blockName": "andQuery",
          "library": "cts",
          "inputs": [
            {
              name: "query1",
              type: "cts:query"
            },
            {
              name: "query2",
              type: "cts:query"
            },
            {
              name: "query3",
              type: "cts:query"
            },
            {
              name: "query4",
              type: "cts:query"
            }
          ],
          "outputs": [
            {
              "name": "query",
              "type": "cts:query"
            }
          ],
          "function": {
            "ref": null,
            "code": "let queries = [];" +
              "    if(this.getInputData(0)!=undefined) queries.push(this.getInputData(0));" +
              "    if(this.getInputData(1)!=undefined) queries.push(this.getInputData(1));" +
              "    if(this.getInputData(2)!=undefined) queries.push(this.getInputData(2));" +
              "    if(this.getInputData(3)!=undefined) queries.push(this.getInputData(3));" +
              "    this.setOutputData( 0, cts.andQuery(queries));"
          }


        },
        {
          "functionName": "cts_orQuery",
          "blockName": "orQuery",
          "library": "cts",
          "inputs": [
            {
              name: "query1",
              type: "cts:query"
            },
            {
              name: "query2",
              type: "cts:query"
            },
            {
              name: "query3",
              type: "cts:query"
            },
            {
              name: "query4",
              type: "cts:query"
            }
          ],
          "outputs": [
            {
              "name": "query",
              "type": "cts:query"
            }
          ],
          "function": {
            "ref": null,
            "code": "let queries = [];" +
              "    if(this.getInputData(0)!=undefined) queries.push(this.getInputData(0));" +
              "    if(this.getInputData(1)!=undefined) queries.push(this.getInputData(1));" +
              "    if(this.getInputData(2)!=undefined) queries.push(this.getInputData(2));" +
              "    if(this.getInputData(3)!=undefined) queries.push(this.getInputData(3));" +
              "    this.setOutputData( 0, cts.orQuery(queries));"
          }


        },
        {
          "functionName": "cts_search",
          "blockName": "search",
          "library": "cts",
          "inputs": [
            {
              name: "query",
              type: "cts:query"
            }
          ],
          "outputs": [
            {
              "name": "results",
              "type": ""
            }
          ],
          "function": {
            "ref": "cts.search",
            "code": null
          }


        },
        {
          "functionName": "fn_stringJoin",
          "blockName": "String join",
          "library": "string",
          "inputs": [
            {
              name: "string*",
              type: "xs:string*"
            }
          ],
          "properties": [
            {
              name: "separator",
              type: "xs:string"
            }

          ],
          "outputs": [
            {
              "name": "joinedString",
              "type": "xs:string"
            }
          ],
          "function": {
            "ref": "fn.stringJoin",
            "code": null
          }
        },
        {
          "functionName": "mapValues",
          "blockName": "Map values",
          "library": "string",
          "inputs": [
            {
              name: "value",
              type: "xs:string"
            }
          ],
          "properties": [
            {
              name: "mapping",
              type: [{"source": "srcVal", "target": "targetVal"}]
            }

          ],
          "outputs": [
            {
              "name": "mappedValue",
              "type": "xs:string"
            }
          ],
          "function": {
            "ref": null,
            "code": "\
               let val = (this.getInputData(0)!=undefined)?this.getInputData(0):'';\
               let mappedValue = this.properties['mapping'].filter(item => {return item.source==val});\
                if(mappedValue.length >0) this.setOutputData( 0,mappedValue[0].target);\
                                      else  this.setOutputData( 0,null);"


          }
        }
        ,
        {
          "functionName": "cts_collectionQuery",
          "blockName": "collectionQuery",
          "library": "cts",
          "inputs": [
            {
              name: "collectionName",
              type: "xs:string"
            }
          ],
          "outputs": [
            {
              "name": "query",
              "type": "cts:query"
            }
          ],
          "function": {
            "ref": "cts.collectionQuery",
            "code": null
          }


        },
        {
          "functionName": "json_validate",
          "blockName": "Json (schema) validate*",
          "library": "controls",
          "inputs": [
            {
              name: "node",
              type: "node"
            }
          ],
          "outputs": [
            {
              "name": "node",
              "type": "node"
            }
          ],
          "function": {
            "ref": null,
            "code": null
          }


        },
        {
          "functionName": "schematron_validate",
          "blockName": "Schematron validation*",
          "library": "controls",
          "inputs": [
            {
              name: "doc",
              type: null
            }
          ],
          "outputs": [
            {
              "name": "SVRL",
              "type": "node"
            }
          ],
          "function": {
            "ref": null,
            "code": null
          }


        },
        {
          "functionName": "isNumber",
          "blockName": "isNumber*",
          "library": "controls",
          "inputs": [
            {
              name: "value",
              type: null
            }
          ],
          "outputs": [
            {
              "name": "status",
              "type": "bool"
            }
          ],
          "function": {
            "ref": null,
            "code": null
          }


        },
        {
          "functionName": "isDate",
          "blockName": "isDate*",
          "library": "controls",
          "inputs": [
            {
              name: "value",
              type: null
            }
          ],
          "outputs": [
            {
              "name": "status",
              "type": "bool"
            }
          ],
          "function": {
            "ref": null,
            "code": null
          }


        },
        {
          "functionName": "isInDictionnary",
          "blockName": "isInDictionnary*",
          "library": "controls",
          "inputs": [
            {
              name: "value",
              type: null
            }
          ],
          "outputs": [
            {
              "name": "status",
              "type": "bool"
            }
          ],
          "function": {
            "ref": null,
            "code": null
          }


        },
        {
          "functionName": "checkRequiredFields",
          "blockName": "checkRequiredFields*",
          "library": "controls",
          "inputs": [
            {
              name: "node",
              type: null
            }
          ],
          "outputs": [
            {
              "name": "status",
              "type": "bool"
            }
          ],
          "function": {
            "ref": null,
            "code": null
          }


        }
        ,
        {
          "functionName": "cts_jsonPropertyValueQuery",
          "blockName": "jsonPropertyValueQuery",
          "library": "cts",
          "inputs": [
            {
              name: "property",
              type: "xs:string"
            },
            {
              name: "value",
              type: "xs:string"
            }
          ],
          "outputs": [
            {
              "name": "query",
              "type": "cts:query"
            }
          ],
          "function": {
            "ref": "cts.jsonPropertyValueQuery",
            "code": null
          }


        }
        ,

        {
          "functionName": "applyXSLT",
          "blockName": "Apply XSLT*",
          "library": "transform",
          "inputs": [
            {
              "name": "doc",
              "type": "node"
            }

          ],
          "outputs": [

            {
              name: "doc",
              type: "node"
            }
          ],
          "function": {
            "ref": null,
            "code": ""
          }

        },
        {
          "functionName": "addProperty",
          "blockName": "Add property",
          "library": "transform",
          "inputs": [
            {
              "name": "doc",
              "type": "node"
            },
            {
              "name": "value",
              "type": null
            }

          ],

          "properties": [
            {
              name: "propertyName",
              type: "Property name"
            }

          ],
          "outputs": [

            {
              name: "doc",
              type: "node"
            }
          ],
          "function": {
            "ref": null,
            "code": "let doc = (this.getInputData(0)!=undefined)?this.getInputData(0):''; \
                        let val = (this.getInputData(1)!=undefined)?this.getInputData(1):'';\
                        let propertyName = this.properties['propertyName'];\
                        doc[propertyName] = val;\
                        this.setOutputData( 0, doc);"
          }

        },
        {
          "functionName": "array",
          "blockName": "Array",
          "library": "basic",
          "inputs": [

            {
              name: "item1",
              type: null
            }, {
              name: "item2",
              type: null
            }, {
              name: "item3",
              type: null
            }, {
              name: "item4",
              type: null
            }, {
              name: "item5",
              type: null
            }

          ],
          "outputs": [

            {
              name: "array",
              type: null
            }
          ],
          "function": {
            "ref": null,
            "code": ""
          }

        },
        {
          "functionName": "uuidString",
          "blockName": "uuid",
          "library": "string",
          "inputs": [],

          "widgets": [
            {
              "type": "text",
              "name": "prefix",
              "default": "/prefix/",
              "values": []

            }

          ],
          "properties": [],
          "outputs": [

            {
              name: "uuid",
              type: null
            }
          ],
          "function": {
            "ref": null,
            "code": ""
          }

        },
        {
          "functionName": "provo",
          "blockName": "PROV-O structure",
          "library": "provenance",
          "inputs": [
            {
              "name": "DerivedFrom1",
              "type": null
            },
            {
              "name": "DerivedFrom2",
              "type": null
            },
            {
              "name": "DerivedFrom3",
              "type": null
            },
            {
              "name": "GeneratedBy",
              "type": null
            },
            {
              "name": "createdOn",
              "type": null
            }

          ],

          "properties": [],
          "outputs": [

            {
              name: "PROV-O",
              type: "node"
            }
          ],
          "function": {
            "ref": null,
            "code": "let from1 = (this.getInputData(0)!=undefined)?this.getInputData(0):null; \
                        let from2 = (this.getInputData(1)!=undefined)?this.getInputData(1):null;\
                        let from3 = (this.getInputData(1)!=undefined)?this.getInputData(2):null;\
                        let generatedBy = (this.getInputData(1)!=undefined)?this.getInputData(3):null;\
                        let createdOn = (this.getInputData(1)!=undefined)?this.getInputData(4):null;\
                        let doc = {derivedFrom:[]};\
                        if(from1) doc.derivedFrom.push(from1);\
                        if(from2) doc.derivedFrom.push(from2);\
                        if(from3) doc.derivedFrom.push(from3);\
                        doc.generatedBy = generatedBy;\
                        doc.createdOn = createdOn;\
                        this.setOutputData( 0, doc);"
          }

        }
      ]

      this.registerBlocksByConf(configs, LiteGraph)

      this.$axios.get('/statics/userblockDefs.json')
        .then((response) => {

          this.registerBlocksByConf(response.data, LiteGraph)

        })


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

      this.discoverCollections()
    }
    ,
    created() {
      this.$root.$on('blockRequested', this.createBlock)

    }

  }
</script>


<style>
</style>
