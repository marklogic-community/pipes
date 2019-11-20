var gHelper  = require("/custom-modules/graphHelper")
function InvokeExecuteGraph(input){


  return {
    execute: function execute() {

      let execContext = input.toObject()
      let doc = null
      if(execContext.collectionRandom)
        doc= fn.head(fn.subsequence(fn.collection(execContext.collection),xdmp.random(fn.count(fn.collection(execContext.collection)) + 1)))
      else {
        if(execContext.previewUri==null || execContext.previewUri=="")
          doc = fn.head(fn.collection(execContext.collection))
        else
          doc = cts.doc(execContext.previewUri)
      }
      let uri = fn.baseUri(doc)
      return gHelper.executeGraphFromJson(execContext.jsonGraph,uri, doc,{collections: xdmp.documentGetCollections(uri)})

    }
  }
}


function get(context, params) {




};
function isIterable(obj) {
  // checks for null and undefined
  if (obj == null) {
    return false;
  }
  return typeof obj[Symbol.iterator] === 'function';
}
function post(context, params, input) {

  const invokeExecuteGraph = InvokeExecuteGraph(input)
  let db = (params.database != null) ? params.database : xdmp.database()
  let targetDb = (params.toDatabase != null) ? params.toDatabase : xdmp.database()
  let result =  xdmp.invokeFunction(invokeExecuteGraph.execute, {database: db})

  if(params.save=="true" ) {

    let jsonResults = JSON.parse(xdmp.quote(result))


    for(let r of jsonResults) {

      let saveDoc = r
      let uri = (saveDoc.uri)?saveDoc.uri:sem.uuidString()
      let doc = (saveDoc.value)?saveDoc.value:saveDoc
      let collections =  (saveDoc.context && saveDoc.context.collections)? saveDoc.context.collections:"vpp"

      xdmp.invokeFunction(() => {

        xdmp.documentInsert(uri, doc, null, collections)

      }, {"database": targetDb, "update": "true"}
    )
    }

  }

  return result


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
