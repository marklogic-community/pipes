const DataHub = require("/data-hub/5/datahub.sjs");
const datahub = new DataHub();


function getGraphDefinition() {

  return {"models":[{"label":"customer-block","collection":"customer-block","source":"Sources","fields":["first_name","last_name","id","email","dob","city","street","zipcode","country"],"options":["nodeInput","fieldsOutputs"]},{"label":"customer-block","collection":"customer-block","source":"Sources","fields":["first_name","last_name","id","email","dob","city","street","zipcode","country","instance","headers"],"options":["nodeInput","fieldsOutputs"]},{"label":"customer-block","collection":"customer-block","source":"Sources","fields":["first_name","last_name","id","email","dob","city","street","zipcode","country","createdOn","createdBy"],"options":["nodeInput","fieldsOutputs"]},{"label":"Customer","collection":"Customer","source":"Entities","fields":["DateOfBirth","EMail","Firstname","Gender","HomeAddress","ID","Lastname","Phone"],"options":["fieldsInputs","nodeOutput"]},{"label":"Address","collection":"Address","source":"Entities","fields":["City","Country","Street","Zip"],"options":["fieldsInputs","nodeOutput"]}],"executionGraph":{"last_node_id":9,"last_link_id":14,"nodes":[{"id":3,"type":"Sources/customer-block","pos":[505,278],"size":[220,256],"flags":{},"mode":0,"inputs":[{"name":"Node","type":"Node","link":11}],"outputs":[{"name":"first_name","type":"xs:string","links":[2]},{"name":"last_name","type":"xs:string","links":[3]},{"name":"id","type":"xs:string","links":[0]},{"name":"email","type":"xs:string","links":[1]},{"name":"dob","type":"xs:string","links":[8]},{"name":"city","type":"xs:string","links":[7]},{"name":"street","type":"xs:string","links":[5]},{"name":"zipcode","type":"xs:string","links":[4]},{"name":"country","type":"xs:string","links":[6]},{"name":"createdOn","type":"xs:string","links":null},{"name":"createdBy","type":"xs:string","links":null}],"properties":{},"widgets_values":[true]},{"id":5,"type":"Entities/Address","pos":[904,501],"size":[210.4626720059996,119.41831259293963],"flags":{},"mode":0,"inputs":[{"name":"City","type":"xs:string","link":7},{"name":"Country","type":"xs:string","link":6},{"name":"Street","type":"xs:string","link":5},{"name":"Zip","type":"xs:string","link":4}],"outputs":[{"name":"Node","links":[10]}],"properties":{},"widgets_values":[true]},{"id":6,"type":"date/FormatDateTimeAuto","pos":[903,407],"size":{"0":212.09902954101562,"1":42.6910400390625},"flags":{},"mode":0,"inputs":[{"name":"inputDateTime","type":"xs:string","link":8}],"outputs":[{"name":"IsoDateTime","type":"xs:string","links":[9]}],"properties":{}},{"id":7,"type":"dhf/input","pos":[240,278],"size":[180,60],"flags":{},"mode":0,"outputs":[{"name":"input","type":"","links":[11]},{"name":"uri","type":"","links":null},{"name":"collections","type":"","links":null}],"properties":{}},{"id":9,"type":"dhf/output","pos":[1529,245],"size":[180,150],"flags":{},"mode":0,"inputs":[{"name":"output","type":0,"link":null},{"name":"headers","type":0,"link":null},{"name":"triples","type":0,"link":null},{"name":"instance","type":0,"link":13},{"name":"attachments","type":0,"link":null},{"name":"uri","type":0,"link":null},{"name":"collections","type":0,"link":null}],"properties":{}},{"id":4,"type":"Entities/Customer","pos":[1210,223],"size":[220,196],"flags":{},"mode":0,"inputs":[{"name":"DateOfBirth","type":"xs:string","link":9},{"name":"EMail","type":"xs:string","link":1},{"name":"Firstname","type":"xs:string","link":2},{"name":"Gender","type":"xs:string","link":null},{"name":"HomeAddress","type":"xs:string","link":10},{"name":"ID","type":"xs:string","link":0},{"name":"Lastname","type":"xs:string","link":3},{"name":"Phone","type":"xs:string","link":null}],"outputs":[{"name":"Node","links":[13]}],"properties":{},"widgets_values":[true]}],"links":[[0,3,2,4,5,"xs:string"],[1,3,3,4,1,"xs:string"],[2,3,0,4,2,"xs:string"],[3,3,1,4,6,"xs:string"],[4,3,7,5,3,"xs:string"],[5,3,6,5,2,"xs:string"],[6,3,8,5,1,"xs:string"],[7,3,5,5,0,"xs:string"],[8,3,4,6,0,"xs:string"],[9,6,0,4,0,"xs:string"],[10,5,0,4,4,"xs:string"],[11,7,0,3,0,"Node"],[13,4,0,9,3,0]],"groups":[],"config":{},"version":0.4}}}

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
  if (doc && (doc instanceof Document || doc instanceof XMLDocument)) {
    doc = fn.head(doc.root);
  }

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

  let gHelper  = require("/custom-modules/graphHelper")

  instance = gHelper.executeGraphStep(doc,id,getGraphDefinition(),context)

  //form our envelope here now, specifying our output format
 // let envelope = datahub.flow.flowUtils.makeEnvelope(instance, headers, triples, outputFormat);

  //assign our envelope value
  content.value = instance.output;

  //assign the uri we want, in this case the same
  content.uri = (instance.uri!=null)?instance.uri:id;

context.collections = (instance.collections!=null)?instance.collections:context.collections;  //assign the context we want
  content.context = context;

  //now let's return out our content to be written
  return content;
}

module.exports = {
  main: main
};
