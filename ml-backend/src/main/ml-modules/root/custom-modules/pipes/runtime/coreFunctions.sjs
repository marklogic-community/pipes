module.exports = {
  executeGraphInputDHF,
  executeGraphOutputDHF,
  executeAddProperty,
  executeStringCase,
  executeTemplating,
  executeMultiPurposeConstant,
  executeMultiPurposeConstantExecutorType,
  executeBlock,
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

function executeGraphInputDHF(propertiesAndWidgets,input,uri,collections,permissions) {
  return [input,uri,collections,permissions];
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

function executeStringCase(propertiesAndWidgets,input) {
    let newVal = '';
    if (input) {
      let inputVal = String(input);
      switch (propertiesAndWidgets.widgets.stringOperation) {
        case 'lowercase':
          newVal = inputVal.toLowerCase();
          break;
        case 'UPPERCASE':
          newVal = inputVal.toUpperCase();
          break;
        case 'Capitalise':
          newVal = inputVal.split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
          break;
        default:
          newVal = inputVal;
      }
      return newVal;
    }
    return "";
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
      return "const "+outputs[0]+" = "+'"'+ value + '";';
    case "number":
      return "const "+outputs[0]+" = "+parseFloat(value)+";";
    case "NULL":
      return "const "+outputs[0]+" = null;";
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
  let startTime = 0;
  if ( doLog ) {
    let arr = [];
    arr.push("Start executing "+block.title);
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
    outputValues = func(propertiesAndWidgets, ...inputs);
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
      inputCode += "const input"+i+" = "+inputs[i]+";\n";
      generatorInputs.push("input"+i);
    }
    let generatorOutputs = [];
    let outputCode = "";
    for ( let i = 0 ; i < ( block.outputs || []).length; i++ ) {
      generatorOutputs.push("output"+i);
    }
    const returnCode = "\n[" + generatorOutputs.join(",") + "];\n"
    const genCode = inputCode + func(propertiesAndWidgets,generatorInputs,generatorOutputs) + returnCode;
    const outputValues = eval(genCode);
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
    outputValues.map((v, index) => {
      if (typeof v !== "undefined") {
        block.setOutputData(index, v)
      }
    });
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
  for ( widget of block.widgets || [] ) {
    const name = widget.name;
    const value = block[widget.name].value;
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
