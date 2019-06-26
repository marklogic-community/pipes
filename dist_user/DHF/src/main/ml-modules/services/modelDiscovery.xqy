xquery version "1.0-ml";

module namespace resource = "http://marklogic.com/rest-api/resource/modelDiscovery";

declare function transform($nodes as node()*) as item()* {
  for $node in $nodes
  return
    typeswitch($node)
      case text() return object-node{"label": name($node)}
      default return object-node{
      "label": name($node),
      "children" : array-node{transform($node/node())}
      }
};

declare function get(
  $context as map:map,
  $params  as map:map
  ) as document-node()*
{



let $collection := map:get($params,"collection")
let $doc:= collection($collection)[1]
return
  document {
    array-node {

      object-node {
      "label": $collection,
      "children" : array-node {transform($doc/*)}
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
