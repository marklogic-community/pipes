const DataHub = require("/data-hub/5/datahub.sjs");
const datahub = new DataHub();

module.exports = {
  executeStringJoin,
  executeStringJoinExecutorType,
  executeBaseUri,
  executeJoinArrayInputAsList,
  executeJoinArray,
  executeQueryDocExecutorType,
  executeQueryDoc,
  executeGraphInputDHFExecutorType,
  executeGraphInputDHF,
  executeGraphOutputDHF,
  executeAddProperty,
  executeStringCaseExecutorType,
  executeStringCase,
  executeTemplating,
  executeMultiPurposeConstant,
  executeMultiPurposeConstantExecutorType,
  executeBlock,
  executeEnvelope,
  flattenArray,

  // OLD
  getCurrentDate,
  LookupByValue,
  split,
  lookUp,
  regExpReplace,
  computeQueryRecursively,
  BLOCK_EXECUTOR_DELEGATOR : 1,
  BLOCK_EXECUTOR_GENERATOR : 2
};

const TRACE_ID = "pipes-coreFunctions";
const TRACE_ID_PIPES_EXECUTION = "pipes-execution";
const TRACE_ID_PIPES_EXECUTION_DETAILS = "pipes-execution-detasils";

function replaceInputValueQuery (value, block) {
  for (var i = 0; i < block.inputs.length; i++) {
    if (value.includes("${v" + i + "}")) {
      return value.replace("${v" + i + "}", block.getInputData(i))
    }
  }
  return value
}

function computeQueryRecursively (queryString, block) {
  let qArray = []

  for (let child of queryString.children) {
    if (child.type == "query-builder-rule") {
      if (child.query.rule == "cts.collectionQuery") {
        qArray.push(cts.collectionQuery(replaceInputValueQuery(child.query.value.value, block)))
      } else if (child.query.rule == "jsonPropertyValueQuery") {

        let value = child.query.value.selectedType == "string" ? fn.string(replaceInputValueQuery(child.query.value.selectedValue.name ? child.query.value.selectedValue.name : child.query.value.selectedValue, block)) : child.query.value.selectedType == "number" ? fn.number(replaceInputValueQuery(child.query.value.selectedValue.name ? child.query.value.selectedValue.name : child.query.value.selectedValue, block)) : replaceInputValueQuery(child.query.value.selectedValue.name ? child.query.value.selectedValue.name : child.query.value.selectedValue, block)

        qArray.push(cts.jsonPropertyValueQuery(child.query.value.selectedAttribute, value))
      } else if (child.query.rule == "wordQuery") {
        qArray.push(cts.wordQuery(replaceInputValueQuery(child.query.value, block)))
      }
    } else if (child.type == "query-builder-group") {
      if (child.query.logicalOperator == "all") {
        qArray.push(cts.andQuery(computeQueryRecursively(child.query, block)))
        xdmp.trace(TRACE_ID, qArray)
      } else {
        qArray.push(cts.orQuery(computeQueryRecursively(child.query, block)))
      }
    }
  }
  return qArray
}

function getCurrentDate (dateOption) {
  switch (dateOption) {
    case "currentDate":
      return fn.currentDate();
      break;
    case "currentDateTime":
      return fn.currentDateTime();
      break;
    case "currentTime":
      return fn.currentTime();
      break;
  }
}

function upperCase (v) {
  return String(v).toUpperCase()
}

function split (v, splitChar) {
  return String(v).split(splitChar)
}

function lookUp (block, var1, var2, nbOutputValues, ctsQuery) {
  let template = "`" + ctsQuery + "`";
  let result = eval(template);
  let query = eval(result);
  let foundDoc = fn.head(xdmp.invokeFunction(() => {
    return cts.search(query, ["unfiltered", "score-zero"], 0);
  }, { database: xdmp.database(block.database.value) }));
  if (foundDoc != null) {
    for (let i = 0; i < parseInt(nbOutputValues); i++) {
      if (block["value" + i + "Path"] != null && block["value" + i + "Path"].value != "") {
        const r = foundDoc.xpath(block["value" + i + "Path"].value)
        block.setOutputData(i, r)
      }
    }
  }
}

