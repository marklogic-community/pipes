module.exports = {

  getCurrentDate,

  split,

  convertJsonEntityToXML
};


function getCurrentDate(dateOption) {
  switch (dateOption) {
    case "currentDate":
      return fn.currentDate();
      break;
    case "currentDateTime":
      return fn.currentDateTime();
      break;
    case "currentTime":
      return fn.currentTime();
      break;

  }

}


function upperCase(v){

  return String(v).toUpperCase()

}

function split(v,splitChar){

  return String(v).split(splitChar)

}


function addTripleSPB(node,builder){

  builder.startElement(fn.name(node),"http://marklogic.com/semantics")
  if(node.datatype) builder.addAttribute('datatype',node.datatype);
  builder.addText(String(node))
  builder.endElement()

}

function processNode(node,builder){
  if(xdmp.type(node) == "untypedAtomic"){
    builder.addElement(fn.name(node),node)
  }
  else{
    if(fn.name(node)=="triples"){
      builder.startElement(fn.name(node),"http://marklogic.com/semantics")
      for(let triple of node.xpath(".//triple")){

        addTripleSPB(triple.subject,builder)
        addTripleSPB(triple.predicate,builder)
        addTripleSPB(triple.object,builder)

        builder.endElement();
      }
    }
    else{
      builder.startElement(fn.name(node))
      for(let child of node.xpath("./*") ) {

        processNode(child,builder)

      }

      builder.endElement();
    }
  }

}

function convertJsonEntityToXML(src) {
  const builder = new NodeBuilder();

  builder.startElement('envelope', 'http://marklogic.com/entity-services');
  processNode(fn.head(src.xpath("/envelope")), builder)
  builder.endElement();
  return builder.toNode();
}

