module.exports = class PipesFlowControlGraph {
  constructor() {
    this.graph = new Map();
    this.allPaths = []
  }

  initFromLiteGraph(LiteGraph,startNode,litegraphJSON) {
    let arr = [];
    this.graph.clear();
    for ( const node of litegraphJSON.executionGraph.nodes || [] ){
      let fromNode = node.id;
      for ( const output of node.outputs || [] ) {
        for ( const link of output.links || [] ) {
          const outputData = getNodeWithInputLink(litegraphJSON.executionGraph,link);
          const toNode = outputData.nodeId;
          this.addEdge(fromNode,toNode);
        }
      }
      let bc = new LiteGraph.registered_node_types[node.type]();
      if ( ( "onDeadNodeRemoval" in bc  && bc.onDeadNodeRemoval() === false ) ) {
        // artificial add a depedency
        this.addEdge(startNode,fromNode)
      }
    }
    return arr;
  }

  addEdge(start,end) {
    if (!this.graph.has(start)) {
      this.graph.set(start,[end])
    }
    else {
      this.graph.get(start).push(end)
    }
  }

  removeNode(node) {
    this.graph.delete(node);
    this.graph.forEach((v,k) => { const index = v.indexOf(node); if ( index > -1 ) { v.splice(index,1)}});
  }
  getAllPathsUtil( u, d, isVisited, localPathList, allPaths) {
    isVisited.set(u,true);
    if ( u == d )  {
      allPaths.push(localPathList);
      isVisited.set(u,false);
      return localPathList;
    }
    const list = this.graph.get(u)
    for (let i of list || [] ) {
      if ( !isVisited.has(i) || isVisited.get(i) == false )  {
        localPathList.push(i);
        localPathList = this.getAllPathsUtil(Number(i), d, isVisited, localPathList,allPaths);
        localPathList = localPathList.filter(x => x !== i)
      }
    }
    isVisited.set(u,false);
    return localPathList
  }
  getAllPaths(s, d) {
    let allPaths = [];
    let isVisited = new Map();
    let pathList = [];
    pathList.push(s);
    this.getAllPathsUtil(s, d, isVisited, pathList,allPaths);
    return allPaths
  }

  removeDeadNodes(startNode,endNode) {
    let liveNodes = new Set();
    let allPaths = this.getAllPaths(startNode,endNode);
    allPaths.forEach(x=>x.forEach(liveNodes.add,liveNodes));
    let allNodes = new Set();
    this.graph.forEach(function(value, key, map) { allNodes.add(key); value.forEach(allNodes.add,allNodes)});
    let dead = new Set([...allNodes].filter(x => !liveNodes.has(x)));
    dead.forEach(x=>{
          this.removeNode(x)
    });
  }

  isCyclicUtil(i, visited,  recStack)  {
    if (recStack.get(i) === true ) {
      return true;
    }
    if (visited.get(i) === true ) {
      return false;
    }
    visited.set(i,true);
    recStack.set(i, true);
    let children = this.graph.get(i);
    for (const c of children || []) {
      if (this.isCyclicUtil(c, visited, recStack)) {
        return true;
      }
    }
    recStack.set(i,false);
    return false;
  }

  isCyclic() {
    let visited = new Map();
    let recStack = new Map();
    for ( const x of this.graph.keys() ){
      visited.set(x,false);
      recStack.set(x,false);
    }
    for ( const i of this.graph.keys() ){
      if (this.isCyclicUtil(Number(i), visited, recStack))
        return true;
    }
    return false;
  }

  determineNodeCodeGenerationOrder(allPaths) {
    /*
      Algorithme:

      Traverse from final state to start state,
      For each state, determine which states it depends on.
      Only output those depends on states if they do not appear earlier in one of the paths
    */
    let outputOrderReverse = [];
    let deepCopyPaths = [];
    allPaths.forEach(x=>{ let arr = []; x.forEach(y=>arr.push(y)); deepCopyPaths.push(arr) })
    const finalState = deepCopyPaths[0].slice(-1)[0];
    for ( const path of deepCopyPaths) {
      const finalStateThisPath = path.slice(-1)[0];
      if ( finalStateThisPath !== finalState ) {
        // TODO Error
      }
      path.pop()
    }
    let currentStates = [finalState];
    let arr = []
    while ( currentStates.length > 0) {
      let dependsOn = new Set();
      arr.push(currentStates);
      currentStates.forEach(x=>outputOrderReverse.push(x));
      deepCopyPaths.forEach(x=>{let y = x.pop(); if ( y != null) { dependsOn.add(y) } });
      dependsOn.forEach(x=>deepCopyPaths.forEach(y=>y.indexOf(x) > -1 ? dependsOn.delete(x) : true ));
      currentStates = [...dependsOn]
    }
    return outputOrderReverse.reverse()
  }
};

function getNodeWithInputLink(graph,link) {
  for ( const node of graph.nodes || [] ) {
    for (const input of node.inputs || [] ) {
      if ( input.link == link ) {
        return {nodeId : node.id};
      }
    }
  }
  throw Error("Compiler error. Could not find input with link = "+link);
}
