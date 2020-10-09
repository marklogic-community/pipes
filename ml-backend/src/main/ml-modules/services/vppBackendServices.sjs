//Copyright ©2020 MarkLogic Corporation.

const blocksCollection = "marklogic-pipes/type/savedBlock";
const graphsCollection = "marklogic-pipes/type/savedGraph";

const PIPESVERSION = "@PIPESVERSIONTOKEN@";
const PIPESBUILD = "@PIPESBUILDTOKEN@";

const TRACE_ID = "pipes-vpp";
const TRACE_ID_DETAILS = "pipes-vpp-details";

function mapper (item, cfg) {

  if (cfg.entities != null) {
    let cols = xdmp.documentGetCollections(item.uri);
    const invokeGetTriples = getTriplesByUri(item.uri);
    let result = {
      index: item.index,
      uri: item.uri,
      score: item.score,
      fitness: item.fitness,
      collections: xdmp.documentGetCollections(item.uri),
      permissions: xdmp.documentGetPermissions(item.uri),
      triplesFromDocument: invokeGetTriples.getResults().length,
      document: {}

    }

    let entity = null;
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
      permissions: xdmp.documentGetPermissions(item.uri),
      triplesFromDocument: fn.count(invokeGetTriples.getResults()),
      document: item

    }

    return result


  }

}


