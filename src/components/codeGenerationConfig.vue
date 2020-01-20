<template>
  <div>

    <q-option-group
      v-model="selectedOptions"
      :options="generationOptions"
      color="green"
      type="checkbox"
    />

    <q-btn color="primary" label="Export" @click="exportDHFModule"/>
    <br/>

  </div>
</template>

<script>
  import {saveAs} from "file-saver";

  export default {
    // name: 'ComponentName',
    data() {
      return {
        message: "",
        selectedOptions: ["download"],
        generationOptions: [
          {
            label: "Save To Modules DB  (Coming soon)",
            value: "toModules"
          },
          {label: "Save to project code (Coming soon)", value: "toCode"},
          {label: "Download main.sjs file", value: "download"}]
      }
    },
    props: ['models', 'graph', "isExported"],
    methods: {
      exportDHFModule() {
        //console.log("export DHF module")
        // this.showCodeGenConfig = true
        let jsonGraph = this.graph.serialize()
        let request = {
          models: (this.models != null) ? this.models : [],
          executionGraph: jsonGraph

        }

        let begin = "const DataHub = require(\"/data-hub/5/datahub.sjs\");\n" +
          "var gHelper  = require(\"/custom-modules/graphHelper\")\n" +
          "const datahub = new DataHub();\n" +
          "\n" +
          "\n" +
          "function getGraphDefinition() {\n" +
          "\n" +
          "  return "

        let end = "}\n" +
          "\n" +
          "function main(content, options) {\n" +
          "\n" +
          "  //grab the doc id/uri\n" +
          "  let id = content.uri;\n" +
          "\n" +
          "  //here we can grab and manipulate the context metadata attached to the document\n" +
          "  let context = content.context;\n" +
          "\n" +
          "  //let's set our output format, so we know what we're exporting\n" +
          "  let outputFormat = options.outputFormat ? options.outputFormat.toLowerCase() : datahub.flow.consts.DEFAULT_FORMAT;\n" +
          "\n" +
          "  //here we check to make sure we're not trying to push out a binary or text document, just xml or json\n" +
          "  if (outputFormat !== datahub.flow.consts.JSON && outputFormat !== datahub.flow.consts.XML) {\n" +
          "    datahub.debug.log({\n" +
          "      message: 'The output format of type ' + outputFormat + ' is invalid. Valid options are ' + datahub.flow.consts.XML + ' or ' + datahub.flow.consts.JSON + '.',\n" +
          "      type: 'error'\n" +
          "    });\n" +
          "    throw Error('The output format of type ' + outputFormat + ' is invalid. Valid options are ' + datahub.flow.consts.XML + ' or ' + datahub.flow.consts.JSON + '.');\n" +
          "  }\n" +
          "\n" +
          "  /*\n" +
          "  This scaffolding assumes we obtained the document from the database. If you are inserting information, you will\n" +
          "  have to map data from the content.value appropriately and create an instance (object), headers (object), and triples\n" +
          "  (array) instead of using the flowUtils functions to grab them from a document that was pulled from MarkLogic.\n" +
          "  Also you do not have to check if the document exists as in the code below.\n" +
          "\n" +
          "  Example code for using data that was sent to MarkLogic server for the document\n" +
          "  let instance = content.value;\n" +
          "  let triples = [];\n" +
          "  let headers = {};\n" +
          "   */\n" +
          "\n" +
          "  //Here we check to make sure it's still there before operating on it\n" +
          "  if (!fn.docAvailable(id)) {\n" +
          "    datahub.debug.log({message: 'The document with the uri: ' + id + ' could not be found.', type: 'error'});\n" +
          "    throw Error('The document with the uri: ' + id + ' could not be found.')\n" +
          "  }\n" +
          "\n" +
          "  //grab the 'doc' from the content value space\n" +
          "  let doc = content.value;\n" +
          "\n" +
          "  // let's just grab the root of the document if its a Document and not a type of Node (ObjectNode or XMLNode)\n" +
          "  //if (doc && (doc instanceof Document || doc instanceof XMLDocument)) {\n" +
          "  //  doc = fn.head(doc.root);\n" +
          "  //}\n" +
          "\n" +
          "  /*\n" +
          "  //get our instance, default shape of envelope is envelope/instance, else it'll return an empty object/array\n" +
          "  let instance = datahub.flow.flowUtils.getInstance(doc) || {};\n" +
          "\n" +
          "  // get triples, return null if empty or cannot be found\n" +
          "  let triples = datahub.flow.flowUtils.getTriples(doc) || [];\n" +
          "\n" +
          "  //gets headers, return null if cannot be found\n" +
          "  let headers = datahub.flow.flowUtils.getHeaders(doc) || {};\n" +
          "\n" +
          "  //If you want to set attachments, uncomment here\n" +
          "  // instance['$attachments'] = doc;\n" +
          "  */\n" +
          "\n" +
          "\n" +
          "\n" +
          "  //insert code to manipulate the instance, triples, headers, uri, context metadata, etc.\n" +
          "\n" +
          "\n" +
          "  let results = gHelper.executeGraphStep(doc,id,getGraphDefinition(),{collections: xdmp.documentGetCollections(id)})\n" +
          /* "\n" +
       "  //form our envelope here now, specifying our output format\n" +
       " // let envelope = datahub.flow.flowUtils.makeEnvelope(instance, headers, triples, outputFormat);\n" +
       "\n" +
       "  //assign our envelope value\n" +
       "  content.value = instance.output;\n" +
       "\n" +
       "  //assign the uri we want, in this case the same\n" +
       "  content.uri = (instance.uri!=null)?instance.uri:id;\n" +
       "\n" +
       "context.collections = (instance.collections!=null)?instance.collections:context.collections;" +
       "  //assign the context we want\n" +
       "  content.context = context;\n" +
       "\n" +
       "  //now let's return out our content to be written\n" +*/
          "  return results;\n" +
          "}\n" +
          "\n" +
          "module.exports = {\n" +
          "  main: main\n" +
          "};\n"



       if(this.selectedOptions.length==0)
         this.$q.notify({
           color: 'negative',
           position: 'top',
           message: "No export option is selected",
           icon: 'code'
         })


        if (this.selectedOptions.indexOf("download") >= 0) {
          var blob = new Blob([begin + JSON.stringify(request) + end], {
            type: "text/plain;charset=utf-8",
            endings: "transparent"
          });
          saveAs(blob, "main.sjs");
          this.$q.notify({
            color: 'positive',
            position: 'top',
            message: " The code of your Data Hub Custom step is now available in the browser downloads folder (main.sjs file).",
            icon: 'code'
          })
        }

        if (this.selectedOptions.indexOf("toCode") >= 0)
          this.$q.notify({
            color: 'positive',
            position: 'top',
            message: " The code of your Data Hub Custom step saved to the project code. Gradle mlloadmodules is required to deploy the code.",
            icon: 'code'
          })

        if (this.selectedOptions.indexOf("toModules") >= 0)
          this.$q.notify({
            color: 'positive',
            position: 'top',
            message: " The code of your Data Hub Custom step saved to the modules DB and is ready to use.",
            icon: 'code'
          })

      }
    }
  }
</script>
