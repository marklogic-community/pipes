'use strict';
//Copyright ©2020 MarkLogic Corporation.
var LiteGraph = require("/custom-modules/pipes/designtime/litegraph").LiteGraph;
var userBlocks = require("/custom-modules/pipes/runtime/user.sjs");
var coreBlocks = require("/custom-modules/pipes/designtime/core.sjs");
const coreFunctions = require("/custom-modules/pipes/runtime/coreFunctions.sjs")
var registeredNodeType=false;
var graph =null;

const TRACE_ID = "pipes-graphHelper";
const TRACE_ID_DETAILS = "pipes-graphHelper-details";

function extractModelByCollectionMatch(collectionsRoot){
  let models =[]
  for (let coll of cts.collectionMatch(collectionsRoot + "*")){
    let model={
      name : coll,
      fields : []

    }
    for (let node of fn.head(fn.collection(coll)).xpath("//*"))
      model.fields.push(fn.nodeName(node))

    models.push(model)
  }

  return models
}

function createGraphNodeFromModel(blockDef) {
  let block = function () {
    xdmp.log("INITIALIZE BLOCKDEF");
    this.blockData = {}
    this.blockData.prov = new Set()
    this.blockData.blockDef = Object.assign({}, blockDef, {})
    this.blockData.doc = {
      input: {},
      output: {}
    }

    this.blockData.ioSetup = {
      inputs: {
        _count: 0
      },
      outputs: {
        _count: 0
      }
    }

    if (this.blockData.blockDef.options.indexOf("getByUri") > -1) {
      this.blockData.ioSetup.inputs["Uri"] = this.blockData.ioSetup.inputs._count++;
      this.addInput("Uri", "xs:string");
    }

    if (this.blockData.blockDef.options.indexOf("nodeInput") > -1) {
      this.blockData.ioSetup.inputs["Node"] = this.blockData.ioSetup.inputs._count++;
      this.addInput("Node", "Node");
    }

    if (this.blockData.blockDef.options.indexOf("nodeOutput") > -1) {
      this.blockData.ioSetup.outputs["Node"] = this.blockData.ioSetup.outputs._count++;
      this.blockData.ioSetup.outputs["Prov"] = this.blockData.ioSetup.outputs._count++;
      this.addOutput("Node", "Node");
      this.addOutput("Prov", null);
    }

    if (this.blockData.blockDef.options.indexOf("fieldsOutputs") > -1) {
      for (let field of blockDef.fields) {
        this.blockData.ioSetup.outputs[field.path] = this.blockData.ioSetup.outputs._count++;
        this.addOutput(field.field, "xs:string");
      }
    }

    if (blockDef.options.indexOf("fieldsInputs") > -1) {
      for (let field of blockDef.fields) {
        this.blockData.ioSetup.inputs[field.path] = this.blockData.ioSetup.inputs._count++;
        this.addInput(field.field, "xs:string");
      }
    }
    this["WithInstanceRoot"] = this.addWidget("toggle", "WithInstanceRoot", true, function (v) {
    }, {on: "enabled", off: "disabled"});
    this.serialize_widgets = true;
  }
  block.title = blockDef.collection;
  block.nodeType = blockDef.collection;
  block.prototype.getRuntimeLibraryFunctionName = function () {
    return "executeSourceBlock";
  }

  block.prototype.addBlockDataAsProperties = function () {
    return this.blockData;
  }

  block.prototype.onExecute = function(){
    xdmp.log("JOSTEST");
    xdmp.log(this.blockData.blockDef);
    xdmp.log("KLAAR");
    coreFunctions.executeBlock(this);
  }
  return block;
}

function executeGraphStep(doc,uri,config,context){
  return executeGraphFromJson(config,uri,doc,context)
}




function executeGraphFromJson(jsonGraph,uri, input,context){
  if( registeredNodeType === false ) {
    for (let model of jsonGraph.models)
      LiteGraph.registerNodeType(model.source + "/" + model.collection, createGraphNodeFromModel(model));
    //userBlocks.initUserBlocks(LiteGraph);
    coreBlocks.init(LiteGraph);
    userBlocks.init(LiteGraph);
    graph = new LiteGraph.LGraph();
    // graph.configure(jsonGraph.executionGraph)
    registeredNodeType=true
  }
  let arr = Object.keys(LiteGraph.registered_node_types)
  arr.unshift("Start registered blocks:");
  arr.push("End registered blocks");
  xdmp.trace(TRACE_ID_DETAILS,Sequence.from(arr));

  const errors = graph.configure(jsonGraph.executionGraph)
  if ( errors.length > 0 ) {
    const str = "The following blocks are not found: "+errors.join()
    xdmp.trace(TRACE_ID_DETAILS,str);
    throw Error(str);
  }
  graph.addInput("input", "");
  graph.addInput("uri", "");
  graph.addInput("collections", "");
  graph.addInput("permissions", "");
  graph.addInput("context", "");
  graph.addOutput("output", "");
  graph.setInputData("input",input)
  graph.setInputData("uri",uri)
  graph.setInputData("collections", xdmp.documentGetCollections(uri))
  graph.setInputData("permissions", xdmp.documentGetPermissions(uri))
  graph.setInputData("context",context)
  graph.start();

  return graph.getOutputData("output")
}

module.exports = {
  extractModelByCollectionMatch,
  createGraphNodeFromModel,
  executeGraphFromJson,
  executeGraphStep
};
