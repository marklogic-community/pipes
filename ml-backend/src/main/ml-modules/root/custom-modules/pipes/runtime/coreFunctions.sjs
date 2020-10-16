'use strict'
const moment = require("/custom-modules/pipes/runtime/moment-with-locales.min.sjs")
const DataHub = require("/data-hub/5/datahub.sjs");
const datahub = new DataHub();

const BLOCK_RUNTIME_DEBUG_TRACE = "pipesBlockRuntimeDebug";

module.exports = {
  executeCheckPhoneNumber,
  executeDeclarativeMapper,
  executeXsl,
  executeUuidStringExecutorType,
  executeUuidString,
  executeAdvancedQueryBlockInputAsList,
  executeAdvancedQueryBlock,
  executeLookupByValueReturnAlwaysAnArray,
  executeLookupByValue,
  executeExpertQueryBuilderInputAsList,
  executeExpertQueryBuilder,
  executeProvo,
  executeHighlight,
  executeXmlValidation,
  executeJsonValidation,
  executeCreateTriple,
  executeSourceBlockInputAsList,
  executeSourceBlock,
  executeMapRangeValues,
  executeMapValues,
  executeFormatDate,
  executeFormatDateTime,
  executeFormatDateAuto,
  executeFormatDateTimeAuto,
  executeEpochToDateTimeExecutorType,
  executeEpochToDateTime,
  executeEntityEnrich,
  executeJavaScript,
  executeMultiCastInputAsList,
  executeMultiCast,
  executeSelectCase,
  executeSelectCaseInputAsList,
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
  executeCurrentDate,
  BLOCK_EXECUTOR_DELEGATOR : 1,
  BLOCK_EXECUTOR_GENERATOR : 2
};

const TRACE_ID = "pipes-coreFunctions";
const TRACE_ID_PIPES_EXECUTION = "pipes-execution";
const TRACE_ID_PIPES_EXECUTION_DETAILS = "pipes-execution-detasils";



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
      return globalArray;``
    }
    else {
      return output;
    }
}

function executeAdvancedQueryBlockInputAsList() {
  return true;
}

function executeAdvancedQueryBlock(propertiesAndWidgets,inputs) {
  let query = propertiesAndWidgets.properties.query;
  let code = "";
  const nrOfInputs = parseInt(propertiesAndWidgets.widgets.nbInputs);
  for ( let i = 0 ; i < nrOfInputs ; i++ )  {
    code += "const v" + i + " = " + JSON.stringify(inputs[i])+ ";"
  }
  code += query;
  let computedQuery = eval(code);
  let result = xdmp.invokeFunction(() => {
    return cts.search(computedQuery,["unfiltered","score-zero"],0);
  }, { database: xdmp.database(propertiesAndWidgets.widgets.database) });
  return [result,computedQuery];
}

function executeCurrentDate(propertiesAndWidgets) {
  switch (propertiesAndWidgets.properties.currentDate) {
    case "currentDate": return fn.currentDate();
    case "currentDateNoTz":  return fn.adjustDateToTimezone(fn.currentDate(), null);
    case "currentDateTime":return fn.currentDateTime();
    case "currentTime": return fn.currentTime();
  }
  return []
}

function executeUuidStringExecutorType() {
  return this.BLOCK_EXECUTOR_GENERATOR;
}

function executeUuidString(propertiesAndWidgets,inputs,outputs) {
  let prefix = propertiesAndWidgets.widgets.prefix;
  prefix = !prefix ? "" : prefix;
  return [
    "const " + outputs[0] + " = '"+prefix+"'+sem.uuidString();"
  ];
}

function executeEntityEnrich(propertiesAndWidgets,input,dictionary) {
  let str = String(input);
  function asNode (text) {
    return new NodeBuilder()
      .addElement('node', text)
      .toNode();
  }
  let result = entity.enrich(asNode(str),
    [cts.entityDictionaryGet(dictionary)],
    "full")
  return result;
}