function LookupByValue (block, var1, nbOutputValues) {
  let collection = block.collection.value;
  collection = !collection ? "" : collection;
  let dataType = block.dataType.value;
  let property = block.property.value;
  dataType = !dataType || (dataType !== 'bool' && dataType !== 'string' && dataType !== 'number') ? "string" : dataType;
  let foundDoc = fn.head(xdmp.invokeFunction(() => {
    let arr = [];
    if (!(var1 instanceof Array)) {
      var1 = [var1]
    }
    for (const v of var1) {
      if (!v) {
        continue;
      }
      if (dataType === 'bool') {
        arr.push(v.toString() === 'true');
      }
      if (dataType === 'string') {
        arr.push(v.toString());
      }
      if (dataType === 'number') {
        arr.push(Number(v.toString()));
      }
    }
    const query = cts.andQuery([cts.collectionQuery(collection), cts.jsonPropertyValueQuery(property, arr)]);
    return cts.search(query, ["unfiltered", "score-zero"], 0);
  }, { database: xdmp.database(block.database.value) }));

  if (foundDoc != null) {
    for (let i = 0; i < parseInt(nbOutputValues); i++) {
      if (block["value" + i + "Path"] != null && block["value" + i + "Path"].value != "") {
        const r = foundDoc.xpath(block["value" + i + "Path"].value);
        block.setOutputData(i, r)
      }
    }
  }
}

function regExpReplace (block, regEx, replace, global, caseInsensitive) {
  let options = "";
  if (global) {
    options += "g"
  }
  if (caseInsensitive) {
    options += "i"
  }
  replace = !replace ? "" : replace;
  const regExObj = new RegExp(regEx, options);
  const input = block.getInputData(0);
  if (input) {
    if (input instanceof Array) {
      let arr = [];
      for (const i of input) {
        if (!i) {
          continue;
        }
        arr.push(i.toString().replace(regExObj, replace))
      }
      block.setOutputData(0, arr);
    } else {
      block.setOutputData(0, input.toString().replace(regExObj, replace));
    }
  }
}

// NEW

function executeGraphInputDHFExecutorType() {
  return this.BLOCK_EXECUTOR_GENERATOR;
}


function executeGraphInputDHF(propertiesAndWidgets,inputs,outputs) {
  return  [
    "const "+outputs[0]+" = "+inputs[0]+";",
    "const "+outputs[1]+" = "+inputs[1]+";",
    "const "+outputs[2]+" = "+inputs[2]+";",
    "const "+outputs[3]+" = "+inputs[3]+";"
  ]
}

function executeGraphOutputDHF(propertiesAndWidgets,output) {
    if (output && output.constructor === Array) {
      let globalArray = [];
      flattenArray(globalArray, output);
      return globalArray;
    }
    else {
      return output;
    }
}

function executeStringJoinExecutorType() {
  return this.BLOCK_EXECUTOR_GENERATOR;
}

function executeStringJoin(propertiesAndWidgets,inputs,outputs) {
  return [
    "const " + outputs[0] + " = "+inputs[0]+" ? fn.stringJoin("+inputs[0]+",'"+propertiesAndWidgets.properties.separator+"') : '';"
  ];
}

function executeBaseUri(propertiesAndWidgets,doc) {
  return fn.baseUri(doc);
}

function executeQueryDocExecutorType() {
  return this.BLOCK_EXECUTOR_GENERATOR;
}

function executeQueryDoc(propertiesAndWidgets,inputs,outputs) {
  return [
    "const " + outputs[0] + " = fn.doc(" + inputs[0] + ");"
  ];
}

function executeJoinArrayInputAsList() {
    return true;
}

function executeJoinArray(propertiesAndWidgets,inputs) {
  let result = []
  xdmp.log(propertiesAndWidgets.widgets);
  for (let i = 0; i < propertiesAndWidgets.widgets.nbInputs; i++) {
    let value = i < inputs.length ? inputs[i] : null
    if (value != null)
      result = result.concat(value)
  }
  return result;
}

function executeEnvelope(propertiesAndWidgets,iHeaders,iTriples,iInstance,iAttachments,iUri,iCollections,iPermissions) {

  xdmp.log(propertiesAndWidgets);
  xdmp.log(iHeaders);
  xdmp.log(iTriples);
  xdmp.log(iInstance);
  xdmp.log(iAttachments);
  xdmp.log(iUri);
  xdmp.log(iCollections);
  xdmp.log(iPermissions);
  let headers = iHeaders ? iHeaders :  {};
  let triples = iTriples ? iTriples : [];
  let instance = iInstance ? iInstance : {};
  let attachments = iAttachments ? iAttachments : {};
  let hasAttachments = (attachments != null)

  if (xdmp.type(headers) != "object") headers = { "value": headers }
  if (xdmp.type(triples) != "array") triples = [triples]
  if (xdmp.type(instance) != "object") instance = { "value": instance }
  if (xdmp.type(attachments) != "object") attachments = { "value": attachments }

  if (propertiesAndWidgets.widgets.format == "json" && hasAttachments) {
    if (instance) {
      if (instance.toObject) instance = instance.toObject()
      instance["$attachments"] = attachments
    } else {
      instance = {}
      instance["$attachments"] = attachments
    }
  }

  let result = datahub.flow.flowUtils.makeEnvelope(instance, headers, triples, propertiesAndWidgets.widgets.format)

  let defaultCollections =  undefined;
  let defaultPermissions = undefined;
  let defaultUri = sem.uuidString()
  let defaultContext = {}

  let uri = ( iUri != undefined) ? iUri : defaultUri;
  let collections = iCollections ? iCollections : defaultCollections;
  let permissions = iPermissions ? iPermissions  : defaultPermissions;
  let context = defaultContext

  let content = {}
  content.value = result;
  content.uri = uri

  context.collections = collections
  context.permissions = permissions
  content.context = context;
  return content;
}