function parseGroup (group) {

  if (group.children != null) {
    let queries = []
    xdmp.trace(TRACE_ID, group)

    for (let q of group.children) {
      xdmp.trace(TRACE_ID, q)
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
    xdmp.trace(TRACE_ID, queries)
    switch (group["logicalOperator"]) {
      case "and":
        return cts.andQuery(queries)
      case "or":
        return cts.orQuery(queries)
      default:
        return cts.trueQuery()
    }
  } else
    return cts.trueQuery()

}

function search (ctx) {

  return {
    getResults: function getResults () {


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


function getTriplesByUri (uri) {

  return {
    getResults: function getResults () {
      return sem.sparql("SELECT * WHERE{?subject ?predicate ?object} LIMIT 10", null, null, cts.documentQuery(uri)).toArray();
    }
  }
}

function openDocument (uri) {

  return {
    getResults: function getResults () {
      return cts.doc(uri);
    }
  }
}

function getTriplesByIri (iri) {

  return {
    getResults: function getResults () {
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
", { var: sem.iri(iri), var2: iri }, null).toArray()
    }
  }
}


function getDatabases () {

  return xdmp.databases().toArray().map(db => {

    return {
      value: db,
      label: xdmp.databaseName(db)
    }

  }).sort((item1, item2) => {
    if (item1.label > item2.label) return 1; else if (item1.label < item2.label) return -1; else 0;
  })

}


function getCollectionsModels (ctx) {

  return {
    collectionsModel: function getModels () {

      let collections = {}
      if (ctx != null && ctx.collectionIncl != null && ctx.collectionIncl.length > 0) {
        ctx.collectionIncl.map(item => {
          cts.collectionMatch(item).toArray().map(item2 => {
            collections[item2] = getFieldsByCollection(item2, "", null)
          })
        })
      } else {
        for (let col of fn.subsequence(cts.collections(), 1, 15)) {
          collections[col] = getFieldsByCollection(col, "", null)

        }
      }
      // collections[collection] =  getFieldsByCollection(collection)
      return collections
    }
  }
}

function checkDocumentExists (uri) {
  return cts.doc(uri);
}

function getCollectionDetails () {
  return {
    CollectionDetails: function CollectionDetails () {
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

function getDHFEntities () {

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

function getDHFEntityProperties (entity) {

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
    { "entity": sem.iri(entityModel.label) }).toArray()
  return entityModel
}

function isIterable (obj) {
  // checks for null and undefined
  if (obj == null) {
    return false;
  }
  return typeof obj[Symbol.iterator] === 'function';
}

function InvokeExecuteGraph (input) {


  return {
    execute: function execute () {
      var previewUri = ''
      var result = null
      let gHelper = require("/custom-modules/pipes/designtime/graphHelper.sjs")
      let execContext = JSON.parse(input)
      let doc = null
      let uri = ''

      if (execContext.previewUri != null && execContext.previewUri != "") {
        previewUri = execContext.previewUri
        doc = cts.doc(execContext.previewUri)
      }
      else if (execContext.collection != null && execContext.collection != "") {
        if (execContext.collectionRandom) {
          let nbDocs = cts.estimate(cts.collectionQuery(execContext.collection))
          if (nbDocs > 0) doc = cts.doc(fn.head(fn.subsequence(cts.uris(null, null, cts.collectionQuery(execContext.collection)), xdmp.random(nbDocs - 1) + 1)))
        }
        else {
          doc = fn.head(fn.collection(execContext.collection))
        }
      }
      else if (execContext.query != null && execContext.query != "") {
        if (execContext.collectionRandom) {
          let estimateQ = "cts.estimate(" + execContext.query + ")"
          let nbDocs = xdmp.eval(estimateQ)

          if (nbDocs > 0) {
            doc = xdmp.eval("cts.doc(fn.head(fn.subsequence(cts.uris(null, null, " + execContext.query + "), xdmp.random(" + nbDocs + " - 1) + 1)))")
          }
        }
        else {
          doc = fn.head(xdmp.eval("cts.search(" + execContext.query + ")"))
        }

      }

      if (doc !== null) {

        uri = fn.baseUri(doc)

        xdmp.trace(TRACE_ID_DETAILS, "input=" + input)
        xdmp.trace(TRACE_ID, "execContext.collection=" + execContext.collection)
        xdmp.trace(TRACE_ID, "execContext.query=" + execContext.query)
        xdmp.trace(TRACE_ID, "execContext[\"collection\"]=" + execContext["collection"])
        xdmp.trace(TRACE_ID, "input.collection=" + execContext.collection)
        xdmp.trace(TRACE_ID, "uri=" + uri);

        var graphResult = []

        try {

          xdmp.trace(TRACE_ID, "Starting graph execution..")

          var startTime = new Date();

          graphResult = gHelper.executeGraphFromJson(
            execContext.jsonGraph,
            uri,
            doc,
            {
              collections: xdmp.documentGetCollections(uri),
              permissions: xdmp.documentGetPermissions(uri)
            });

          var endTime = new Date();
          var executionTime = endTime - startTime;

          xdmp.trace(TRACE_ID, "Execution completed normally in " + executionTime + "ms")
          xdmp.trace(TRACE_ID_DETAILS, "Result: " + JSON.stringify(graphResult))

          result = {
            uri: uri,
            result: graphResult,
            execTime: executionTime
          }

        } catch (e) {
          xdmp.log(Sequence.from(["Exception occured during graph execution: " + e.message,e.stack,"End"]), "error")
          result = {
            uri: uri,
            result: graphResult,
            error: "Error during graph execution. Check the log for details: "+e.message
          }

        }

      } else {

        xdmp.trace(TRACE_ID, "No source document found. Nothing to preview for the given context")

        result = {
          uri: previewUri,
          error: "No source document found. Nothing to preview for given context",
          result: []
        }

      }

      return result

    }
  }
}

function executeGraph (input, params) {

  const invokeExecuteGraph = InvokeExecuteGraph(input)
  let db = (params.database != null) ? xdmp.database(params.database) : xdmp.database()
  let targetDb = (params.toDatabase != null) ? xdmp.database(params.toDatabase) : xdmp.database()
  let result = fn.head(xdmp.invokeFunction(invokeExecuteGraph.execute, { database: db }))
  let jsonResults = result.result
  if (params.save == "true") {

    if (jsonResults.toArray) jsonResults = jsonResults.toArray()
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

        xdmp.documentInsert(uri, doc, xdmp.defaultPermissions(), collections)

      }, { "database": targetDb, "update": "true" }
      )
    }

  }

  return result


}


function getFieldsByCollection (collection, customURI, query) {

  return {
    FieldsByCollection: function FieldsByCollection () {
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
      else if (query != null && query != "") {
        let decodedQuery = decodeURI(query)

        let estimateQ = "cts.estimate(" + decodedQuery + ")"
        let nbDocs = xdmp.eval(estimateQ)

        if (nbDocs > 0) {
          for (let j = 0; j < 10; j++) {
            doc = fn.head(xdmp.eval("cts.doc(fn.head(fn.subsequence(cts.uris(null, null, " + query + "), xdmp.random(" + nbDocs + " - 1) + 1)))"))
            docs.push(doc);
          }
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
        let allnodes = [node]
        node.xpath("./@*").toArray().map(item => allnodes.push(item))
        allnodes.map(node => {

          let name = fn.name(node)
          let originalPath = String(xdmp.path(node))

          //let path = originalPath.replace(/[A-z]+-node\('([\s]*)'\)/g, "$1").replace(/text\('([\s]+)'\)/g, "$1").replace(/text\('([\s\w]+)'\)/g, "node('$1')").replace(/[A-z]+-node\('([\s]*)'\)/g, "node('$1')")
          let pathTokens = originalPath.replace(/(\/object-node\(\)|\/text\(\))/g, "").replace(/(\[\d+\])/g, "").split("/")

          pathTokens = pathTokens.map((item, index) => {
            if (item == "") return null
            if (item.includes("array-node") && item.includes(" "))
              if (index == pathTokens.length - 1)
                return item + "/*"
              else return item + "/"

            if (item.includes(" ") || item.includes("@"))
              return item.replace(/[A-z]+-node\('([\s\w@]*)'\)/g, "node('$1')").replace(/text\('([\s\w@]+)'\)/g, "node('$1')")
            else
              return item.replace(/[A-z]+-node\('([\s\w@]*)'\)/g, "$1").replace(/text\('([\s\w@]+)'\)/g, "$1")
          })

          let lastSlash = originalPath.replace(/(\/object-node\(\))/g, "").lastIndexOf("/")
          let nodeLastPath = originalPath.substring(lastSlash + 1)
          //if(nodeLastPath.includes("array-node") && path[path.length-1].includes(" "))
          //path[path.length-1]=nodeLastPath

          let path = pathTokens.join("/")
          let parentPath = path.replace(/(\/object-node\(\))/g, "").replace(/\/\*/g, "")
          parentPath = parentPath.substring(0, parentPath.lastIndexOf("/"))
          path = path.replace(/(\/object-node\(\))/g, "")
          let newParentPath = parentPath//.replace(/array-node\('([\s\w]*)'\)/g, "$1")

          pathTokens = path.split("/")
          let pathKey = pathTokens.splice(0, pathTokens.length - 1).join("/")

          newParentPath = newParentPath.replace("/*", "").replace(/\/\//, "/").replace(/\/$/, "")
          if (newParentPath == "") newParentPath = "/"

          let prefix = (path.includes("@")) ? "@" : ""
          if (fields[path.replace("/*", "").replace(/\/\//, "/")] == null)
            fields[path.replace("/*", "").replace(/\/\//, "/")] = {
              label: name + " [id" + i++ + "]",
              field: prefix + node.xpath("name(.)"),
              value: prefix + node.xpath("name(.)"),
              path: path,
              originalPath: originalPath,
              type: node.nodeType,
              children: [],
              parent: newParentPath
            }

        })
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

function getSavedBlock (params) {
  return fn.doc(params.uri)

}

function listSavedBlock (params) {

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

function saveBlock (input, params) {
  let graph = JSON.parse(input)
  let targetDb = (params.toDatabase != null) ? params.toDatabase : xdmp.database()
  xdmp.invokeFunction(() => {

    xdmp.documentInsert("/marklogic-pipes/savedBlock/" + graph.name + ".json", graph, null
      , blocksCollection)

  }, { "database": targetDb, "update": "true" }
  )

}

function deleteBlock (URI) {

  xdmp.invokeFunction(() => {
    declareUpdate();
    if (xdmp.documentGetCollections(URI).includes(blocksCollection)) { // security. can only delete blocks
      xdmp.trace(TRACE_ID, "Deleting Pipes block " + URI)
      xdmp.documentDelete(URI)
    }
  })
}

function deleteGraph (URI) {

  xdmp.invokeFunction(() => {
    declareUpdate();
    if (xdmp.documentGetCollections(URI).includes(graphsCollection)) // security. can only delete graphs
      xdmp.documentDelete(URI)
  })
}

function getSavedGraph (params) {
  return fn.doc(params.uri)

}

function listSavedGraph (params) {

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

function saveGraph (input, params) {
  let graph = JSON.parse(input);
  let targetDb = (params.toDatabase != null) ? params.toDatabase : xdmp.database()
  xdmp.invokeFunction(() => {

    xdmp.documentInsert("/marklogic-pipes/savedGraph/" + graph.name + ".json", graph, xdmp.defaultPermissions()
      , graphsCollection)

  }, { "database": targetDb, "update": "true" }
  )
}

function verifyUri (params) {
  xdmp.trace(TRACE_ID, "verifyUri " + params)
  if (params.uri === null || params.uri.length < 1) return { 'documentExists': false }
  var docExists = (checkDocumentExists(params.uri) !== null)
  var response = {}
  response.documentExists = docExists
  return response
}

// Returns backend version
function getBackEndVersion () {
  var info = {}
  info.Version = PIPESVERSION
  info.Build = PIPESBUILD
  return info
}

function validateCTSQuery (input, params) {
  var query = JSON.parse(input).query
  xdmp.trace(TRACE_ID, "Validating ctsquery : " + query)
  var testQuery = 'fn.count(' + query + ')'
  var result
  try {
    result = xdmp.eval(testQuery)
    return { "valid": true }
  } catch (e) {
    xdmp.trace(TRACE_ID, "Not valid: " + e)
    return { "valid": false, "error": e }
  }
}

function get (context, params) {

  switch (params.action) {
    case "collectionModel":
      const invokeGetFieldsByCollection = getFieldsByCollection(params.collection, params.customURI, params.query)
      return xdmp.invokeFunction(invokeGetFieldsByCollection.FieldsByCollection, { database: (params.database != null) ? params.database : xdmp.database() })
    case "collectionDetails":
      const invokeGetCollectionDetails = getCollectionDetails()
      return xdmp.invokeFunction(invokeGetCollectionDetails.CollectionDetails, { database: (params.database != null) ? params.database : xdmp.database() })
    case "databasesDetails":
      return getDatabases()
    case "DHFEntities":
      return getDHFEntities();
    case "DHFEntityProperties":
      return getDHFEntityProperties(params.entity);
    case "GetSavedBlock":
      return getSavedBlock(params)
    case "ListSavedBlock":
      return listSavedBlock(params)
    case "GetSavedGraph":
      return getSavedGraph(params)
    case "ListSavedGraph":
      return listSavedGraph(params)
    case "verifyDocumentUri":
      return verifyUri(params)
    case "GetVersion":
      return getBackEndVersion()
    default:
  }


};

function post (context, params, input) {

  let config = {};

  let ctx = JSON.parse(input);
  //xdmp.log(Sequence.from(["POST", params, input]));

  switch (params.action) {
    case "compile":
      let compiler = require("/custom-modules/pipes/designtime/compiler.sjs");
      let output = compiler.compileGraphToJavaScript(ctx);
      //xdmp.log(Sequence.from(["COMPILER OUTPUT", output]));
      return output;
    case "config":
      config.databases = getDatabases();
      const invokeGetCollectionsModels = getCollectionsModels(ctx);
      config.collectionsModels = xdmp.invokeFunction(invokeGetCollectionsModels.collectionsModel, { database: (ctx.database != null) ? ctx.database.value : xdmp.database() })//getCollectionsModels(ctx)
      return config
    case "search":
      const invokeSearch = search(ctx);
      let results = xdmp.invokeFunction(invokeSearch.getResults, { database: (ctx.database != null) ? ctx.database.value : xdmp.database() })//getCollectionsModels(ctx)
      return results
    case "triplesByUri":
      const invokeGetTriples = getTriplesByUri(ctx.currentDocumentUri)
      return xdmp.invokeFunction(invokeGetTriples.getResults, { database: (ctx.database != null) ? ctx.database.value : xdmp.database() })
    case "triplesByIri":
      const invokeGetTriplesIri = getTriplesByIri(ctx.currentIri)
      return xdmp.invokeFunction(invokeGetTriplesIri.getResults, { database: (ctx.database != null) ? ctx.database.value : xdmp.database() })
    case "Document":
      const invokeOpenDocument = openDocument(ctx.currentDocumentUri)
      return xdmp.invokeFunction(invokeOpenDocument.getResults, { database: (ctx.database != null) ? ctx.database.value : xdmp.database() })
    case "DHFEntities":
      return getDHFEntities();
    case "DHFEntityProperties":
      return getDHFEntityProperties(params.entity);
    case "ExecuteGraph":
      return executeGraph(input, params)
    case "GetSavedBlock":
      return getSavedBlock(params)
    case "ListSavedBlock":
      return listSavedBlock(params)
    case "SaveBlock":
      return saveBlock(input, params)
    case "GetSavedGraph":
      return getSavedGraph(params)
    case "ListSavedGraph":
      return listSavedGraph(params)
    case "SaveGraph":
      return saveGraph(input, params)
    case "ValidateCtsQuery":
      return validateCTSQuery(input, params)
    default:
    // code block
  }

};

function put (context, params, input) {
  // return at most one document node
};

function deleteFunction (context, params) {

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
