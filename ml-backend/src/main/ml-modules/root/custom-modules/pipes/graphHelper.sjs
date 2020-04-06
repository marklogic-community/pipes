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


  block.prototype.onCodeGeneration =  function(tempVarPrefix,inputVariables,outputVariables,propertiesWidgets) {
    let code  = [];
    code.push("let "+tempVarPrefix+"doc = {};");
    if (this.blockDef.options.indexOf("nodeInput") > -1) {
        code.push("if ("+inputVariables['input'+this.ioSetup.inputs["Node"]]+" != null) {");
        code.push(" "+tempVarPrefix+"doc = "+inputVariables["input"+this.ioSetup.inputs["Node"]]+";");
        code.push(" if ("+tempVarPrefix+"doc.toObject) {");
        code.push("  "+tempVarPrefix+"doc = fn.head(xdmp.unquote(String("+tempVarPrefix+"doc)));")
        code.push(" }");
        code.push("}")
    }
    if (this.blockDef.options.indexOf("getByUri") > -1) {
          code.push("if ("+inputVariables.byIndex[this.ioSetup.inputs["Uri"]]+" != null) {");
          code.push(" "+tempVarPrefix+"doc = fn.head(fn.doc("+inputVariables["input"+this.ioSetup.inputs["Uri"]]+")).toObject();");
          code.push("}");
    }
    code.push("let "+tempVarPrefix+"prov = null;");
    for (let i = 0; i < this.blockDef.fields.length; i++) {
      code.push("let "+tempVarPrefix+"output"+i+" = null;");
      if (this.blockDef.options.indexOf("nodeInput") > -1) {
        let path = "." + this.blockDef.fields[i].path;
        path = path.replace(/'/g,"\\'")
        code.push("let "+tempVarPrefix+"path"+i+" = '"+path+"';");
        code.push("let "+tempVarPrefix+"v"+i+" = "+tempVarPrefix+"doc.xpath('"+path+"')");
        code.push("if ( "+tempVarPrefix+"v"+i+" == null || fn.count( "+tempVarPrefix+"v"+i+" ) == 0) {");
        code.push(" let "+tempVarPrefix+"last"+i+" = "+tempVarPrefix+"path"+i+".substring("+tempVarPrefix+"path"+i+".lastIndexOf('array-node')).substring("+tempVarPrefix+"path"+i+".indexOf('object-node'))");
        code.push(" "+tempVarPrefix+"path"+i+" =  './' + "+tempVarPrefix+"path"+i+".substring("+tempVarPrefix+"last"+i+" + 12)");
        code.push(" "+tempVarPrefix+"v"+i+" = "+tempVarPrefix+"doc.xpath("+tempVarPrefix+"path"+i+");");
        code.push("  if ( "+tempVarPrefix+"v"+i+" == null || fn.count("+tempVarPrefix+"v"+i+") == 0) {");
        code.push("   "+tempVarPrefix+"path"+i+" = './'+" + tempVarPrefix+"path"+i+".substring("+tempVarPrefix+"path"+i+".lastIndexOf('/'));");
        code.push("  }");
        code.push("}");
        code.push("let "+tempVarPrefix+"children"+i+" = "+tempVarPrefix+"doc.xpath( "+tempVarPrefix + "path"+i+"+'//*')");
        code.push("if ( fn.count("+tempVarPrefix+"children"+i+") > 1 ) {");
        code.push(" "+tempVarPrefix+"v"+i+" = "+tempVarPrefix+"doc.xpath("+tempVarPrefix+"path"+i+").toArray();");
        code.push("}");
        code.push("else {");
        code.push(" "+tempVarPrefix+"v"+i+" = "+tempVarPrefix+"doc.xpath("+tempVarPrefix+"path"+ i + '+"/string()");');
        code.push("}");
        code.push(tempVarPrefix+"output"+i+" = "+tempVarPrefix+"v"+i+";");
      }
      if (this.blockDef.options.indexOf("fieldsInputs") > -1) {
        code.push("let "+tempVarPrefix+"v"+i+" = "+inputVariables["input"+this.ioSetup.inputs[this.blockDef.fields[i].path]]+";");
        code.push(tempVarPrefix+"doc['"+this.blockDef.fields[i].field+"'] = "+tempVarPrefix+"v"+i+";");
        code.push("try {");
        code.push(" let "+tempVarPrefix+"srcUri"+i+" = fn.baseUri("+tempVarPrefix+"v"+i+");");
        code.push(" if( "+tempVarPrefix+"srcUri"+i+" != null ) { "+tempVarPrefix+"prov.add(String(srcUri)); }");
        code.push("}");
        code.push("catch (error) {");
        code.push("}");
      }
      if (this.blockDef.options.indexOf("fieldsOutputs") > -1) {
        code.push("const "+outputVariables["output"+this.ioSetup.outputs[blockDef.fields[i].path]] + " = "+tempVarPrefix+"output"+i+"; ");
      }
    }
    if (blockDef.options.indexOf("nodeOutput") > -1) {
      code.push("let "+tempVarPrefix+"out = {};");
      if(propertiesWidgets.widgets.WithInstanceRoot == true) {
        code.push(tempVarPrefix+"out['"+this.blockDef.collection+"'] = "+tempVarPrefix+"doc;");
        code.push(tempVarPrefix+"out['info'] = { 'title' : '"+this.blockDef.collection+"', 'version' : '0.0.1'  };");
      }
      else {
        code.push(tempVarPrefix+"out  = "+tempVarPrefix+"doc;");
      }
      code.push("const "+outputVariables['output'+this.ioSetup.outputs["Node"]]+" = "+tempVarPrefix+"out;");
      code.push("const "+outputVariables['output'+this.ioSetup.outputs["Prov"]]+"  = "+tempVarPrefix+"prov;");
    }
    return code;
  }

  block.prototype.onExecute = function(){
    xdmp.log("Exeecuting "+this.title);

    if (this.blockDef.options.indexOf("nodeInput")>-1) {


      if(this.getInputData(this.ioSetup.inputs["Node"] )!=null) {
        let inputNode = this.getInputData(this.ioSetup.inputs["Node"]);
        //if(xdmp.nodeKind(inputNode)=='document') inputNode = inputNode.toObject();
        //  if(xdmp.nodeKind(inputNode)!='document')  inputNode = xdmp.toJSON(inputNode);
        this.doc.input = inputNode;
        //if(fn.count(this.doc.input)==1 && xdmp.type(this.doc.input )=="untypedAtomic" && xdmp.nodeKind(this.doc.input)!="document")

        if(!this.doc.input.toObject) {

          this.doc.input = fn.head(xdmp.unquote(JSON.stringify(this.doc.input)))
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

          if(docNode && fn.exists(docNode.xpath("./.."))) {
            let root = fn.head(docNode.xpath(".//name(.)"))
            let rootPos = path.indexOf(root + "/")
            if(rootPos >=0) {
              path = "." + path.substring(rootPos + root.length)
            }else {

              rootPos = path.indexOf(root)
              if(path.substring(rootPos).indexOf("/")<0)
                path = path.substring(path.lastIndexOf("/"))

            }
          }

          /*
          //let last = path.lastIndexOf("array-node()/object-node()")
          // if (fn.matches(path, "array-node\\('[\\s\\w]*'\\)/object-node\\(\\)")) {
          let last = path.substring(path.lastIndexOf("array-node")).substring(path.indexOf("/object-node"))
          path = "./" + path.substring(last + 12)
          v = docNode.xpath(path)
          if (v==null || fn.count(v) == 0) {
            path = "./" + path.substring(path.lastIndexOf("/"))
          }
          //}

           */
        }
        let children = docNode.xpath( path + "//*")
        if(fn.count(children)>1)
          v= docNode.xpath(path).toArray();
        else
          v=   docNode.xpath( path + "/string()");


        xdmp.log(path)
        this.doc.output[this.blockDef.fields[i].field] =  v




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
    // graph.configure(jsonGraph.executionGraph)
    registeredNodeType=true
  }


  // graph.stop()

  graph.configure(jsonGraph.executionGraph)



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
