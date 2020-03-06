'use strict';

function findStartNode(graph) {
  let startNode = graph.executionGraph == null || graph.executionGraph.nodes == null ? null : graph.executionGraph.nodes.filter(x=>x.type==='dhf/input').map(x=>x.id);
  startNode = startNode == null || startNode.length === 0 ? null : startNode;
  return startNode;
}
function findFinalNode(graph) {
  let startNode = graph.executionGraph == null || graph.executionGraph.nodes == null ? null : graph.executionGraph.nodes.filter(x=>x.type==='dhf/output').map(x=>x.id);
  startNode = startNode == null || startNode.length === 0 ? null : startNode;
  return startNode;
}

function validateStartNode(startNodes,errors) {
  if ( startNodes == null ) {
    errors.push({ errorCode: "DHF_INPUT_NODE_NOT_FOUND",
      errorDescription:"DHF Input Node not found"});
    return false;
  }
  if ( startNodes.length > 1 ) {
    errors.push({ errorCode: "DHF_INPUT_MULTIPLE_NODES_FOUND",
      errorDescription:"Multiple DHF Input Nodes found."});
    return false;
  }
  return true;
}
function validateFinalNode(finalNodes,errors) {
  if ( finalNodes == null ) {
    errors.push({ errorCode: "DHF_OUTPUT_NODE_NOT_FOUND",
      errorDescription:"DHF Output Node not found"});
    return false;
  }
  if ( finalNodes.length > 1 ) {
    errors.push({ errorCode: "DHF_OUTPUT_MULTIPLE_NODES_FOUND",
      errorDescription:"Multiple DHF Output Nodes found."});
    return false;
  }
  return true;
}
function initLiteGraph(jsonGraph) {
  const userBlocks = require("/custom-modules/pipes/user");
  const coreBlocks = require("/custom-modules/pipes/core");
  const gHelper  = require("/custom-modules/pipes/graphHelper");
  for (let model of jsonGraph.models || []) {
    LiteGraph.registerNodeType(model.source + "/" + model.collection, gHelper.createGraphNodeFromModel(model));
  }
  coreBlocks.init(LiteGraph);
  userBlocks.init(LiteGraph);
}

function allNodesSupportCodeGeneration(LiteGraph,jsonGraph,nodeGenerationOrder,errors) {
  let isError = false;
  for ( const nodeId of nodeGenerationOrder ) {
    let node = getNode(jsonGraph.executionGraph.nodes,nodeId);
    let type = node.type;
    let bc = null;
    try {
      bc = new LiteGraph.registered_node_types[node.type]()
    } catch (e) {
      errors.push({ errorCode : "BLOCK_IMPL_NOT_FOUND", errorDescription: "Block implementation not found of "+type+" for node-id="+node.id});
      isError = true;
      continue;
    }
    if (! ("onCodeGeneration" in bc)) {
      errors.push({ errorCode : "BLOCK_DOES_NOT_SUPPORT_CODE_GENERATION", errorDescription: "Block implementation "+type+" does not support code generation. Node-id="+node.id});
      isError = true;
    }
  }
  return !isError;
}

function compileGraphToJavaScriptWithOptions(jsonGraph,options) {
  let errors = []
  // STEP 0: Init litegraph
  const LiteGraph = require("/custom-modules/pipes/litegraph").LiteGraph;
  initLiteGraph(jsonGraph);
  // STEP 1: Check the start node
  const startNodes = findStartNode(jsonGraph);
  if ( !validateStartNode(startNodes,errors) ) {
    return {
      sourceCode : null,
      errors
    }
  }
  const startNode = startNodes[0];
  // STEP 2: Check the final node
  const finalNodes = findFinalNode(jsonGraph);
  if ( !validateFinalNode(finalNodes,errors) ) {
    return {
      sourceCode : null,
      errrors
    }
  }
  const finalNode = finalNodes[0];
  // STEP 3: Build the flow graph
  const PipesFlowControlGraph = require("/custom-modules/pipes/compilerFlowControlGraph.sjs")
  const flowGraph = new PipesFlowControlGraph();
  flowGraph.initFromLiteGraph(LiteGraph,startNode,jsonGraph);
  // STEP 4: Check there is a path between start node and end node
  const paths = flowGraph.getAllPaths(startNode,finalNode);
  if ( paths == null || paths.length == 0) {
    return {
      sourceCode : null,
      errors : [{ errorCode: "NO_PATH_FROM_DHF_INPUT_TO_OUTPUT",
        errorDescription:"There is no path between DHF Input to Output"
      }],
    }
  }
  // STEP 5: Remove dead nodes prior to the loop check
  flowGraph.removeDeadNodes(startNode,finalNode);
  // STEP 6: Check the remaining graph has no loop
  if ( flowGraph.isCyclic() ) {
    return {
      sourceCode : null,
      errors : [{ errorCode: "GRAPH_CONTAINS_LOOPS",
        errorDescription:"The graph contains loops. This is unsupported."
      }],
    };
  }

  // STEP 5: Determine code generation order
  const nodeGenerationOrder = flowGraph.determineNodeCodeGenerationOrder(paths);

  // STEP 6: Check all nodes in the paths support code generation
  if ( !allNodesSupportCodeGeneration(LiteGraph,jsonGraph,nodeGenerationOrder,errors)) {
    return { sourceCode: null, errors : errors};
  }
  let sourceCode = [];
  let functions = ['function flattenArray(globalArray,value){',
    ' for(let v of value)',
    '  if(v.constructor === Array)',
    '  flattenArray(globalArray,v)',
    '  else',
    '  globalArray.push(v)',
    '}'];
  for (const nodeId of nodeGenerationOrder ) {
    const node = getNode(jsonGraph.executionGraph.nodes,nodeId);
    const inputs = determineInputVariables(jsonGraph.executionGraph,node);
    const outputs = determineOutputVariables(jsonGraph.executionGraph,node);
    sourceCode.push(...generateCode(options,jsonGraph,node,inputs,outputs,functions));
  }
  let identSpace = options.identSpaceCount ? options.identSpaceCount : 1;
  return { sourceCode : createSourceCodeOutput(options,sourceCode,identSpace,functions),
    errors : null
  };
}

