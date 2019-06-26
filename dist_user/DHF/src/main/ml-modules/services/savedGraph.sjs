function get(context, params) {


    return fn.doc(params.uri)

};

function post(context, params, input) {

    let results = []
    for (let graph of cts.search(cts.andQuery([
        cts.collectionQuery("/type/savedGraph"),
        ((params.q!=null)?params.q:cts.trueQuery())
    ])))
        results.push({
            uri: fn.baseUri(graph),
            name: graph.toObject().name
        })

    return results


};

function put(context, params, input) {

    let graph = input.toObject();

    xdmp.documentInsert("/savedGraph/" + graph.name + ".json", graph,  null
        , "/type/savedGraph"  )


};

function deleteFunction(context, params) {
  // return at most one document node
};

exports.GET = get;
exports.POST = post;
exports.PUT = put;
exports.DELETE = deleteFunction;
