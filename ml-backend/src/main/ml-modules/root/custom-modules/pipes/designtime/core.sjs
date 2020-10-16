'use strict';
//Copyright ©2020 MarkLogic Corporation.
const entity = require('/MarkLogic/entity');
const BLOCK_RUNTIME_DEBUG_TRACE = "pipesBlockRuntimeDebug";

const coreFunctions = require("/custom-modules/pipes/runtime/coreFunctions.sjs")

const TRACE_ID = "pipes-core";
const TRACE_ID_DETAILS = "pipes-core-details";

function init (LiteGraph) {

  //Input for a subgraph
  function GraphInputDHF () {
    this.addOutput("input", "");
    this.addOutput("uri", "");
    this.addOutput("collections", "");
    this.addOutput("permissions", "");

    this.name_in_graph = "";
    this.properties = {};
    var that = this;

    this.widgets_up = true;
    this.size = [180, 60];
  }

  GraphInputDHF.title = "Input";
  GraphInputDHF.desc = "Input of the graph";

  GraphInputDHF.prototype.getTitle = function () {
    if (this.flags.collapsed) {
      return this.properties.name;
    }
    return this.title;
  };

  GraphInputDHF.prototype.onAction = function (action, param) {
    if (this.properties.type == LiteGraph.EVENT) {
      this.triggerSlot(0, param);
    }
  };

  GraphInputDHF.prototype.onExecute = function () {
    //var name = this.properties.name;

    //read from global input
    var input = this.graph.inputs["input"];
    var uri = this.graph.inputs["uri"];
    var collections = this.graph.inputs["collections"];
    var permissions = this.graph.inputs["permissions"];

    //put through output
    this.setOutputData(0, input.value);
    this.setOutputData(1, uri.value);
    this.setOutputData(2, collections.value);
    this.setOutputData(3, permissions.value);
  };

  GraphInputDHF.prototype.onRemoved = function () {
    if (this.name_in_graph) {
      this.graph.removeInput(this.name_in_graph);
    }
  };

  GraphInputDHF.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeGraphInputDHF";
  }

  LiteGraph.GraphInput = GraphInputDHF;
  LiteGraph.registerNodeType("DHF/input", GraphInputDHF);

  //Output for a subgraph
  function GraphOutputObjectDHF () {
    //this.addInput("output", null );
    this.addInput("headers", null);
    this.addInput("triples", null);
    this.addInput("instance", null);
    this.addInput("attachments", null);
    this.addInput("uri", null);
    this.addInput("collections", null);
    this.addInput("permissions", null);
    this.addOutput("output", null);
    this.name_in_graph = "";
    this.properties = {};
    var that = this;

    this.format = this.addWidget("combo", "format", "json", function (v) { }, { values: ["json", "xml"] });

    this.size = [180, 60];
  }

  GraphOutputObjectDHF.title = "Output Object";
  GraphOutputObjectDHF.desc = "DHF output object";


  GraphOutputObjectDHF.prototype.onExecute = function () {
    coreFunctions.executeBlock(this);
  };

  GraphOutputObjectDHF.prototype.onAction = function (action, param) {
    if (this.properties.type == LiteGraph.ACTION) {
      this.graph.trigger(this.properties.name, param);
    }
  };

  GraphOutputObjectDHF.prototype.onRemoved = function () {
    if (this.name_in_graph) {
      this.graph.removeOutput(this.name_in_graph);
    }
  };

  GraphOutputObjectDHF.prototype.getTitle = function () {
    if (this.flags.collapsed) {
      return this.properties.name;
    }
    return this.title;
  };

  GraphOutputObjectDHF.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeEnvelope";
  }

  LiteGraph.registerNodeType("DHF/envelope", GraphOutputObjectDHF);

  //Output for a subgraph
  function GraphOutputDHF () {
    this.addInput("output", null);
    this.name_in_graph = "";
    this.properties = {};
    var that = this;
    this.size = [180, 60];
  }

  GraphOutputDHF.desc = "Output of the graph";

  GraphOutputDHF.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeGraphOutputDHF";
  }

  GraphOutputDHF.prototype.onExecute = function () {
    let output = this.getInputData(0)
    if (output && output.constructor === Array) {
      let globalArray = []
      coreFunctions.flattenArray(globalArray, output)
      this.graph.setOutputData("output", globalArray)
    }
    else
      this.graph.setOutputData("output", output)
    // }
  };


  GraphOutputDHF.prototype.onAction = function (action, param) {
    if (this.properties.type == LiteGraph.ACTION) {
      this.graph.trigger(this.properties.name, param);
    }
  };

  GraphOutputDHF.prototype.onRemoved = function () {
    if (this.name_in_graph) {
      this.graph.removeOutput(this.name_in_graph);
    }
  };

  GraphOutputDHF.prototype.getTitle = function () {
    if (this.flags.collapsed) {
      return this.properties.name;
    }
    return this.title;
  };

  LiteGraph.GraphOutput = GraphOutputDHF;
  LiteGraph.registerNodeType("DHF/output", GraphOutputDHF);

  /*
   String Case
  */

  function stringCaseBlock () {
    this.addInput("value", "xs:string");
    this.addOutput("nsValue", "xs:string");
    this.stringOperation = this.addWidget("combo", "stringOperation", "string", function (v) { }, { values: ["lowercase", "uppercase", "Capitalise"] });
  }

  stringCaseBlock.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeStringCase";
  }

  stringCaseBlock.prototype.onExecute = function () {
    return coreFunctions.executeBlock(this);
  }

  LiteGraph.registerNodeType("Transform/stringCase", stringCaseBlock);


  function fn_doc() {
    this.addInput('uri', 'xs:string');
    this.addOutput('doc', 'node');
    null
  };

  fn_doc.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeQueryDoc";
  }


  fn_doc.prototype.onExecute = function() {
    coreFunctions.executeBlock(this);
  };
  LiteGraph.registerNodeType('Query/doc', fn_doc);

  function fn_baseUri() {
    this.addInput('node', 'node');
    this.addOutput('uri', 'xs:string');
    null
  };

  fn_baseUri.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeBaseUri";
  }

  fn_baseUri.prototype.onExecute = function () {
    return coreFunctions.executeBlock(this);
  }


  LiteGraph.registerNodeType('Advanced/baseUri', fn_baseUri);

  function fn_count() {
    this.addInput('list');
    this.addOutput('nbItems', 'number');
    null
  };

  fn_count.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeCount";
  }

  fn_count.prototype.onExecute = function() {
    coreFunctions.executeBlock(this);
  };

  LiteGraph.registerNodeType('Advanced/count', fn_count);

  function fn_stringJoin() {
    this.addInput('string*', 'xs:string*');
    this.addOutput('joinedString', 'xs:string');
    this.addProperty('separator', ',');
  };
  fn_stringJoin.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeStringJoin";
  }

  fn_stringJoin.prototype.onExecute = function() {
    coreFunctions.executeBlock(this);
  };
  LiteGraph.registerNodeType('Join/String join', fn_stringJoin);

  function StringConstant () {
    this.addOutput("value", "xs:string");
    this.string = this.addWidget("text", "string", "Your string", function (v) { }, {});
  }

  StringConstant.desc = "Constant value";

  StringConstant.prototype.onDeadNodeRemoval = function () {
    // this node is not dead.
    return false;
  }

  StringConstant.prototype.onExecute = function () {
    this.setOutputData(0, this.string.value);
  }

  LiteGraph.registerNodeType("Generate/constant", StringConstant);



  function fn_head () {
    this.addInput("list");
    this.addOutput("firstItem");

  }

  fn_head.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeHead";
  }

  fn_head.prototype.onExecute = function () {
    coreFunctions.executeBlock(this);
  }

  LiteGraph.registerNodeType("Advanced/head", fn_head);


  /*
    featureLookupByValueBlock
  */
  function featureLookupByValueBlock () {
    this.addInput("var1");
    this.nbOutputValues = this.addWidget("text", "nbOutputValues", "string", function (v) { }, {});
    this.database = this.addWidget("text", "database", "string", function (v) { }, {});
    this.collection = this.addWidget("text", "collection", "string", function (v) { }, {});
    this.property = this.addWidget("text", "property", "string", function (v) { }, {});
    this.dataType = this.addWidget("text", "dataType", "string", function (v) { }, {});
    // addoutputs
    const OUTPUTS = 20;
    for (var vp = 0; vp < OUTPUTS; vp++) {
      var varName = 'value' + vp + 'Path'
      this[varName] = this.addWidget("text",varName, "", function (v) { }, {});
      this.addOutput("val" + vp);
    }
  }

  featureLookupByValueBlock.prototype.onExecute = function () {
    coreFunctions.executeBlock(this);
  }


  featureLookupByValueBlock.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeLookupByValue";
  }

  featureLookupByValueBlock.prototype.onExecute = function () {
     coreFunctions.executeBlock(this);
  }

  LiteGraph.registerNodeType("Query/LookupByValue", featureLookupByValueBlock);

  function featureQueryBuilderBlock () {
    this.addInput("v0");
    this.addOutput("documents");
    this.addOutput("ctsQuery");
    this.addProperty("queryBuilder");
    this.database = this.addWidget("text", "database", "string", function (v) { }, {});
  }

  featureQueryBuilderBlock.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeExpertQueryBuilder";
  }

  featureQueryBuilderBlock.prototype.onExecute = function () {
    coreFunctions.executeBlock(this);
  }

  LiteGraph.registerNodeType("Query/ExpertQueryBuilder", featureQueryBuilderBlock);

  function mapValueBlock () {
    this.addInput("value");
    this.addOutput("mappedValue");
    this.mapping = this.addProperty("mapping");
    this.castOutput = this.addWidget("combo", "castOutput", "string", function (v) { }, { values: ["string", "bool", "date", "int", "float"] });
    this.wildcarded = this.addWidget("toggle", "wildcarded", false, function (v) { }, {});
  }

  mapValueBlock.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeMapValues";
  }

  mapValueBlock.prototype.onExecute = function () {
    coreFunctions.executeBlock(this);
  }

  LiteGraph.registerNodeType("Mapping/Map values", mapValueBlock);

  function mapRangeValueBlock () {
    this.addInput("value");
    this.addInput("default");
    this.addOutput("mappedValue");
    this.mappingRange = this.addProperty("mappingRange");
    this.castOutput = this.addWidget("combo", "castOutput", "string", function (v) { }, { values: ["string", "bool", "date", "int", "float"] });
  }

  mapRangeValueBlock.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeMapRangeValues";
  }

  mapRangeValueBlock.prototype.onExecute = function () {
    coreFunctions.executeBlock(this);
  }

  LiteGraph.registerNodeType("Mapping/mapRangeValues", mapRangeValueBlock);

  function EvalJavaScriptBlock () {
    this.addInput("var0");
    this.addInput("var1");
    this.addInput("var2");
    this.addInput("var3");
    this.addInput("var4");
    this.addOutput("output");
    this.addProperty("sjsCode");
  }

  EvalJavaScriptBlock.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeJavaScript";
  }

  EvalJavaScriptBlock.prototype.onExecute = function () {
    coreFunctions.executeBlock(this);
  }

  LiteGraph.registerNodeType("Advanced/EvalJavaScript", EvalJavaScriptBlock);

  function AdvancedQueryBlock () {
      this.addInput("v0");
      this.addOutput("documents");
      this.addOutput("ctsQuery");
       this.addProperty("query");
      this.nbInputs = this.addWidget("text", "nbInputs", "string", function (v) { }, {});
      this.database = this.addWidget("text", "database", "string", function (v) { }, {});
  }

  AdvancedQueryBlock.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeAdvancedQueryBlock";
  }

  AdvancedQueryBlock.prototype.onExecute = function () {
    coreFunctions.executeBlock(this);
  }

  LiteGraph.registerNodeType("Advanced/AdvancedQuery", AdvancedQueryBlock);

  function currentDate () {
    this.size = [300, 300];
    this.addOutput("current");
    this.addProperty("currentDate", "currentDate", "enum", { values: currentDate.values });
  }

  currentDate.values = ["currentDate", "currentDateNoTz", "currentDateTime", "currentTime"];
  currentDate.desc = "Outputs current date(time)";
  currentDate["currentDate"] = { type: "enum", title: "currentDate", values: currentDate.values };

  currentDate.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeCurrentDate";
  }

  currentDate.prototype.getTitle = function () {
    return this.properties.currentDate;
  }

  currentDate.prototype.setValue = function (v) {
    this.properties["value"] = v;
  }

  currentDate.prototype.onExecute = function () {
    coreFunctions.executeBlock(this);
  }

  currentDate.prototype.onDrawBackground = function (ctx) {
    if (this.flags.collapsed)
      return;
  }

  LiteGraph.registerNodeType("Generate/Current Date", currentDate);

  // -----

  function EpochToDateTime () {
    this.addInput("epoch", null);
    this.addOutput("IsoDateTime", null);
    this.serialize_widgets = true;
  }


  EpochToDateTime.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeEpochToDateTime";
  }

  EpochToDateTime.prototype.onExecute = function () {
    coreFunctions.executeBlock(this);
  }

  LiteGraph.registerNodeType('Format/EpochToDateTime', EpochToDateTime);

  // ----

  function formatDateTimeAuto () {
    this.addInput("inputDateTime", null);
    this.addOutput("IsoDateTime", null);
    this.serialize_widgets = true;
  }


  formatDateTimeAuto.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeFormatDateTimeAuto";
  }

  formatDateTimeAuto.prototype.onExecute = function () {
    coreFunctions.executeBlock(this);
  }

  LiteGraph.registerNodeType('Format/FormatDateTimeAuto', formatDateTimeAuto);

  // ----

  function formatDateAuto () {
    this.addInput("inputDate", null);
    this.addOutput("IsoDate", null);
    this.serialize_widgets = true;
  }


  formatDateAuto.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeFormatDateAuto";
  }

  formatDateAuto.prototype.onExecute = function () {
    coreFunctions.executeBlock(this);
  }

  LiteGraph.registerNodeType('Format/FormatDateAuto', formatDateAuto);

  // -----

  function hashNode () {
    this.addInput("Node", null);
    this.addOutput("Hash", "xs:string");
    this.properties = {};
    var that = this;
    this.hashAlgo = this.addWidget("combo", "hash function", "hash64", function (v) { }, { values: ["hash64", "sha1", "sha256", "sha512"] });
    this.size = this.computeSize();
    this.serialize_widgets = true;
  }

  hashNode.prototype.onExecute = function () {
    coreFunctions.executeBlock(this);
  }

  hashNode.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeHash";
  }

  LiteGraph.registerNodeType("Generate/hashNode", hashNode);

  //node constructor class
  function normalizeSpaceBlock () {
    this.addInput("value", "xs:string");
    this.addOutput("nsValue", "xs:string");

  }

  normalizeSpaceBlock.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeNormalizeSpace";
  }

  normalizeSpaceBlock.prototype.onExecute = function () {
    coreFunctions.executeBlock(this);
  }

  LiteGraph.registerNodeType("Clean/NormalizeSpace", normalizeSpaceBlock);

  function RegExReplaceBlock () {
    this.addInput("input", "xs:string");
    this.addOutput("output", "xs:string");
    this.regEx = this.addWidget("text", "regex", "", function (v) { }, {});
    this.replace = this.addWidget("text", "replace", "", function (v) { }, {});
    this.global = this.addWidget("toggle", "global", true, function (v) { }, {});
    this.caseInsensitive = this.addWidget("toggle", "caseInsensitive", true, function (v) { }, {});
  }

  RegExReplaceBlock.prototype.onExecute = function () {
    coreFunctions.executeBlock(this);
  }

  RegExReplaceBlock.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeRegExReplace";
  }

  LiteGraph.registerNodeType("Transform/RegExReplace", RegExReplaceBlock);

  function stringTemplate () {
    this.addInput("v1");
    this.addInput("v2");
    this.addInput("v3");
    this.addOutput("newString", "xs:string");

    this.v4 = this.addWidget("text", "v4", "v4", function (v) { }, {});
    this.v5 = this.addWidget("text", "v5", "v5", function (v) { }, {});
    this.template = this.addWidget("text", "template", "${v1} ${v2} ${v3} ${v4}", function (v) { }, {});
    this.size = [230, 160];
    this.serialize_widgets = true;

  }

  stringTemplate.desc = "Apply string template on inputs";

  stringTemplate.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeTemplating";
  }

  stringTemplate.prototype.onExecute = function () {
    return coreFunctions.executeBlock(this);
  }

  LiteGraph.registerNodeType("Generate/Templating", stringTemplate);

  // ---

  function FormatDate () {
    this.addInput("inputDate");

    this.addOutput("IsoDate");

    this.format = this.addWidget("text", "format", "DD/MM/YYYY", function (v) { }, {});
    this.size = [230, 160];
    this.serialize_widgets = true;

  }
  FormatDate.desc = "Format date with explicit format";

  FormatDate.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeFormatDate";
  }

  FormatDate.prototype.onExecute = function () {
    coreFunctions.executeBlock(this);
  }

  LiteGraph.registerNodeType("Format/FormatDate", FormatDate);
  // ---

  function FormatDateTime () {
    this.addInput("inputDateTime");

    this.addOutput("IsoDateTime");

    this.format = this.addWidget("text", "format", "DD/MM/YYYY hh:mm:ss", function (v) { }, {});
    this.size = [230, 160];
    this.serialize_widgets = true;
  }

  FormatDateTime.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeFormatDateTime";
  }

  FormatDateTime.desc = "Format date with explicit format";

  FormatDateTime.prototype.onExecute = function () {
    coreFunctions.executeBlock(this);
  }

  LiteGraph.registerNodeType("Format/FormatDateTime", FormatDateTime);

   // ---

  function addPropertyBlock() {
    this.addInput('doc', 'node');
    this.addInput('value');
    this.addOutput('doc', 'node');
    this.addProperty('propertyName', 'Property name');
  };

  addPropertyBlock.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeAddProperty";
  }

  addPropertyBlock.prototype.onExecute = function () {
    return coreFunctions.executeBlock(this);
  }

  LiteGraph.registerNodeType('Enrich/AddProperty', addPropertyBlock);

  function CreateTriple () {
    this.addInput("subject");
    this.addInput("object");
    this.addOutput("triple");
    this.subjectIsIRI = this.addWidget("toggle", "subjectIsIRI", true, function (v) { }, {});
    this.predicate = this.addWidget("text", "predicate", "myPredicate", function (v) { }, {});
    this.objectIsIRI = this.addWidget("toggle", "objectIsIRI", true, function (v) { }, {});
    this.size = [230, 160];
    this.serialize_widgets = true;
  }

  CreateTriple.desc = "Create Triple";

  CreateTriple.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeCreateTriple";
  }

  CreateTriple.prototype.onExecute = function () {
    coreFunctions.executeBlock(this);
  }
  LiteGraph.registerNodeType("Enrich/CreateTriple", CreateTriple);



  function uuidString () {

    this.addOutput("uuid");

    this.prefix = this.addWidget("text", "prefix", "/prefix/", function (v) { }, {});
    this.size = [230, 160];
    this.serialize_widgets = true;

  }

  uuidString.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeUuidString";
  }
  uuidString.desc = "Generate UUID with prefix";

  uuidString.prototype.onDeadNodeRemoval = function () {
    // this node is not dead.
    return false;
  }

  uuidString.prototype.onExecute = function () {
    coreFunctions.executeBlock(this);
  }

  LiteGraph.registerNodeType("Generate/uuid", uuidString);


  function multicast () {
    this.addInput("v1");
    this.addInput("v2");
    this.addInput("v3");
    this.addInput("v4");
    this.addOutput("v1");
    this.addOutput("v2");
    this.addOutput("v3");
    this.addOutput("v4");


    this.type1 = this.addWidget("combo", "type1", "string", function (v) { }, { values: ["string", "int", "float"] });
    this.type2 = this.addWidget("combo", "type2", "string", function (v) { }, { values: ["string", "int", "float"] });
    this.type3 = this.addWidget("combo", "type3", "string", function (v) { }, { values: ["string", "int", "float"] });
    this.type4 = this.addWidget("combo", "type4", "string", function (v) { }, { values: ["string", "int", "float"] });
    this.size = [230, 160];
    this.serialize_widgets = true;
  }


  multicast.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeMultiCast";
  }

  multicast.desc = "Cast input to type";

  multicast.prototype.onExecute = function () {
      coreFunctions.executeBlock(this);
  }
  LiteGraph.registerNodeType("Transform/multicast", multicast);


  function Array () {
    this.addInput("item1");
    this.addInput("item2");
    this.addInput("item3");
    this.addInput("item4");
    this.addInput("item5");
    this.addOutput("array");
    this.addWidget("text", "nbInputs", 5, function (v) { }, { min: 0, max: 1000 });
  }

  Array.desc = "Array";

  Array.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeJoinArray";
  }

  Array.prototype.onExecute = function () {
    coreFunctions.executeBlock(this);
  }
  LiteGraph.registerNodeType("Join/Array", Array);

  function split () {
    this.addInput("string");
    this.addOutput("v1");
    this.addOutput("v2");
    this.addOutput("v3");
    this.addOutput("array");
    this.splitChar = this.addWidget("string", "splitChar", "/", function (v) { });
  }

  split.desc = "Split";

  split.prototype.onExecute = function () {
    coreFunctions.executeBlock(this);
  }

  split.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeStringSplit";
  }


  LiteGraph.registerNodeType("Split/Split", split);

  function selectCase () {
    this.addInput("value2Test", null);
    this.addOutput("result", "number");
    this.addProperty("mappingCase");
    var that = this;
    this.slider = this.addWidget("text", "nbInputs", 1, function (v) { }, { min: 0, max: 1000 });
    this.size = this.computeSize();
    this.serialize_widgets = true;
  }

  selectCase.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeSelectCase";
  }

  selectCase.prototype.onExecute = function () {
    coreFunctions.executeBlock(this);
  }

  LiteGraph.registerNodeType("Mapping/selectCase", selectCase);

  function xmlValidate () {
    this.addInput("node", null);
    this.addOutput("results", null);

    this.size = this.computeSize();
    this.serialize_widgets = true;
  }

  xmlValidate.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeXmlValidation";
  }
  xmlValidate.prototype.onExecute = function () {
    coreFunctions.executeBlock(this);
  }
  LiteGraph.registerNodeType("Validate/XMLValidate", xmlValidate);

  function jsonValidate () {
    this.addInput("node", null);
    this.addInput("schema", null);
    this.addOutput("results", null);

    this.size = this.computeSize();
    this.serialize_widgets = true;
  }

  jsonValidate.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeJsonValidation";
  }
  jsonValidate.prototype.onExecute = function () {
      coreFunctions.executeBlock(this);
  }

  LiteGraph.registerNodeType("Validate/JsonValidate", jsonValidate);

  function provo () {
    this.addInput("uri", null);
    this.addInput("DerivedFrom1", null);
    this.addInput("DerivedFrom2", null);
    this.addInput("DerivedFrom3", null);
    this.addInput("GeneratedBy", null);
    this.addInput("createdOn", null);
    this.addOutput("PROV-O", null);
    this.size = this.computeSize();
  }
  provo.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeProvo";
  }

  provo.prototype.onExecute = function () {
    coreFunctions.executeBlock(this);
  }

  LiteGraph.registerNodeType("Enrich/PROV-O structure", provo);

  function xslBlock () {
    this.addInput("node", null);
    this.addInput("xsl", "number");
    this.addInput("xslPath", null);
    this.addOutput("node", null);

    this.size = this.computeSize();
    this.serialize_widgets = true;
  }

  xslBlock.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeXsl";
  }
  xslBlock.prototype.onExecute = function () {
      coreFunctions.executeBlock(this);
  }
  LiteGraph.registerNodeType("Transform/ApplyXSLT", xslBlock);

  function DistinctValues () {
    this.addInput("array", null);
    this.addOutput("distinctValues", null);
    this.serialize_widgets = true;
  }

  DistinctValues.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeDistinctValues";
  }

  DistinctValues.prototype.onExecute = function () {
    coreFunctions.executeBlock(this);
  }

  LiteGraph.registerNodeType("Filter/DistinctValues", DistinctValues);

  function FilterArray() {
      this.addInput("unfiltered"); //Add Inputs, same as the one in the json definition
      this.addInput("patterns"); //Add Inputs, same as the one in the json definition
      this.addOutput("filtered");//Add Outputs, same as the one in the json definition
      this.include = this.addWidget("toggle","include", true, function(v){} );
  }
  FilterArray.desc = "Returns the filtered Array based on the given pattern(can be an arrray), either inclusive or exclusive";

  FilterArray.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeFilterArray";
  }

  FilterArray.prototype.onExecute = function() {
      coreFunctions.executeBlock(this);
  };

  LiteGraph.registerNodeType("Filter/FilterArray", FilterArray );

  function Highlight () {
    this.addInput("string", null);
    this.addInput("query", null);

    this.addOutput("enrichedString", null);

    this.serialize_widgets = true;
  }

  Highlight.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeHighlight";
  }
  Highlight.prototype.onExecute = function () {
      coreFunctions.executeBlock(this);
  }
  LiteGraph.registerNodeType("Enrich/Highlight", Highlight);

  function enrichEntity () {
    this.addInput("string", null);
    this.addInput("dictionary", null);
    this.addOutput("enrichedString", null);
    this.serialize_widgets = true;
  }

  enrichEntity.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeEnrichEntity";
  }

  enrichEntity.prototype.onExecute = function () {
    coreFunctions.executeBlock(this);
  }
  LiteGraph.registerNodeType("Enrich/EntityEnrichment", enrichEntity);

  function declarativeMapper () {
    this.addInput("node", null);
    this.mappingName = this.addWidget("string", "mappingName", "", function (v) { });
    this.mappingVersion = this.addWidget("string", "mappingVersion", 1, function (v) { });
    this.WithInstanceRoot = this.addWidget("toggle", "WithInstanceRoot", true, function (v) { });

    this.addOutput("mappedNode", null);
    this.serialize_widgets = true;
  }


  declarativeMapper.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeDeclarativeMapper";
  }
  declarativeMapper.prototype.onExecute = function () {
    coreFunctions.executeDeclarativeMapper();
  }
  LiteGraph.registerNodeType("DHF/declarativeMapper", declarativeMapper);

  function checkPhoneNumber () {
    this.addInput("phoneNumber", null);
    this.addInput("countryISO2", null);
    this.addInput("uri", null);
    this.addOutput("phoneNumber", null);
    this.addOutput("countryCode", null);
    this.addOutput("numberType", null);
    this.addOutput("qualityResult", null);
    this.outputFormat = this.addWidget("combo", "outputFormat", "INTERNATIONAL", function (v) { }, { values: ["NATIONAL", "INTERNATIONAL", "E164"] });
    this.defaultCountry = this.addWidget("string", "defaultCountry", "UK", function (v) { });
    this.ifInvalid = this.addWidget("toggle", "Output if invalid ?", true, function (v) { });

    this.serialize_widgets = true;
  }

  checkPhoneNumber.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeCheckPhoneNumber";
  }

  checkPhoneNumber.prototype.onExecute = function () {
    coreFunctions.executeBlock(this);
  }

  LiteGraph.registerNodeType("Validate/CheckPhoneNumber", checkPhoneNumber);

  function xpathBlock () {
    this.addInput("node");
    this.addOutput("nodes");
    this.xpath = this.addWidget("text", "xpath", "", function (v) { }, {});
    this.namespaces = this.addWidget("text", "namespaces", "", function (v) { }, {});
  }

  xpathBlock.desc = "xpath";

  xpathBlock.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeXpath";
  }

  xpathBlock.prototype.onExecute = function () {
    coreFunctions.executeBlock(this);
  }

  LiteGraph.registerNodeType("Transform/xpath", xpathBlock);

  // Multipurpose Constant Block
  function MultipurposeConstant () {
    this.addOutput("value");
    this.Type = this.addWidget("combo", "Type", "string", function (v) { }, { values: ["string", "number", "NULL"] });
    this.constant = this.addWidget("text", "constant", "", function (v) { }, {});
  }


  MultipurposeConstant.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeMultiPurposeConstant";
  }

  MultipurposeConstant.prototype.onExecute = function () {
    return coreFunctions.executeBlock(this);
  }
  LiteGraph.registerNodeType("Generate/multiConstant", MultipurposeConstant);

  // String Padding Block
  function StringPadding () {
    this.addInput("input");
    this.addOutput("output");
    this.totalWidth = this.addWidget("text", "Size", "", function (v) { }, {});
    this.paddingDirection = this.addWidget("combo", "Padding Direction", "left", function (v) { }, { values: ["left", "right"] });
    this.paddingChar = this.addWidget("text", "Padding Character", "", function (v) { }, {});
  }

  StringPadding.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeStringPadding";
  }

  StringPadding.prototype.onExecute = function () {
    return coreFunctions.executeBlock(this);
  }

LiteGraph.registerNodeType("Format/stringPadding", StringPadding);
}

module.exports = {
  init: init
};

