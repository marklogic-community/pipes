//Copyright ©2020 MarkLogic Corporation.


const blocksCollection = "marklogic-pipes/type/savedBlock";
const graphsCollection = "marklogic-pipes/type/savedGraph";

function mapper(item, cfg) {

  if (cfg.entities != null) {
    let cols = xdmp.documentGetCollections(item.uri)
    const invokeGetTriples = getTriplesByUri(item.uri)
    let result = {
      index: item.index,
      uri: item.uri,
      score: item.score,
      fitness: item.fitness,
      collections: xdmp.documentGetCollections(item.uri),
      triplesFromDocument: invokeGetTriples.getResults().length,
      document: {}

    }

    let entity = null
    for (let col of cols)
      if (cfg.entities[col] != null) {
        entity = col;
        for (let field of Object.keys(cfg.entities[entity])) {

          let fieldValues = cfg.entities[entity][field]
          if (fieldValues != null && fieldValues != "") {

            if (fn.contains(field, "_static")) {

              result[field] = fieldValues
            } else {

              if (fieldValues.constructor === Array)
                result.document[field] = fieldValues.map(f => {
                  return fn.head(item.document.xpath(".//" + f.value))
                }).join(" - ")
              else
                result.document[field] = fn.head(item.document.xpath(".//" + fieldValues.value))

            }
          }
        }
        return result
      }

    if (entity == null)
      result.document = item
    return result
  } else {
    const invokeGetTriples = getTriplesByUri(item.uri)
    let result = {
      index: item.index,
      uri: item.uri,
      score: item.score,
      fitness: item.fitness,
      collections: xdmp.documentGetCollections(item.uri),
      triplesFromDocument: fn.count(invokeGetTriples.getResults()),
      document: item

    }

    return result


  }

}


function parseGroup(group) {

  if (group.children != null) {
    let queries = []
    xdmp.log(group)

    for (let q of group.children) {
      xdmp.log(q)
      switch (q.type) {
        case "query-builder-rule":
          if (q.query.rule == "collection")
            queries.push(cts.collectionQuery(q.query.value))
          else if (q.query.selectedOperator == "equals")
            queries.push(cts.jsonPropertyValueQuery(q.query.selectedOperand, q.query.value))
          else
            queries.push(cts.notQuery(cts.jsonPropertyValueQuery(q.query.selectedOperand, q.query.value)))
          break;
        case "query-builder-group":
          queries.push(parseGroup(q.query))
          break;
        default:
        // code block
      }


    }
    xdmp.log(queries)
    switch (group["logicalOperator"]) {
      case "and":
        return cts.andQuery(queries)
        break;
      case "or":
        return cts.orQuery(queries)
        break;
      default:
        return cts.trueQuery()
    }
  } else
    return cts.trueQuery()

}

function search(ctx) {

  return {
    getResults: function getResults() {


      const jsearch = require('/MarkLogic/jsearch.sjs');
      let currentPage = (ctx.page != null) ? ctx.page : 1;

      let queries = []
      if (ctx.queryString != null && ctx.queryString != "")
        queries.push(cts.wordQuery(ctx.queryString, ["case-insensitive"]))
      else
        queries.push(cts.trueQuery())

      if (ctx.collectionFilter.length > 0) queries.push(cts.collectionQuery(ctx.collectionFilter))
      let results = null

      if (ctx.structuredQuery != null)
        queries.push(parseGroup(ctx.structuredQuery))

      if (ctx.facets != null && ctx.facets.length > 0) {
        results = jsearch.facets(
          ctx.facets.map(item => {
            return jsearch.facet(item, item).slice(1, 5)
          }), jsearch.documents()
            .where(cts.andQuery(queries))
            .slice(10 * (currentPage - 1), 10 * (currentPage - 1) + 10)
            .map(item => {
              return mapper(item, ctx)
            })).result()
      } else {
        results = jsearch.documents()
          .where(cts.andQuery(queries))
          .slice(10 * (currentPage - 1), 10 * (currentPage - 1) + 10)
          .map(item => {
            return mapper(item, ctx)
          }).result();

      }

      return results

    }
  }
}


function getTriplesByUri(uri) {

  return {
    getResults: function getResults() {
      return sem.sparql("SELECT * WHERE{?subject ?predicate ?object} LIMIT 10", null, null, cts.documentQuery(uri)).toArray();
    }
  }
}

