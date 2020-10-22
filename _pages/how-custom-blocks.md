---
layout: inner
title: How to create and use custom blocks?
lead_text: ''
permalink: /custom-blocks/
---

# User defined (custom) blocks

In order to define your own blocks without having to modify and build the front-end you can just update the following 2 files:

./Examples/CustomModules/user.json
./Examples/CustomModules/user.sjs

## Block interfaces definition: It's used to display the block and its inputs/outputs

**./Examples/CustomModules/user.json**

This example describes an Object block. In Pipes 2.0 this is not needed anymore, you can achieve the same using a "reverse" source block (fields in, node out with the root toggle on false).

Add a new block definition in the array like this:

```
[
  {
    "functionName": "Object",
    "blockName": "Object",
    "library": "user",
    "events": {
      "onConfigure": "let v = this.widgets[0].value;if (this.widgets.length == (parseInt(v) + 1)) return; this.widgets=this.widgets.slice(0,1);for (let x=0;x < v ;x++) {this.addWidget(\"text\", \"key\" + x , this.widgets_values[x+1], function (v) {})};return;"
    },
    "inputs": [
      {
        "name": "var0",
        "type": null
      }
    ],
    "properties": [
    ],
    "widgets": [
      {
        "type": "text",
        "name": "nbKeys",
        "default": "1",
        "values": "1",
        "callback": "let nb = this.inputs.length;let vInt = parseInt(v); if (vInt < nb) {for (let i=0;i<(nb - vInt);i++){this.removeInput(this.inputs.length-1);this.widgets.pop()}}else if (vInt > nb) { this.widgets=this.widgets.slice(0,1 + nb);for(let i=nb;i<vInt;i++) {this.addInput('var' + i,null);this.addWidget(\"text\", \"key\" + i  , '', function (v) {})};}"
      },
      {
        "type": "text",
        "name": "key0",
        "default": "",
        "values": []

      }
    ],
    "outputs": [
      {
        "name": "obj0",
        "type": null
      }
    ],
    "function": {
      "ref": null,
      "code": ""
    }
  }
]
```

## Block implementation : 
It's used to execute the logic of the block in MarkLogic

The code is located in :

**./Examples/CustomModules/user.sjs**

```
function init(LiteGraph){

    function ObjectBlock() {
        this.addInput("var0");
        this.nbKeys = this.addWidget("text","nbKeys", "string", function(v){},  { } );
        const OUTPUTS = 20;
        for (let vp = 0; vp < OUTPUTS; vp++ ) {
            var varName = 'key' + vp;
            this[varName] = this.addWidget("text",varName, "", function(v){},  { } );
            this.addInput("var" + vp);
        }
    }

    ObjectBlock.title = "Object";

    // This should be fixed on "user.sjs", that is this file.

    ObjectBlock.prototype.getRuntimeLibraryPath = function() {
        return "user.sjs";
    }

    // This returns the method name which should be in the getRuntimeLibraryPath() module. 
    ObjectBlock.prototype.getRuntimeLibraryFunctionName = function() {
        return "executeObjectBlock";
    }

/*

   Old Pipes 1.x implementation for reference. 

     ObjectBlock.prototype.onExecute = function()  {
        let obj = {};
        let keys = parseInt(this.nbKeys.value); 
        for ( let i = 0 ; i < keys ; i++ ) {
            const key = this['key'+i].value;
            xdmp.log("KEY "+key);
            if ( key && key.length > 0 ) {
                obj[key] = this.getInputData(i);
                xdmp.log("VALUE "+obj[key])
            }
        }
        xdmp.log("SET ");
        xdmp.log(obj);
        this.setOutputData(0,obj);
    }
    */

    // This should be fixed to this. In case of interpretation, executeBlock will call the delegate. 
    ObjectBlock.prototype.onExecute = function()  {
        require("/custom-modules/pipes/runtime/coreFunctions.sjs").executeBlock(this);
    }
    LiteGraph.registerNodeType("user/Object", ObjectBlock );
}

// BEWARE, this is outside the object:

// Optional function named <executionMethod>InputAsList. 
// If not present: false.
// Return true if you want to get the inputs as a list (executeMethod(propertiesAnmdWidgets,inputsAsLost)
// Return false if you want the inputs as a argument: (executeMethod(propertiesAnmdWidgets,input1,input2,input3)
//
function executeObjectBlockInputAsList() {
  return true;
}

// Optional function named <executionMethod>ReturnAlwaysAnArray.
// If not present: false
// Return true: <executionMethod> should always return [output1,output2,output3...]
// Return false: If nr of outputs = 1 -> return output, if outputs > 1 return [output1,output2,....]

function executeObjectBlockReturnAlwaysAnArray() { 
    return false;
}

// This is the execution block
function executeObjectBlock(propertiesAndWidgets,inputs) { 
        let obj = {};
        let keys = parseInt(propertiesAndWidgets.widgets.nbKeys);
        for ( let i = 0 ; i < keys ; i++ ) {
            const key = propertiesAndWidgets.widgets['key'+i];
            if ( inputs && key && key.length > 0 && i < inputs.length ) {
                obj[key] = inputs[i];
            }
        }
    return obj;
}

module.exports = {
    init:init,
    executeObjectBlock,
    executeObjectBlockInputAsList,
    executeObjectBlockReturnAlwaysAnArray
};
```

You must then run gradle mlloadmodules
You can also find details on block implementation here: [Litegraph guides](https://github.com/jagenjo/litegraph.js/tree/master/guides)


<a name="use-custom-blocks"></a>
## How to tell Pipes to use these blocks

- Put these files in a separate directory. Don't put them in the src/ directory of your DHF project. For instance, if your DHF project is in
```/usr/dev/my-dhf-project```, create a folder
```/usr/dev/my-dhf-project/user-modules``` and put the files there
- Now, to tell Pipes you want to include the user blocks defined in these files, you have to use the ```customModulesRoot``` property. There are 2 ways to do it:
  - ```java -jar marklogic-pipes-1.2-release.jar --customModulesRoot=/usr/dev/my-dhf-project/user-modules```
  - Or, put ```customModulesRoot=/usr/dev/my-dhf-project/user-modules``` in application.properties. The application.properties file should be put in the same folder from which you're running the Pipes jar so that it can be read in on start.
- In the Pipes blocks menu, you should now see a "user" group. If you don't see it, you probably have to refresh your browser or even clear the browser history:

![](../images/how-custom-blocks/user-menu.png)
