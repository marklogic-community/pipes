function extractModelByCollectionMatch(collectionsRoot){
    let models =[]
    for (let coll of cts.collectionMatch(collectionsRoot + "*")){
        let model={
            name : coll,
            fields : []

        }
        for (let node of fn.head(fn.collection(coll)).xpath("//*"))
            model.fields.push(fn.nodeName(node))

        models.push(model)
    }

    return models
}

function createGraphNodeFromModel(blockDef) {
    /*
    *
    *       { label: 'Get doc by URI', value: 'getByUri' },
          { label: 'Node as input', value: 'nodeInput' },
          { label: 'Node as output', value: 'nodeOutput' },
          { label: 'Create fields inputs', value: 'fieldsInputs' },
          { label: 'Create fields outputs', value: 'fieldsOutputs' }
    *
    * */

    let nodeCode = "";
    let ioSetup = {
        inputs: {
            _count: 0
        },
        outputs: {
            _count: 0
        }
    }

    if (blockDef.options.indexOf("getByUri") > -1) {
        ioSetup.inputs["Uri"] = ioSetup.inputs._count++;
        nodeCode += 'this.addInput("Uri","xs:string");'
    }

    if (blockDef.options.indexOf("nodeInput") > -1) {
        ioSetup.inputs["Node"] = ioSetup.inputs._count++;
        nodeCode += 'this.addInput("Node","Node");'
    }

    if (blockDef.options.indexOf("nodeOutput") > -1) {
        ioSetup.outputs["Node"] = ioSetup.outputs._count++;
        nodeCode += 'this.addOutput("Node","Node");'
    }

    if (blockDef.options.indexOf("fieldsOutputs") > -1) {
        for (let field of blockDef.fields) {

            ioSetup.outputs[field] = ioSetup.outputs._count++;
            nodeCode += 'this.addOutput("' + field + '","xs:string");'

        }
    }

    if (blockDef.options.indexOf("fieldsInputs") > -1) {
        for (let field of blockDef.fields) {

            ioSetup.inputs[field] = ioSetup.inputs._count++;
            nodeCode += 'this.addInput("' + field + '","xs:string");'

        }
    }


    let node = new Function('{' + nodeCode + '}')

    let execCode = "{let doc = {};";
    if (blockDef.options.indexOf("nodeInput")>-1) {

        execCode += "if(this.getInputData(" + ioSetup.inputs["Node"] + ")!=null) {";
        execCode += "let inputNode = this.getInputData(" + ioSetup.inputs["Node"] + ");"
        execCode += "if(xdmp.nodeKind(inputNode)=='document') inputNode = inputNode.toObject();"
        execCode += "doc = inputNode;}";

    }
    if (blockDef.options.indexOf("getByUri")>-1)
        execCode += "if(this.getInputData(" + ioSetup.inputs["Uri"] + ")!=null) doc = fn.head(fn.doc(this.getInputData(" + ioSetup.inputs["Uri"] + "))).toObject();";


    if (blockDef.options.indexOf("fieldsInputs") > -1) {
        for (let i = 0; i < blockDef.fields.length; i++)

            execCode += 'if(this.getInputData( ' + ioSetup.inputs[blockDef.fields[i]]  + ')!=null) doc["' + blockDef.fields[i] + '"]= this.getInputData( ' + ioSetup.inputs[blockDef.fields[i]]  + ');'
    }

    if (blockDef.options.indexOf("fieldsOutputs") > -1) {
        execCode += 'let docNode = xdmp.toJSON(doc);';
        for (let i = 0; i < blockDef.fields.length; i++)

            execCode += 'this.setOutputData( ' + ioSetup.outputs[blockDef.fields[i]] + ', docNode.xpath("//' + blockDef.fields[i] + '"));'
    }


    if (blockDef.options.indexOf("nodeOutput") > -1) {

        execCode += 'this.setOutputData(' + ioSetup.outputs["Node"] + ', doc);';
    }
    execCode += '}'
    //console.log(blockDef)
    //console.log(ioSetup)
    //console.log(execCode)
    node.prototype.onExecute = new Function(execCode)

    node.title = blockDef.collection;
    node.nodeType = blockDef.collection;
    return node
}

/*
function createGraphNodeFromModel(model){

    let nodeCode = fn.concat(model.fields.map(function(item){return 'this.addOutput("' + item + '","string");'}))
    let node = new Function('{this.addInput("Node","Node");' + nodeCode + '}')

    let execCode = '{let doc = this.getInputData(0).toObject();'

    for(let i=0;i<model.fields.length;i++)
        execCode+='this.setOutputData( ' + i + ', doc['+ model.fields[i] + ']);'
    execCode +='}'
    node.prototype.onExecute = new Function(execCode)

    node.title = model.name;

    return node
}
*/

function executeGraphStep(doc,uri,config,context){



    return executeGraphFromJson(config,uri,doc,context)

}


function executeGraphFromJson(jsonGraph,uri, input,context){



   // let markLogicNodes = require("/lib/marklogicNodes")


    var LiteGraph = require("/custom-modules/litegraph").LiteGraph;
    var userBlocks = require("/custom-modules/userblockDefs");

    userBlocks.initUserBlocks(LiteGraph);

    for(let model of jsonGraph.models)
        LiteGraph.registerNodeType(model.source + "/" + model.collection, createGraphNodeFromModel(model));


    var graph = new LiteGraph.LGraph();

    graph.configure(jsonGraph.executionGraph)
    graph.addInput("input", "");
    graph.addInput("uri", "");
    graph.addInput("collections", "");
    graph.addOutput("output", "");
    graph.addOutput("uri", "");
    graph.addOutput("collections", "");
    graph.setInputData("input",input)
    graph.setInputData("uri",uri)
    graph.setInputData("collections",context.collections)
    graph.start();

    return {
        output: graph.getOutputData("output"),
        uri : graph.getOutputData("uri"),//graph.global_outputs,
        collections : graph.getOutputData("collections")
    }
    }//graph.global_outputs


module.exports = {
    extractModelByCollectionMatch,
    createGraphNodeFromModel,
    executeGraphFromJson,
    executeGraphStep
};
