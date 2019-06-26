function get(context, params) {

    return sem.sparql(
        "SELECT DISTINCT ?value ?label WHERE {?value <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>	 <http://marklogic.com/entity-services#EntityType>. \
          ?value <http://marklogic.com/entity-services#title> ?label.\
            FILTER NOT EXISTS {?any <http://marklogic.com/entity-services#ref> ?value}\
          }").toArray()
};

function post(context, params, input) {
  // return zero or more document nodes
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
