const DataHub = require("/data-hub/5/datahub.sjs");
var gHelper  = require("/custom-modules/pipes/graphHelper")
const datahub = new DataHub();


function getGraphDefinition() {
  return {"models":[{"label":"my-customer-source","collection":"my-customer-source","source":"Sources","fields":[{"label":"city [id16]","field":"city","value":"city","path":"/envelope/instance/text('city')","type":3,"children":[],"parent":"/envelope/instance"},{"label":"country [id18]","field":"country","value":"country","path":"/envelope/instance/text('country')","type":3,"children":[],"parent":"/envelope/instance"},{"label":"dob [id14]","field":"dob","value":"dob","path":"/envelope/instance/text('dob')","type":3,"children":[],"parent":"/envelope/instance"},{"label":"email [id11]","field":"email","value":"email","path":"/envelope/instance/text('email')","type":3,"children":[],"parent":"/envelope/instance"},{"label":"first_name [id9]","field":"first_name","value":"first_name","path":"/envelope/instance/text('first_name')","type":3,"children":[],"parent":"/envelope/instance"},{"label":"id [id8]","field":"id","value":"id","path":"/envelope/instance/text('id')","type":3,"children":[],"parent":"/envelope/instance"},{"label":"gender [id12]","field":"gender","value":"gender","path":"/envelope/instance/text('gender')","type":3,"children":[],"parent":"/envelope/instance"},{"label":"last_name [id10]","field":"last_name","value":"last_name","path":"/envelope/instance/text('last_name')","type":3,"children":[],"parent":"/envelope/instance"},{"label":"street [id15]","field":"street","value":"street","path":"/envelope/instance/text('street')","type":3,"children":[],"parent":"/envelope/instance"},{"label":"zipcode [id17]","field":"zipcode","value":"zipcode","path":"/envelope/instance/text('zipcode')","type":3,"children":[],"parent":"/envelope/instance"}],"options":["nodeInput","fieldsOutputs"],"metadata":{"dateCreated":"2020-01-24T13:19:25.061Z"}},{"label":"Customer","collection":"Customer","source":"Entities","fields":[{"label":"address","field":"address","path":"//address"},{"label":"dateOfBirth","field":"dateOfBirth","path":"//dateOfBirth"},{"label":"email","field":"email","path":"//email"},{"label":"externalId","field":"externalId","path":"//externalId"},{"label":"firstName","field":"firstName","path":"//firstName"},{"label":"gender","field":"gender","path":"//gender"},{"label":"id","field":"id","path":"//id"},{"label":"lastName","field":"lastName","path":"//lastName"}],"options":["fieldsInputs","nodeOutput"]},{"label":"Address","collection":"Address","source":"Entities","fields":[{"label":"city","field":"city","path":"//city"},{"label":"country","field":"country","path":"//country"},{"label":"customerId","field":"customerId","path":"//customerId"},{"label":"id","field":"id","path":"//id"},{"label":"postalCode","field":"postalCode","path":"//postalCode"},{"label":"street","field":"street","path":"//street"}],"options":["fieldsInputs","nodeOutput"]}],"executionGraph":{"last_node_id":26,"last_link_id":52,"nodes":[{"id":3,"type":"Sources/my-customer-source","pos":[-2,432],"size":[305,268],"flags":{},"order":7,"mode":0,"inputs":[{"name":"Node","type":0,"link":1}],"outputs":[{"name":"city","links":[16]},{"name":"country","links":[17]},{"name":"dob","links":[14]},{"name":"email","links":[3]},{"name":"first_name","links":[4]},{"name":"id","links":[5]},{"name":"gender","links":[10]},{"name":"last_name","links":[7]},{"name":"street","links":[18]},{"name":"zipcode","links":[19]}],"properties":{},"widgets_values":[true]},{"id":9,"type":"Format/FormatDateAuto","pos":[416,460],"size":{"0":170,"1":26},"flags":{},"order":8,"mode":0,"inputs":[{"name":"inputDate","type":0,"link":14}],"outputs":[{"name":"IsoDate","links":[15]}],"title":"Normalize DoB","properties":{}},{"id":7,"type":"Mapping/Map values","pos":[363,631],"size":{"0":255,"1":58},"flags":{},"order":9,"mode":0,"inputs":[{"name":"value","type":0,"link":10},{"name":"default","type":0,"link":null}],"outputs":[{"name":"mappedValue","links":[12]}],"title":"Map gender","properties":{"mapping":[{"source":"#NULL#","target":"#NULL#"},{"source":"#EMPTY#","target":"#EMPTY#"},{"source":"Female","target":"F"},{"source":"Male","target":"M"}],"hoverText":"Double click block to edit the mapping rules"},"widgets_values":["string",false]},{"id":2,"type":"DHF/output","pos":[2005,448],"size":[180,160],"flags":{},"order":15,"mode":0,"inputs":[{"name":"output","type":0,"link":26}],"properties":{}},{"id":13,"type":"Join/Array","pos":[1719,337],"size":{"0":170,"1":106},"flags":{},"order":14,"mode":0,"inputs":[{"name":"item1","type":0,"link":25},{"name":"item2","type":0,"link":40},{"name":"item3","type":0,"link":null},{"name":"item4","type":0,"link":null},{"name":"item5","type":0,"link":null}],"outputs":[{"name":"array","links":[26]}],"properties":{}},{"id":10,"type":"Entities/Address","pos":[661,233],"size":[305,188],"flags":{},"order":10,"mode":0,"inputs":[{"name":"city","type":0,"link":16},{"name":"country","type":0,"link":17},{"name":"customerId","type":0,"link":22},{"name":"id","type":0,"link":47},{"name":"postalCode","type":0,"link":19},{"name":"street","type":0,"link":18}],"outputs":[{"name":"Node","type":"Node","links":[21]},{"name":"Prov","type":null,"links":null}],"properties":{},"widgets_values":[true]},{"id":4,"type":"Entities/Customer","pos":[1025,439],"size":[305,228],"flags":{},"order":11,"mode":0,"inputs":[{"name":"address","type":0,"link":null},{"name":"dateOfBirth","type":0,"link":15},{"name":"email","type":0,"link":3},{"name":"externalId","type":0,"link":5},{"name":"firstName","type":0,"link":4},{"name":"gender","type":0,"link":12},{"name":"id","type":0,"link":13},{"name":"lastName","type":0,"link":7}],"outputs":[{"name":"Node","type":"Node","links":[36]},{"name":"Prov","type":null,"links":null}],"properties":{},"widgets_values":[true]},{"id":19,"type":"DHF/envelope","pos":[1466,534],"size":[180,160],"flags":{},"order":13,"mode":0,"inputs":[{"name":"headers","type":0,"link":null},{"name":"triples","type":0,"link":null},{"name":"instance","type":0,"link":36},{"name":"attachments","type":0,"link":null},{"name":"uri","type":0,"link":37},{"name":"collections","type":0,"link":39}],"outputs":[{"name":"output","type":null,"links":[40]}],"properties":{},"widgets_values":["json"]},{"id":20,"type":"Generate/multiConstant","pos":[1179,875],"size":{"0":255,"1":82},"flags":{},"order":0,"mode":0,"outputs":[{"name":"output","links":[39]}],"properties":{},"widgets_values":["string","Customer360-pipes"]},{"id":11,"type":"DHF/envelope","pos":[1377,132],"size":[180,160],"flags":{},"order":12,"mode":0,"inputs":[{"name":"headers","type":0,"link":null},{"name":"triples","type":0,"link":null},{"name":"instance","type":0,"link":21},{"name":"attachments","type":0,"link":null},{"name":"uri","type":0,"link":43},{"name":"collections","type":0,"link":41}],"outputs":[{"name":"output","type":null,"links":[25]}],"properties":{},"widgets_values":["json"]},{"id":21,"type":"Generate/multiConstant","pos":[1043,306],"size":{"0":255,"1":82},"flags":{},"order":1,"mode":0,"outputs":[{"name":"output","links":[41]}],"properties":{},"widgets_values":["string","Address360-pipes"]},{"id":16,"type":"Generate/Templating","pos":[858,803],"size":{"0":230,"1":160},"flags":{},"order":5,"mode":0,"inputs":[{"name":"v1","type":0,"link":29},{"name":"v2","type":0,"link":null},{"name":"v3","type":0,"link":null}],"outputs":[{"name":"newString","type":"xs:string","links":[37]}],"properties":{},"widgets_values":["v4","v5","/customer/${v1}.json"]},{"id":8,"type":"Generate/uuid","pos":[317,795],"size":{"0":255,"1":58},"flags":{},"order":2,"mode":0,"outputs":[{"name":"uuid","links":[13,22,29]}],"title":"Customer Id","properties":{},"widgets_values":[""]},{"id":23,"type":"Generate/uuid","pos":[-124,161],"size":{"0":255,"1":58},"flags":{},"order":3,"mode":0,"outputs":[{"name":"uuid","links":[42,47]}],"title":"Address ID","properties":{},"widgets_values":[""]},{"id":22,"type":"Generate/Templating","pos":[319,-133],"size":{"0":230,"1":160},"flags":{},"order":6,"mode":0,"inputs":[{"name":"v1","type":0,"link":42},{"name":"v2","type":0,"link":null},{"name":"v3","type":0,"link":null}],"outputs":[{"name":"newString","type":"xs:string","links":[43]}],"properties":{},"widgets_values":["v4","v5","/address/${v1}.json"]},{"id":1,"type":"DHF/input","pos":[-244,439],"size":[180,60],"flags":{},"order":4,"mode":0,"outputs":[{"name":"input","type":"","links":[1]},{"name":"uri","type":"","links":[]},{"name":"collections","type":"","links":null}],"properties":{}}],"links":[[1,1,0,3,0,0],[3,3,3,4,2,0],[4,3,4,4,4,0],[5,3,5,4,3,0],[7,3,7,4,7,0],[10,3,6,7,0,0],[12,7,0,4,5,0],[13,8,0,4,6,0],[14,3,2,9,0,0],[15,9,0,4,1,0],[16,3,0,10,0,0],[17,3,1,10,1,0],[18,3,8,10,5,0],[19,3,9,10,4,0],[21,10,0,11,2,0],[22,8,0,10,2,0],[25,11,0,13,0,0],[26,13,0,2,0,0],[29,8,0,16,0,0],[36,4,0,19,2,0],[37,16,0,19,4,0],[39,20,0,19,5,0],[40,19,0,13,1,0],[41,21,0,11,5,0],[42,23,0,22,0,0],[43,22,0,11,4,0],[47,23,0,10,3,0]],"groups":[],"config":{},"version":0.4}}}

