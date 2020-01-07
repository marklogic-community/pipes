//Copyright ©2020 MarkLogic Corporation.
var LiteGraph = require("/custom-modules/pipes/litegraph").LiteGraph;
var userBlocks = require("/custom-modules/pipes/user");
var coreBlocks = require("/custom-modules/pipes/core");
var registeredNodeType=false
var graph =null

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
    this.prov=new Set()
    this.blockDef = Object.assign({}, blockDef, {})
    this.doc = {
      input: {},
      output: {}
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
      this.addInput("Uri", "xs:string");
    }

    if (this.blockDef.options.indexOf("nodeInput") > -1) {
      this.ioSetup.inputs["Node"] = this.ioSetup.inputs._count++;
      this.addInput("Node", "Node");
    }

    if (this.blockDef.options.indexOf("nodeOutput") > -1) {
      this.ioSetup.outputs["Node"] = this.ioSetup.outputs._count++;
      this.ioSetup.outputs["Prov"] = this.ioSetup.outputs._count++;
      this.addOutput("Node", "Node");
      this.addOutput("Prov", null);
    }

    if (this.blockDef.options.indexOf("fieldsOutputs") > -1) {
      for (let field of blockDef.fields) {
        this.ioSetup.outputs[field.path] = this.ioSetup.outputs._count++;
        this.addOutput(field.field, "xs:string");
      }
    }

    if (blockDef.options.indexOf("fieldsInputs") > -1) {
      for (let field of blockDef.fields) {
        this.ioSetup.inputs[field.path] = this.ioSetup.inputs._count++;
        this.addInput(field.field, "xs:string");
      }
    }
    this["WithInstanceRoot"] = this.addWidget("toggle","WithInstanceRoot", true, function(v){}, { on: "enabled", off:"disabled"} );
    this.serialize_widgets = true;
  }

  block.title = blockDef.collection;
  block.nodeType = blockDef.collection;


  block.prototype.onExecute = function(){


    if (this.blockDef.options.indexOf("nodeInput")>-1) {


      if(this.getInputData(this.ioSetup.inputs["Node"] )!=null) {
        let inputNode = this.getInputData(this.ioSetup.inputs["Node"]);
        //if(xdmp.nodeKind(inputNode)=='document') inputNode = inputNode.toObject();
        //  if(xdmp.nodeKind(inputNode)!='document')  inputNode = xdmp.toJSON(inputNode);
        this.doc.input = inputNode;
        //if(fn.count(this.doc.input)==1 && xdmp.type(this.doc.input )=="untypedAtomic" && xdmp.nodeKind(this.doc.input)!="document")

        if(!this.doc.input.toObject) {

          this.doc.input = fn.head(xdmp.unquote(String(this.doc.input)))
        }
      }
    }
    if (this.blockDef.options.indexOf("getByUri")>-1)
      if(this.getInputData(this.ioSetup.inputs["Uri"])!=null)
        this.input.doc = fn.head(fn.doc(this.getInputData(this.ioSetup.inputs["Uri"]))).toObject();

    // if (blockDef.options.indexOf("fieldsOutputs") > -1) {

    let docNode = this.doc.input //xdmp.toJSON(this.doc.input);

    for (let i = 0; i < this.blockDef.fields.length; i++) {


      if (this.blockDef.options.indexOf("nodeInput") > -1) {
        //let docNodeRoot = docNode.xpath("/*/name(.)")
        //let start = this.blockDef.fields[i].path.indexOf("/" + docNodeRoot)
        //this.blockDef.fields[i].path=this.blockDef.fields[i].path.substring(start)
        let path = "." + this.blockDef.fields[i].path
        let v= docNode.xpath(path)
        if(v==null || fn.count(v)==0) {
          //let last = path.lastIndexOf("array-node()/object-node()")
          // if (fn.matches(path, "array-node\\('[\\s\\w]*'\\)/object-node\\(\\)")) {
          let last = path.substring(path.lastIndexOf("array-node")).substring(path.indexOf("/object-node"))
          path = "./" + path.substring(last + 12)
          v = docNode.xpath(path)
          if (v==null || fn.count(v) == 0) {
            path = "./" + path.substring(path.lastIndexOf("/"))
          }
          //}
        }
        let children = docNode.xpath( path + "//*")
        if(fn.count(children)>1)
          v= docNode.xpath(path).toArray();
        else
          v=   docNode.xpath( path + "/string()");
        this.doc.output[this.blockDef.fields[i].field] = v




        /* let v = docNode.xpath("//" + this.blockDef.fields[i]);
         if (fn.count(v) == 1 && v.constructor != Array) v = docNode.xpath("//" + this.blockDef.fields[i] + "/string()");
         this.doc.output[this.blockDef.fields[i]] = (v != null) ? v : null;*/
      }

      if (this.blockDef.options.indexOf("fieldsInputs") > -1) {
        //  if (this.getInputData(this.ioSetup.inputs[blockDef.fields[i].path]) != undefined) {

        let v = this.getInputData(this.ioSetup.inputs[this.blockDef.fields[i].path])
        this.doc.output[this.blockDef.fields[i].field] = v ;
        try {
          let srcUri = fn.baseUri(v);
          if(srcUri!=null) this.prov.add(String(srcUri))
        }
        catch(error) {
          //this.prov.push(error)
        }

      }  //}
      if (this.blockDef.options.indexOf("fieldsOutputs") > -1)
        this.setOutputData(this.ioSetup.outputs[blockDef.fields[i].path], this.doc.output[this.blockDef.fields[i].field]);

    }
    //}

    if (blockDef.options.indexOf("nodeOutput") > -1) {
      let out = {};
      if(this["WithInstanceRoot"].value == true){
        out[this.blockDef.collection] = this.doc.output
        out["info"] = {
          "title" : this.blockDef.collection,
          "version" : "0.0.1" //TODO make it dynamic

        }
      }
      else{

        out= this.doc.output
      }
      this.setOutputData(this.ioSetup.outputs["Node"], out);

      this.setOutputData(this.ioSetup.outputs["Prov"], Array.from(this.prov));
    }

  }


  return block



}