function executeAddProperty(propertiesAndWidgets,doc,value) {
  let propertyName = propertiesAndWidgets.properties['propertyName'];
  if ( !doc ) {
    doc = {};
  }
  if (xdmp.nodeKind(doc) == 'document' && doc.documentFormat == 'JSON') {
    doc = doc.toObject();
  }
  doc[propertyName] = value;
  return doc;
};

function executeStringCaseExecutorType() {
  return this.BLOCK_EXECUTOR_GENERATOR;
}

function executeStringCase(propertiesAndWidgets,inputs,outputs) {
      switch (propertiesAndWidgets.widgets.stringOperation) {
        case 'lowercase':
          return ["const "+outputs[0]+" = "+inputs[0] +" ? String("+inputs[0]+").toLowerCase() : '';"];
        case 'UPPERCASE':
          return ["const "+outputs[0]+" = "+inputs[0] +" ? String("+inputs[0]+").toUpperCase() : '';"];
        case 'Capitalise':
          return ["const "+outputs[0]+" = "+inputs[0] +" ? "+inputs[0]+".split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') : '';"];
        default:
         return ["const "+outputs[0]+" = "+inputs[0] + " ? String("+inputs[0]+") : '';"];
      }
}

function executeTemplating(propertiesAndWidgets,v1,v2,v3) {
    let v4 = propertiesAndWidgets.widgets.v4;
    let v5 = propertiesAndWidgets.widgets.v5;
    let template = "`" + propertiesAndWidgets.widgets.template + "`";
    let result = eval(template);
    return result;
}

function executeMultiPurposeConstantExecutorType() {
  return this.BLOCK_EXECUTOR_GENERATOR;
}

function executeMultiPurposeConstant(propertiesAndWidgets,inputs,outputs) {
  let dataType = propertiesAndWidgets.widgets.Type;
  let value = propertiesAndWidgets.widgets.constant;
  let outputval = null
  switch (dataType) {
    case "string":
      return ["const "+outputs[0]+" = "+'"'+ value + '";'];
    case "number":
      return ["const "+outputs[0]+" = "+parseFloat(value)+";"];
    case "NULL":
      return ["const "+outputs[0]+" = null;"];
    default:
      throw new Error("Invalid dataType ["+dataType+"]");
  }
}

