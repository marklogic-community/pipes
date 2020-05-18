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

Add a new block definition in the array like this:

```
{
  "functionName": "MyFunction", //Name of the function of the block
  "blockName": "MyFunction", //Name if the block
  "library": "user",  //Name of the menu entry
  "inputs": [.   //List of inputs
    {
      "name": "myInput1",
      "type": null
    }
  ],
  "outputs": [ //List of outputs
    {
      name: "myOutput1",
      type: null
    }
  ],
  "function": {
    "ref": null,
    "code": ""
  }

}
```

## Block implementation : 
It's used to execute the logic of the block in MarkLogic

The code is located in :

**./Examples/CustomModules/user.sjs**

```
function myBlock() //Any unique function is the module
{
   this.addInput("MyInput1"); //Add Inputs, same as the one in the son definition
   this.addOutput("myOutput1");//Add Outputs, same as the one in the son definition
}

myBlock.title = "MyFunction";
myBlock.desc = "MyFunction";

myBlock.prototype.onExecute = function()
{
   let myInput1 = this.getInputData(0) //Add Outputs, same as the one in the son definition
   // Code any logic you want or call external lib
   // Code any logic you want or call external lib
   // Code any logic you want or call external lib
   this.setOutputData(0, outputValueFromLogic ) //Set output(s) value(s)
}
LiteGraph.registerNodeType("user/MyFunction", myBlock ); //The first parameter must be equal to library/blockName of the block definition.
```

You must then run gradle mlloadmodules
You can also find details on block implementation here: [Litegraph guides](https://github.com/jagenjo/litegraph.js/tree/master/guides)

## How to tell Pipes to use these blocks
Put these files in a directory and in application.properties, define a property:
`customModulesRoot=/my/custom/modules/path`

Now, run the Jar with --deployBackend=true and the custom modules will be used by Pipes.
