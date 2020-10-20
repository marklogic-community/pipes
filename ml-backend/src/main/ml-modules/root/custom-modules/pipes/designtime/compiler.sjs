'use strict';

const SUBGRAPH_TYPE = "Graph/subgraph";

const cf = require('/custom-modules/pipes/runtime/coreFunctions.sjs');

function findStartNodes(graph,subgraphPath) {
  let type = subgraphPath === null ? 'DHF/input' : 'Graph/input';
  let startNodes = graph == null || graph.nodes == null ? null : graph.nodes.filter(x=>x.type===type).map(x=>x.id);
  startNodes = startNodes == null || startNodes.length === 0 ? null : startNodes;
  return startNodes;
}
function findFinalNodes(graph,subgraphPath) {
  let type = subgraphPath === null ? 'DHF/output' : 'Graph/output';
  let finalNodes = graph == null || graph.nodes == null ? null : graph.nodes.filter(x=>x.type===type).map(x=>x.id);
  finalNodes = finalNodes == null || finalNodes.length === 0 ? null : finalNodes;
  return finalNodes;
}

function validateStartNode(graph,startNodes,errors,subgraphPath,graphTitle) {
  if ( startNodes === null && subgraphPath === null ) {
    errors.push({ errorCode: "DHF_INPUT_NODE_NOT_FOUND",
      errorDescription:"DHF Input Node not found in "+graphTitle,graph});
    return false;
  }
  if ( startNodes === null && subgraphPath !== null ) {
    errors.push({ errorCode: "GRAPH_INPUT_NODE_NOT_FOUND",
      errorDescription:"Graph Input Node not found in "+graphTitle,graph});
    return false;
  }
  if ( graph === null && startNodes.length > 1 ) {
    errors.push({ errorCode: "DHF_INPUT_MULTIPLE_NODES_FOUND",
      errorDescription:"Multiple DHF Input Nodes found in "+graphTitle,graph});
    return false;
  }
  return true;
}
function validateFinalNode(graph,finalNodes,errors,subgraphPath,graphTitle) {
  if ( finalNodes == null ) {
    errors.push({ errorCode: "DHF_OUTPUT_NODE_NOT_FOUND",
      errorDescription:"DHF Output Node not found in "+graphTitle,graph});
    return false;
  }
  if ( graph === null && finalNodes.length > 1 ) {
    errors.push({ errorCode: "DHF_OUTPUT_MULTIPLE_NODES_FOUND",
      errorDescription:"Multiple DHF Output Nodes found in "+graphTitle,graph});
    return false;
  }
  return true;
}
function initLiteGraph(jsonGraph) {
  const userBlocks = require("/custom-modules/pipes/runtime/user.sjs");
  const coreBlocks = require("/custom-modules/pipes/designtime/core.sjs");
  const gHelper  = require("/custom-modules/pipes/designtime/graphHelper.sjs");
  xdmp.log("MODELS");
  xdmp.log(jsonGraph.models);
  for (let model of jsonGraph.models || []) {
    xdmp.log("CREATE MODEL "+model.source + "/" + model.collection);
    const block = gHelper.createGraphNodeFromModel(model)
    LiteGraph.registerNodeType(model.source + "/" + model.collection, block);
  }
  coreBlocks.init(LiteGraph);
  userBlocks.init(LiteGraph);
}

function allNodesSupportCodeGeneration(LiteGraph,graph,nodeGenerationOrder,errors,graphTitle) {
  let isError = false;
  for ( const nodeId of nodeGenerationOrder ) {
    let node = getNode(graph.nodes,nodeId);
    let type = node.type;
    if ( type === SUBGRAPH_TYPE || type === "Graph/input" || type === "Graph/output" || type === "DHF/input") {
      continue;
    }
    let bc = null;
    try {
      bc = new LiteGraph.registered_node_types[node.type]()
    } catch (e) {
      errors.push({ errorCode : "BLOCK_IMPL_NOT_FOUND", errorDescription: "Block implementation not found of "+type+" in "+graphTitle});
      isError = true;
      continue;
    }
    if (! ("getRuntimeLibraryFunctionName" in bc)) {
      errors.push({ errorCode : "BLOCK_DOES_NOT_SUPPORT_CODE_GENERATION", errorDescription: "Block implementation "+type+" does not support code generation in "+graphTitle});
      isError = true;
    }
  }
  return !isError;
}