function createSourceCodeOutput(options,sourceCodeArray,identSpace,functions) {
  return [
    "function executeCustomStep(input,uri,collections,context) {",
    ...ident(sourceCodeArray,identSpace),
    ...ident(["return output"],identSpace),
    "}",
    ...ident(functions,identSpace)].join("\n");
}

function ident(sourceCodeArray,identSpace) {
  if (identSpace === 0 || identSpace < 0 ) {
    return sourceCodeArray;
  }
  let ident = " ".repeat(identSpace);
  let arr=[];
  for ( const line of sourceCodeArray ) {
    const identiation = ident.repeat(line.search(/\S|$/) + 1);
    arr.push(identiation+line);
  }
  return arr;
}
function createVariableName(node,index,inputOutput) {
  return "var_"+node.id+"_"+index+"_"+inputOutput.name.match(/[0-9a-zA-Z_]+/g).join("");
}


function getNodeWithOutputLink(graph,link) {
  for ( const node of graph.nodes || [] ) {
    let i = 0;
    for (const output of node.outputs || [] ) {
      for ( const outputLink of output.links || [] ) {
        if ( outputLink === link ) {
          return {nodeId : node.id,variableName : createVariableName(node,i,output) }
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


function determineOutputVariables(graph,node) {
  let arr = [];
  let i = 0;
  for ( const output of node.outputs || []) {
    let variableName = createVariableName(node,i,output);
    arr.push({ name: variableName, index : i } );
    i++;
  }
  return arr
}
function determineInputVariables(graph,node) {
  let arr = [];
  let i = 0;
  for ( const input of node.inputs || []) {
    const link = input.link;
    if ( link != null ) {
      arr.push({ name: getNodeWithOutputLink(graph,link).variableName, index: i});
    }
    i++;
  }
  return arr
}

function createFunctionName(node) {
  let t = node.type.charAt(0).toUpperCase() + node.type.slice(1);
  return "block"+t.match(/[0-9a-zA-Z_]+/g).join("")+node.id;
}

function generateCode(options,jsonGraph,node,ins,outs,functions) {
  const addComments = options.addComments && options.addComments === true;
  let input = {};
  let output = {};
  for ( const inp of ins ) {
    input["input"+inp.index] = inp.name;
  }
  if ( node.type === "dhf/input") {
    input = { input0 : "input" , input1 : "uri", input2: "collections" }
  }
  for ( const outp of outs ) {
    output["output"+outp.index] = outp.name;
  }
  if ( node.type === "dhf/output") {
    output["output0"] = "output";
  }
  let bc = new LiteGraph.registered_node_types[node.type]();
  let i = 0;
  let w = {};
  for ( const widget of bc.widgets || [] ) {
    w[widget.name] = node.widgets_values[i];
    i++;
  }
  i = 0;
  let p = {};
  for ( const property of bc.properties_info || [] ) {
    p[property.name] = node.properties[property.name];
    i++;
  }
  let propertiesWidgets = { properties : p,widgets : w};
  if ("onCodeGeneration" in bc ) {
    let code = bc.onCodeGeneration("temp_node_"+node.id+"_",input,output,propertiesWidgets);
    if ( options.outputBlockAsFunction && options.outputBlockAsFunction === true ) {
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
      functions.push("\nfunction "+createFunctionName(node)+"("+dataIn.join(",")+") {");
      if ( addComments ) {
        if ( addComments ) {
          functions.push("// Start code for "+node.type+" - nodeId = "+node.id);
        }
        functions.push("// Inputs: "+JSON.stringify(ins));
        functions.push("// Outputs: "+JSON.stringify(outs));
        functions.push("// Poperties/widgets: "+JSON.stringify(propertiesWidgets));
      }
      functions.push(...code);
      functions.push("return {"+dataOut.join(",")+"};");
      functions.push("}");
      code = [];
      code.push("const {"+dataOut.join(",")+"} = "+createFunctionName(node)+"("+dataIn.join(",")+");");
      return code;
    } else {
      let comment = [];
      if ( addComments ) {
        if ( addComments ) {
          comment.push("// Start code for "+node.type+" - nodeId = "+node.id);
        }
        comment.push("// Inputs: "+JSON.stringify(ins));
        comment.push("// Outputs: "+JSON.stringify(outs));
      }
      return [...comment,...code];
    }
  }
  return [];
}

function compileGraphToJavaScript(jsonGraph) {
  return compileGraphToJavaScriptWithOptions(jsonGraph,{addComments:true, identSpaceCount : 1,outputBlockAsFunction : true });
}

module.exports = {
  compileGraphToJavaScript
};
