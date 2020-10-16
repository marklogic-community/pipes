const moment = require("/custom-modules/pipes/runtime/moment-with-locales.min.sjs")
const DataHub = require("/data-hub/5/datahub.sjs");
const datahub = new DataHub();

const BLOCK_RUNTIME_DEBUG_TRACE = "pipesBlockRuntimeDebug";

module.exports = {
  executeFormatDate,
  executeFormatDateTime,
  executeFormatDateAuto,
  executeFormatDateTimeAuto,
  executeEpochToDateTimeExecutorType,
  executeEpochToDateTime,
  executeJavaScript,
  executeMultiCastInputAsList,
  executeMultiCast,
  executeNormalizeSpace,
  executeCount,
  executeHead,
  executeXpath,
  executeHash,
  executeDistinctValues,
  executeFilterArray,
  executeRegExReplace,
  executeStringSplit,
  executeStringPadding,
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

function executeJavaScript(propertiesAndWidgets,var1,var2,var3,var4,var5) {
  let code = propertiesAndWidgets.properties.sjsCode;
  let template = "`" + code + "`";
  let result = eval(template);
  let output = eval(result);
  return output;
}

function executeDistinctValues(propertiesAndWidgets,input) {
  let seq = null;
  if ( input instanceof Sequence ) {
    seq = input;
  } else if ( input.constructor.name === "Array" ) {
    seq = Sequence.from(input);
  } else {
    seq = Sequence.from([input]);
  }
  const arr = fn.distinctValues(seq).toArray();
  return arr;
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
  let result = [];
  for (let i = 0; i < propertiesAndWidgets.widgets.nbInputs; i++) {
    let value = i < inputs.length ? inputs[i] : null
    if (value != null)
      result = result.concat(value)
  }
  return result;
}

function executeXpath(propertiesAndWidgets,input) {
  let ns = {};
  const nstokens = propertiesAndWidgets.widgets.namespaces.trim().split(",");
  if (nstokens.length % 2 === 0) {
    for (let i = 0; i < nstokens.length; i += 2) {
      ns[nstokens[i].trim()] = nstokens[i + 1].trim();
    }
  }
  let output = null;
  const xpathValue = propertiesAndWidgets.widgets.xpath;
  xdmp.trace(BLOCK_RUNTIME_DEBUG_TRACE, Sequence.from(["Xpath: Input", input, "NS", ns]));
  if (typeof(input) != "undefined" && input != null ) {
    if ( input.constructor.name === "Array") {
      output = [];
      for ( const i of input) {
        output.push(i.xpath(xpathValue, ns));
      }
    } else if ( input instanceof Sequence ) {
      let arr = [];
      for ( const i of input ) {
        arr.push(i.xpath(xpathValue, ns));
      }
      output = Sequence.from(arr);
    } else {
      output=input.xpath(xpathValue,ns);
    }
    xdmp.trace(BLOCK_RUNTIME_DEBUG_TRACE, Sequence.from(["Xpath: Output", output]));
  }
  return output;
}
function executeHash(propertiesAndWidgets,input) {
  switch (propertiesAndWidgets.widgets['hash function']) {
    case "hash64":
      return String(xdmp.hash64(xdmp.quote(input)));
      break;
    case "sha1":
      return String(xdmp.sha1(xdmp.quote(input), "base64"))
      break;
    case "sha256":
      return tring(xdmp.sha256(xdmp.quote(input), "base64"))
      break;
    case "sha512":
      return String(xdmp.sha512(xdmp.quote(input), "base64"))
      break;
    default:
      return "unknown";
      break;
  }
}

function executeEpochToDateTimeExecutorType() {
  return this.BLOCK_EXECUTOR_GENERATOR;
}

function executeEpochToDateTime(propertiesAndWidgets,inputs,outputs) {
      return ["const "+outputs[0]+" = (new Date(Number("+inputs[0]+"))).toISOString();"];
};

function executeFilterArray(propertiesAndWidgets,unfiltered,patterns) {
  xdmp.trace(TRACE_ID, "++++++++++++++++++FilterArray++++++++++++++++++++++++++++++");
  let include = propertiesAndWidgets.widgets.include;
  let filtered = []
  if ( !unfiltered.constructor.name === "Array") {
    filtered = [unfiltered];
  } else
  {
    let patternArray = patterns.constructor.name === "Array" ? patterns : [patterns]
    filtered = unfiltered.filter(function (item) {
      for (p of patternArray) {
        if (item.includes(p)) {
          return include;
        }
      }
      return !include;
    })
    xdmp.trace(TRACE_ID, unfiltered);
    xdmp.trace(TRACE_ID, patterns);
    xdmp.trace(TRACE_ID, "include=" + include);
    xdmp.trace(TRACE_ID, filtered);
    xdmp.trace(TRACE_ID, "++++++++++++++++++FilterArray++++++++++++++++++++++++++++++");
  }
  return filtered;
}
function executeEnvelope(propertiesAndWidgets,iHeaders,iTriples,iInstance,iAttachments,iUri,iCollections,iPermissions) {
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


function executeMultiCastInputAsList() {
  return true;
}

function executeMultiCast(propertiesAndWidgets,inputs) {
  let arr = []
  for (let i = 0; i < 4; i++) {
    const inp = inputs[i]
    if ( inp != undefined) {
      if (!"type" + (i + 1) in propertiesAndWidgets.widgets) {
        arr.push(inp);
      } else {
        switch (propertiesAndWidgets.widgets["type" + (i + 1)]) {
          case "string":
            arr.push(String(inp))
            break;
          case "int":
            arr.push( parseInt(inp))
            break;
          case "float":
            arr.push(parseFloat(inp))
            break;
          case "date":
            arr.push(new date(inp))
            break;
          default:
            arr.push(inp);
        }
      }
    }
  }
  return arr;
}
function executeNormalizeSpace(propertiesAndWidgets,input) {
  if (input) {
    if (input.constructor.name === "Array") {
      let arr = [];
      for (const v of arr) {
        if (v) {
          arr.push(fn.normalizeSpace(String(v)))
        }
      }
      return [arr]
    } else {
      return fn.normalizeSpace(String(input));
    }
  } else {
    return "";
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

function executeCount(propertiesAndWidgets,input) {
  let count = 0;
  if ( input ) {
    if (input.constructor.name === "Array") {
      count = input.length;
    } else if ( input instanceof Sequence ) {
      count = fn.count(input)
    }
  }
  return count;
}

function executeHead(propertiesAndWidgets,input) {
  let output = null
  if ( input.constructor.name === "Array") {
    if (input.length > 0) {
      output = input[0];
    }
  }
  else if ( input instanceof Sequence) {
    output = fn.head(input)
  }
  return output;
}

function executeStringPadding(propertiesAndWidgets,input) {
  let totalWidth = propertiesAndWidgets.widgets.Size;
  let paddingDirection = String(propertiesAndWidgets.widgets['Padding Direction']);
  let paddingChar = String(propertiesAndWidgets.widgets['Padding Character']);
  let inputString = String(input ? input : "");
  let outputval = inputString;
  switch (paddingDirection) {
    case "left":
      outputval = inputString.padStart(totalWidth, paddingChar);
      break
    case "right":
      outputval = inputString.padEnd(totalWidth, paddingChar);
      break
    default:
      break
  }
  return outputval;
}

function executeRegExReplace(propertiesAndWidgets,input) {
    const global = propertiesAndWidgets.widgets.global;
    const caseInsensitive = propertiesAndWidgets.widgets.caseInsensitive;
    const regEx = propertiesAndWidgets.widgets.regex;
    let replace = propertiesAndWidgets.widgets.replace;
    let options = "";
    if (global) {
      options += "g"
    }
    if (caseInsensitive) {
      options += "i"
    }
    replace = !replace ? "" : replace;
    const regExObj = new RegExp(regEx, options);
    let ret = null;
    if (input) {
      if (input.constructor.name === "Array") {
        let arr = [];
        for (const i of input) {
          if (!i) {
            continue;
          }
          arr.push(i.toString().replace(regExObj, replace))
        }
        ret = arr;
      } else {
        ret = input.toString().replace(regExObj, replace);
      }
    }
    return ret;
}

function executeStringSplit(propertiesAndWidgets,input) {
  if (!input) {
    return []
  }
  let result = String(input).split(propertiesAndWidgets.widgets.splitChar);
  let arr = [];
  for (let i = 0; i < Math.min(result.length, 3); i++) {
     arr.push(result[i]);
   }
  for ( let i = arr.length ; i < 3 ; i++ ) {
    arr.push(undefined);
  }
  arr.push(result);
  return arr;
}

function executeFormatDate(propertiesAndWidgets,inputDate) {
  let format = propertiesAndWidgets.widgets.format;
  let result = fn.string(moment(inputDate, [format]).format('YYYY-MM-DD'));
  if (result == "Invalid date") {
    result = null;
  }
  return result;
}

function executeFormatDateTime(propertiesAndWidgets,inputDateTime) {
  let format = propertiesAndWidgets.widgets.format;
  let result = fn.string(moment(inputDateTime, [format]).format());
  if (result == "Invalid date") {
    result = null;
  }
  return result;
}

function executeFormatDateAuto(propertiesAndWidgets,srcDate) {
    let result = moment(srcDate, ["MM-DD-YYYY", "YYYY-MM-DD", "DD/MM/YYYY"]).format("YYYY-MM-DD")
    if (result == "Invalid date")
      return null;
    else
      return result
}

function executeFormatDateTimeAuto(propertiesAndWidgets,srcDate) {
  let result = moment(srcDate).format();
  if (result == "Invalid date")
    return null;
  else
    return result
}

// ========= RUNTIME

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
  xdmp.log(block.widgets);
  for ( widget of block.widgets || [] ) {
    const name = widget.name;
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