function checkAndDecorateExecutionOrder(graph,subgraphPath,graphTitle) {
  let errors = [];
  // STEP 1: Check the start node
  const startNodes = findStartNodes(graph,subgraphPath);
  if ( !validateStartNode(graph,startNodes,errors,subgraphPath,graphTitle) ) {
    return {
      sourceCode : null,
      errors,
      graphTitle
    }
  }
  // STEP 2: Check the final node
  const finalNodes = findFinalNodes(graph,subgraphPath);
  if ( !validateFinalNode(graph,finalNodes,errors,subgraphPath,graphTitle) ) {
    return {
      sourceCode : null,
      errors,
      graphTitle
    }
  }
  // STEP 3: Build the flow graph
  const PipesFlowControlGraph = require("/custom-modules/pipes/designtime/compilerFlowControlGraph.sjs")
  const flowGraph = new PipesFlowControlGraph();
  flowGraph.initFromLiteGraph(LiteGraph,startNodes[0],finalNodes[0],graph);
  // STEP 4: Check there is a path between start node and end node
  let paths = []
  for ( const startNode of startNodes ) {
    for ( const finalNode of finalNodes ) {
      paths = paths.concat(flowGraph.getAllPaths(startNode,finalNode));
    }
  }
  if ( paths == null || paths.length == 0 ) {
    return {
      sourceCode : null,
      graphTitle,
      errors : [{ errorCode: "NO_PATH_FROM_DHF_INPUT_TO_OUTPUT",
        errorDescription:"There is no path between Input to Output in "+graphTitle
      }],
    }
  }
  // STEP 5: Check the remaining graph has no loop
  if ( flowGraph.isCyclic() ) {
    return {
      sourceCode : null,
      graphTitle,
      errors : [{ errorCode: "GRAPH_CONTAINS_LOOPS",
        errorDescription:"The graph contains loops in "+graphTitle
      }],
    };
  }

  // STEP 5: Determine code generation order
  const nodeGenerationOrder = flowGraph.determineNodeCodeGenerationOrder(paths);

  // STEP 6: Check all nodes in the paths support code generation
  if ( !allNodesSupportCodeGeneration(LiteGraph,graph,nodeGenerationOrder,errors,graphTitle)) {
    return { sourceCode: null, errors : errors};
  }
  graph.nodeGenerationOrder = nodeGenerationOrder;

  // STEP 7: Check all subgraphs in this graph
  const subgraphNodes = graph.nodes.filter( x=>x.type===SUBGRAPH_TYPE )
  for ( const subgraph of subgraphNodes ) {
    const path = subgraphPath === null ? String(subgraph.id) : subgraphPath+"_"+subgraph.id;
    subgraph.subgraph.subgraphPath = path;
    const subgraphTitle = "subgraph "+subgraph.title;
    const errorResponse = checkAndDecorateExecutionOrder(subgraph.subgraph,path,subgraphTitle);
    if ( errorResponse != null ) {
      return errorResponse;
    }
  }
  return null;
}

function compileGraphToJavaScriptWithOptions(jsonGraph,options) {

  // STEP 0: Init litegraph
  const LiteGraph = require("/custom-modules/pipes/designtime/litegraph").LiteGraph;
  initLiteGraph(jsonGraph);

  let errorResponse = checkAndDecorateExecutionOrder(jsonGraph.executionGraph,null,"main graph");

  if ( errorResponse !== null ) {
    return errorResponse;
  }

  let outputFunctions = []
  generateFunctionForGraph(options,jsonGraph.executionGraph,outputFunctions,null);
  return outputFunctions;
}