function openDocument(uri) {

  return {
    getResults: function getResults() {
      return cts.doc(uri);
    }
  }
}

function getTriplesByIri(iri) {

  return {
    getResults: function getResults() {
      return sem.sparql("SELECT DISTINCT ?subject ?predicate ?object  WHERE{\
{SELECT (?var as ?subject) ?predicate ?object WHERE{\
           ?var ?predicate ?object.\
           }} UNION\
 {SELECT ?subject ?predicate (?var as ?object) WHERE{\
           ?subject ?predicate ?var.\
           }}\
           UNION\
           {SELECT (?var2 as ?subject) ?predicate ?object WHERE{\
           ?var ?predicate ?object.\
           }} UNION\
 {SELECT ?subject ?predicate (?var as ?object) WHERE{\
           ?subject ?predicate ?var2.\
           }}\
           } LIMIT 100\
", {var: sem.iri(iri), var2: iri}, null).toArray()
    }
  }
}


function getDatabases() {

  return xdmp.databases().toArray().map(db => {

    return {
      value: db,
      label: xdmp.databaseName(db)
    }

  }).sort((item1, item2) => {
    if (item1.label > item2.label) return 1; else if (item1.label < item2.label) return -1; else 0;
  })

}


function getCollectionsModels(ctx) {

  return {
    collectionsModel: function getModels() {

      let collections = {}
      if (ctx != null && ctx.collectionIncl != null && ctx.collectionIncl.length > 0) {
        ctx.collectionIncl.map(item => {
          cts.collectionMatch(item).toArray().map(item2 => {
            collections[item2] = getFieldsByCollection(item2, "")
          })
        })
      } else {

        for (let col of fn.subsequence(cts.collections(), 1, 15)) {
          collections[col] = getFieldsByCollection(col, "")

        }

      }
      // collections[collection] =  getFieldsByCollection(collection)


      return collections
    }
  }


}

function checkDocumentExists(uri) {
      return cts.doc(uri);
}

function getCollectionDetails() {
  return {
    CollectionDetails: function CollectionDetails() {
      return cts.values(cts.collectionReference(), null, ["item-frequency", "frequency-order"]).toArray().map(collection => {
        return {

          "label": collection,
          "value": collection,
          "sublabel": cts.frequency(collection) + " documents"

        }

      })


    }
  }
}

function getDHFEntities() {

  return sem.sparql("PREFIX es: <http://marklogic.com/entity-services#>\
    SELECT DISTINCT ?value ?label ?description WHERE {\
      ?value a es:EntityType ;\
             es:title ?label .\
      OPTIONAL {\
        ?value es:description ?description .\
      }\
      ?def es:definitions ?value. optional { ?def es:description ?description }\
      FILTER NOT EXISTS {\
        ?any es:ref ?value .\
      }\
    }").toArray()

}

function getDHFEntityProperties(entity) {

  let entityModel = {
    "label": entity,
    "children": null
  }

  entityModel.children = sem.sparql(
      "PREFIX es: <http://marklogic.com/entity-services#>\
       SELECT * WHERE {\
        ?entity <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> es:EntityType.\
        ?entity es:property ?property.\
        ?property es:title ?label.\
        OPTIONAL {?property es:datatype|es:ref ?type.}\
        OPTIONAL { ?property es:description ?description }\
        }",
      {"entity": sem.iri(entityModel.label)}).toArray()
  return entityModel
}

function isIterable(obj) {
  // checks for null and undefined
  if (obj == null) {
    return false;
  }
  return typeof obj[Symbol.iterator] === 'function';
}

function InvokeExecuteGraph(input) {


  return {
    execute: function execute() {
      var previewUri = ''
      var result = null
      let gHelper = require("/custom-modules/pipes/graphHelper")
      let execContext = JSON.parse(input)
      let doc = null
      let uri = ''
      if (execContext.collectionRandom) {
        let nbDocs = cts.estimate(cts.collectionQuery(execContext.collection))
        if(nbDocs>0) doc = cts.doc(fn.head(fn.subsequence(cts.uris(null, null, cts.collectionQuery(execContext.collection)), xdmp.random(nbDocs - 1) + 1)))
      } else {
        if (execContext.previewUri == null || execContext.previewUri == "")
          doc = fn.head(fn.collection(execContext.collection))
        else {
          previewUri = execContext.previewUri
          doc = cts.doc(execContext.previewUri)
        }
      }

      if (doc != null) {

        uri = fn.baseUri(doc)

        console.log("input=", input)
        console.log("execContext=", execContext)
        console.log("execContext.collection=", execContext.collection)
        console.log("execContext[\"collection\"]=", execContext["collection"])
        console.log("input.collection=", input.collection)
        console.log("uri=", uri);

        var graphResult = []

        try {

        graphResult = gHelper.executeGraphFromJson(execContext.jsonGraph, uri, doc, {collections: xdmp.documentGetCollections(uri)})

        result = {
          uri: uri,
          result: graphResult
        }

        } catch (e) {

          result = {
            uri: uri,
            result: graphResult,
            error: e
          }

        }

      } else {

        result = {

          uri: previewUri,
          error: "No source document found. Nothing to preview for the given context",
          result: []

        }

      }

      return result

    }
  }
}

