function InvokeExecuteGraph(input){


  return {
    execute: function execute() {
      let gHelper  = require("/custom-modules/graphHelper")
      let execContext = input.toObject()
      let doc = null
      if(execContext.collectionRandom)
        doc= fn.head(fn.subsequence(fn.collection(execContext.collection),xdmp.random(fn.count(fn.collection(execContext.collection)) + 1)))
      else
        doc = fn.head(fn.collection(execContext.collection))
      let uri = fn.baseUri(doc)
      return gHelper.executeGraphFromJson(execContext.jsonGraph,uri, doc,{collections: xdmp.documentGetCollections(uri)});

    }
  }
}


function get(context, params) {




};

function post(context, params, input) {

  const invokeExecuteGraph = InvokeExecuteGraph(input)
  return xdmp.invokeFunction(invokeExecuteGraph.execute, {database: (params.database != null) ? params.database : xdmp.database()})


};

function put(context, params, input) {
  // return at most one document node
};

function deleteFunction(context, params) {
  // return at most one document node
};

exports.GET = get;
exports.POST = post;
exports.PUT = put;
exports.DELETE = deleteFunction;