function executeCheckPhoneNumber(propertiesAndWidgets,pn,cc,uri) {
  const PNF = require('/custom-modules/pipes/runtime/google-libphonenumber.sjs').PhoneNumberFormat;
  const phoneUtil = require('/custom-modules/pipes/runtime/google-libphonenumber.sjs').PhoneNumberUtil.getInstance();
  const NumberType = [
    "FIXED_LINE",
    "MOBILE",
    "FIXED_LINE_OR_MOBILE",
    "TOLL_FREE",
    "PREMIUM_RATE",
    "SHARED_COST",
    "VOIP",
    "PERSONAL_NUMBER",
    "PAGER",
    "UAN",
    "VOICEMAIL",
    "UNKNOWN"
  ];

  if (cc == null || cc == undefined) {
    cc = propertiesAndWidgets.widgets.defaultCountry;
  }
  const number = phoneUtil.parseAndKeepRawInput(pn, cc);
  if (phoneUtil.isValidNumber(number)) {
    let output = phoneUtil.format(number, PNF[propertiesAndWidgets.widgets.outputFormat]);
    return [output,number.getCountryCode(),NumberType[phoneUtil.getNumberType(number)]];
  }
  else {
    let ret = []
    if (this.ifInvalid) {
      ret.push(pn);
    } else {
      ret.push(undefined);
    }
    let qualityStatus = {
      "field": "Phone Number",
      "isValid": phoneUtil.isValidNumber(number),
      "isPossible": phoneUtil.isPossibleNumber(number),
      "Uri": uri,
      "message": "The phone number is invalid"

    }
    ret.push(undefined);
    ret.push(qualityStatus);
    return ret;
  }
}

function executeDeclarativeMapper(propertiesAndWidgets,node) {
  const lib2 = require("/custom-modules/pipes/runtime/entity-services-lib-vpp.sjs")
  const lib = require('/data-hub/5/builtins/steps/mapping/default/lib.sjs');

  if (!node.xpath) node = fn.head(xdmp.unquote(xdmp.quote(node)))

  let result = ""
  let prov = {}

  let mapping = lib.getMappingWithVersion(propertiesAndWidgets.widgets.mappingName, parseInt(propertiesAndWidgets.widgets.mappingVersion)).toObject()

  result = lib2.validateAndRunMappingByDoc(mapping, node)

  let entityType = result.targetEntityType
  entityType = entityType.substring(0, entityType.lastIndexOf("/"))
  entityType = entityType.substring(entityType.lastIndexOf("/") + 1).split("-")

  let oOutput = {}
  Object.keys(result.properties).map(item => { oOutput[item] = result.properties[item].output })
  let out = {};
  if (propertiesAndWidgets.widgets["WithInstanceRoot"]  === true) {
    out[entityType[0]] = oOutput
    out["info"] = {
      "title": entityType[0],
      "version": entityType[1]
    }
  }
  else {
    out = oOutput
  }
  return out;
}

function executeXsl(propertiesAndWidgets,inputNode,xslStr,xslPath) {
  let result = null;
  if (inputNode != null && inputNode != undefined) {
    if ((xslStr == undefined || xslStr == null) && (xslPath != null && xslPath != undefined)) {
      result = xdmp.xsltInvoke(xslPath, inputNode);
   }  else if (xslStr != null && xslStr != undefined) {
      let xsl = xdmp.unquote(xslStr);
      result = xdmp.xsltEval(xsl, inputNode);
    }
  }
  return result;
}

function executeLookupByValueReturnAlwaysAnArray() {
  return true;
}