function executeBlock(block) {
  if (! ("getRuntimeLibraryFunctionName" in block) ) {
    throw Error("Block does not implement getRuntimeLibraryFunctionName. Check blockType "+block.type)
  }
  const functionName = block.getRuntimeLibraryFunctionName();
  const library = "getRuntimeLibraryPath" in  block ? "/custom-modules/pipes/runtime/"+block.getRuntimeLibraryPath() : "/custom-modules/pipes/runtime/coreFunctions.sjs";
  const inputs = getInputs(block);
  const propertiesAndWidgets = getPropertiesAndWidgets(block);
  const lib = require(library)
  const func = lib[functionName];
  if ( typeof func !== "function") {
    throw Error("Function '"+functionName+"' not found in '"+library+"'")
  }
  const typeExecutorFunction = functionName + "ExecutorType";
  const doesFunctionExist =  typeExecutorFunction in lib && typeof lib[typeExecutorFunction] === "function";
  const executorType = doesFunctionExist ? lib[typeExecutorFunction]() : this.BLOCK_EXECUTOR_DELEGATOR;
  const doLog = xdmp.traceEnabled(TRACE_ID_PIPES_EXECUTION);
  const inputAsListFunction = functionName + "InputAsList"
  xdmp.log("DEBUGGER");
  xdmp.log(inputAsListFunction);
  xdmp.log(lib);
  const inputAsList = inputAsListFunction in lib && typeof lib[inputAsListFunction] === "function" ? lib[inputAsListFunction]() : false;
  let startTime = 0;
  if ( doLog ) {
    let arr = [];
    arr.push("Start executing "+block.title);
    arr.push("InputAsList="+inputAsList);
    arr.push("Properties:")
    arr.push(propertiesAndWidgets.properties);
    arr.push("Widgets:")
    if ( propertiesAndWidgets.widgets ) {
      const keys = Object.keys(propertiesAndWidgets.widgets);
      if ( keys.length === 0 ) {
        arr.push("<no widgets>");
      } else {
        for ( const k of keys ) {
          arr.push("Widget "+k+" = "+JSON.stringify(propertiesAndWidgets.widgets[k]))
        }
      }
    } else {
      arr.push("<no widgets>");
    }
    arr.push("Inputs:");
    if ( (inputs || [] ).length == 0 ) {
      arr.push("<No inputs>")
    }
    else {
      for (let i = 0; i < inputs.length; i++) {
        arr.push("input" + i + "=" + JSON.stringify(inputs[i]))
      }
    }
    xdmp.trace(TRACE_ID_PIPES_EXECUTION,Sequence.from(arr));
    startTime = Date.now();
  }
  let outputValues;
  if (  executorType === this.BLOCK_EXECUTOR_DELEGATOR ) {
    if ( !inputAsList ) {
      outputValues = func(propertiesAndWidgets, ...inputs);
    } else {
      outputValues = func(propertiesAndWidgets, inputs);
    }
    if (doLog) {
      const runTime = Date.now() - startTime;
      let arr = [];
      arr.push("End executing " + block.title);
      arr.push("Execution runtime: " + runTime);
      if (block.outputs.length > 1) {
        for (let i = 0; i < (outputValues || []).length; i++) {
          arr.push("Output" + i + "=" + JSON.stringify(outputValues[i]));
        }
      } else {
        arr.push("Output0="+JSON.stringify(outputValues));
      }
      xdmp.trace(TRACE_ID_PIPES_EXECUTION, Sequence.from(arr));
    }
    if (block.outputs.length > 1) {
      outputValues.map((v, index) => {
        if (typeof v !== "undefined") {
          block.setOutputData(index, v)
        }
      });
    } else {
      block.setOutputData(0, outputValues);
    }
  } else {
    // generator
    let inputCode = "";
    let generatorInputs = [];
    for ( let i = 0 ; i < (inputs || []).length; i++ ) {
      inputCode += "const input"+i+" = "+JSON.stringify(inputs[i])+";\n";
      generatorInputs.push("input"+i);
    }
    let generatorOutputs = [];
    let outputCode = "";
    for ( let i = 0 ; i < ( block.outputs || []).length; i++ ) {
      generatorOutputs.push("output"+i);
    }
    const returnCode = "\n[" + generatorOutputs.join(",") + "];"
    const genCode = inputCode + func(propertiesAndWidgets,generatorInputs,generatorOutputs).join("\n") + returnCode;
    let outputValues = null;
    xdmp.trace(TRACE_ID_PIPES_EXECUTION_DETAILS,Sequence.from(["-- Start code --",genCode,"-- End code ---"]));
    try {
      outputValues = eval(genCode);
    } catch (e) {
      xdmp.log(Sequence.from(["Error executing code","code:",genCode,"Exception",e]),"error");
      throw e;
    }
    if (doLog) {
      const runTime = Date.now() - startTime;
      let arr = [];
      arr.push("End executing " + block.title);
      arr.push("Execution runtime: " + runTime);
      for (let i = 0; i < (outputValues || []).length; i++) {
        arr.push("Output" + i + "=" + JSON.stringify(outputValues[i]));
      }
      xdmp.trace(TRACE_ID_PIPES_EXECUTION, Sequence.from(arr));
    }
    if ( outputValues != null ) {
      outputValues.map((v, index) => {
        if (typeof v !== "undefined") {
          block.setOutputData(index, v)
        }
      });
    }
  }
  return outputValues;
}


function flattenArray (globalArray, value) {
  for (let v of value)
    if (v.constructor === Array)
      flattenArray(globalArray, v);
    else
      globalArray.push(v);
}

function getPropertiesAndWidgets(block) {
  let propertiesWidgets ={
    properties : block.properties,
    widgets : {}
  }
  xdmp.log("DATA")
  xdmp.log(block.widgets);
  for ( widget of block.widgets || [] ) {
    const name = widget.name;
    xdmp.log("NAME '"+name+"'")
    xdmp.log(widget);
    const value=widget.value;
    propertiesWidgets.widgets[name] = value;
  }
  return propertiesWidgets;
}

function getInputs(block) {
  // flatten the inputs
  let inputs = [];
  if ( block.inputs && block.inputs.length > 0 ) {
    for ( let i = 0 ; i <= block.inputs.length ; i++ ) {
      inputs.push(block.getInputData(i));
    }
  } else {
    inputs = []
  }
  return inputs;
}