function generateFunctionForGraph(options,graph,outputFunctions,title) {
  let variablePool = [];
  const functionName = generateFunctionName(graph,title);
  const argList = generateFunctionArguments(graph,variablePool);
  let func = { functionName,argList,body:[],returnVar : null};
  let lib = {user: false, core:false};
  createReturnVariable(graph,variablePool,func);
  const inSubgraph = addSubgraphLoop(graph,func,variablePool);
  for (const nodeId of graph.nodeGenerationOrder ) {
    const node = getNode(graph.nodes,nodeId);
    xdmp.log("TYPE "+node.type);
    if ( node.type === SUBGRAPH_TYPE ) {
      xdmp.log("LOOP");
      xdmp.log(node.subgraph);
      generateFunctionForGraph(options,node.subgraph,outputFunctions,node.title);
    } else if ( node.type === "Graph/input" || node.type === "Graph/output") {
      // nothing to emit
      continue;
    }
    const inputs = determineInputVariables(graph,node,variablePool);
    const outputs = determineOutputVariables(graph,node,variablePool);
    xdmp.log("HERE44");
    xdmp.log(node.type);
    xdmp.log(outputs);
    xdmp.log("CLEAR");
    let code = generateCode(options,graph,node,inputs,outputs,lib);
    if ( inSubgraph ) {
      let identSpace = options.identSpaceCount ? options.identSpaceCount : 1;
      code = ident(code,identSpace);
    }
    func.body.push(...code);
  }
  addSubgraphEndLoop(graph,func,variablePool,options);
  outputFunctions.push(generateEntireFunction(options,lib,func));
  outputFunctions.reverse();
}

function createReturnVariable(graph,variablePool,func) {
  if ( graph.subgraphPath ) {
    func.returnVar = [];
    let outputNodes = graph.nodes.filter(x=>x.type==="Graph/output") ;
    outputNodes.sort((a, b) => a.id - b.id);
    for ( const node of outputNodes ) {
      const name = node.properties.name;
      let returnName = "result_"+name;
      if (variablePoolHasVariable(variablePool,returnName) ) {
        returnName = "result_"+name+"_"+graph.subgraphPath;
      }
      addToVariablePool(variablePool,returnName,returnName,-1);
      func.returnVar.push(returnName);
    }
  }
}

function addSubgraphEndLoop(graph,func,variablePool,options) {
  if ( graph.subgraphPath ) {
    let identSpace = options.identSpaceCount ? options.identSpaceCount : 1;
    let outputNodes = graph.nodes.filter(x=>x.type==="Graph/output") ;
    outputNodes.sort((a, b) => a.id - b.id);
    let counter = 0;
    for ( const v of func.returnVar) {
      xdmp.log("OUTPUTNODE");
      xdmp.log(outputNodes[counter]);
      const link = outputNodes[counter].inputs[0].link;
      const variableName = getNodeWithOutputLink(graph,link,variablePool).variableName
      const line = ""+v+".push("+variableName+");";
      func.body.push(...ident([line],identSpace));
      counter++;
    }
    func.body.push("}");
  }
}

function addSubgraphLoop(graph,func,variablePool) {
  if ( graph.subgraphPath ) {
    let inputNodes = graph.nodes.filter(x=>x.type==="Graph/input") ;
    inputNodes.sort((a, b) => a.id - b.id);
    const firstSubgraphInput = inputNodes[0];
    for ( const retVar of func.returnVar ) {
      func.body.push("let "+retVar+" = [];");
    }
    const variableName =  getVariableNameForSubgraphInput(graph,firstSubgraphInput,variablePool)
    const inputName = "list_"+variableName
    let snippet = `${inputName} = !(${inputName}.toArray || Array.isArray(${inputName})) ? [${inputName}] : ${inputName};
for ( const ${variableName} of ${inputName} ) {`
    func.body.push(...snippet.split('\n'))
    return true;
  }
  return false;
}


