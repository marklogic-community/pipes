const admin = require("/MarkLogic/admin.xqy");


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

  if(group.children!=null) {
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
  }else
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


function getIndexes(ctx) {
  let dbConfig = admin.getConfiguration()
  let indexDefs = admin.databaseGetRangeElementIndexes(dbConfig, (ctx.database != null) ? ctx.database.value : xdmp.database())

  let indexes = {}
  if (ctx != null && ctx.database != null) {
    let indexDefs = admin.databaseGetRangeElementIndexes(dbConfig, (ctx.database != null) ? ctx.database.value : xdmp.database())

    for (let indexDef of indexDefs) {

      let index = {

        localname: indexDef.xpath(".//localname/string()"),
        namespaceUri: indexDef.xpath(".//namespace-uri/string()"),
        scalarType: indexDef.xpath(".//scalar-type/string()"),
      }
      indexes[index.localname] = index

    }
  }
  return indexes
}

function getDatabases() {

  return xdmp.databases().toArray().map(db => {

    return {
      value: db,
      label: xdmp.databaseName(db)
    }

  }).sort((item1,item2)=>{ if(item1.label>item2.label) return 1; else if (item1.label<item2.label) return -1; else 0;})

}

function getFieldsByCollection(collection) {

  let doc = fn.head(fn.collection(collection))
  let fields = []
  for (let node of doc.xpath(".//*"))
    fields.push(
      {
        label: node.xpath("name(.)"),
        value: node.xpath("name(.)"),
        type: node.nodeType
      }
    )

  return fields

}

function getCollectionsModels(ctx) {

  return {
    collectionsModel: function getModels() {

      let collections = {}
      if (ctx != null && ctx.collectionIncl != null && ctx.collectionIncl.length > 0) {
        ctx.collectionIncl.map(item => {
          cts.collectionMatch(item).toArray().map(item2 => {
            collections[item2] = getFieldsByCollection(item2)
          })
      })
      } else {

        for (let col of fn.subsequence(cts.collections(), 1, 15)) {
          collections[col] = getFieldsByCollection(col)

        }

      }
      // collections[collection] =  getFieldsByCollection(collection)


      return collections
    }
  }


}


function getCollectionDetails(){
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

function getFieldsByCollection(collection) {

  return {
    FieldsByCollection: function FieldsByCollection() {
      let i = 0
      let doc = fn.head(fn.collection(collection))
      let fields = {}
      for (let node of doc.xpath(".//*")
        ) {
        let path = xdmp.path(node)
        path = fn.replace(path, "\\[\\d*\\]", "")

        if (fields[path] == null) fields[path] = {
          label: node.xpath("name(.)") + " [id" + i++ + "]",
          field: node.xpath("name(.)"),
          value: node.xpath("name(.)"),
          path: path,
          type: node.nodeType,
          children: [],
          parent: path.substring(0, path.lastIndexOf("/"))
        }
        if (fields[path].parent == "") fields[path].parent = "/"
      }

      let results = []
      Object.keys(fields).map(item => {
        results.push(fields[item])
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


function get(context, params) {



  switch (params.action) {
    case "collectionModel":
      const invokeGetFieldsByCollection = getFieldsByCollection(params.collection)
      return xdmp.invokeFunction(invokeGetFieldsByCollection.FieldsByCollection, {database: (params.database != null) ? params.database : xdmp.database()})
      break;
    case "collectionDetails":
      const invokeGetCollectionDetails = getCollectionDetails()
      return xdmp.invokeFunction(invokeGetCollectionDetails.CollectionDetails, {database: (params.database != null) ? params.database : xdmp.database()})
    case "databasesDetails":
      return getDatabases()
    default:
  }


};

function post(context, params, input) {

  let config = {}

  let ctx = input.toObject()


  switch (params.action) {
    case "config":
      config.databases = getDatabases()
      config.indexes = getIndexes(ctx)
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
    default:
    // code block
  }


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