function executeGraph(input, params) {

  const invokeExecuteGraph = InvokeExecuteGraph(input)
  let db = (params.database != null) ? xdmp.database(params.database) : xdmp.database()
  let targetDb = (params.toDatabase != null) ? xdmp.database(params.toDatabase) : xdmp.database()
  let result = xdmp.invokeFunction(invokeExecuteGraph.execute, {database: db})
  let jsonResults = result
  if (params.save == "true") {

    if(jsonResults.toArray) jsonResults = jsonResults.toArray()
    //let jsonResults = JSON.parse(xdmp.quote(result))
    if (!Array.isArray(jsonResults)) {

      jsonResults = [jsonResults]

    }

    for (let r of jsonResults) {

      let saveDoc = r
      let uri = (saveDoc.uri) ? saveDoc.uri : sem.uuidString()
      let doc = (saveDoc.value) ? saveDoc.value : saveDoc
      let collections = (saveDoc.context && saveDoc.context.collections) ? saveDoc.context.collections : "vpp"

      xdmp.invokeFunction(() => {

          xdmp.documentInsert(uri, doc, null, collections)

        }, {"database": targetDb, "update": "true"}
      )
    }

  }

  return result


}


function getFieldsByCollection(collection, customURI) {

  return {
    FieldsByCollection: function FieldsByCollection() {
      let i = 0
      let fields = {}
      let docs = []
      let collectionDocs = fn.count(fn.collection(collection))
      if (collection != null && collection != "" && collectionDocs > 0) {
        for (let j = 0; j < 10; j++) {
          docs.push(fn.head(fn.subsequence(fn.collection(collection), xdmp.random(collectionDocs))))
          //let doc = fn.head(fn.collection(collection))
        }
      }
      if (customURI != null && customURI != "") {
        customURI = decodeURI(customURI).trim();
        // replace multiple spaces by one so that spliting goes ok
        customURI = customURI.replace(/ +/g, " ");
        for (const uri of customURI.split(" ")) {
          let doc = cts.doc(uri);
          if (doc != null) {
            docs.push(doc);
          }
        }
      }

      docs.map(doc => doc.xpath(".//*").toArray().map(node => {

        let name = fn.name(node)
        let originalPath = String(xdmp.path(node))

        //let path = originalPath.replace(/[A-z]+-node\('([\s]*)'\)/g, "$1").replace(/text\('([\s]+)'\)/g, "$1").replace(/text\('([\s\w]+)'\)/g, "node('$1')").replace(/[A-z]+-node\('([\s]*)'\)/g, "node('$1')")
        pathTokens = originalPath.replace(/(\/object-node\(\))/g,"").replace(/(\[\d+\])/g,"").split("/")

        pathTokens = pathTokens.map((item,index)=>{
          if(item=="") return null
          if(item.includes("array-node") && item.includes(" "))
            if(index==pathTokens.length-1)
              return item + "/*"
            else return item + "/"

          if(item.includes(" ") || item.includes("@"))
            return item.replace(/[A-z]+-node\('([\s\w@]*)'\)/g, "node('$1')").replace(/text\('([\s\w@]+)'\)/g, "node('$1')")
          else
            return item.replace(/[A-z]+-node\('([\s\w@]*)'\)/g, "$1").replace(/text\('([\s\w@]+)'\)/g, "$1")
        })

        let lastSlash = originalPath.replace(/(\/object-node\(\))/g,"").lastIndexOf("/")
        let nodeLastPath = originalPath.substring(lastSlash + 1)
        //if(nodeLastPath.includes("array-node") && path[path.length-1].includes(" "))
        //path[path.length-1]=nodeLastPath

        path = pathTokens.join("/")
        let parentPath =path.replace(/(\/object-node\(\))/g,"").replace(/\/\*/g,"")
        parentPath = parentPath.substring(0, parentPath.lastIndexOf("/"))
        path = path.replace(/(\/object-node\(\))/g,"")
        let newParentPath = parentPath//.replace(/array-node\('([\s\w]*)'\)/g, "$1")

        pathTokens = path.split("/")
        let pathKey = pathTokens.splice(0,pathTokens.length-1).join("/")

        newParentPath=newParentPath.replace("/*", "").replace(/\/\//,"/").replace(/\/$/,"")
        if (newParentPath == "") newParentPath = "/"

        if (fields[path.replace("/*", "").replace(/\/\//,"/")] == null)
          fields[path.replace("/*", "").replace(/\/\//,"/")] = {
            label: name + " [id" + i++ + "]",
            field: node.xpath("name(.)"),
            value: node.xpath("name(.)"),
            path: path,
            originalPath: originalPath,
            type: node.nodeType,
            children: [],
            parent: newParentPath
          }

      }))
      // return fields
      let results = []
      Object.keys(fields).map(item => {
        results.push(fields[item])
      })

      results = results.sort((a, b) => {
        return a.label.localeCompare(b.label)
      })

      for (let path of Object.keys(fields)) {

        fields[path].children = results.filter(item => {
          return (item.parent == path)
        })
      }

      return results.filter(item => item.parent == "/")
    }

  }
}

function getSavedBlock(params) {
  return fn.doc(params.uri)

}

function listSavedBlock(params) {

  let results = []
  for (let graph of cts.search(cts.andQuery([
    cts.collectionQuery(blocksCollection),
    ((params.q != null) ? params.q : cts.trueQuery())
  ])))
    results.push({
      uri: fn.baseUri(graph),
      name: graph.toObject().name
    })

  return results
}

function saveBlock(input, params) {
  let graph = JSON.parse(input)
  let targetDb = (params.toDatabase != null) ? params.toDatabase : xdmp.database()
  xdmp.invokeFunction(() => {

      xdmp.documentInsert("/marklogic-pipes/savedBlock/" + graph.name + ".json", graph, null
        , blocksCollection)

    }, {"database": targetDb, "update": "true"}
  )

}

function deleteBlock(URI) {

  xdmp.invokeFunction(() => {
    declareUpdate();
    if (xdmp.documentGetCollections(URI).includes(blocksCollection)) { // security. can only delete blocks
      console.log("Deleting Pipes block " + URI)
      xdmp.documentDelete(URI)
    }
  })
}

function deleteGraph(URI) {

  xdmp.invokeFunction(() => {
    declareUpdate();
    if (xdmp.documentGetCollections(URI).includes(graphsCollection)) // security. can only delete graphs
      xdmp.documentDelete(URI)
  })
}

function getSavedGraph(params) {
  return fn.doc(params.uri)

}

function listSavedGraph(params) {

  let results = []
  for (let graph of cts.search(cts.andQuery([
    cts.collectionQuery(graphsCollection),
    ((params.q != null) ? params.q : cts.trueQuery())
  ])))
    results.push({
      uri: fn.baseUri(graph),
      name: graph.toObject().name
    })

  return results
}

function saveGraph(input, params) {
  let graph = JSON.parse(input);
  let targetDb = (params.toDatabase != null) ? params.toDatabase : xdmp.database()
  xdmp.invokeFunction(() => {

      xdmp.documentInsert("/marklogic-pipes/savedGraph/" + graph.name + ".json", graph, xdmp.defaultPermissions()
        , graphsCollection)

    }, {"database": targetDb, "update": "true"}
  )
}

function verifyUri(params) {
  console.log("verifyUri " + params)
  if ( params.uri === null || params.uri.length < 1 ) return {'documentExists' : false}
  var docExists = (checkDocumentExists(params.uri) !== null)
  var response = {}
  response.documentExists = docExists
  return response
}

function validateCTSQuery(input, params) {
  var query = JSON.parse(input).query
  console.log("Validating ctsquery : " + query)
  var testQuery = 'fn.count(' + query + ')'
  var result
  try {
    result = xdmp.eval(testQuery)
    return {"valid" : true}
  } catch (e) {
    console.log("Not valid: " + e)
    return {"valid" : false, "error" : e}
  }
}

function get(context, params) {

  switch (params.action) {
    case "collectionModel":
      const invokeGetFieldsByCollection = getFieldsByCollection(params.collection, params.customURI)
      return xdmp.invokeFunction(invokeGetFieldsByCollection.FieldsByCollection, {database: (params.database != null) ? params.database : xdmp.database()})
      break;
    case "collectionDetails":
      const invokeGetCollectionDetails = getCollectionDetails()
      return xdmp.invokeFunction(invokeGetCollectionDetails.CollectionDetails, {database: (params.database != null) ? params.database : xdmp.database()})
      break;
    case "databasesDetails":
      return getDatabases()
      break;
    case "DHFEntities":
      return getDHFEntities();
      break;
    case "DHFEntityProperties":
      return getDHFEntityProperties(params.entity);
      break;
    case "GetSavedBlock":
      return getSavedBlock(params)
      break;
    case "ListSavedBlock":
      return listSavedBlock(params)
      break;
    case "GetSavedGraph":
      return getSavedGraph(params)
      break;
    case "ListSavedGraph":
      return listSavedGraph(params)
      break;
    case "verifyDocumentUri":
      return verifyUri(params)
      break;
    default:
  }


};

function post(context, params, input) {

  let config = {};

  let ctx = JSON.parse(input);
  //xdmp.log(Sequence.from(["POST", params, input]));

  switch (params.action) {
    case "compile":
      let compiler = require("/custom-modules/pipes/compiler.sjs");
      let output = compiler.compileGraphToJavaScript(ctx);
      //xdmp.log(Sequence.from(["COMPILER OUTPUT", output]));
      return output;
    case "config":
      config.databases = getDatabases();
      const invokeGetCollectionsModels = getCollectionsModels(ctx);
      config.collectionsModels = xdmp.invokeFunction(invokeGetCollectionsModels.collectionsModel, {database: (ctx.database != null) ? ctx.database.value : xdmp.database()})//getCollectionsModels(ctx)
      return config
      break;
    case "search":
      const invokeSearch = search(ctx);
      let results = xdmp.invokeFunction(invokeSearch.getResults, {database: (ctx.database != null) ? ctx.database.value : xdmp.database()})//getCollectionsModels(ctx)
      return results
      break;
    case "triplesByUri":
      const invokeGetTriples = getTriplesByUri(ctx.currentDocumentUri)
      return xdmp.invokeFunction(invokeGetTriples.getResults, {database: (ctx.database != null) ? ctx.database.value : xdmp.database()})
      break;
    case "triplesByIri":
      const invokeGetTriplesIri = getTriplesByIri(ctx.currentIri)
      return xdmp.invokeFunction(invokeGetTriplesIri.getResults, {database: (ctx.database != null) ? ctx.database.value : xdmp.database()})
      break;
    case "Document":
      const invokeOpenDocument = openDocument(ctx.currentDocumentUri)
      return xdmp.invokeFunction(invokeOpenDocument.getResults, {database: (ctx.database != null) ? ctx.database.value : xdmp.database()})
      break;
    case "DHFEntities":
      return getDHFEntities();
      break;
    case "DHFEntityProperties":
      return getDHFEntityProperties(params.entity);
      break;
    case "ExecuteGraph":
      return executeGraph(input, params)
      break;
    case "GetSavedBlock":
      return getSavedBlock(params)
      break;
    case "ListSavedBlock":
      return listSavedBlock(params)
      break;
    case "SaveBlock":
      return saveBlock(input, params)
      break;
    case "GetSavedGraph":
      return getSavedGraph(params)
      break;
    case "ListSavedGraph":
      return listSavedGraph(params)
      break;
    case "SaveGraph":
      return saveGraph(input, params)
      break;
    case "ValidateCtsQuery":
      return validateCTSQuery(input, params)
    default:
    // code block
  }

};

function put(context, params, input) {
  // return at most one document node
};

function deleteFunction(context, params) {

  var response
  context.outputTypes = [];
  context.outputTypes.push('application/json');

  switch (params.action) {
    case "deleteBlock":
      if (params.URI && params.URI != null && params.URI != '') {
        response = deleteBlock(params.URI)
      }
      break;
    case "deleteGraph":
      if (params.URI && params.URI != null && params.URI != '') {
        response = deleteGraph(params.URI)
      }
      break;
    default:
    // code block
  }

  return response

};

exports.GET = get;
exports.POST = post;
exports.PUT = put;
exports.DELETE = deleteFunction;