function generateEntireFunction(options,lib,func) {
  let identSpace = options.identSpaceCount ? options.identSpaceCount : 1;
  let newLine = options.newLine ? options.newLine : "\\n";
  let ret = [];
  ret.push("function "+func.functionName+"("+func.argList.join(",")+") {");
  if ( lib.core ) {
    ret.push(ident(["const r = require('/custom-modules/pipes/runtime/coreFunctions.sjs');"],identSpace));
  }
  if ( lib.user ) {
    ret.push(ident(["const u = require('/custom-modules/pipes/runtime/user.sjs');"],identSpace));
  }
  ret.push(...ident(func.body,identSpace));
  if ( func.returnVar ) {
    ret.push(ident(["return ["+func.returnVar+"];"],identSpace));
  }
  ret.push("}");
  return ret.join(newLine);
}
function generateReturnVar(graph) {
  if ( graph.subgraphPath ) {
    return "[TODO]";
  } else {
    return null;
  }
}

function generateFunctionName(graph,title) {
  let titleString = title ? "_"+title : "";
  return graph.subgraphPath ? "executeSubgraph"+graph.subgraphPath + titleString : "executeCustomStep";
}

function generateFunctionArguments(graph,variablePool) {
  if ( graph.subgraphPath ) {
    let args = [];
    let counter = 0;
    let inputs = graph.nodes.filter(x=>x.type==="Graph/input") ;
    inputs.sort((a, b) => a.id - b.id);
    for ( const node of inputs) {
      const prefix = counter == 0 ? "list_" : "";
      args.push(prefix+createVariableNameForSubgraphInput(graph,node,variablePool));
      counter++;
    }
    return args;
  } else {
    let inputNode = graph.nodes.filter(x=>x.type==='DHF/input')[0]
    const params = [
      "input",
      "uri",
      "collections",
      "context",
      "permissions"
    ];
    for ( const p of params ) {
      addToVariablePool(variablePool,p,p,inputNode);
    }
    return params;
  }
}

function getVariableNameForSubgraphInput(graph,subgraphInputNode,variablePool) {
  const nodeId = subgraphInputNode.id;
  const lookupName = subgraphInputNode.properties.name;
  xdmp.log("NodeID="+nodeId+" lookup="+lookupName);
  const found =  variablePool.find(x=>x.lookup === lookupName  && x.nodeId === nodeId );
  if ( found ) {
    return found.varName;
  }
  return null;
}

function createVariableNameForSubgraphInput(graph,subgraphInputNode,variablePool) {
  let name = subgraphInputNode.properties.name.match(/[0-9a-zA-Z_]+/g).join("");
  if ( variablePoolHasVariable(variablePool,name)) {
    name = name + "_"+graph.subgraphPath;
  }
  addToVariablePool(variablePool,name,subgraphInputNode.properties.name,subgraphInputNode);
  return name;
}

function variablePoolHasVariable(variablePool,varName) {
  return variablePool.some( x => x.varName === varName )
}
function addToVariablePool(variablePool,varName,lookup,node) {
  variablePool.push({ varName, lookup, nodeId : node.id })
};


function ident(sourceCodeArray,identSpace) {
  if (identSpace === 0 || identSpace < 0 ) {
    return sourceCodeArray;
  }
  let ident = " ".repeat(identSpace);
  let arr=[];
  for ( const line of sourceCodeArray ) {
    xdmp.log("LINE2");
    xdmp.log(line);
    const identiation = ident.repeat(line.search(/\S|$/) + 1);
    arr.push(identiation+line);
  }
  return arr;
}
function createVariableName(node,index,inputOutput,variablePool) {
  let lookup = inputOutput.name.match(/[0-9a-zA-Z_]+/g).join("");
  let found = variablePool.find(x=>x.lookup === lookup && x.nodeId === node.id );
  if ( found ) {
    return found.varName;
  }
  let name = lookup;
  if ( variablePoolHasVariable(variablePool,"var_"+name)) {
    name = "var_"+node.id+"_"+index+"_"+name;
  } else {
    name = "var_"+name;
  }
  addToVariablePool(variablePool,name,lookup,node);
  return  name;
}

