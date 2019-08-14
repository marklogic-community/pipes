function get(context, params) {




};

function post(context, params, input) {

    let gHelper  = require("/custom-modules/graphHelper")
    let execContext = input.toObject()

    let doc = fn.head(fn.collection(execContext.collection))
    let uri = fn.baseUri(doc)
    return gHelper.executeGraphFromJson(execContext.jsonGraph,uri, doc,{});

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