/*
function createGraphNodeFromModel(model){

    let nodeCode = fn.concat(model.fields.map(function(item){return 'this.addOutput("' + item + '","string");'}))
    let node = new Function('{this.addInput("Node","Node");' + nodeCode + '}')

    let execCode = '{let doc = this.getInputData(0).toObject();'

    for(let i=0;i<model.fields.length;i++)
        execCode+='this.setOutputData( ' + i + ', doc['+ model.fields[i] + ']);'
    execCode +='}'
    node.prototype.onExecute = new Function(execCode)

    node.title = model.name;

    return node
}
*/

function executeGraphStep(doc,uri,config,context){



  return executeGraphFromJson(config,uri,doc,context)

}




function executeGraphFromJson(jsonGraph,uri, input,context){


//console.log(context)
  // let markLogicNodes = require("/lib/marklogicNodes")



  /*
  Library refactoring
  var core = require("/custom-modules/core");
  var user = require("/custom-modules/user");
  core
  user.init(LiteGraph);
  */




  if(registeredNodeType==false) {
    for (let model of jsonGraph.models)
      LiteGraph.registerNodeType(model.source + "/" + model.collection, createGraphNodeFromModel(model));
    //userBlocks.initUserBlocks(LiteGraph);
    coreBlocks.init(LiteGraph);
    userBlocks.init(LiteGraph);
    graph = new LiteGraph.LGraph();
    graph.configure(jsonGraph.executionGraph)
    registeredNodeType=true
  }


  graph.stop()


  graph.addInput("input", "");
  graph.addInput("uri", "");
  graph.addInput("collections", "");
  graph.addInput("context", "");
  graph.addOutput("output", "");
  graph.setInputData("input",input)
  graph.setInputData("uri",uri)
  graph.setInputData("collections", xdmp.documentGetCollections(uri))
  graph.setInputData("context",context)
  graph.start();

  return graph.getOutputData("output")
}//graph.global_outputs


module.exports = {
  extractModelByCollectionMatch,
  createGraphNodeFromModel,
  executeGraphFromJson,
  executeGraphStep
};
