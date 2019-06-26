xquery version "1.0-ml";

module namespace resource = "http://marklogic.com/rest-api/resource/collectionsDiscovery";

declare function get(
        $context as map:map,
        $params  as map:map
) as document-node()*
{
  document {
    array-node {
      for $collection in cts:values(cts:collection-reference(), (), ("item-frequency", ("frequency-order")))
      return
        object-node {
        "label" : $collection,
        "value" : $collection,
        "sublabel" : cts:frequency($collection) || " documents"

        }
    }
  }
};

declare function put(
        $context as map:map,
        $params  as map:map,
        $input   as document-node()*
) as document-node()?
{
  xdmp:log("PUT called")
};

declare function post(
        $context as map:map,
        $params  as map:map,
        $input   as document-node()*
) as document-node()*
{
  xdmp:log("POST called")
};

declare function delete(
        $context as map:map,
        $params  as map:map
) as document-node()?
{
  xdmp:log("DELETE called")
};
