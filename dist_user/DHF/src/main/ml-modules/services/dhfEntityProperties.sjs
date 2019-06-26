function get(context, params) {
    let entityModel ={
        "label" : params.entity,
        "children" :null
    }

    entityModel.children = sem.sparql(
        "SELECT * WHERE {\
          ?entity <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>	 <http://marklogic.com/entity-services#EntityType>.\
          ?entity <http://marklogic.com/entity-services#property> ?property.\
          ?property <http://marklogic.com/entity-services#title> ?label.\
          OPTIONAL {?property <http://marklogic.com/entity-services#datatype>|<http://marklogic.com/entity-services#ref> ?type.}\
          }",{"entity" : sem.iri(entityModel.label)}).toArray()
    return entityModel
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