function main(content, options) {
  //grab the doc id/uri
  let id = content.uri;

  //here we can grab and manipulate the context metadata attached to the document
  let context = content.context;

  //let's set our output format, so we know what we're exporting
  let outputFormat = options.outputFormat ? options.outputFormat.toLowerCase() : datahub.flow.consts.DEFAULT_FORMAT;

  //here we check to make sure we're not trying to push out a binary or text document, just xml or json
  if (outputFormat !== datahub.flow.consts.JSON && outputFormat !== datahub.flow.consts.XML) {
    datahub.debug.log({
      message: 'The output format of type ' + outputFormat + ' is invalid. Valid options are ' + datahub.flow.consts.XML + ' or ' + datahub.flow.consts.JSON + '.',
      type: 'error'
    });
    throw Error('The output format of type ' + outputFormat + ' is invalid. Valid options are ' + datahub.flow.consts.XML + ' or ' + datahub.flow.consts.JSON + '.');
  }

  /*
  This scaffolding assumes we obtained the document from the database. If you are inserting information, you will
  have to map data from the content.value appropriately and create an instance (object), headers (object), and triples
  (array) instead of using the flowUtils functions to grab them from a document that was pulled from MarkLogic.
  Also you do not have to check if the document exists as in the code below.

  Example code for using data that was sent to MarkLogic server for the document
  let instance = content.value;
  let triples = [];
  let headers = {};
   */

  //Here we check to make sure it's still there before operating on it
  if (!fn.docAvailable(id)) {
    datahub.debug.log({message: 'The document with the uri: ' + id + ' could not be found.', type: 'error'});
    throw Error('The document with the uri: ' + id + ' could not be found.')
  }

  //grab the 'doc' from the content value space
  let doc = content.value;

  // let's just grab the root of the document if its a Document and not a type of Node (ObjectNode or XMLNode)
  //if (doc && (doc instanceof Document || doc instanceof XMLDocument)) {
  //  doc = fn.head(doc.root);
  //}

  /*
  //get our instance, default shape of envelope is envelope/instance, else it'll return an empty object/array
  let instance = datahub.flow.flowUtils.getInstance(doc) || {};

  // get triples, return null if empty or cannot be found
  let triples = datahub.flow.flowUtils.getTriples(doc) || [];

  //gets headers, return null if cannot be found
  let headers = datahub.flow.flowUtils.getHeaders(doc) || {};

  //If you want to set attachments, uncomment here
  // instance['$attachments'] = doc;
  */

  //insert code to manipulate the instance, triples, headers, uri, context metadata, etc.
  let results = gHelper.executeGraphStep(doc,id,getGraphDefinition(),{collections: xdmp.documentGetCollections(id)})
return results;
}

module.exports = {
  main: main
};