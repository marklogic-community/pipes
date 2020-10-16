'use strict';
//Copyright ©2020 MarkLogic Corporation.
const entity = require('/MarkLogic/entity');
const lib = require('/data-hub/5/builtins/steps/mapping/default/lib.sjs');
//const lib2 = require('/data-hub/5/builtins/steps/mapping/entity-services/lib.sjs')
const lib2 = require("/custom-modules/pipes/runtime/entity-services-lib-vpp.sjs")
const PNF = require('/custom-modules/pipes/runtime/google-libphonenumber.sjs').PhoneNumberFormat;
const phoneUtil = require('/custom-modules/pipes/runtime/google-libphonenumber.sjs').PhoneNumberUtil.getInstance();
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

  GraphOutputDHF.title = "Output";
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

  stringCaseBlock.title = "String Case";

  stringCaseBlock.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeStringCase";
  }

  stringCaseBlock.prototype.onExecute = function () {
    return coreFunctions.executeBlock(this);
  }

  LiteGraph.registerNodeType("Transform/stringCase", stringCaseBlock);

  //Show value inside the debug console
  function Console () {
    this.mode = LiteGraph.ON_EVENT;
    this.size = [60, 20];
    this.addProperty("msg", "");
    this.addInput("log", LiteGraph.EVENT);
    this.addInput("msg", 0);
  }

  Console.title = "Console";
  Console.desc = "Show value inside the console";

  Console.prototype.onAction = function (action, param) {
    if (action == "log")
      console.log(param);
    else if (action == "warn")
      console.warn(param);
    else if (action == "error")
      console.error(param);
  }

  Console.prototype.onExecute = function () {
    var msg = this.getInputData(1);
    if (msg !== null)
      this.properties.msg = msg;
    console.log(msg);
  }

  Console.prototype.onGetInputs = function () {
    return [["log", LiteGraph.ACTION], ["warn", LiteGraph.ACTION], ["error", LiteGraph.ACTION]];
  }

  LiteGraph.registerNodeType("basic/console", Console);


  //Show value inside the debug console
  function NodeScript () {
    this.size = [60, 20];
    this.addProperty("onExecute", "");
    this.addInput("in", "");
    this.addInput("in2", "");
    this.addOutput("out", "");
    this.addOutput("out2", "");

    this._func = null;
  }

  NodeScript.title = "Script";
  NodeScript.desc = "executes a code";

  NodeScript.widgets_info = {
    "onExecute": { type: "code" }
  };

  NodeScript.prototype.onPropertyChanged = function (name, value) {
    if (name == "onExecute" && LiteGraph.allow_scripts) {
      this._func = null;
      try {
        this._func = new Function(value);
      }
      catch (err) {
        console.error("Error parsing script");
        console.error(err);
      }
    }
  }

  NodeScript.prototype.onExecute = function () {
    if (!this._func)
      return;

    try {
      this._func.call(this);
    }
    catch (err) {
      console.error("Error in script");
      console.error(err);
    }
  }

  LiteGraph.registerNodeType("basic/script", NodeScript);

  function fn_doc() {
    this.addInput('uri', 'xs:string');
    this.addOutput('doc', 'node');
    null
  };
  fn_doc.title = 'doc';

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
  fn_baseUri.title = 'baseUri';
  fn_baseUri.prototype.onExecute = function() {
    this.setOutputData(0, fn.baseUri(this.getInputData(0)));
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

  fn_count.title = 'count';

  fn_count.prototype.onExecute = function() {
    coreFunctions.executeBlock(this);
  };

  LiteGraph.registerNodeType('Advanced/count', fn_count);

  function fn_stringJoin() {
    this.addInput('string*', 'xs:string*');
    this.addOutput('joinedString', 'xs:string');
    this.addProperty('separator', ',');
  };
  fn_stringJoin.title = 'String join';

  fn_stringJoin.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeStringJoin";
  }

  fn_stringJoin.prototype.onExecute = function() {
    coreFunctions.executeBlock(this);
  };
  LiteGraph.registerNodeType('Join/String join', fn_stringJoin);

  //Output for a subgraph
  function GlobalEnvelopeOutput () {
    //random name to avoid problems with other outputs when added
    var output_name = "output";
    var output_uri = "uri";

    this.addInput("output", null);
    this.addInput("headers", null);
    this.addInput("triples", null);
    this.addInput("instance", null);
    this.addInput("attachments", null);
    this.addInput("uri", null);

    this._value = null;

    this.properties = { name: output_name, type: null, uri: output_uri };

    var that = this;

    Object.defineProperty(this.properties, "name", {
      get: function () {
        return output_name;
      },
      set: function (v) {
        if (v == "")
          return;

        var info = that.getInputInfo(0);
        if (info.name == v)
          return;
        info.name = v;
        if (that.graph)
          that.graph.renameGlobalOutput(output_name, v);
        output_name = v;
      },
      enumerable: true
    });

    Object.defineProperty(this.properties, "uri", {
      get: function () {
        return output_uri;
      },
      set: function (v) {
        if (v == "")
          return;

        var info = that.getInputInfo(5);
        if (info.name == v)
          return;
        info.name = v;
        if (that.graph)
          that.graph.renameGlobalOutput(output_uri, v);
        output_uri = v;
      },
      enumerable: true
    });

    Object.defineProperty(this.properties, "type", {
      get: function () { return that.inputs[0].type; },
      set: function (v) {
        that.inputs[0].type = v;
        if (that.graph)
          that.graph.changeGlobalInputType(output_name, that.inputs[0].type);
      },
      enumerable: true
    });
  }

  GlobalEnvelopeOutput.title = "Output with envelope";
  GlobalEnvelopeOutput.desc = "Output of the graph";

  GlobalEnvelopeOutput.prototype.onAdded = function () {
    var name = this.graph.addGlobalOutput(this.properties.name, this.properties.type);
    var uri = this.graph.addGlobalOutput(this.properties.uri, this.properties.type);
  }

  GlobalEnvelopeOutput.prototype.getValue = function () {
    return this._value;
  }

  GlobalEnvelopeOutput.prototype.onExecute = function () {
    let result = { 'envelope': {} };
    result.envelope.headers = (this.getInputData(1) != undefined) ? this.getInputData(1) : {};
    result.envelope.triples = (this.getInputData(2) != undefined) ? this.getInputData(2) : {};
    result.envelope.instance = (this.getInputData(3) != undefined) ? this.getInputData(3) : {};
    result.envelope.attachments = (this.getInputData(4) != undefined) ? this.getInputData(4) : {};
    let uri = (this.getInputData(5) != undefined) ? this.getInputData(5) : null;

    this.graph.setGlobalOutputData(this.properties.name, result);
    this.graph.setGlobalOutputData(this.properties.uri, uri);
  }

  LiteGraph.registerNodeType("DHF/StepEnvelopeOutput", GlobalEnvelopeOutput);

  function StringConstant () {
    this.addOutput("value", "xs:string");
    this.string = this.addWidget("text", "string", "Your string", function (v) { }, {});
  }

  StringConstant.title = "Constant";
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

  //name to show
  fn_head.title = "head";

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
      this[varName] = this.addWidget("text", "nbOutputValues", "", function (v) { }, {});
      this.addOutput("val" + vp);
    }
  }

  //name to show
  featureLookupByValueBlock.title = "LookupByValue";

  featureLookupByValueBlock.prototype.onExecute = function () {
    let var1 = this.getInputData(0);
    coreFunctions.LookupByValue(this, var1, this.nbOutputValues.value);
  }

  LiteGraph.registerNodeType("Query/LookupByValue", featureLookupByValueBlock);

  function featureQueryBuilderBlock () {
    this.addInput("v0");
    this.addOutput("documents");
    this.addOutput("ctsQuery");
    this.addProperty("queryBuilder");
    this.database = this.addWidget("text", "database", "string", function (v) { }, {});
  }
  featureQueryBuilderBlock.title = "ExpertQueryBuilder";

  featureQueryBuilderBlock.prototype.onExecute = function () {

    let query = this.properties.queryBuilder

    let computedQuery = null


    // TODO : pass also the list of input in order to replace inside the query if needed
    if (query.logicalOperator == "all") {
      computedQuery = cts.andQuery(coreFunctions.computeQueryRecursively(query, this))
    } else {
      computedQuery = cts.orQuery(coreFunctions.computeQueryRecursively(query, this))
    }

    let result = xdmp.invokeFunction(() => {
      return cts.search(computedQuery,["unfiltered","score-zero"],0);
    }, { database: xdmp.database(query.selectedDB.label) });

    if (result != null) {
      this.setOutputData(0, result);
    }
    this.setOutputData(1, computedQuery);
  }

  LiteGraph.registerNodeType("Query/ExpertQueryBuilder", featureQueryBuilderBlock);

  function mapValueBlock () {
    this.addInput("value");
    this.addOutput("mappedValue");
    this.mapping = this.addProperty("mapping");
    this.castOutput = this.addWidget("combo", "castOutput", "string", function (v) { }, { values: ["string", "bool", "date", "int", "float"] });
    this.wildcarded = this.addWidget("toggle", "wildcarded", false, function (v) { }, {});
  }
  mapValueBlock.title = "mapValues";

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
  mapRangeValueBlock.title = "mapRangeValues";

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

  EvalJavaScriptBlock.title = "EvalJavaScript";

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

  AdvancedQueryBlock.title = "AdvancedQuery";

  AdvancedQueryBlock.prototype.onExecute = function () {
    let query = this.properties.query;
    let code = "";
    const nrOfInputs = parseInt(this.nbInputs.value);
    for ( let i = 0 ; i < nrOfInputs ; i++ )  {
      code += "const v" + i + " = this.getInputData(" + i + ");"
    }
    code += query;
    let computedQuery = eval(code);
    let result = xdmp.invokeFunction(() => {
      return cts.search(computedQuery,["unfiltered","score-zero"],0);
    }, { database: xdmp.database(this.database.value) });

    if (result != null) {
      this.setOutputData(0, result);
    }
    this.setOutputData(1, computedQuery);
  }

  LiteGraph.registerNodeType("Advanced/AdvancedQuery", AdvancedQueryBlock);

  function currentDate () {
    this.size = [300, 300];
    this.addOutput("current");
    this.addProperty("currentDate", "currentDate", "enum", { values: currentDate.values });
  }

  currentDate.values = ["currentDate", "currentDateNoTz", "currentDateTime", "currentTime"];
  currentDate.title = "Current date(time)";
  currentDate.desc = "Outputs current date(time)";
  currentDate["currentDate"] = { type: "enum", title: "currentDate", values: currentDate.values };

  currentDate.prototype.getTitle = function () {
    return this.properties.currentDate;
  }

  currentDate.prototype.setValue = function (v) {
    this.properties["value"] = v;
  }

  currentDate.prototype.onExecute = function () {
    switch (this.properties.currentDate) {
      case "currentDate": this.setOutputData(0, fn.currentDate()); break;
      case "currentDateNoTz": this.setOutputData(0, fn.adjustDateToTimezone(fn.currentDate(), null)); break;
      case "currentDateTime": this.setOutputData(0, fn.currentDateTime()); break;
      case "currentTime": this.setOutputData(0, fn.currentTime()); break;
    }
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

  hashNode.title = "Hash Node content";

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

  normalizeSpaceBlock.title = "NormalizeSpace";


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

  RegExReplaceBlock.title = "RegExReplace";
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

  stringTemplate.title = "String Templating";
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
  FormatDate.title = "Format date";
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

  FormatDateTime.title = "Format date";
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
  addPropertyBlock.title = 'Add property';

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

  CreateTriple.title = "Create Triple";
  CreateTriple.desc = "Create Triple";

  CreateTriple.prototype.onExecute = function () {

    let subject = this.getInputData(0)
    let object = this.getInputData(1)
    let predicate = this.predicate.value

    let subjectIsIRI = this.subjectIsIRI.value
    let objectIsIRI = this.objectIsIRI.value

    if (subjectIsIRI) subject = sem.iri(String(subject))
    if (objectIsIRI) object = sem.iri(String(object))
    predicate = sem.iri(predicate)

    this.setOutputData(0, sem.triple(subject, predicate, object));
  }
  LiteGraph.registerNodeType("Enrich/CreateTriple", CreateTriple);



  function uuidString () {

    this.addOutput("uuid");

    this.prefix = this.addWidget("text", "prefix", "/prefix/", function (v) { }, {});
    this.size = [230, 160];
    this.serialize_widgets = true;

  }

  uuidString.title = "UUID";
  uuidString.desc = "Generate UUID with prefix";

  uuidString.prototype.onDeadNodeRemoval = function () {
    // this node is not dead.
    return false;
  }

  uuidString.prototype.onExecute = function () {
    let prefix = this.prefix.value
    this.setOutputData(0, prefix + sem.uuidString());
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

  multicast.title = "Multicast";
  multicast.desc = "Cast input to type";

  multicast.prototype.onExecute = function () {
      coreFunctions.executeBlock(this);
  }
  LiteGraph.registerNodeType("Transform/multicast", multicast);



  function wktReproject (s_srs, t_srs, inWkt) {
    // get coords from inWkt and send to Esri project service, alternative is to setup something with ogr2ogr as a service (RFE: ogr/gdal in MarkLogic)
    // this reproject here is not the right place, no exception/error handling and won't work with higher data volumes I guess
    let outWkt = esriResponseToWKT(wktToEsriRequest(s_srs, t_srs, inWkt));
    //let outWkt = fn.concat(makeWkt("LINESTRING",5)); // create dummy wkt data
    return outWkt;
  }

  function wktToEsriRequest (s_srs, t_srs, inWkt) {
    let coords = fn.substringBefore(fn.substringAfter(inWkt, "LINESTRING ("), ")"); // TODO: improve to work for POINT and POLYGON WKT strings too
    var i;
    var pair;
    var pairs = coords.split(",");
    var esriPairs = '';
    for (var i = 0; i < pairs.length; i++) {
      pair = pairs[i].trim().split(" "); // TODO: now trims whitespaces from both ends of the string otherwise split on space fails, improve
      esriPairs += fn.concat('{"x": ', pair[0], ', "y": ', pair[1], '},');
    }
    esriPairs = esriPairs.substr(0, esriPairs.length - 1); // cut of last trailing comma
    let esriProjectService = "http://tasks.arcgisonline.com/arcgis/rest/services/Geometry/GeometryServer/project?";
    let esriSR = fn.concat("inSR=+", s_srs, "&outSR=", t_srs, "&geometries=");
    let esriGeometries = xdmp.urlEncode(fn.concat('{"geometryType":"esriGeometryPoint","geometries":[', esriPairs, ']}'), false);
    let esriOptions = "&transformation=&transformForward=true&f=pjson";
    let esriRequest = fn.concat(esriProjectService, esriSR, esriGeometries, esriOptions);
    let esriResponse = fn.subsequence(xdmp.httpGet(esriRequest), 2, 1); // get second part of the response to only return body part, not headers
    return esriResponse;
  }

  function esriResponseToWKT (esriResponse) {
    // from Esri json response to LINESTRING format, can't get the code right in MarkLogic to do it the json/array way.
    // should be able to just get x and y values from geometries object, this is so q&d now...
    let coords = fn.substringBefore(fn.substringAfter(esriResponse, '"geometries": ['), ']');
    coords = fn.replace(coords, "\\n", "");
    coords = fn.replace(coords, "\\r", "");
    coords = fn.replace(coords, "\\t", "");
    coords = fn.replace(coords, "\\},", "xxx");
    coords = fn.replace(coords, '\\{', '');
    coords = fn.replace(coords, '"x": ', '');
    coords = fn.replace(coords, '"y": ', '');
    coords = fn.replace(coords, '\\}', '');
    coords = fn.replace(coords, ',', ' ');
    coords = fn.replace(coords, 'xxx', ',');
    let reprojectedWkt = fn.concat("LINESTRING(", coords.trim(), ")");
    return reprojectedWkt;
  }

  function GeoReproject () {
    this.addInput("srcCoordinateSystem");
    this.addInput("targetCoordinateSystem");
    this.addInput("strWKT");
    this.addOutput("strWKT");
  }

  GeoReproject.title = "GeoReproject";
  GeoReproject.desc = "Geo Reproject";

  GeoReproject.prototype.onExecute = function () {

    let srcCS = parseInt(this.getInputData(0))
    let tgtCS = parseInt(this.getInputData(1))
    let strWKT = this.getInputData(2)
    let result = wktReproject(srcCS, tgtCS, strWKT)
    this.setOutputData(0, result)
  }
  LiteGraph.registerNodeType("Transform/GeoReproject", GeoReproject);


  function Array () {
    this.addInput("item1");
    this.addInput("item2");
    this.addInput("item3");
    this.addInput("item4");
    this.addInput("item5");
    this.addOutput("array");
    this.addWidget("text", "nbInputs", 5, function (v) { }, { min: 0, max: 1000 });
  }

  Array.title = "Array";
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

  split.title = "Split";
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

  selectCase.title = "selectCase";

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

  xmlValidate.title = "xmlValidate";
  xmlValidate.prototype.onExecute = function () {
    let inputNode = this.getInputData(0);
    this.setOutputData(0, xdmp.validate(inputNode))
  }
  LiteGraph.registerNodeType("Validate/XMLValidate", xmlValidate);

  function jsonValidate () {
    this.addInput("node", null);
    this.addInput("schema", null);
    this.addOutput("results", null);

    this.size = this.computeSize();
    this.serialize_widgets = true;
  }

  jsonValidate.title = "jsonValidate";
  jsonValidate.prototype.onExecute = function () {

    let inputNode = this.getInputData(0);
    let schema = this.getInputData(1);

    try {
      let results = xdmp.jsonValidate(inputNode, schema)
      this.setOutputData(0, results)
    }
    catch (error) {

      this.setOutputData(0, error)
    }
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

  provo.title = "PROV-O";
  provo.prototype.onExecute = function () {
    let uri = this.getInputData(0)
    let triples = []
    if (this.getInputData(1))
      triples.push(sem.triple(sem.iri(uri), sem.iri("http://www.w3.org/ns/prov#DerivedFrom1"), sem.iri(this.getInputData(1))))

    if (this.getInputData(2))
      triples.push(sem.triple(sem.iri(uri), sem.iri("http://www.w3.org/ns/prov#DerivedFrom1"), sem.iri(this.getInputData(2))))

    if (this.getInputData(3))
      triples.push(sem.triple(sem.iri(uri), sem.iri("http://www.w3.org/ns/prov#DerivedFrom1"), sem.iri(this.getInputData(3))))

    if (this.getInputData(4))
      triples.push(sem.triple(sem.iri(uri), sem.iri("http://www.w3.org/ns/prov#GeneratedBy"), sem.iri(this.getInputData(4))))

    if (this.getInputData(5))
      triples.push(sem.triple(sem.iri(uri), sem.iri("http://www.w3.org/ns/prov#createdOn"), sem.iri(this.getInputData(5))))

    this.setOutputData(0, triples)
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

  xslBlock.title = "XSL";
  xslBlock.prototype.onExecute = function () {

    let inputNode = this.getInputData(0);
    if (inputNode != null && inputNode != undefined) {
      let xslStr = this.getInputData(1);
      let xslPath = this.getInputData(2);
      let result = null
      if ((xslStr == undefined || xslStr == null) && (xslPath != null && xslPath != undefined))
        result = xdmp.xsltInvoke(xslPath, inputNode)
      else if (xslStr != null && xslStr != undefined) {
        let xsl = xdmp.unquote(xslStr)
        result = xdmp.xsltEval(xsl, inputNode)
      }

      this.setOutputData(0, result)
    }

  }
  LiteGraph.registerNodeType("Transform/ApplyXSLT", xslBlock);

  function DistinctValues () {
    this.addInput("array", null);
    this.addOutput("distinctValues", null);
    this.serialize_widgets = true;
  }

  DistinctValues.title = "DistinctValues";

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
  FilterArray.title = "FilterArray";
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

  Highlight.title = "Highlight";
  Highlight.prototype.onExecute = function () {

    let str = this.getInputData(0);
    let query = this.getInputData(1);
    let highlightKeyword = this.getInputData(2);

    let x = { "str": str };
    let result = new NodeBuilder();
    cts.highlight(x, query,
      function (builder, text, node, queries, start) {
        let hl = {}
        hl[highlightKeyword] = text
        builder.addNode(hl);
      }, result
    );
    this.setOutputData(0, result.toNode().str)
  }
  LiteGraph.registerNodeType("Enrich/Highlight", Highlight);

  function enrichEntity () {
    this.addInput("string", null);
    this.addInput("dictionary", null);

    this.addOutput("enrichedString", null);

    this.serialize_widgets = true;
  }

  enrichEntity.title = "EntityEnrichment";
  enrichEntity.prototype.onExecute = function () {

    let str = this.getInputData(0);
    let dict = this.getInputData(1);

    function asNode (text) {
      return new NodeBuilder()
        .addElement('node', text)
        .toNode();
    }

    let result = entity.enrich(asNode(str),
      [cts.entityDictionaryGet(dict)],
      "full")

    this.setOutputData(0, result)
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

  declarativeMapper.title = "declarativeMapper";
  declarativeMapper.prototype.onExecute = function () {

    let node = this.getInputData(0);

    if (!node.xpath) node = fn.head(xdmp.unquote(xdmp.quote(node)))

    let result = ""
    let prov = {}

    let mapping = lib.getMappingWithVersion(this.mappingName.value, parseInt(this.mappingVersion.value)).toObject()

    result = lib2.validateAndRunMappingByDoc(mapping, node)

    let entityType = result.targetEntityType
    entityType = entityType.substring(0, entityType.lastIndexOf("/"))
    entityType = entityType.substring(entityType.lastIndexOf("/") + 1).split("-")

    let oOutput = {}
    Object.keys(result.properties).map(item => { oOutput[item] = result.properties[item].output })
    let out = {};
    if (this["WithInstanceRoot"].value == true) {
      out[entityType[0]] = oOutput
      out["info"] = {
        "title": entityType[0],
        "version": entityType[1]
      }
    }
    else {
      out = oOutput
    }

    this.setOutputData(0, out)
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

  checkPhoneNumber.title = "CheckPhoneNumber";
  checkPhoneNumber.prototype.onExecute = function () {
    this.setOutputData(0, "test")
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
    ]

    let pn = this.getInputData(0)
    let cc = this.getInputData(1)
    if (cc == null || cc == undefined) cc = this.defaultCountry.value

    const number = phoneUtil.parseAndKeepRawInput(pn, cc);
    if (phoneUtil.isValidNumber(number)) {
      let output = phoneUtil.format(number, PNF[this.outputFormat.value])
      this.setOutputData(0, output)
      this.setOutputData(1, number.getCountryCode())
      this.setOutputData(2, NumberType[phoneUtil.getNumberType(number)])
    }
    else {

      if (this.ifInvalid)
        this.setOutputData(0, pn)
      let qualityStatus = {
        "field": "Phone Number",
        "isValid": phoneUtil.isValidNumber(number),
        "isPossible": phoneUtil.isPossibleNumber(number),
        "Uri": this.getInputData(2),
        "message": "The phone number is invalid"

      }
      this.setOutputData(3, qualityStatus)

    }

  }

  LiteGraph.registerNodeType("Validate/CheckPhoneNumber", checkPhoneNumber);

  function xpathBlock () {
    this.addInput("node");
    this.addOutput("nodes");
    this.xpath = this.addWidget("text", "xpath", "", function (v) { }, {});
    this.namespaces = this.addWidget("text", "namespaces", "", function (v) { }, {});
  }

  xpathBlock.title = "xpath";
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

  MultipurposeConstant.title = "multiconstant";

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

  StringPadding.title = "padding";

  StringPadding.prototype.getRuntimeLibraryFunctionName = function() {
    return "executeStringPadding";
  }

  StringPadding.prototype.onExecute = function () {
    coreFunctions.executeBlock(this);
  }
  LiteGraph.registerNodeType("Format/stringPadding", StringPadding);
}

module.exports = {
  init: init
};
