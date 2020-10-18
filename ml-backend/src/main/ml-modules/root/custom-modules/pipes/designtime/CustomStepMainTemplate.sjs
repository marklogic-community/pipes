const DataHub = require("/data-hub/5/datahub.sjs");
const datahub = new DataHub();

function main(content, options) {
  let id = content.uri;
  let context = content.context; 
  
  let outputFormat = options.outputFormat ? options.outputFormat.toLowerCase() : datahub.flow.consts.DEFAULT_FORMAT;
  if (outputFormat !== datahub.flow.consts.JSON && outputFormat !== datahub.flow.consts.XML) {
    datahub.debug.log({
      message: 'The output format of type ' + outputFormat + ' is invalid. Valid options are ' + datahub.flow.consts.XML + ' or ' + datahub.flow.consts.JSON + '.',
      type: 'error'
    });
    throw Error('The output format of type ' + outputFormat + ' is invalid. Valid options are ' + datahub.flow.consts.XML + ' or ' + datahub.flow.consts.JSON + '.');
  }
 
  if (!fn.docAvailable(id)) {
    datahub.debug.log({message: 'The document with the uri: ' + id + ' could not be found.', type: 'error'});
    throw Error('The document with the uri: ' + id + ' could not be found.')
  }
 
  let doc = content.value;
 
  let instance = datahub.flow.flowUtils.getInstance(doc) || {}; 
  let triples = datahub.flow.flowUtils.getTriples(doc) || [];
  let headers = datahub.flow.flowUtils.getHeaders(doc) || {};

  let results = executeCustomStep(doc,id,xdmp.documentGetCollections(id),context);
  return results;
}

