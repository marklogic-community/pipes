// Copyright ©2020 MarkLogic Corporation.
const LiteGraphHelper = {

  data() {},

  methods: {

   graphStatistics: function(liteGraph) {
      console.log("========================")
      var blockArray = []
      var g = liteGraph
      console.log("Graph contains " + g.nodes.length + " node types:")
      var blockMap = new Map();
      for (var n = 0; n < g.nodes.length; n++) {
      var val = blockMap.get( g.nodes[n].type )
      if ( val != undefined ) { blockMap.set(g.nodes[n].type,++val)
      } else {
        blockMap.set(g.nodes[n].type,1)
      }
        }
    // report results
        for (let nodeType of blockMap.keys()) {
          console.log(nodeType + " x" + blockMap.get(nodeType))
          blockArray.push(nodeType)
        }
       console.log("========================")
       return blockArray
    },


    remapBlocks: function(litegraph, graph) {

      var originalGraph = JSON.stringify(graph.executionGraph)
      var updatedGraph = JSON.stringify(graph.executionGraph)

      var thisGraphBlocks = this.graphStatistics(graph.executionGraph)
      var liteGraphRegisteredBlocks = litegraph.getRegisteredNodes()

      var blocksToReplace = []

      for (var b = 0; b < thisGraphBlocks.length; b++) {

        var blockMenuType = thisGraphBlocks[b].split("/")[0]
        // Only process core and user blocks. Source and Entity blocks are seperate
        if ( blockMenuType != 'Sources' && blockMenuType != 'Entities' ) {
          if ( ! liteGraphRegisteredBlocks.includes(thisGraphBlocks[b]) ) {
             // console.log("Graph contains " + thisGraphBlocks[b] + " which is not registered Litegraph")
              blocksToReplace.push( thisGraphBlocks[b] )
          }
        }
      }

      if ( blocksToReplace.length > 0 ) {
        updatedGraph = this.replaceBlocks(blocksToReplace,originalGraph)
      }

      return JSON.parse(updatedGraph)

    },

    replaceBlocks: function(oldblocks, origgraph) {

    var graph = origgraph

    console.log("Unknown/legacy blocks found. Remapping..")

    const DHF = "DHF"
    const GRAPH = "Graph"
    const GENERATE = "Generate"
    const VALIDATE = "Validate"
    const FIND = "Query"
    const TRANSFORM = "Transform"

    const blockMapping =  new Map  ([
        ["dhf/input", DHF+ "/input"],
        ["dhf/output", DHF + "/output"],
        ["dhf/envelope", DHF + "/envelope"],
        ["dhf/declarativeMapper", DHF + "/declarativeMapper"],
        ["graph/subgraph", GRAPH + "/subgraph"],
        ["graph/input", GRAPH + "/input"],
        ["graph/output", GRAPH + "/output"],
        ["string/constant", GENERATE + "/constant"],
        ["controls/CheckPhoneNumber", VALIDATE + "/CheckPhoneNumber"],
        ["controls/XMLValidate", VALIDATE + "/XMLValidate"],
        ["controls/JsonValidate", VALIDATE + "/JsonValidate"],
        ["string/Templating", GENERATE + "/Templating"],
        ["basic/multicast", TRANSFORM + "/multicast"],
        ["geo/GeoReproject", TRANSFORM + "/GeoReproject"],
        ["string/Highlight", "Enrich/Highlight"],
        ["cts/ExpertQueryBuilder","Query/ExpertQueryBuilder"],
        ["string/EntityEnrichment", "Enrich/EntityEnrichment"],
        ["feature/EvalJavaScript","Advanced/EvalJavaScript"],
        ["string/Map values","Mapping/Map values"],
        ["feature/mapRangeValues","Mapping/mapRangeValues"],
        ["cts/search","Query/search"],
        ["string/NormalizeSpace","Clean/NormalizeSpace"],
        ["provenance/PROV-O structure", "Enrich/PROV-O structure"],
        ["date/Current Date","Generate/Current Date"],
        ["basic/Array","Join/Array"],
        ["transform/Add property", "Enrich/AddProperty"],
        ["string/uuid","Generate/uuid"],
        ["feature/DistinctValues", "Filter/DistinctValues"],
        ["fn/doc",FIND + "/doc"],
        ["feature/hashNode", GENERATE + "/hashNode"],
        ["feature/selectCase", "Mapping/selectCase"],
      //  ["basic/const", GENERATE + "/constNumber"],
        ["feature/Doc By Key", FIND + "/Doc By Key"],
        ["string/RegExReplace","Transform/RegExReplace"],
        ["date/FormatDateAuto","Format/FormatDateAuto"],
        ["date/FormatDate","Format/FormatDate"],
        ["date/FormatDateTimeAuto","Format/FormatDateTimeAuto"],

        ["feature/LookupCollectionPropertyValue",FIND +"/LookupCollectionPropertyValue"],
        ["feature/Lookup",FIND +"/Lookup"]
      ]);

    for (var b = 0; b < oldblocks.length; b++ ) {

     var oldBlockKey = oldblocks[b]
     var newBlockKey = blockMapping.get(oldBlockKey)

     if ( newBlockKey != undefined && newBlockKey !== null ) {
     console.log( "New mapping for " + oldBlockKey + " is " + newBlockKey )
     graph = graph.replace(oldBlockKey, newBlockKey )
     } else {
      console.log( "WARNING: No mapping found for block " + oldBlockKey + " graph will not run");
     }
    }

    return graph

    },

  listTheGraphBlocks: function(pipesModels) {
    console.log('Pipes Blocks contains: ' + pipesModels.length + " blocks:")
    for (var i = 0; i < pipesModels.length; i++) {
      console.log( pipesModels[i].source + "/" + pipesModels[i].label )
      console.log( JSON.stringify(pipesModels[i] ) )
    }
  },

  isblockInModelList: function(pipesModels, blockKey) {
      var isInList = false
      for (var i = 0; i < pipesModels.length; i++) {
        console.log("Checking against: " + pipesModels[i].source + "/" + pipesModels[i].label)
        if ( (pipesModels[i].source + "/" + pipesModels[i].label) == blockKey ) {
          isInList = true
          break
        }
      }
      console.log("Block " + blockKey + " " + (isInList ? "is" : "isn't") + " in the list" )
      return isInList
    },

    isblockOnGraph(liteGraph, blockKey) {
     const isOnGraph = liteGraph.findNodesByType(blockKey).length > 0
     console.log(blockKey + " is currently" + (isOngraph ? "" : " not") + " used on the graph")
     return isOnGraph
    },

    searchTree(element, blockKey){
      if(element.type == blockKey){
           return element;
      }else if (element.children != null){
           var i;
           var result = null;
           for(i=0; result == null && i < element.children.length; i++){
                result = searchTree(element.children[i], blockKey);
           }
           return result;
      }
      return null;
 },

  isblockOnGraph(liteGraph, blockName) {
    //console.log("blockIsOnGraph " + blockName)
    var isOnGraph = false
    var g = liteGraph.serialize()
    return JSON.stringify( g ).includes(blockName)
  },

/*
  inspectGraph(nodeList, blockName) {
    for (var x = 0; x < nodeList.length; x++) {
      if ( nodeList[x].type == blockName ) {
        console.log("Block is on graph: " + JSON.stringify(nodeList[x]))
        return true
      }
    }
},
*/

// Graphs have duplicate blocks - analyse this
findDuplicateBlocks: function(pipesModels) {
  var checkArray = []
  for (var i = 0; i < pipesModels.length; i++) {
    if ( pipesModels[i].source == "Sources" || pipesModels[i].source == 'Entities' ) checkArray.push(pipesModels[i])
  }

  for (var i = 0; i < checkArray.length; i++) {
    var block = checkArray[i]
    for (var x = ++i; x < checkArray.length; x++) {
      if ( checkArray[x].label == block.label && checkArray[x].sources == block.sources  )
     // console.log("DUPLICATE: " + block.label + "/" + block.sources)
      if ( checkArray[x].fields.length == block.fields.length && checkArray[x].fields == block.fields ) {
    //    console.log("DUPLICATE NUMBER OF FIELDS")
      }
    }
  }

}

}

}

export default LiteGraphHelper
