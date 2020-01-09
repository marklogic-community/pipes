//Copyright ©2020 MarkLogic Corporation.
const  moment = require("/custom-modules/pipes/moment-with-locales.min.sjs")
const entity = require('/MarkLogic/entity');
const lib = require('/data-hub/5/builtins/steps/mapping/default/lib.sjs');
//const lib2 = require('/data-hub/5/builtins/steps/mapping/entity-services/lib.sjs')
const  lib2 = require("/custom-modules/pipes/entity-services-lib-vpp.sjs")
const PNF = require('/custom-modules/pipes/google-libphonenumber.sjs').PhoneNumberFormat;
const phoneUtil = require('/custom-modules/pipes/google-libphonenumber.sjs').PhoneNumberUtil.getInstance();


function init(LiteGraph){


//Constant
  function Time()
  {
    this.addOutput("in ms","number");
    this.addOutput("in sec","number");
  }

  Time.title = "Time";
  Time.desc = "Time";

  Time.prototype.onExecute = function()
  {
    this.setOutputData(0, this.graph.globaltime * 1000 );
    this.setOutputData(1, this.graph.globaltime  );
  }

  LiteGraph.registerNodeType("basic/time", Time);





  //Input for a subgraph
  function GraphInputDHF() {
    this.addOutput("input", "");
    this.addOutput("uri", "");
    this.addOutput("collections", "");

    this.name_in_graph = "";
    this.properties = {};
    var that = this;


    this.widgets_up = true;
    this.size = [180, 60];
  }

  GraphInputDHF.title = "Input";
  GraphInputDHF.desc = "Input of the graph";

  GraphInputDHF.prototype.getTitle = function() {
    if (this.flags.collapsed) {
      return this.properties.name;
    }
    return this.title;
  };

  GraphInputDHF.prototype.onAction = function(action, param) {
    if (this.properties.type == LiteGraph.EVENT) {
      this.triggerSlot(0, param);
    }
  };

  GraphInputDHF.prototype.onExecute = function() {
    //var name = this.properties.name;

    //read from global input
    var input = this.graph.inputs["input"];
    var uri = this.graph.inputs["uri"];
    var collections = this.graph.inputs["collections"];


    //put through output
    this.setOutputData(0, input.value);
    this.setOutputData(1, uri.value);
    this.setOutputData(2, collections.value);
  };

  GraphInputDHF.prototype.onRemoved = function() {
    if (this.name_in_graph) {
      this.graph.removeInput(this.name_in_graph);
    }
  };

  LiteGraph.GraphInput = GraphInputDHF;
  LiteGraph.registerNodeType("dhf/input", GraphInputDHF);


  //Output for a subgraph
  function GraphOutputObjectDHF() {
    //this.addInput("output", null );
    this.addInput("headers", null );
    this.addInput("triples", null );
    this.addInput("instance", null );
    this.addInput("attachments", null );
    this.addInput("uri", null );
    this.addInput("collections", null );
    this.addOutput("output", null );
    this.name_in_graph = "";
    this.properties = {};
    var that = this;



    this.size = [180, 60];
  }

  GraphOutputObjectDHF.title = "Output Object";
  GraphOutputObjectDHF.desc = "DHF output object";

  GraphOutputObjectDHF.prototype.onExecute = function() {




    let result = {'envelope' : {}} ;
    // if(this.getInputData(0)==undefined) {
    result.envelope.headers = (this.getInputData(0)!=undefined)?this.getInputData(0):{};
    result.envelope.triples = (this.getInputData(1)!=undefined)?this.getInputData(1):{};
    result.envelope.instance = (this.getInputData(2)!=undefined)?this.getInputData(2):{};
    result.envelope.attachments  = (this.getInputData(3)!=undefined)?this.getInputData(3):{};

    let defaultCollections = (this.graph.inputs["collections"]!=null)?this.graph.inputs["collections"].value:null
    let defaultUri = (this.graph.inputs["uri"]!=null)?this.graph.inputs["uri"].value:sem.uuidString()
    let defaultContext = (this.graph.inputs["context"]!=null)?JSON.parse(JSON.stringify(this.graph.inputs["context"].value)):{}

    let uri  = (this.getInputData(4)!=undefined)?this.getInputData(4):defaultUri;
    let collections  = (this.getInputData(5)!=undefined)?this.getInputData(5):defaultCollections;
    let context = defaultContext

    let content = {}
    content.value = result;
    content.uri = uri

    context.collections = collections
    content.context = context;

    this.setOutputData(0,content)//}
    // this.graph.setOutputData( "output", content );}
    /*  else {
        this.setOutputData(0,this.getInputData(0))
        // this.graph.setOutputData( "output", this.getInputData(0) )
      }*/




  };

  GraphOutputObjectDHF.prototype.onAction = function(action, param) {
    if (this.properties.type == LiteGraph.ACTION) {
      this.graph.trigger(this.properties.name, param);
    }
  };

  GraphOutputObjectDHF.prototype.onRemoved = function() {
    if (this.name_in_graph) {
      this.graph.removeOutput(this.name_in_graph);
    }
  };

  GraphOutputObjectDHF.prototype.getTitle = function() {
    if (this.flags.collapsed) {
      return this.properties.name;
    }
    return this.title;
  };

//LiteGraph.GraphOutput = GraphOutputDHF;
  LiteGraph.registerNodeType("dhf/envelope", GraphOutputObjectDHF);


//Output for a subgraph
  function GraphOutputDHF() {
    this.addInput("output", null );
    /*   this.addInput("headers", null );
       this.addInput("triples", null );
       this.addInput("instance", null );
       this.addInput("attachments", null );
       this.addInput("uri", null );
       this.addInput("collections", null );*/

    this.name_in_graph = "";
    this.properties = {};
    var that = this;



    this.size = [180, 60];
  }

  GraphOutputDHF.title = "Output";
  GraphOutputDHF.desc = "Output of the graph";

  GraphOutputDHF.prototype.onExecute = function() {



    //let result = {'envelope' : {}} ;
    /* if(this.getInputData(0)==undefined) {
       result.envelope.headers = (this.getInputData(1)!=undefined)?this.getInputData(1):{};
       result.envelope.triples = (this.getInputData(2)!=undefined)?this.getInputData(2):{};
       result.envelope.instance = (this.getInputData(3)!=undefined)?this.getInputData(3):{};
       result.envelope.attachments  = (this.getInputData(4)!=undefined)?this.getInputData(4):{};


       let defaultCollections = (this.graph.inputs["collections"]!=null)?this.graph.inputs["collections"].value:null
       let defaultUri = (this.graph.inputs["uri"]!=null)?this.graph.inputs["uri"].value:sem.uuidString()
       let defaultContext = (this.graph.inputs["context"]!=null)?this.graph.inputs["context"].value:{}

       let uri  = (this.getInputData(5)!=undefined)?this.getInputData(5):defaultUri;
       let collections  = (this.getInputData(6)!=undefined)?this.getInputData(6):defaultCollections;
       let context = defaultContext

       let content = {}
       content.value = result;
       content.uri = uri

       context.collections = collections
       content.context = context;

       this.graph.setOutputData( "output", content );}
     else {*/
    let output =  this.getInputData(0)
    if(output.constructor === Array){
      let globalArray = []
      flattenArray(globalArray,output)
      this.graph.setOutputData( "output",globalArray )
    }
    else
      this.graph.setOutputData( "output",output )
    // }



  };

  function flattenArray(globalArray,value){
    for(let v of value)
      if(v.constructor === Array)
        flattenArray(globalArray,v)
      else
        globalArray.push(v)

  }

  GraphOutputDHF.prototype.onAction = function(action, param) {
    if (this.properties.type == LiteGraph.ACTION) {
      this.graph.trigger(this.properties.name, param);
    }
  };

  GraphOutputDHF.prototype.onRemoved = function() {
    if (this.name_in_graph) {
      this.graph.removeOutput(this.name_in_graph);
    }
  };

  GraphOutputDHF.prototype.getTitle = function() {
    if (this.flags.collapsed) {
      return this.properties.name;
    }
    return this.title;
  };

  LiteGraph.GraphOutput = GraphOutputDHF;
  LiteGraph.registerNodeType("dhf/output", GraphOutputDHF);

//Constant
  function Constant()
  {
    this.addOutput("value","number");
    this.addProperty( "value", 1.0 );
    this.editable = { property:"value", type:"number" };
  }

  Constant.title = "Const";
  Constant.desc = "Constant value";


  Constant.prototype.setValue = function(v)
  {
    if( typeof(v) == "string") v = parseFloat(v);
    this.properties["value"] = v;
    this.setDirtyCanvas(true);
  };

  Constant.prototype.onExecute = function()
  {
    this.setOutputData(0, parseFloat( this.properties["value"] ) );
  }

  Constant.prototype.onDrawBackground = function(ctx)
  {
    //show the current value
    this.outputs[0].label = this.properties["value"].toFixed(3);
  }

  LiteGraph.registerNodeType("basic/const", Constant);


//Watch a value in the editor
  function Watch()
  {
    this.size = [60,20];
    this.addInput("value",0,{label:""});
    this.value = 0;
  }

  Watch.title = "Watch";
  Watch.desc = "Show value of input";

  Watch.prototype.onExecute = function()
  {
    if( this.inputs[0] )
      this.value = this.getInputData(0);
  }

  Watch.toString = function( o )
  {
    if( o == null )
      return "null";
    else if (o.constructor === Number )
      return o.toFixed(3);
    else if (o.constructor === Array )
    {
      var str = "[";
      for(var i = 0; i < o.length; ++i)
        str += Watch.toString(o[i]) + ((i+1) != o.length ? "," : "");
      str += "]";
      return str;
    }
    else
      return String(o);
  }

  Watch.prototype.onDrawBackground = function(ctx)
  {
    //show the current value
    this.inputs[0].label = Watch.toString(this.value);
  }

  LiteGraph.registerNodeType("basic/watch", Watch);

//Watch a value in the editor
  function Pass()
  {
    this.addInput("in",0);
    this.addOutput("out",0);
    this.size = [40,20];
  }

  Pass.title = "Pass";
  Pass.desc = "Allows to connect different types";

  Pass.prototype.onExecute = function()
  {
    this.setOutputData( 0, this.getInputData(0) );
  }

  LiteGraph.registerNodeType("basic/pass", Pass);


//Show value inside the debug console
  function Console()
  {
    this.mode = LiteGraph.ON_EVENT;
    this.size = [60,20];
    this.addProperty( "msg", "" );
    this.addInput("log", LiteGraph.EVENT);
    this.addInput("msg",0);
  }

  Console.title = "Console";
  Console.desc = "Show value inside the console";

  Console.prototype.onAction = function(action, param)
  {
    if(action == "log")
      console.log( param );
    else if(action == "warn")
      console.warn( param );
    else if(action == "error")
      console.error( param );
  }

  Console.prototype.onExecute = function()
  {
    var msg = this.getInputData(1);
    if(msg !== null)
      this.properties.msg = msg;
    console.log(msg);
  }

  Console.prototype.onGetInputs = function()
  {
    return [["log",LiteGraph.ACTION],["warn",LiteGraph.ACTION],["error",LiteGraph.ACTION]];
  }

  LiteGraph.registerNodeType("basic/console", Console );



//Show value inside the debug console
  function NodeScript()
  {
    this.size = [60,20];
    this.addProperty( "onExecute", "" );
    this.addInput("in", "");
    this.addInput("in2", "");
    this.addOutput("out", "");
    this.addOutput("out2", "");

    this._func = null;
  }

  NodeScript.title = "Script";
  NodeScript.desc = "executes a code";

  NodeScript.widgets_info = {
    "onExecute": { type:"code" }
  };

  NodeScript.prototype.onPropertyChanged = function(name,value)
  {
    if(name == "onExecute" && LiteGraph.allow_scripts )
    {
      this._func = null;
      try
      {
        this._func = new Function( value );
      }
      catch (err)
      {
        console.error("Error parsing script");
        console.error(err);
      }
    }
  }

  NodeScript.prototype.onExecute = function()
  {
    if(!this._func)
      return;

    try
    {
      this._func.call(this);
    }
    catch (err)
    {
      console.error("Error in script");
      console.error(err);
    }
  }

  LiteGraph.registerNodeType("basic/script", NodeScript );



//Added by ERP

  /*
    function fn_doc(uri)
    {
        return fn.doc(uri);
    }
    LiteGraph.wrapFunctionAsNode('fn/fn_doc',fn_doc,
        ['xs:string'],'node')
        */

  let configs = [
    {
      "functionName" : "fn_doc",
      "blockName" : "doc",
      "library" : "fn",
      "inputs":[
        {
          name:"uri",
          type:"xs:string"}
      ],
      "outputs":[
        {
          "name": "doc",
          "type":"node"
        }
      ],
      "function":{
        "ref":"fn.doc",
        "code" :null
      }


    },
    {
      "functionName" : "fn_collection",
      "blockName" : "collection",
      "library" : "fn",
      "inputs":[
        {
          name:"collectionName",
          type:"xs:string"}
      ],
      "outputs":[
        {
          "name": "docs",
          "type":"node()*"
        }
      ],
      "function":{
        "ref":"fn.collection",
        "code" :null
      }


    },
    {
      "functionName" : "fn_baseUri",
      "blockName" : "baseUri",
      "library" : "fn",
      "inputs":[
        {
          name:"node",
          type:"node"}
      ],
      "outputs":[
        {
          "name": "uri",
          "type":"xs:string"
        }
      ],
      "function":{
        "ref":"fn.baseUri",
        "code" :null
      }


    },
    {
      "functionName" : "fn_head",
      "blockName" : "head",
      "library" : "fn",
      "inputs":[
        {
          name:"nodes",
          type:null}
      ],
      "outputs":[
        {
          "name": "node",
          "type":null
        }
      ],
      "function":{
        "ref":"fn.head",
        "code" :null
      }


    },
    {
      "functionName" : "fn_upperCase",
      "blockName" : "UpperCase",
      "library" : "string",
      "inputs":[
        {
          name:"string",
          type:"xs:string"}
      ],
      "outputs":[
        {
          "name": "STRING",
          "type":"xs:string"
        }
      ],
      "function":{
        "ref":"fn.upperCase",
        "code" :null
      }


    },
    {
      "functionName" : "fn_lowerCase",
      "blockName" : "LowerCase",
      "library" : "string",
      "inputs":[
        {
          name:"STRING",
          type:"xs:string"}
      ],
      "outputs":[
        {
          "name": "string",
          "type":"xs:string"
        }
      ],
      "function":{
        "ref":"fn.lowerCase",
        "code" :null
      }


    }
    ,
    {
      "functionName" : "fn_count",
      "blockName" : "count",
      "library" : "fn",
      "inputs":[
        {
          name:"list",
          type:null}
      ],
      "outputs":[
        {
          "name": "nbItems",
          "type":"number"
        }
      ],
      "function":{
        "ref":"fn.count",
        "code" :null
      }


    },
    {
      "functionName" : "cts_andQuery",
      "blockName" : "andQuery",
      "library" : "cts",
      "inputs":[
        {
          name:"query1",
          type:"cts:query"},
        {
          name:"query2",
          type:"cts:query"},
        {
          name:"query3",
          type:"cts:query"},
        {
          name:"query4",
          type:"cts:query"}
      ],
      "outputs":[
        {
          "name": "query",
          "type":"cts:query"
        }
      ],
      "function":{
        "ref":null,
        "code" :"let queries = [];" +
          "    if(this.getInputData(0)!=undefined) queries.push(this.getInputData(0));" +
          "    if(this.getInputData(1)!=undefined) queries.push(this.getInputData(1));" +
          "    if(this.getInputData(2)!=undefined) queries.push(this.getInputData(2));" +
          "    if(this.getInputData(3)!=undefined) queries.push(this.getInputData(3));" +
          "    this.setOutputData( 0, cts.andQuery(queries));"
      }


    } ,
    {
      "functionName" : "cts_orQuery",
      "blockName" : "orQuery",
      "library" : "cts",
      "inputs":[
        {
          name:"query1",
          type:"cts:query"},
        {
          name:"query2",
          type:"cts:query"},
        {
          name:"query3",
          type:"cts:query"},
        {
          name:"query4",
          type:"cts:query"}
      ],
      "outputs":[
        {
          "name": "query",
          "type":"cts:query"
        }
      ],
      "function":{
        "ref":null,
        "code" :"let queries = [];" +
          "    if(this.getInputData(0)!=undefined) queries.push(this.getInputData(0));" +
          "    if(this.getInputData(1)!=undefined) queries.push(this.getInputData(1));" +
          "    if(this.getInputData(2)!=undefined) queries.push(this.getInputData(2));" +
          "    if(this.getInputData(3)!=undefined) queries.push(this.getInputData(3));" +
          "    this.setOutputData( 0, cts.orQuery(queries));"
      }


    },
    {
      "functionName" : "cts_search",
      "blockName" : "search",
      "library" : "cts",
      "inputs":[
        {
          name:"query",
          type:"cts:query"}
      ],
      "outputs":[
        {
          "name": "results",
          "type":"node*"
        }
      ],
      "function":{
        "ref":"cts.search",
        "code" :null
      }


    },
    {
      "functionName" : "fn_stringJoin",
      "blockName" : "String join",
      "library" : "string",
      "inputs":[
        {
          name:"string*",
          type:"xs:string*"}
      ],
      "properties" : [
        {
          name:"separator",
          type:"xs:string"}

      ],
      "outputs":[
        {
          "name": "joinedString",
          "type":"xs:string"
        }
      ],
      "function":{
        "ref":"fn.stringJoin",
        "code" :null
      }
    },
    {
      "functionName" : "cts_collectionQuery",
      "blockName" : "collectionQuery",
      "library" : "cts",
      "inputs":[
        {
          name:"collectionName",
          type:"xs:string"}
      ],
      "outputs":[
        {
          "name": "query",
          "type":"cts:query"
        }
      ],
      "function":{
        "ref":"cts.collectionQuery",
        "code" :null
      }


    },
    {
      "functionName" : "isNumber",
      "blockName" : "isNumber*",
      "library" : "controls",
      "inputs":[
        {
          name:"value",
          type:null}
      ],
      "outputs":[
        {
          "name": "status",
          "type":"bool"
        }
      ],
      "function":{
        "ref":null,
        "code" :null
      }


    },
    {
      "functionName" : "isDate",
      "blockName" : "isDate*",
      "library" : "controls",
      "inputs":[
        {
          name:"value",
          type:null}
      ],
      "outputs":[
        {
          "name": "status",
          "type":"bool"
        }
      ],
      "function":{
        "ref":null,
        "code" :null
      }


    },
    {
      "functionName" : "isInDictionnary",
      "blockName" : "isInDictionnary*",
      "library" : "controls",
      "inputs":[
        {
          name:"value",
          type:null}
      ],
      "outputs":[
        {
          "name": "status",
          "type":"bool"
        }
      ],
      "function":{
        "ref":null,
        "code" :""
      }


    },
    {
      "functionName" :"checkRequiredFields",
      "blockName" : "checkRequiredFields*",
      "library" : "controls",
      "inputs":[
        {
          name:"node",
          type:null}
      ],
      "outputs":[
        {
          "name": "status",
          "type":"bool"
        }
      ],
      "function":{
        "ref":null,
        "code" :null
      }


    }
    ,

    {
      "functionName": "ctsDoc",
      "blockName": "Doc",
      "library": "cts",
      "inputs": [
        {
          "name": "uri",
          "type": null
        }

      ],
      "outputs": [

        {
          "name": "doc",
          "type": "node"
        }
      ],
      "function": {
        "ref": "cts.doc",
        "code": ""
      }

    },
    /* {
        "functionName" : "cts_jsonPropertyValueQuery",
        "blockName" : "jsonPropertyValueQuery",
        "library" : "cts",
        "inputs":[
            {
                name:"property",
                type:"xs:string"},
            {
                name:"value",
                type:"xs:string"}
        ],
        "outputs":[
            {
                "name": "query",
                "type":"cts:query"
            }
        ],
        "function":{
            "ref":"cts.jsonPropertyValueQuery",
            "code" :null
        }


    },
    {
        "functionName" : "mapValues",
        "blockName" : "Map values",
        "library" : "string",
        "inputs":[
            {
                name:"value",
                type:"xs:string"}
        ],
        "properties" : [
            {
                name:"mapping",
                type:[{"source":"srcVal","target": "targetVal"}]}

        ],
        "widgets": [
            {
                "type": "combo",
                "name": "cast",
                "default": "string",
                "values": ["string","bool","date","int","float"]

            }

        ],
        "outputs":[
            {
                "name": "mappedValue",
                "type":"xs:string"
            }
        ],
        "function":{
            "ref":null,
            "code" : "\
           let val = (this.getInputData(0)!=undefined)?this.getInputData(0):'';\
           let mappedValue = this.properties['mapping'].filter(item => {return item.source==val});\
           if (this.cast.value=='bool'){\
           if(mappedValue==\"true\") mappedValue=true;\
           if(mappedValue==\"false\") mappedValue=false;\
           }\
           \
            if(mappedValue.length >0) this.setOutputData( 0,mappedValue[0].target);\
                                  else  this.setOutputData( 0,null);"


        }
    }
    , */
    {
      "functionName" : "toEnvelope",
      "blockName" : "to Envelope",
      "library" : "dhf",
      "inputs":[
        {
          name:"headers",
          type:"node"},
        {
          name:"triples",
          type:"node"},
        {
          name:"instance",
          type:"node"},
        {
          name:"attachments",
          type:"node"}

      ],
      "outputs":[
        {
          "name": "doc",
          "type":"node"
        }
      ],
      "function":{
        "ref":null,
        "code" :"let result = {'envelope' : {}} ;" +
          "    if(this.getInputData(0)!=undefined) result.envelope.headers = this.getInputData(0);" +
          "    if(this.getInputData(1)!=undefined) result.envelope.triples = this.getInputData(1);" +
          "    if(this.getInputData(2)!=undefined) result.envelope.instance = this.getInputData(2);" +
          "    if(this.getInputData(3)!=undefined) result.envelope.attachments  = this.getInputData(3);" +
          "    this.setOutputData( 0, result);"
      }

    }
    ,
    {
      "functionName" : "fromEnvelope",
      "blockName" : "from Envelope",
      "library" : "dhf",
      "inputs":[
        {
          "name": "doc",
          "type":"node"
        }

      ],
      "outputs":[

        {
          name:"headers",
          type:"node"},
        {
          name:"triples",
          type:"node"},
        {
          name:"instance",
          type:"node"},
        {
          name:"attachments",
          type:"node"}
      ],
      "function":{
        "ref":null,
        "code" :"\
                let docNode = (this.getInputData(0)!=undefined)?this.getInputData(0):xdmp.toJSON({});\
                let headers = docNode.xpath('//headers');\
                let triples = docNode.xpath('//triples');\
                let instance = docNode.xpath('//instance');\
                let attachments = docNode.xpath('//attachments');\
                this.setOutputData( 0, headers);\
                this.setOutputData( 1, triples);\
                this.setOutputData(2, instance);\
                this.setOutputData( 3, attachments);"


      }

    },
    {
      "functionName" : "addProperty",
      "blockName" : "Add property",
      "library" : "transform",
      "inputs":[
        {
          "name": "doc",
          "type":"node"
        },
        {
          "name": "value",
          "type": null
        }

      ],

      "properties" : [
        {
          name:"propertyName",
          type:"Property name"}

      ],
      "outputs":[

        {
          name:"doc",
          type:"node"}
      ],
      "function":{
        "ref":null,
        "code" : "let doc = (this.getInputData(0)!=undefined)?this.getInputData(0):{}; \
                        let val = (this.getInputData(1)!=undefined)?this.getInputData(1):'';\
                        let propertyName = this.properties['propertyName'];\
                        if (xdmp.nodeKind(doc) == 'document' && doc.documentFormat == 'JSON') {\
                              doc=doc.toObject();\
                        }\
                        doc[propertyName] = val;\
                        this.setOutputData( 0, doc);"
      }

    }
  ]

  let code=""
  for (let config of configs){

    code += "function "+ config.functionName + "(){"
    code += config.inputs.map((input) => { return "this.addInput('" + input.name +  ((input.type)?"','" + input.type + "');":"');")}).join("")
    code += config.outputs.map((output) => { return "this.addOutput('" + output.name +  ((output.type)?"','" + output.type + "');":"');")}).join("")
    code += (config.properties!=null)?config.properties.map((property) => { return "this.addProperty('" + property.name +  ((property.type)?"','" + property.type + "');":"');")}).join(""):null;
    code += (config.widgets!=null)?config.widgets.map((widget) => { return "this.addWidget('" + widget.type + "','" + widget.name + "','" + widget.default + "', function(v){}, { values:" + JSON.stringify(widget.values) + "} );"}).join(""):"";

    //code += "    this.serialize_widgets = true;"

    //code += (config.properties)?"config.properties = " +  config.properties +";":"";
    code += "};"

    code += config.functionName + ".title = '" + config.blockName + "';";

    code += config.functionName + ".prototype.onExecute = function(){ ";

    if(config.function.ref != null){
      let i =0;
      code += "this.setOutputData( 0, " + config.function.ref + "(" +   config.inputs.map((input) => { return "this.getInputData("+ i++ + ")" }).join(",") + "));"
    }else
    {
      code += config.function.code;

    }
    code += "};"
//register in the syst em
    code += "LiteGraph.registerNodeType('" + config.library + "/" + config.blockName +"', " + config.functionName + " );"
  }

//xdmp.log(code)
  eval(code)

  /*

    function fn_collection(uri)
    {
        return fn.collection(uri);
    }
    LiteGraph.wrapFunctionAsNode('fn/fn_collection',fn_collection,
        ['xs:string'],'node()*')
  */


//Output for a subgraph
  function GlobalEnvelopeOutput()
  {
    //random name to avoid problems with other outputs when added
    var output_name = "output";
    var output_uri = "uri";

    this.addInput("output", null );
    this.addInput("headers", null );
    this.addInput("triples", null );
    this.addInput("instance", null );
    this.addInput("attachments", null );
    this.addInput("uri", null );

    this._value = null;

    this.properties = {name: output_name, type: null,uri: output_uri };

    var that = this;

    Object.defineProperty(this.properties, "name", {
      get: function() {
        return output_name;
      },
      set: function(v) {
        if(v == "")
          return;

        var info = that.getInputInfo(0);
        if(info.name == v)
          return;
        info.name = v;
        if(that.graph)
          that.graph.renameGlobalOutput(output_name, v);
        output_name = v;
      },
      enumerable: true
    });

    Object.defineProperty(this.properties, "uri", {
      get: function() {
        return output_uri;
      },
      set: function(v) {
        if(v == "")
          return;

        var info = that.getInputInfo(5);
        if(info.name == v)
          return;
        info.name = v;
        if(that.graph)
          that.graph.renameGlobalOutput(output_uri, v);
        output_uri = v;
      },
      enumerable: true
    });

    Object.defineProperty(this.properties, "type", {
      get: function() { return that.inputs[0].type; },
      set: function(v) {
        that.inputs[0].type = v;
        if(that.graph)
          that.graph.changeGlobalInputType( output_name, that.inputs[0].type );
      },
      enumerable: true
    });
  }

  GlobalEnvelopeOutput.title = "Output with envelope";
  GlobalEnvelopeOutput.desc = "Output of the graph";

  GlobalEnvelopeOutput.prototype.onAdded = function()
  {
    var name = this.graph.addGlobalOutput( this.properties.name, this.properties.type );
    var uri = this.graph.addGlobalOutput( this.properties.uri, this.properties.type );
  }

  GlobalEnvelopeOutput.prototype.getValue = function()
  {
    return this._value;
  }

  GlobalEnvelopeOutput.prototype.onExecute = function()
  {
    let result = {'envelope' : {}} ;
    result.envelope.headers = (this.getInputData(1)!=undefined)?this.getInputData(1):{};
    result.envelope.triples = (this.getInputData(2)!=undefined)?this.getInputData(2):{};
    result.envelope.instance = (this.getInputData(3)!=undefined)?this.getInputData(3):{};
    result.envelope.attachments  = (this.getInputData(4)!=undefined)?this.getInputData(4):{};
    let uri  = (this.getInputData(5)!=undefined)?this.getInputData(5):null;

    this.graph.setGlobalOutputData( this.properties.name, result );
    this.graph.setGlobalOutputData( this.properties.uri, uri );
  }

  LiteGraph.registerNodeType("dhf/StepEnvelopeOutput", GlobalEnvelopeOutput);


  /*
    function GlobalStepInputWithEnvelope()
    {

        //random name to avoid problems with other outputs when added
        var input_name = "input";

        this.addOutput("headers", null );
        this.addOutput("headers", null );
        this.addOutput("triples", null );
        this.addOutput("instance", null );
        this.addOutput("attachments", null );

        this.properties = { name: input_name, type: null };

        var that = this;

        Object.defineProperty( this.properties, "name", {
            get: function() {
                return input_name;
            },
            set: function(v) {
                if(v == "")
                    return;

                var info = that.getOutputInfo(0);
                if(info.name == v)
                    return;
                info.name = v;
                if(that.graph)
                    that.graph.renameGlobalInput(input_name, v);
                input_name = v;
            },
            enumerable: true
        });

        Object.defineProperty( this.properties, "type", {
            get: function() { return that.outputs[0].type; },
            set: function(v) {
                that.outputs[0].type = v;
                if(that.graph)
                    that.graph.changeGlobalInputType(input_name, that.outputs[0].type);
            },
            enumerable: true
        });
    }

    GlobalInput.title = "Input";
    GlobalInput.desc = "Input of the graph";

  //When added to graph tell the graph this is a new global input
    GlobalInput.prototype.onAdded = function()
    {
        this.graph.addGlobalInput( this.properties.name, this.properties.type );
    }

    GlobalInput.prototype.onExecute = function()
    {
        var name = this.properties.name;

        //read from global input
        var	data = this.graph.global_inputs[name];
        if(!data) return;

        //put through output
        this.setOutputData(0,data.value);
    }

    LiteGraph.registerNodeType("dhf/StepInput", GlobalInput);

  */

  function StringConstant()
  {
    this.addOutput("value","xs:string");
    this.string = this.addWidget("text","string", "Your string", function(v){}, {} );
  }

  StringConstant.title = "Constant";
  StringConstant.desc = "Constant value";




  StringConstant.prototype.onExecute = function()
  {
    this.setOutputData(0, this.string.value );
  }


  LiteGraph.registerNodeType("string/constant", StringConstant);




  function featureLookupBlock()
  {
    this.addInput("query");
    this.addInput("var1");
    this.addInput("var2");
    this.addOutput("value");
    this.query = this.addWidget("text","query", "", function(v){}, {} );
    this.valuePath = this.addWidget("text","valuePath", "", function(v){}, {} );
    this.ctsQuery = this.addProperty("ctsQuery" );

  }

//name to show
  featureLookupBlock.title = "Lookup";

//function to call when the node is executed

  featureLookupBlock.prototype.onExecute = function()
  {
    //let output = "lookup(" + this.getInputData(0) + "," + this.getInputData(1) + "," + this.getInputData(2) + ")"

    let query = this.getInputData(0)

    if(query==undefined || query==null) {

      let var1 = this.getInputData(1)
      let var2 = this.getInputData(2)

      let template =""
      if(this.properties.ctsQuery!=null)
        template = "`"+ this.properties.ctsQuery +"`"
      else
        template = "`"+ this.query.value +"`"
      let result = eval(template)
      query = eval(result)
    }

    let foundDoc = fn.head(cts.search(query))
    if(foundDoc!=null) this.setOutputData( 0, foundDoc.xpath(this.valuePath.value))
    //this.setOutputData( 0, output );


  }

//register in the system
  LiteGraph.registerNodeType("feature/Lookup", featureLookupBlock );

  function featureQueryBuilderBlock()
  {

    this.addInput("value0");
    this.addInput("value1");
    this.ctsQuery = this.addProperty("ctsQuery" );

  }

//name to show
  featureQueryBuilderBlock.title = "ExpertQueryBuilder";

//function to call when the node is executed

  featureQueryBuilderBlock.prototype.onExecute = function()
  {
    //let output = "lookup(" + this.getInputData(0) + "," + this.getInputData(1) + "," + this.getInputData(2) + ")"

    let v0= this.getInputData(0)
    let v1= this.getInputData(1)
    let v2= this.getInputData(2)
    let v4 = this.getInputData(3)
    let v5 = this.getInputData(4)
    let v6 = this.getInputData(5)
    let v7 = this.getInputData(6)
    let template = "`"+ this.properties.ctsQuery +"`"
    let result = eval(eval(template))
    this.setOutputData(0, result);

  }

//register in the system
  LiteGraph.registerNodeType("cts/ExpertQueryBuilder", featureQueryBuilderBlock );

  function mapValueBlock()
  {
    this.addInput("value");
    this.addOutput("mappedValue");
    this.mapping = this.addProperty("mapping" );
    this.castOutput = this.addWidget("combo","castOutput", "string", function(v){},  { values:["string","bool","date","int","float"]} );

  }

//name to show
  mapValueBlock.title = "mapValues";

//function to call when the node is executed

  mapValueBlock.prototype.onExecute = function()
  {

    let val = this.getInputData(0);
    if(val==undefined) val ="#NULL#"
    if(val==null) val ="#NULL#"
    if(val=="") val ="#EMPTY#"
    let mappedValue = this.properties['mapping'].filter(item => {return item.source==val});

    let output= val
    if(mappedValue!=null && mappedValue.length>0) output=mappedValue[0].target
    if (this.castOutput.value=='bool'){
      if(output=="true") output=true;
      if(output=="false") output=false;
    }

    if(output=="#NULL#") output = null
    if(output=="#EMPTY#") output =""

    this.setOutputData( 0,output);



  }

//register in the system
  LiteGraph.registerNodeType("string/Map values", mapValueBlock );




  /*  function cts_search(query,options,qualityWeight,forestIds)
    {
        return cts.search(query)
    }
    LiteGraph.wrapFunctionAsNode('cts/search',cts_search,
        ['cts:query','(cts:order|xs:string)*','xs:double?','xs:unsignedLong*'],'node()*')

  */
  /*  function cts_andQuery(query1,query2,query3,query4)
    {
        let queries = [];
        if(query1!=null) queries.push(query1);
        if(query2!=null) queries.push(query2);
        if(query3!=null) queries.push(query3);
        if(query4!=null) queries.push(query4);
        return cts.andQuery(queries)
    }
    LiteGraph.wrapFunctionAsNode('cts/andQuery',cts_andQuery,
        ['cts:query','cts:query','cts:query','cts:query'],'cts:query')
  */
  /*
    function cts_orQuery(query1,query2,query3,query4)
    {
        let queries = [];
        if(query1!=null) queries.push(query1);
        if(query2!=null) queries.push(query2);
        if(query3!=null) queries.push(query3);
        if(query4!=null) queries.push(query4);
        return cts.orQuery(queries)
    }
    LiteGraph.wrapFunctionAsNode('cts/orQuery',cts_orQuery,
        ['cts:query','cts:query','cts:query','cts:query'],'cts:query')

    function cts_collectionQuery(uris)
    {
        return cts.collectionQuery(uris)
    }
    LiteGraph.wrapFunctionAsNode('cts/collectionQuery',cts_collectionQuery,
        ['xs:string'],'cts:query')

  */

  /*
    function cts_jsonPropertyValueQuery(propertyName,value,options,weight)
    {
        return cts.jsonPropertyValueQuery(propertyName,value,options,weight)
    }
    LiteGraph.wrapFunctionAsNode('cts/jsonPropertyValueQuery',cts_jsonPropertyValueQuery,
        ['xs:string','xs:string','xs:string','xs:double'],'cts:query')

  */
  /*

    function fn_head(seq)
    {
        return fn.head(seq)
    }
    LiteGraph.wrapFunctionAsNode('fn/head',fn_head,
        ['node()*'],'node')

    function fn_upperCase(str)
    {
        return fn.upperCase(str)
    }
    LiteGraph.wrapFunctionAsNode('fn/upperCase',fn_upperCase,
        ['xs:string'],'xs:string')

    function fn_lowerCase(str)
    {
        return fn.lowerCase(str)
    }
    LiteGraph.wrapFunctionAsNode('fn/lowerCase',fn_lowerCase,
        ['xs:string'],'xs:string')

    function fn_baseUri(node)
    {
        return fn.baseUri(node)
    }
    LiteGraph.wrapFunctionAsNode('fn/baseUri',fn_baseUri,
        ['node'],'xs:string')


  */

  function currentDate()
  {
    this.size = [300,300];
    this.addOutput("current");
    this.addProperty( "currentDate", "currentDate", "enum", { values: currentDate.values } );
  }


  currentDate.values = ["currentDate","currentDateTime","currentTime"];

  currentDate.title = "Current date(time)";
  currentDate.desc = "Outputs current date(time)";
  currentDate["currentDate"] = { type:"enum", title: "currentDate", values: currentDate.values };

  currentDate.prototype.getTitle = function()
  {
    return this.properties.currentDate ;
  }

  currentDate.prototype.setValue = function(v)
  {
    //if( typeof(v) == "string") v = parseFloat(v);
    this.properties["value"] = v;
  }

  currentDate.prototype.onExecute = function()
  {

    switch(this.properties.currentDate){
      case "currentDate": this.setOutputData(0, fn.currentDate() ); break;
      case "currentDateTime": this.setOutputData(0, fn.currentDateTime() ); break;
      case "currentTime": this.setOutputData(0, fn.currentTime() ); break;

    }

  }

  currentDate.prototype.onDrawBackground = function(ctx)
  {
    if(this.flags.collapsed)
      return;

    /*ctx.font = "12px Arial";
    ctx.fillStyle = "#CCC";
    ctx.textAlign = "center";
    ctx.fillText(this.properties.currentDate, this.size[0] * 0.5, this.size[1] * 0.35 + LiteGraph.NODE_TITLE_HEIGHT );
    ctx.textAlign = "left";*/

  }

  LiteGraph.registerNodeType("date/Current Date", currentDate );


  function formatDateTimeAuto(srcDate)
  {

    let result =  moment(srcDate).format();
    if(result=="Invalid date")
      return null;
    else
      return result
  }
  LiteGraph.wrapFunctionAsNode('feature/formatDateTimeAuto',formatDateTimeAuto,
    ['xs:string'],'xs:string')

  function formatDateAuto(srcDate)
  {

    let result = moment(srcDate, ["MM-DD-YYYY", "YYYY-MM-DD","DD/MM/YYYY"]).format("YYYY-MM-DD")
    if(result=="Invalid date")
      return null;
    else
      return result

  }
  LiteGraph.wrapFunctionAsNode('date/FormatDateAuto',formatDateAuto,
    ['xs:string'],'xs:string')



  function hashNode()
  {
    this.addInput("Node",null);
    this.addOutput("Hash","xs:string");
    this.properties = {};
    var that = this;
    this.hashAlgo = this.addWidget("combo","hash function", "hash64", function(v){}, { values:["hash64","sha1","sha256","sha512"]} );
    this.size = this.computeSize();
    this.serialize_widgets = true;
  }

  hashNode.title = "Hash Node content";

  hashNode.prototype.onExecute = function()
  {

    switch(this.hashAlgo.value) {
      case "hash64":
        this.setOutputData( 0,String(xdmp.hash64(xdmp.quote(this.getInputData(0)))))
        break;
      case "sha1":
        this.setOutputData( 0,String(xdmp.sha1(xdmp.quote(this.getInputData(0)), "base64")))
        break;
      case "sha256":
        this.setOutputData( 0,String(xdmp.sha256(xdmp.quote(this.getInputData(0)), "base64")))
        break;
      case "sha512":
        this.setOutputData( 0,String(xdmp.sha512(xdmp.quote(this.getInputData(0)), "base64")))
        break;
      default:
        this.setOutputData( 0,"unknown")
        break;
    }

  }

  LiteGraph.registerNodeType("feature/hashNode", hashNode );

//node constructor class
  function countrySrc()
  {

    this.addOutput("name","xs:string");
    this.addOutput("country","xs:string");
    this.addOutput("population","xs:string");
    this.addOutput("metro-population","xs:string");
    this.addOutput("language","xs:string");

  }

//name to show
  countrySrc.title = "CountrySrc";

//function to call when the node is executed
  countrySrc.prototype.onExecute = function()
  {
    this.setOutputData( 0, "@'name'" );
    this.setOutputData( 1, "@'country'" );
    this.setOutputData( 2, "@'population'" );
    this.setOutputData( 3, "@'metro-population'" );
    this.setOutputData( 4, "@'language'" );

  }

//register in the system
  LiteGraph.registerNodeType("dm/CountrySrc", countrySrc );


//node constructor class
  function lookupBlock()
  {
    this.addInput("lookupMap","uri");
    this.addInput("Key1","xs:string");
    this.addInput("Key2","xs:string");
    this.addOutput("value");

  }

//name to show
  lookupBlock.title = "lookup";

//function to call when the node is executed
  lookupBlock.prototype.onExecute = function()
  {
    let output = "lookup(" + this.getInputData(0) + "," + this.getInputData(1) + "," + this.getInputData(2) + ")"
    this.setOutputData( 0, output );


  }

//register in the system
  LiteGraph.registerNodeType("dm/lookup", lookupBlock );


//node constructor class
  function lookupMapsBlock()
  {

    this.addOutput("countries","uri");
    this.addOutput("titles","uri");
    this.addOutput("orgs","uri");

  }

//name to show
  lookupMapsBlock.title = "lookupMaps";

//function to call when the node is executed
  lookupMapsBlock.prototype.onExecute = function()
  {
    this.setOutputData( 0, "'/countries.json'" );
    this.setOutputData( 1, "'/titles.json'" );
    this.setOutputData( 2, "'/orgs.json'" );

  }

//register in the system
  LiteGraph.registerNodeType("dm/lookupMaps", lookupMapsBlock );

//End of Added




//node constructor class
  function countryBlock()
  {

    this.addInput("name","xs:string");
    this.addInput("output-language","xs:string");
    this.addInput("country","date");
    this.addInput("population","xs:string");
    this.addInput("metro-population","xs:string");
    this.addInput("dense","xs:string");
    this.addOutput("Object","object");

  }

//name to show
  countryBlock.title = "Country";

//function to call when the node is executed
  countryBlock.prototype.onExecute = function()
  {

    let output= {

      "name" : "[[" + this.getInputData(0) + "]]",
      "output-language" : "[[" +this.getInputData(1)+ "]]",
      "country" : "[[" +this.getInputData(2)+ "]]",
      "population" : "[[" +this.getInputData(3)+ "]]",
      "metro-population" : "[[" +this.getInputData(4)+ "]]",
      "dense" : "[[" +this.getInputData(5)+ "]]"

    }

    this.setOutputData( 0, output);


  }

//register in the system
  LiteGraph.registerNodeType("dm/Country", countryBlock );

//End of Added



//node constructor class
  function lowercaseBlock()
  {

    this.addInput("value","xs:string");
    this.addOutput("lcValue","xs:string");

  }

//name to show
  lowercaseBlock.title = "lowerCase";

//function to call when the node is executed
  lowercaseBlock.prototype.onExecute = function()
  {

    let output= this.getInputData(0) + " => lowerCase()"


    this.setOutputData( 0, output);


  }

//register in the system
  LiteGraph.registerNodeType("dm/lowerCase", lowercaseBlock );


//node constructor class
  function multiplyBlock()
  {

    this.addInput("value1");
    this.addInput("value2");
    this.addOutput("result");

  }

//name to show
  multiplyBlock.title = "multiply";

//function to call when the node is executed
  multiplyBlock.prototype.onExecute = function()
  {

    let output= this.getInputData(0) + " * " + this.getInputData(1)


    this.setOutputData( 0, output);


  }

//register in the system
  LiteGraph.registerNodeType("dm/multiply", multiplyBlock );


//node constructor class
  function gateBlock()
  {

    this.addInput("value1");
    this.addInput("value2");
    this.addInput("condition");
    this.addInput("trueValue");
    this.addInput("falseValue");
    this.addOutput("result");

  }

//name to show
  gateBlock.title = "gate";

//function to call when the node is executed
  gateBlock.prototype.onExecute = function()
  {

    let output= "if("+this.getInputData(0) + " " + this.getInputData(2) + " "+ this.getInputData(1) +"), " + this.getInputData(3) +"," +  this.getInputData(4)+")"


    this.setOutputData( 0, output);


  }

//register in the system
  LiteGraph.registerNodeType("dm/gate", gateBlock );



  function MathOperationDM()
  {
    this.addInput("A");
    this.addInput("B");
    this.addOutput("=");
    this.addProperty( "A", 1 );
    this.addProperty( "B", 1 );
    this.addProperty( "OP", "+", "enum", { values: MathOperationDM.values } );
  }

  MathOperationDM.values = ["+","-","*","/","%","^"];

  MathOperationDM.title = "Operation";
  MathOperationDM.desc = "Easy math operators";
  MathOperationDM["@OP"] = { type:"enum", title: "operation", values: MathOperationDM.values };

  MathOperationDM.prototype.getTitle = function()
  {
    return "A " + this.properties.OP + " B";
  }

  MathOperationDM.prototype.setValue = function(v)
  {
    //if( typeof(v) == "string") v = parseFloat(v);
    this.properties["value"] = v;
  }

  MathOperationDM.prototype.onExecute = function()
  {
    var A = this.getInputData(0);
    var B = this.getInputData(1);
    if(A!=null)
      this.properties["A"] = A;
    else
      A = this.properties["A"];

    if(B!=null)
      this.properties["B"] = B;
    else
      B = this.properties["B"];

    // var result = 0;
    switch(this.properties.OP)
    {
      case '+': result = A + " + " + B; break;
      case '-': result =  A + " - " + B; break;
      case 'x':
      case 'X':
      case '*': result =  A + " * " + B; break;
      case '/': result =  A + " / " + B;; break;
      case '%': result =  A + "/" + B; break;
      case '^': result = "Math.pow("+A+","+B+")"; break;
      default:
        console.warn("Unknown operation: " + this.properties.OP);
    }
    this.setOutputData(0, result );
  }

  MathOperationDM.prototype.onDrawBackground = function(ctx)
  {
    if(this.flags.collapsed)
      return;

    ctx.font = "40px Arial";
    ctx.fillStyle = "#CCC";
    ctx.textAlign = "center";
    ctx.fillText(this.properties.OP, this.size[0] * 0.5, this.size[1] * 0.35 + LiteGraph.NODE_TITLE_HEIGHT );
    ctx.textAlign = "left";
  }

  LiteGraph.registerNodeType("dm/operation", MathOperationDM );


  function coalesce(value1,value2)
  {
    if(value1!=null)
      return value1
    else {if(value2!=null)
      return value2;
    else return null}
  }
  LiteGraph.wrapFunctionAsNode('dm/coalesce',fn_head,
    ['xs:string','xs:string'],'xs:string')
  /*
        "name": "[[extract('name') => lowerCase()]]",
            "output-language": "[[$outputLang]]",
            "country": "[[$outputName]]",
            "population": "[[extract('population') * 1000 ]]",
            "metro-population": "[[extract('metro-population') * 1000 ]]",
            "dense": "[[if((@'population' / @'metro-population') > 0.75, 'dense', 'sparse')]]"
            */

  function StringConstantDM()
  {
    this.addOutput("value","xs:string");
    this.addProperty( "value", "String Value" );
    this.editable = { property:"value", type:"xs:string" };
  }

  StringConstantDM.title = "String Const";
  StringConstantDM.desc = "Constant value";


  StringConstantDM.prototype.setValue = function(v)
  {
    //if( typeof(v) == "string") v = parseFloat(v);
    this.properties["value"] = v;
    this.setDirtyCanvas(true);
  };

  StringConstantDM.prototype.onExecute = function()
  {
    this.setOutputData(0, "'" + this.properties["value"] + "'"  );
  }

  StringConstantDM.prototype.onDrawBackground = function(ctx)
  {
    //show the current value
    this.outputs[0].label = "'" + this.properties["value"] + "'"//.toFixed(3);
  }

  LiteGraph.registerNodeType("dm/constStr", StringConstantDM);


  function stringTemplate()
  {
    this.addInput("v1");
    this.addInput("v2");
    this.addInput("v3");
    this.addOutput("newString","xs:string");

    this.v4 = this.addWidget("text","v4", "v4", function(v){}, {} );
    this.v5 = this.addWidget("text","v5", "v5", function(v){}, {} );
    this.template = this.addWidget("text","template", "${v1} ${v2} ${v3} ${v4}", function(v){}, {} );
    this.size = [230, 160];
    this.serialize_widgets = true;

  }



  stringTemplate.title = "String Templating";
  stringTemplate.desc = "Apply string template on inputs";



  stringTemplate.prototype.onExecute = function()
  {
    let v1= this.getInputData(0)
    let v2= this.getInputData(1)
    let v3= this.getInputData(2)
    let v4 = this.v4.value
    let v5 = this.v5.value
    let template = "`"+ this.template.value +"`"
    let result = eval(template)
    this.setOutputData(0, result );
  }


  LiteGraph.registerNodeType("string/Templating", stringTemplate );


  function FormatDate()
  {
    this.addInput("inputDate");

    this.addOutput("IsoDate");

    this.format = this.addWidget("text","format", "DD/MM/YYYY", function(v){}, {} );
    this.size = [230, 160];
    this.serialize_widgets = true;

  }



  FormatDate.title = "Format date";
  FormatDate.desc = "Format date with explicit format";



  FormatDate.prototype.onExecute = function()
  {
    let inputDate= this.getInputData(0)
    let format = this.format.value
    let result = fn.string(moment(inputDate, [format]).format('YYYY-MM-DD'))
    if(result=="Invalid date") result = null;
    this.setOutputData(0, result );
  }


  LiteGraph.registerNodeType("date/FormatDate", FormatDate );


  function CreateTriple()
  {
    this.addInput("subject");
    this.addInput("object");

    this.addOutput("triple");


    this.subjectIsIRI = this.addWidget("toggle","subjectIsIRI", true, function(v){}, {} );
    this.predicate = this.addWidget("text","predicate", "myPredicate", function(v){}, {} );
    this.objectIsIRI = this.addWidget("toggle","objectIsIRI", true, function(v){}, {} );
    this.size = [230, 160];
    this.serialize_widgets = true;

  }



  CreateTriple.title = "Create Triple";
  CreateTriple.desc = "Create Triple";



  CreateTriple.prototype.onExecute = function()
  {

    let subject = this.getInputData(0)
    let object = this.getInputData(1)
    let predicate = this.predicate.value

    let subjectIsIRI = this.subjectIsIRI.value
    let objectIsIRI = this.objectIsIRI.value


    if(subjectIsIRI) subject=sem.iri(String(subject))
    if(objectIsIRI) object=sem.iri(String(object))
    predicate = sem.iri(predicate)

    this.setOutputData(0,sem.triple(subject,predicate,object));
  }


  LiteGraph.registerNodeType("triples/CreateTriple", CreateTriple );

  function uuidString()
  {

    this.addOutput("uuid");

    this.prefix = this.addWidget("text","prefix", "/prefix/", function(v){}, {} );
    this.size = [230, 160];
    this.serialize_widgets = true;

  }



  uuidString.title = "UUID";
  uuidString.desc = "Generate UUID with prefix";





  uuidString.prototype.onExecute = function()
  {


    let prefix = this.prefix.value

    this.setOutputData(0, prefix + sem.uuidString() );
  }


  LiteGraph.registerNodeType("string/uuid", uuidString );


  function multicast()
  {
    this.addInput("v1");
    this.addInput("v2");
    this.addInput("v3");
    this.addInput("v4");
    this.addOutput("v1");
    this.addOutput("v2");
    this.addOutput("v3");
    this.addOutput("v4");


    this.type1 = this.addWidget("combo","type1", "string", function(v){}, { values:["string","int","float"]} );
    this.type2 = this.addWidget("combo","type2", "string", function(v){}, { values:["string","int","float"]} );
    this.type3 = this.addWidget("combo","type3", "string", function(v){}, { values:["string","int","float"]} );
    this.type4 = this.addWidget("combo","type4", "string", function(v){}, { values:["string","int","float"]} );
    this.size = [230, 160];
    this.serialize_widgets = true;

  }

  multicast.title = "Multicast";
  multicast.desc = "Cast input to type";

  multicast.prototype.onExecute = function()
  {

    for(let i=0;i<5;i++) {
      if (this.getInputData(i) != undefined) {
        switch (this["type" + i].value) {
          case "string":
            this.setOutputData(i, String(this.getInputData(i)) )
            break;
          case "int":
            this.setOutputData(i, parseInt(this.getInputData(i)) )
            break;
          case "float":
            this.setOutputData(i, parseFloat(this.getInputData(i)) )
            break;
          case "date":
            this.setOutputData(i, new date(this.getInputData(i)) )
            break;
          default:
            this.setOutputData(i, this.getInputData(i))
        }

      }


    }

  }
  LiteGraph.registerNodeType("basic/multicast", multicast );



  function wktReproject(s_srs,t_srs,inWkt) {
    // get coords from inWkt and send to Esri project service, alternative is to setup something with ogr2ogr as a service (RFE: ogr/gdal in MarkLogic)
    // this reproject here is not the right place, no exception/error handling and won't work with higher data volumes I guess
    let outWkt = esriResponseToWKT(wktToEsriRequest(s_srs,t_srs,inWkt));
    //let outWkt = fn.concat(makeWkt("LINESTRING",5)); // create dummy wkt data
    return outWkt;
  }

  function wktToEsriRequest(s_srs,t_srs,inWkt) {
    let coords = fn.substringBefore(fn.substringAfter(inWkt,"LINESTRING ("),")"); // TODO: improve to work for POINT and POLYGON WKT strings too
    var i;
    var pair;
    var pairs = coords.split(",");
    var esriPairs = '';
    for (var i = 0; i < pairs.length; i++) {
      pair = pairs[i].trim().split(" "); // TODO: now trims whitespaces from both ends of the string otherwise split on space fails, improve
      esriPairs += fn.concat('{"x": ',pair[0],', "y": ',pair[1],'},');
    }
    esriPairs = esriPairs.substr(0, esriPairs.length-1); // cut of last trailing comma
    let esriProjectService = "http://tasks.arcgisonline.com/arcgis/rest/services/Geometry/GeometryServer/project?";
    let esriSR = fn.concat("inSR=+",s_srs,"&outSR=",t_srs,"&geometries=");
    let esriGeometries = xdmp.urlEncode(fn.concat('{"geometryType":"esriGeometryPoint","geometries":[',esriPairs,']}'),false);
    let esriOptions = "&transformation=&transformForward=true&f=pjson";
    let esriRequest = fn.concat(esriProjectService,esriSR,esriGeometries,esriOptions);
    let esriResponse = fn.subsequence(xdmp.httpGet(esriRequest),2,1); // get second part of the response to only return body part, not headers
    return esriResponse;
  }

  function esriResponseToWKT(esriResponse) {
    // from Esri json response to LINESTRING format, can't get the code right in MarkLogic to do it the json/array way.
    // should be able to just get x and y values from geometries object, this is so q&d now...
    let coords = fn.substringBefore(fn.substringAfter(esriResponse,'"geometries": ['),']');
    coords = fn.replace(coords,"\\n","");
    coords = fn.replace(coords,"\\r","");
    coords = fn.replace(coords,"\\t","");
    coords = fn.replace(coords,"\\},","xxx");
    coords = fn.replace(coords,'\\{','');
    coords = fn.replace(coords,'"x": ','');
    coords = fn.replace(coords,'"y": ','');
    coords = fn.replace(coords,'\\}','');
    coords = fn.replace(coords,',',' ');
    coords = fn.replace(coords,'xxx',',');
    let reprojectedWkt = fn.concat("LINESTRING(",coords.trim(),")");
    return reprojectedWkt;
  }

  function GeoReproject()
  {
    this.addInput("srcCoordinateSystem");
    this.addInput("targetCoordinateSystem");
    this.addInput("strWKT");
    this.addOutput("strWKT");
  }

  GeoReproject.title = "GeoReproject";
  GeoReproject.desc = "Geo Reproject";

  GeoReproject.prototype.onExecute = function()
  {

    let srcCS = parseInt(this.getInputData(0))
    let tgtCS = parseInt(this.getInputData(1))
    let strWKT = this.getInputData(2)
    let result = wktReproject(srcCS,tgtCS,strWKT)
    this.setOutputData(0, result )

  }
  LiteGraph.registerNodeType("geo/GeoReproject", GeoReproject );


  function Array()
  {
    this.addInput("item1");
    this.addInput("item2");
    this.addInput("item3");
    this.addInput("item4");
    this.addInput("item5");
    this.addOutput("array");
  }

  Array.title = "Array";
  Array.desc = "Array";

  Array.prototype.onExecute = function()
  {
    let result = []
    for(let i=0;i<5;i++){
      let value =  this.getInputData(i)
      if(value!=null)
        result=result.concat(value)
    }

    this.setOutputData(0, result )

  }
  LiteGraph.registerNodeType("basic/Array", Array );



  function split()
  {
    this.addInput("string");
    this.addOutput("v1");
    this.addOutput("v2");
    this.addOutput("v3");
    this.addOutput("array");
    this.splitChar = this.addWidget("string","splitChar", "/", function(v){} );
  }

  split.title = "Split";
  split.desc = "Split";

  split.prototype.onExecute = function()
  {

    let str = this.getInputData(0)

    let result = fn.tokenize(str,this.splitChar.value).toArray()

    for(let i=0;i<fn.max([result.length,3]);i++)
      this.setOutputData(i, result[i] )
    this.setOutputData(3, result )

  }
  LiteGraph.registerNodeType("string/Split", split );


  function jsonPropertyValueQueryBlock()
  {
    this.addInput("property");
    this.addInput("value");
    this.addOutput("query");

    this.case = this.addWidget("combo","case", "", function(v){} ,{ values:[]});
    this.diacritic = this.addWidget("combo","diacritic", "", function(v){},{ values:[]});
    this.punctuation = this.addWidget("combo","punctuation", "", function(v){} ,{ values:[]});
    this.whitespace = this.addWidget("combo","whitespace", "", function(v){} ,{ values:[]});
    this.stemming = this.addWidget("combo","stemming", "", function(v){} ,{ values:[]});
    this.wildcard = this.addWidget("combo","wildcard", "", function(v){} ,{ values:[]});
    this.exact = this.addWidget("combo","exact", "", function(v){} ,{ values:[]});
  }

  jsonPropertyValueQueryBlock.title = "jsonPropertyValueQuery";
  jsonPropertyValueQueryBlock.desc = "jsonPropertyValueQuery";

  jsonPropertyValueQueryBlock.prototype.onExecute = function()
  {

    let prop = this.getInputData(0)
    let value = this.getInputData(1)

    let options =[]
    if(this.case.value != "") options.push(this.case.value)
    if(this.diacritic.value != "") options.push(this.diacritic.value)
    if(this.punctuation.value != "") options.push(this.punctuation.value)
    if(this.whitespace.value != "") options.push(this.whitespace.value)
    if(this.stemming.value != "") options.push(this.stemming.value)
    if(this.wildcard.value != "") options.push(this.wildcard.value)
    if(this.exact.value != "") options.push(this.exact.value)

    this.setOutputData(0, cts.jsonPropertyValueQuery(prop,value,options) )


  }
  LiteGraph.registerNodeType("cts/jsonPropertyValueQuery", jsonPropertyValueQueryBlock );

  function selectCase()
  {
    this.addInput("value2Test",null);
    this.addOutput("result","number");
    this.addProperty("testCases");
    var that = this;
    this.slider = this.addWidget("text","nbInputs", 1, function(v){}, { min: 0, max: 1000} );
    this.size = this.computeSize();
    this.serialize_widgets = true;
  }

  selectCase.title = "selectCase";
  selectCase.prototype.onExecute = function()
  {

    let value2test = String(this.getInputData(0));
    let map2Output = {}
    fn.tokenize(this.properties.testCases,"\n").toArray().map(item => {

      item = fn.tokenize(item,";").toArray()
      map2Output[item[0]]=parseInt(item[1])


    })
    let o = map2Output[value2test]

    this.setOutputData(0, (o!=null)?this.getInputData(o + 1):value2test )

  }
  LiteGraph.registerNodeType("feature/selectCase", selectCase );


  function xmlValidate()
  {
    this.addInput("node",null);
    this.addOutput("results",null);

    this.size = this.computeSize();
    this.serialize_widgets = true;
  }

  xmlValidate.title = "xmlValidate";
  xmlValidate.prototype.onExecute = function()
  {

    let inputNode = this.getInputData(0);


    this.setOutputData(0, xdmp.validate(inputNode))


  }
  LiteGraph.registerNodeType("controls/XMLValidate", xmlValidate );

  function jsonValidate()
  {
    this.addInput("node",null);
    this.addInput("schema",null);
    this.addOutput("results",null);

    this.size = this.computeSize();
    this.serialize_widgets = true;
  }

  jsonValidate.title = "jsonValidate";
  jsonValidate.prototype.onExecute = function()
  {

    let inputNode = this.getInputData(0);
    let schema = this.getInputData(1);

    try {
      let results = xdmp.jsonValidate(inputNode,schema)
      this.setOutputData(0, results)
    }
    catch(error) {

      this.setOutputData(0, error)
    }
  }

  LiteGraph.registerNodeType("controls/JsonValidate", jsonValidate );


  function provo()
  {
    this.addInput("uri",null);
    this.addInput("DerivedFrom1",null);
    this.addInput("DerivedFrom2",null);
    this.addInput("DerivedFrom3",null);
    this.addInput("GeneratedBy",null);
    this.addInput("createdOn",null);
    this.addOutput("PROV-O",null);

    this.size = this.computeSize();

  }

  provo.title = "PROV-O";
  provo.prototype.onExecute = function()
  {
    let uri =  this.getInputData(0)
    let triples = []
    if(this.getInputData(1))
      triples.push(sem.triple(sem.iri(uri),sem.iri("http://www.w3.org/ns/prov#DerivedFrom1"),sem.iri(this.getInputData(1))))

    if(this.getInputData(2))
      triples.push(sem.triple(sem.iri(uri),sem.iri("http://www.w3.org/ns/prov#DerivedFrom1"),sem.iri(this.getInputData(2))))

    if(this.getInputData(3))
      triples.push(sem.triple(sem.iri(uri),sem.iri("http://www.w3.org/ns/prov#DerivedFrom1"),sem.iri(this.getInputData(3))))

    if(this.getInputData(4))
      triples.push(sem.triple(sem.iri(uri),sem.iri("http://www.w3.org/ns/prov#GeneratedBy"),sem.iri(this.getInputData(4))))

    if(this.getInputData(5))
      triples.push(sem.triple(sem.iri(uri),sem.iri("http://www.w3.org/ns/prov#createdOn"),sem.iri(this.getInputData(5))))

    this.setOutputData(0, triples)
  }

  LiteGraph.registerNodeType("provenance/PROV-O structure", provo );

  function xslBlock()
  {
    this.addInput("node",null);
    this.addInput("xsl","number");
    this.addInput("xslPath",null);
    this.addOutput("node",null);

    this.size = this.computeSize();
    this.serialize_widgets = true;
  }

  xslBlock.title = "XSL";
  xslBlock.prototype.onExecute = function()
  {

    let inputNode = this.getInputData(0);
    if(inputNode!=null && inputNode!=undefined) {
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
  LiteGraph.registerNodeType("transform/ApplyXSLT", xslBlock );


  function DistinctValues()
  {
    this.addInput("array",null);
    this.xpath = this.addWidget("text","xpath", "//prop", function(v){});

    this.addOutput("distinctValues",null);

    this.serialize_widgets = true;
  }

  DistinctValues.title = "DistinctValues";
  DistinctValues.prototype.onExecute = function()
  {

    const builder = new NodeBuilder();
    let list = this.getInputData(0);
    let xpath = this.getInputData(0);
    let t = builder.addNode(list.toArray()).toNode()



    this.setOutputData(0, fn.distinctValues(t.xpath(this.xpath.value)).toArray())


  }
  LiteGraph.registerNodeType("feature/DistinctValues", DistinctValues );

  function Highlight()
  {
    this.addInput("string",null);
    this.addInput("query",null);

    this.addOutput("enrichedString",null);

    this.serialize_widgets = true;
  }

  Highlight.title = "Highlight";
  Highlight.prototype.onExecute = function()
  {


    let str = this.getInputData(0);
    let query = this.getInputData(1);
    let highlightKeyword = this.getInputData(2);


    let x = {"str": str};
    let result = new NodeBuilder();
    cts.highlight(x, query,
      function(builder,text,node,queries,start) {
        let hl = {}
        hl[highlightKeyword] = text
        builder.addNode( hl );
      }, result
    );



    this.setOutputData(0, result.toNode().str)


  }
  LiteGraph.registerNodeType("string/Highlight", Highlight );

  function enrichEntity()
  {
    this.addInput("string",null);
    this.addInput("dictionary",null);

    this.addOutput("enrichedString",null);

    this.serialize_widgets = true;
  }

  enrichEntity.title = "EntityEnrichment";
  enrichEntity.prototype.onExecute = function()
  {


    let str = this.getInputData(0);
    let dict = this.getInputData(1);


    function asNode(text) {
      return new NodeBuilder()
        .addElement('node', text)
        .toNode();
    }

    let result = entity.enrich(asNode(str),
      [cts.entityDictionaryGet(dict)],
      "full")

    this.setOutputData(0, result)


  }
  LiteGraph.registerNodeType("string/EntityEnrichment", enrichEntity );



  function declarativeMapper()
  {
    this.addInput("node",null);
    this.mappingName = this.addWidget("string","mappingName", "", function(v){});
    this.mappingVersion = this.addWidget("string","mappingVersion", 1, function(v){});
    this.WithInstanceRoot = this.addWidget("toggle","WithInstanceRoot", true, function(v){});

    this.addOutput("mappedNode",null);

    this.serialize_widgets = true;
  }

  declarativeMapper.title = "declarativeMapper";
  declarativeMapper.prototype.onExecute = function()
  {

    let node = this.getInputData(0);

    if(!node.xpath) node= fn.head(xdmp.unquote(xdmp.quote(node)))

    let result =""
    let prov= {}

    let mapping = lib.getMappingWithVersion(this.mappingName.value, parseInt(this.mappingVersion.value)).toObject()

    result = lib2.validateAndRunMappingByDoc(mapping,node)

    let entityType =result.targetEntityType
    entityType = entityType.substring(0,entityType.lastIndexOf("/"))
    entityType = entityType.substring(entityType.lastIndexOf("/") +1).split("-")

    let oOutput ={}
    Object.keys(result.properties).map(item => {oOutput[item]= result.properties[item].output})



    let out = {};
    if(this["WithInstanceRoot"].value == true){
      out[entityType[0]] = oOutput
      out["info"] = {
        "title" : entityType[0],
        "version" : entityType[1]

      }
    }
    else{

      out= oOutput
    }


    this.setOutputData(0, out)


  }
  LiteGraph.registerNodeType("dhf/declarativeMapper", declarativeMapper );


  function checkPhoneNumber()
  {
    this.addInput("phoneNumber",null);
    this.addInput("countryISO2",null);
    this.addInput("uri",null);
    this.addOutput("phoneNumber",null);
    this.addOutput("countryCode",null);
    this.addOutput("numberType",null);
    this.addOutput("qualityResult",null);


    this.outputFormat = this.addWidget("combo","outputFormat", "INTERNATIONAL", function(v){}, {values: ["NATIONAL","INTERNATIONAL","E164"] } );
    this.defaultCountry = this.addWidget("string","defaultCountry", "UK", function(v){});
    this.ifInvalid = this.addWidget("toggle","Output if invalid ?", true, function(v){});

    this.serialize_widgets = true;
  }

  checkPhoneNumber.title = "CheckPhoneNumber";
  checkPhoneNumber.prototype.onExecute = function()
  {
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
    if(cc==null || cc==undefined) cc= this.defaultCountry.value


    const number = phoneUtil.parseAndKeepRawInput(pn, cc);
    if(phoneUtil.isValidNumber(number)){
      let output = phoneUtil.format(number, PNF[this.outputFormat.value])
      this.setOutputData(0, output)
      this.setOutputData(1, number.getCountryCode())
      this.setOutputData(2, NumberType[phoneUtil.getNumberType(number)])
    }
    else{

      if(this.ifInvalid)
        this.setOutputData(0, pn)
      let qualityStatus = {
        "field" : "Phone Number",
        "isValid" : phoneUtil.isValidNumber(number),
        "isPossible" : phoneUtil.isPossibleNumber(number),
        "Uri" : this.getInputData(2),
        "message" :"The phone number is invalid"

      }
      this.setOutputData(3, qualityStatus)

    }



  }
  LiteGraph.registerNodeType("controls/CheckPhoneNumber", checkPhoneNumber );







}



module.exports = {
  init:init
};