function dumpVariablePool(variablePool) {
  xdmp.log(Sequence.from(["start variable pool dump",...variablePool,"end variable pool"]));
}
function getNodeWithOutputLink(graph,link,variablePool) {
  xdmp.log("getNodeWithOutputLink")
  for ( const node of graph.nodes || [] ) {
    let i = 0;
    for (const output of node.outputs || [] ) {
      for ( const outputLink of output.links || [] ) {
        if ( outputLink === link ) {
          if ( node.type === "Graph/input") {
            return {nodeId : node.id,variableName : getVariableNameForSubgraphInput(graph,node,variablePool)};
          } else {
            dumpVariablePool(variablePool);
            xdmp.log("getNodeWithOutputLink for NodeId="+node.id+" node type="+node.type);
            return {nodeId : node.id,variableName : createVariableName(node,i,output,variablePool) }
          }
        }
      }
      i++;
    }
  }
  throw Error("Compiler error. Could not find node with output link = "+link);
}

function getNode(nodes,nodeId) {
  return nodes.filter(x=>x.id === nodeId)[0];
}


function determineOutputVariables(graph,node,variablePool) {
  if ( node.type === "DHF/output") {
    return [];
  }
  if ( node.type === "DHF/input") {
    return [
      { name:  createVariableName(node,0,{name:"input"},variablePool), index: 0},
      { name: createVariableName(node,1,{name:"uri"},variablePool) , index: 1},
      { name: createVariableName(node,2,{name:"collections"},variablePool),index: 2},
      { name: createVariableName(node,3,{name:"permissions"},variablePool),index:3}
    ];
  }
  let arr = [];
  let i = 0;
  for ( const output of node.outputs || []) {
    let variableName = createVariableName(node,i,output,variablePool);
    arr.push({ name: variableName, index : i } );
    i++;
  }
  return arr
}
function determineInputVariables(graph,node,variablePool) {
  if ( node.type === "DHF/input") {
    return [];
  }
  let arr = [];
  let i = 0;
  for ( const input of node.inputs || []) {
    const link = input.link;
    if ( link != null ) {
      arr.push({ name: getNodeWithOutputLink(graph,link,variablePool).variableName, index: i});
    } else {
      arr.push({ name: "undefined", index: i});
    }
    i++;
  }
  return arr
}