function executeLookupByValue(propertiesAndWidgets,var1) {
  let retArray = [];
  let collection = propertiesAndWidgets.widgets.collection;
  collection = !collection ? "" : collection;
  let dataType = propertiesAndWidgets.widgets.dataType;
  let property = propertiesAndWidgets.widgets.property;
  dataType = !dataType || (dataType !== 'bool' && dataType !== 'string' && dataType !== 'number') ? "string" : dataType;
  let foundDoc = fn.head(xdmp.invokeFunction(() => {
    let arr = [];
    if (!(var1.constructor.name === 'Array')) {
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
    xdmp.log("QUERY");
    xdmp.log(query);
    return cts.search(query, ["unfiltered", "score-zero"], 0);
  }, { database: xdmp.database(propertiesAndWidgets.widgets.database) }));
  xdmp.log("FOUND");
  if (!fn.empty(foundDoc)) {
    xdmp.log(propertiesAndWidgets.widgets);
    xdmp.log(propertiesAndWidgets.widgets.nbOutputValues);
    xdmp.log(parseInt(propertiesAndWidgets.widgets.nbOutputValues));
    for (let i = 0; i < parseInt(propertiesAndWidgets.widgets.nbOutputValues); i++) {
      let path = propertiesAndWidgets.widgets["value" + i + "Path"];
      xdmp.log("PATRH")
      xdmp.log(path);
      if ( path != null && path  != "") {
        const r = foundDoc.xpath(path);
        xdmp.log("R ")
        xdmp.log(r);
        retArray.push(r);
      } else {
        retArray.push(undefined);
      }
    }
    return retArray;
  }
  return undefined;
}

function executeExpertQueryBuilderInputAsList() {
  return true;
}
function executeExpertQueryBuilder(propertiesAndWidgets,inputs) {
  let query = propertiesAndWidgets.properties.queryBuilder
  let computedQuery = null
  // TODO : pass also the list of input in order to replace inside the query if needed
  if (query.logicalOperator == "all") {
    computedQuery = cts.andQuery( computeQueryRecursively(query, propertiesAndWidgets,inputs))
  } else {
    computedQuery = cts.orQuery(computeQueryRecursively(query, propertiesAndWidgets,inputs))
  }
  let result = xdmp.invokeFunction(() => {
    return cts.search(computedQuery,["unfiltered","score-zero"],0);
  }, { database: xdmp.database(query.selectedDB.label) });
  return [result,computedQuery];
}

function computeQueryRecursively (queryString, propertiesAndWidgets,inputs) {
  let qArray = []

  for (let child of queryString.children) {
    if (child.type == "query-builder-rule") {
      if (child.query.rule == "cts.collectionQuery") {
        qArray.push(cts.collectionQuery(replaceInputValueQuery(child.query.value.value, inputs)))
      } else if (child.query.rule == "jsonPropertyValueQuery") {

        let value = child.query.value.selectedType == "string" ? fn.string(replaceInputValueQuery(child.query.value.selectedValue.name ? child.query.value.selectedValue.name : child.query.value.selectedValue, inputs)) : child.query.value.selectedType == "number" ? fn.number(replaceInputValueQuery(child.query.value.selectedValue.name ? child.query.value.selectedValue.name : child.query.value.selectedValue, inputs)) : replaceInputValueQuery(child.query.value.selectedValue.name ? child.query.value.selectedValue.name : child.query.value.selectedValue, inputs)

        qArray.push(cts.jsonPropertyValueQuery(child.query.value.selectedAttribute, value))
      } else if (child.query.rule == "wordQuery") {
        qArray.push(cts.wordQuery(replaceInputValueQuery(child.query.value, inputs)))
      }
    } else if (child.type == "query-builder-group") {
      if (child.query.logicalOperator == "all") {
        qArray.push(cts.andQuery(computeQueryRecursively(child.query, inputs)))
        xdmp.trace(TRACE_ID, qArray)
      } else {
        qArray.push(cts.orQuery(computeQueryRecursively(child.query, inputs)))
      }
    }
  }
  return qArray
}

function replaceInputValueQuery (value, inputs) {
  for (var i = 0; i < inputs.length ; i++) {
    if (value.includes("${v" + i + "}")) {
      return value.replace("${v" + i + "}", inputs[i])
    }
  }
  return value
}


function executeJsonValidation(propertiesAndWidgets,inputNode,schema){
  try {
    return xdmp.jsonValidate(inputNode, schema);
  }
  catch (error) {
    return error.message;
  }
}
function executeXmlValidation(propertiesAndWidgets,inputNode) {
  return xdmp.toJSON(xdmp.validate(inputNode));
}

function executeSourceBlockInputAsList() {
  return true;
}

function executeSourceBlock(propertiesAndWidgets,inputs) {
  xdmp.log("Enter executeSourceBlock");
  xdmp.log(propertiesAndWidgets);
  const blockData = propertiesAndWidgets.properties.blockData;
  let outputMap = new Map()
  let max = -1;
  let index;
  if (blockData.blockDef.options.indexOf("nodeInput")>-1) {
    if(inputs[blockData.ioSetup.inputs["Node"]]!=null) {
      let inputNode = inputs[blockData.ioSetup.inputs["Node"]];
      blockData.doc.input = inputNode;
      if(!blockData.doc.input.toObject) {
        blockData.doc.input = fn.head(xdmp.unquote(JSON.stringify(blockData.doc.input)))
      }
    }
  }
  if (blockData.blockDef.options.indexOf("getByUri")>-1) {
    if(inputs[blockData.ioSetup.inputs["Uri"]]!=null) {
      blockData.doc.input = fn.head(fn.doc(inputs[blockData.ioSetup.inputs["Uri"]])).toObject();
    }
  }
  let docNode = blockData.doc.input
  for (let i = 0; i < blockData.blockDef.fields.length; i++) {
    if (blockData.blockDef.options.indexOf("nodeInput") > -1) {
      let path = "." + blockData.blockDef.fields[i].path
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
      }
      let children = docNode.xpath( path + "//*")
      if(fn.count(children)>1)
        v=docNode.xpath(path).toArray();
      else
        v=docNode.xpath( path + "/string()");
      blockData.doc.output[blockData.blockDef.fields[i].field] =  v
    }

    if (blockData.blockDef.options.indexOf("fieldsInputs") > -1) {
      let v = inputs[blockData.ioSetup.inputs[blockData.blockDef.fields[i].path]]
      blockData.doc.output[blockData.blockDef.fields[i].field] = v ;
      try {
        let srcUri = fn.baseUri(v);
        if(srcUri!=null) blockData.prov.add(String(srcUri))
      }
      catch(error) {
      }
    }
    if (blockData.blockDef.options.indexOf("fieldsOutputs") > -1) {
      index = blockData.ioSetup.outputs[blockData.blockDef.fields[i].path];
      if ( index > max ) {
        max = index;
      }
      outputMap.set(index, blockData.doc.output[blockData.blockDef.fields[i].field]);
    }
  }
  if (blockData.blockDef.options.indexOf("nodeOutput") > -1) {
    let out = {};
    if(propertiesAndWidgets.widgets["WithInstanceRoot"] == true){
      out[blockData.blockDef.collection] = blockData.doc.output;
      out["info"] = {
        "title" : blockData.blockDef.collection,
        "version" : "0.0.1" //TODO make it dynamic
      }
    }
    else{
      out= blockData.doc.output;
    }
    index = blockData.ioSetup.outputs["Node"];
    if ( index > max ) {
      max = index;
    }
    outputMap.set(index, out);
    index = blockData.ioSetup.outputs["Prov"];
    if ( index > max ) {
      max = index;
    }
    outputMap.set(index, Array.from(blockData.prov));
  }
  let output = [];
  for ( let i = 0 ; i <= max ; i++ ) {
    const value = outputMap.get(i);
    output.push(value);
  }
  return output;
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

function executeHighlight(propertiesAndWidgets,str,query,highlightKeyword) {
  let x = { "str": str };
  let result = new NodeBuilder();
  cts.highlight(x, query,
    function (builder, text, node, queries, start) {
      let hl = {}
      hl[highlightKeyword] = text
      builder.addNode(hl);
    }, result
  );
  return result.toNode().str
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

function executeMapRangeValues(propertiesAndWidgets,input1,input2) {
  let val = Number(input1);
  let mappedValue = propertiesAndWidgets.properties['mappingRange'].filter(item => {
    return val >= Number(item.from) && val <= Number(item.to)
  });
  let output = input2;
  if (!output) {
    output = 0;
  }
  if (mappedValue != null && mappedValue.length > 0) {
    output = mappedValue[0].target;
    if (output === "#INPUT#") {
      output = val;
    }
  }
  if (propertiesAndWidgets.widgets.castOutput === 'bool') {
    if (output === "true") {
      output = true;
    } else if (output === "false") {
      output = false;
    }
  } else if (propertiesAndWidgets.widgets.castOutput === 'string') {
    output = output.toString();
  } else if (propertiesAndWidgets.widgets.castOutput == 'number') {
    output = Number(output.toString());
  }
  return output;
}

function executeMapValues(propertiesAndWidgets,input) {
  let val = String(input);
  if (val === undefined) {
    val = "#NULL#";
  }
  if (val === null) {
    val = "#NULL#";
  }
  if (val === "") {
    val = "#EMPTY#";
  }
  let mappedValue = null;
  if (propertiesAndWidgets.widgets.wildcarded) {
    mappedValue = [];
    for (const map of propertiesAndWidgets.properties['mapping']) {
      const wildcard = map.source;
      const re = new RegExp(`^${wildcard.replace(/\*/g, '.*').replace(/\?/g, '.')}$`, '');
      if (re.test(val)) {
        mappedValue.push(map);
      }
    }
  } else {
    mappedValue = propertiesAndWidgets.properties['mapping'].filter(item => {
      return item.source === val;
    });
  }
  let output = input;
  if (mappedValue != null && mappedValue.length > 0) {
    output = mappedValue[0].target;
  }
  if (propertiesAndWidgets.widgets.castOutput === 'bool') {
    if (output === "true") {
      output = true;
    } else if (output === "false") {
      output = false;
    }
  } else if (propertiesAndWidgets.widgets.castOutput === 'string') {
    output = output.toString();
  } else if (propertiesAndWidgets.widgets.castOutput == 'number') {
    output = Number(output.toString());
  }

  if (output === "#NULL#") output = null;
  if (output === "#EMPTY#") output = "";
  return output;
}
function executeSelectCaseInputAsList() {
  return true;
}

function executeSelectCase(propertiesAndWidgets,inputs) {
  let value2test = inputs[0];
  if (value2test === undefined) {
    value2test = "#NULL#";
  } else if (value2test === null) {
    value2test = "#NULL#";
  } else if (value2test === "") {
    value2test = "#EMPTY#";
  } else {
    value2test = String(value2test);
  }
  let r = null;
  let o = null;
  for (let mapCase of propertiesAndWidgets.properties.mappingCase) {
    if (mapCase.value == value2test) {
      o = mapCase.input;
    }
  }
  const index = parseInt(o) + 2;
  if (o != null && index < inputs.length ) {
    r = inputs[index];
  } else {
    const defaultValue = inputs[1];
    if (defaultValue == null) {
      r = value2test;
    } else {
      r = defaultValue;
    }
  }
  return r;
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
      for (let p of patternArray) {
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

function executeCreateTriple(propertiesAndWidgets,subject,object) {
  let predicate = propertiesAndWidgets.widgets.predicate;

  let subjectIsIRI = propertiesAndWidgets.widgets.subjectIsIRI;
  let objectIsIRI = propertiesAndWidgets.widgets.objectIsIRI;

  if (subjectIsIRI) subject = sem.iri(String(subject))
  if (objectIsIRI) object = sem.iri(String(object))
  predicate = sem.iri(predicate)

 return sem.triple(subject, predicate, object);
}

function executeProvo(propertiesdAndWidgets,uri,t1,t2,t3,t4,t5){
  let triples = []
  if (t1) {
    triples.push(sem.triple(sem.iri(uri), sem.iri("http://www.w3.org/ns/prov#DerivedFrom1"), sem.iri(t1)))
  }
  if (t2) {
    triples.push(sem.triple(sem.iri(uri), sem.iri("http://www.w3.org/ns/prov#DerivedFrom1"), sem.iri(t2)))
  }
  if (t3) {
    triples.push(sem.triple(sem.iri(uri), sem.iri("http://www.w3.org/ns/prov#DerivedFrom1"), sem.iri(t3)))
  }
  if (t4) {
    triples.push(sem.triple(sem.iri(uri), sem.iri("http://www.w3.org/ns/prov#GeneratedBy"), sem.iri(t4)))
  }
  if (t5) {
    triples.push(sem.triple(sem.iri(uri), sem.iri("http://www.w3.org/ns/prov#createdOn"), sem.iri(t5)))
  }

  return triples;
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
  xdmp.log("LIBRARY");
  xdmp.log(library)
  xdmp.log("getRuntimeLibraryPath" in  block );
  xdmp.log(Object.keys(block));
  const inputs = getInputs(block);
  let propertiesAndWidgets = getPropertiesAndWidgets(block);
  if ( functionName === "executeSourceBlock") {
    propertiesAndWidgets.properties.blockData = block.blockData;
  }
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
  const returnAlwaysAnArrayFunction = functionName + "ReturnAlwaysAnArray"
  const returnAlwaysAnArray = returnAlwaysAnArrayFunction in lib && typeof lib[returnAlwaysAnArrayFunction] === "function" ? lib[returnAlwaysAnArrayFunction]() : false;
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
    // TODO should make this dynamical
    if (block.outputs.length > 1 || returnAlwaysAnArray ) {
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
  xdmp.log("BLOCK WIDGETS");
  xdmp.log(block.widgets);
  for ( let widget of block.widgets || [] ) {
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
