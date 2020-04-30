// Copyright ©2020 MarkLogic Corporation.
const BLOCK_OPTION_FIELDS_INPUT = "fieldsInputs"
const BLOCK_OPTION_NODE_OUTPUT = "nodeOutput"
const BLOCK_OPTION_NODE_INPUT = "nodeInput"
const BLOCK_OPTION_FIELDS_OUTPUT = "fieldsOutputs"
const BLOCK_OPTIONS_DOC_BY_URI = 'getByUri'
// TODO IMPORT THESE INSTEAD FROM constants.js

const LiteGraphHelper = {

  data() {},

  methods: {

   graphStatistics: function(liteGraph) {
      console.log("========================")
      var blockArray = []
      var g = liteGraph
      console.log("Graph contains " + g.nodes.length + " nodes:")
      var blockMap = new Map();
      for (var n = 0; n < g.nodes.length; n++) {
      var val = blockMap.get( g.nodes[n].type )
      if ( val != undefined ) { blockMap.set(g.nodes[n].type,++val)
      } else {
        blockMap.set(g.nodes[n].type,1)
      }
        }
    // report results
        for (let nodeType of blockMap.keys()) {
          console.log(nodeType + " x" + blockMap.get(nodeType))
          blockArray.push(nodeType)
        }
       console.log("========================")
       return blockArray
    },

    remapBlocks: function(litegraph, graph) {

      var originalGraph = JSON.stringify(graph.executionGraph)
      var updatedGraph = JSON.stringify(graph.executionGraph)

      var thisGraphBlocks = this.graphStatistics(graph.executionGraph)
      var liteGraphRegisteredBlocks = litegraph.getRegisteredNodes()

      var blocksToReplace = []

      for (var b = 0; b < thisGraphBlocks.length; b++) {

        var blockMenuType = thisGraphBlocks[b].split("/")[0]
        // Only process core and user blocks. Source and Entity blocks are seperate
        if ( blockMenuType != 'Sources' && blockMenuType != 'Entities' ) {
          if ( ! liteGraphRegisteredBlocks.includes(thisGraphBlocks[b]) ) {
             // console.log("Graph contains " + thisGraphBlocks[b] + " which is not registered Litegraph")
              blocksToReplace.push( thisGraphBlocks[b] )
          }
        }
      }

      if ( blocksToReplace.length > 0 ) {
        updatedGraph = this.replaceBlocks(blocksToReplace,originalGraph)
      }

      return JSON.parse(updatedGraph)

    },

    replaceBlocks: function(oldblocks, origgraph) {

    var graph = origgraph

    console.log("Unknown/legacy blocks found. Remapping..")

    const DHF = "DHF"
    const GRAPH = "Graph"
    const GENERATE = "Generate"
    const VALIDATE = "Validate"
    const FIND = "Query"
    const FORMAT = "Format"
    const TRANSFORM = "Transform"

    const blockMapping =  new Map  ([
        ["dhf/input", DHF+ "/input"],
        ["dhf/output", DHF + "/output"],
        ["dhf/envelope", DHF + "/envelope"],
        ["dhf/declarativeMapper", DHF + "/declarativeMapper"],
        ["graph/subgraph", GRAPH + "/subgraph"],
        ["graph/input", GRAPH + "/input"],
        ["graph/output", GRAPH + "/output"],
        ["string/constant", GENERATE + "/constant"],
        ["controls/CheckPhoneNumber", VALIDATE + "/CheckPhoneNumber"],
        ["controls/XMLValidate", VALIDATE + "/XMLValidate"],
        ["controls/JsonValidate", VALIDATE + "/JsonValidate"],
        ["string/Templating", GENERATE + "/Templating"],
        ["basic/multicast", TRANSFORM + "/multicast"],
        ["geo/GeoReproject", TRANSFORM + "/GeoReproject"],
        ["transform/xpath", TRANSFORM + "/xpath"],
        ["string/Highlight", "Enrich/Highlight"],
        ["cts/ExpertQueryBuilder","Query/ExpertQueryBuilder"],
        ["string/EntityEnrichment", "Enrich/EntityEnrichment"],
        ["feature/EvalJavaScript","Advanced/EvalJavaScript"],
        ["string/Map values","Mapping/Map values"],
        ["feature/mapRangeValues","Mapping/mapRangeValues"],
        ["cts/search","Query/search"],
        ["string/NormalizeSpace","Clean/NormalizeSpace"],
        ["provenance/PROV-O structure", "Enrich/PROV-O structure"],
        ["date/Current Date","Generate/Current Date"],
        ["basic/Array","Join/Array"],
        ["transform/Add property", "Enrich/AddProperty"],
        ["string/uuid","Generate/uuid"],
        ["feature/DistinctValues", "Filter/DistinctValues"],
        ["fn/doc",FIND + "/doc"],
        ["feature/hashNode", GENERATE + "/hashNode"],
        ["feature/selectCase", "Mapping/selectCase"],
        ["feature/Doc By Key", FIND + "/Doc By Key"],
        ["string/RegExReplace",TRANSFORM + "/RegExReplace"],
        ["date/FormatDateAuto",FORMAT + "/FormatDateAuto"],
        ["date/FormatDate",FORMAT + "/FormatDate"],
        ["date/FormatDateTimeAuto",FORMAT + "/FormatDateTimeAuto"],
        ["feature/LookupCollectionPropertyValue",FIND +"/LookupCollectionPropertyValue"],
        ["feature/Lookup",FIND +"/Lookup"]
      ]);

    for (var b = 0; b < oldblocks.length; b++ ) {

     var oldBlockKey = oldblocks[b]
     var newBlockKey = blockMapping.get(oldBlockKey)

     if ( newBlockKey != undefined && newBlockKey !== null ) {
     console.log( "New mapping for " + oldBlockKey + " is " + newBlockKey )
     var re = new RegExp(oldBlockKey,"g");
     graph = graph.replace(re, newBlockKey);
     } else {
      console.log( "WARNING: No mapping found for block " + oldBlockKey + " - Graph will not run");
     }
    }
    return graph
    },

  listTheGraphBlocks: function(pipesModels) {
    console.log('Pipes Blocks contains: ' + pipesModels.length + " blocks:")
    for (var i = 0; i < pipesModels.length; i++) {
      console.log( pipesModels[i].source + "/" + pipesModels[i].label )
      console.log( JSON.stringify(pipesModels[i] ) )
    }
  },

  isblockInModelList: function(pipesModels, blockKey) {
      var isInList = false
      for (var i = 0; i < pipesModels.length; i++) {
        console.log("Checking against: " + pipesModels[i].source + "/" + pipesModels[i].label)
        if ( (pipesModels[i].source + "/" + pipesModels[i].label) == blockKey ) {
          isInList = true
          break
        }
      }
      console.log("Block " + blockKey + " " + (isInList ? "is" : "isn't") + " in the list" )
      return isInList
    },

    isblockOnGraph(liteGraph, blockKey) {
     const isOnGraph = liteGraph.findNodesByType(blockKey).length > 0
     console.log(blockKey + " is currently" + (isOngraph ? "" : " not") + " used on the graph")
     return isOnGraph
    },

    searchTree(element, blockKey){
      if(element.type == blockKey){
           return element;
      }else if (element.children != null){
           var i;
           var result = null;
           for(i=0; result == null && i < element.children.length; i++){
                result = searchTree(element.children[i], blockKey);
           }
           return result;
      }
      return null;
 },

 // returns true if a block is on the graph
  isblockOnGraph(liteGraph, blockKey) {
    var isOnGraph = false
    var g = liteGraph.serialize()
    return JSON.stringify( g ).includes(blockKey)
  },

  // Creates a LiteGraph node from a Pipes block definition
  createGraphNodeFromModel (blockDef) {

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

      if (this.blockDef.options.indexOf(BLOCK_OPTIONS_DOC_BY_URI) > -1) {
        this.ioSetup.inputs["Uri"] = this.ioSetup.inputs._count++;
        this.addInput("Uri");
      }

      if (this.blockDef.options.indexOf(BLOCK_OPTION_NODE_INPUT) > -1) {
        this.ioSetup.inputs["Node"] = this.ioSetup.inputs._count++;
        this.addInput("Node")
      }

      if (this.blockDef.options.indexOf(BLOCK_OPTION_NODE_OUTPUT) > -1) {
        this.ioSetup.outputs["Node"] = this.ioSetup.outputs._count++;
        this.ioSetup.outputs["Prov"] = this.ioSetup.outputs._count++;
        this.addOutput("Node", "Node");
        this.addOutput("Prov", null);
      }

      if (this.blockDef.options.indexOf(BLOCK_OPTION_FIELDS_OUTPUT) > -1) {
        for (let field of blockDef.fields) {
          //this.ioSetup.outputs[field] = this.ioSetup.outputs._count++;
          this.ioSetup.outputs[field.path] = this.ioSetup.outputs._count++;
          this.addOutput(field.field)
        }
      }

      if (blockDef.options.indexOf(BLOCK_OPTION_FIELDS_INPUT) > -1) {
        for (let field of blockDef.fields) {
          this.ioSetup.inputs[field.path] = this.ioSetup.inputs._count++;
          //this.ioSetup.inputs[field] = this.ioSetup.inputs._count++;
          this.addInput(field.field);
        }
      }
      this["WithInstanceRoot"] = this.addWidget("toggle", "WithInstanceRoot", true, function (v) {
      }, { on: "enabled", off: "disabled" });
      this.serialize_widgets = true;
      this.computeSize();
      this.size = [this.size[0] + 50, this.size[1] + 30]
    }

    block.title = blockDef.collection;
    if ( blockDef.metadata && blockDef.metadata.description != '' ) block.description = blockDef.metadata.description
    block.nodeType = blockDef.collection;
    return block
  },
  // Returns code block to register a LiteGraph node based on configuration (from core.json or user.json)
  createGraphNodeFromConfig(config,availableDatabases) {

    var blockCode = ''

    blockCode += "function " + config.functionName + "(){"
    blockCode += config.inputs.map((input) => {
      return "this.addInput('" + input.name + ((input.type == "ee") ? "','" + input.type + "');" : "');")
    }).join("")
    blockCode += config.outputs.map((output) => {
      return "this.addOutput('" + output.name + ((output.type == "ee") ? "','" + output.type + "');" : "');")
    }).join("")
    blockCode += (config.properties != null) ? config.properties.map((property) => {
      return "this.addProperty('" + property.name + ((property.type) ? "'," + JSON.stringify(property.type) + ");" : "');")
    }).join("") : ""
    blockCode += (config.widgets != null) ? config.widgets.map((widget) => {
      if (widget.default == "#DATABASES#") widget.values = availableDatabases.map(item => item.label)
      return "this.addWidget('" + widget.type + "','" + widget.name + "'," + ((typeof (widget.default) == "boolean") ? widget.default : "'" + widget.default + "'") + ", function(v){" + (widget.callback ? widget.callback : "") + "}.bind(this), { values:" + JSON.stringify(widget.values) + "} );"
    }).join("") : "";

    if (config.width)
    blockCode += "    this.size = [" + config.width + "," + config.height + "];\n"
    blockCode += "    this.serialize_widgets = true;"

    //blockCode += (config.properties)?"config.properties = " +  config.properties +";":"";
    blockCode += "};"

    if (config.title_color) blockCode += config.functionName + ".title_color = \"" + config.title_color + "\";"

    // Use title property, otherwise blockname for block title bar
    if ( config.title !== null && config.title != undefined ) {
      blockCode += config.functionName + ".title = '" + config.title + "';";
    } else {
      blockCode += config.functionName + ".title = '" + config.blockName + "';";
    }

    if (config.description && config.description != undefined) blockCode += config.functionName + ".description = '" + config.description + "';";

    // Add event to onConfigure for block when defined
    // !== undefined is required
    if (config.events && config.events != null && config.events != undefined) {
      if (config.events.onDrawForeground !== null && config.events.onDrawForeground != undefined && config.events.onDrawForeground != '') {
        blockCode += config.functionName + ".prototype.onDrawForeground = function(ctx){" + config.events.onDrawForeground + "};"
      }
      if (config.events.onConfigure !== null && config.events.onConfigure != undefined && config.events.onConfigure != '') {
        blockCode += config.functionName + ".prototype.onConfigure = function(node){" + config.events.onConfigure + "};"
      }
    }
    // beforePropSave event for validating block property editing
    if (config.events && config.events.beforePropSave && config.events.beforePropSave != undefined) {
      blockCode += config.functionName + ".prototype.beforePropSave = function(v,validation,ctx){" + config.events.beforePropSave + "};"
    }

    blockCode += config.functionName + ".prototype.notify = function(node){this.$root.$emit(\"nodeSelected\",node)}.bind(this);";
    blockCode += config.functionName + ".prototype.onSelected = function(){this.notify(this) };"
    blockCode += config.functionName + ".prototype.onDblClick = function(e,pos,object){this.$root.$emit(\"nodeDblClicked\",object) }.bind(this);"
    blockCode += config.functionName + ".prototype.onExecute = function(){  ";

    if (config.function != null && config.function.ref != null) {
      let i = 0;
      blockCode += "this.setOutputData( 0, " + config.function.ref + "(" + config.inputs.map((input) => {
        return "this.getInputData(" + i++ + ")"
      }).join(",") + "));"
    } else {
      blockCode += config.function.code;

    }
    blockCode += "};"
    blockCode += "LiteGraph.registerNodeType('" + config.library + "/" + config.blockName + "', " + config.functionName + " );"

    return blockCode
  },
// Graphs have duplicate blocks - analyse this
findDuplicateBlocks: function(pipesModels) {
  var checkArray = []
  for (var i = 0; i < pipesModels.length; i++) {
    if ( pipesModels[i].source == "Sources" || pipesModels[i].source == 'Entities' ) checkArray.push(pipesModels[i])
  }

  for (var i = 0; i < checkArray.length; i++) {
    var block = checkArray[i]
    for (var x = ++i; x < checkArray.length; x++) {
      if ( checkArray[x].label == block.label && checkArray[x].sources == block.sources  )
     // console.log("DUPLICATE: " + block.label + "/" + block.sources)
      if ( checkArray[x].fields.length == block.fields.length && checkArray[x].fields == block.fields ) {
    //    console.log("DUPLICATE NUMBER OF FIELDS")
      }
    }
  }

}

}

}

export default LiteGraphHelper