function generateCode(options,graph,node,ins,outs,lib) {
  if ( node.type === "DHF/input") {
    return [];
  }
  const addComments = options.addComments && options.addComments === true;
  let input = {};
  let output = {};
  for ( const inp of ins ) {
    input["input"+inp.index] = inp.name;
  }
  for ( const outp of outs ) {
    output["output"+outp.index] = outp.name;
  }
  let bc = new LiteGraph.registered_node_types[node.type]();
  let i = 0;
  let w = {};
  for ( const widget of bc.widgets || [] ) {
    if ( !node.widgets_values || i >= node.widgets_values.length ) {
      w[widget.name] = widget.value;
    } else {
      w[widget.name] = node.widgets_values[i];
    }
    i++;
  }
  let hasWidgets = i > 0;
  i = 0;
  let p = {};
  for ( const property of bc.properties_info || [] ) {
    p[property.name] = node.properties[property.name];
    i++;
  }
  if ( "addBlockDataAsProperties" in bc ) {
    const blockData = bc.addBlockDataAsProperties();
    xdmp.log(blockData);
    p.blockData = blockData;
    i++;
  }
  let hasProperties = i > 0;
  let propertiesWidgets = hasProperties || hasWidgets ? {} : null;
  if ( propertiesWidgets ) {
    if ( hasProperties ) {
      propertiesWidgets.properties = p;
    }
    if ( hasWidgets ) {
      propertiesWidgets.widgets = w;
    }
  }
  let inputKeys = Object.keys(input);
  let dataIn = [];
  for ( const i of inputKeys ) {
    dataIn.push(input[i])
  }
  if (node.type === "dhf/envelope") {
    dataIn.push(...["collections","uri", "context"])
  }
  let outputKeys = Object.keys(output);
  let dataOut = [];
  for ( const i of outputKeys ) {
    dataOut.push(output[i])
  }
  let inputString;
  let out = "const ["+dataOut.join(",")+"] = ";
  let code = [];
  if ( node.type === SUBGRAPH_TYPE ) {
    inputString =  dataIn.join(",");
    code.push(out + generateFunctionName(node.subgraph,node.title)+"(" + inputString +");");
  } else {
    let prefix = ""
    const library = "getRuntimeLibraryPath" in  bc ? bc.getRuntimeLibraryPath() : "coreFunctions.sjs"
    const req = require("/custom-modules/pipes/runtime/"+library);
    const inputAsListFunction = bc.getRuntimeLibraryFunctionName() + "InputAsList"
    const inputAsList = inputAsListFunction in req && typeof req[inputAsListFunction] === "function" ? req[inputAsListFunction]() : false;
    const returnAlwaysAnArrayFunction = bc.getRuntimeLibraryFunctionName()  + "ReturnAlwaysAnArray"
    const returnAlwaysAnArray = returnAlwaysAnArrayFunction in cf && typeof cf[returnAlwaysAnArrayFunction] === "function" ? cf[returnAlwaysAnArrayFunction]() : false;
    xdmp.log("FUNCTION "+returnAlwaysAnArrayFunction);
    xdmp.log(returnAlwaysAnArray);
    if ( library == "coreFunctions.sjs" ) {
      lib.core = true;
      prefix = "r";
    } else if ( library == "user.sjs")  {
      lib.user = true;
      prefix = "u";
    }
    if ( dataIn && dataIn.length > 0 ) {
      if ( inputAsList ) {
        inputString = ",[" + dataIn.join(",") + "]";
      } else {
        inputString = "," + dataIn.join(",");
      }
    } else {
      inputString = ",[" + dataIn.join(",") + "]";
    }
    if ( dataOut.length == 1 && !returnAlwaysAnArray) {
      out = "const "+dataOut[0]+" = ";
    }
    if ( node.type === "DHF/output") {
      out = "return ";
    }
    const typeExecutorFunction =  bc.getRuntimeLibraryFunctionName() + "ExecutorType";
    const doesFunctionExist =  typeExecutorFunction in req && typeof req[typeExecutorFunction] === "function";
    const executorType = doesFunctionExist ? req[typeExecutorFunction]() : cf.BLOCK_EXECUTOR_DELEGATOR;
    if ( executorType === cf.BLOCK_EXECUTOR_DELEGATOR ) {
      code.push(out + prefix + "." + bc.getRuntimeLibraryFunctionName() + "(" + JSON.stringify(propertiesWidgets) + inputString + ");");
    } else {
      const genCode = req[bc.getRuntimeLibraryFunctionName()](propertiesWidgets,dataIn,dataOut);
      code.push(...genCode);
    }
  }
  return code;
}

function compileGraphToJavaScript(jsonGraph) {
  return compileGraphToJavaScriptWithOptions(jsonGraph,{addComments:true, identSpaceCount : 1,newLine : "\n"});
}

let jsonGraph = cts.doc("/graph.json").toObject();
compileGraphToJavaScript(jsonGraph).join("\n");
