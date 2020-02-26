<template>
  <div>
    <q-dialog v-model="showDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">JavaScript Compiler Errors</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
            <q-list highlight separator>
              <q-item-main>Unable to compile to native JavaScript. Errors:</q-item-main>
              <div v-for="error in compilerErrors" highlight separator>
                <q-item v-ripple>
                        <q-item-section avatar>
                          <q-avatar color="primary" text-color="white" icon="stop"></q-avatar>
                        </q-item-section>
                        <q-item-section>{{ error }}</q-item-section>
                </q-item>
              </div>
            </q-list>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="OK" color="primary" v-close-popup></q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-option-group
      v-model="selectedOptions"
      :options="generationOptions"
      color="green"
      type="checkbox"
    />
    <q-checkbox name="deployOption" v-if="selectedOptions.indexOf('toCode')>=0" left-label v-model="deployOption" label="Deploy to MarkLogic" />
    <q-select dense v-if="selectedOptions.indexOf('toCode')>=0" outlined v-model="selectedStep" :options="dhfSteps" label="Select DHF5 Step to update" />
    <br/>
    <q-btn-group >
      <q-btn  label="JS Compiler Errors" :disable="!isCompilerError" icon="info" @click="showDialog = true" />
      <q-btn  label="Export" icon="archive" @click="exportDHFModule" />
      <q-btn  label="Close" icon="close"  v-close-popup/>
    </q-btn-group>


    <br/>

  </div>
</template>

<script>
  import {saveAs} from "file-saver";
  import Notifications from '../components/notificationHandler.js';
  export default {
    // name: 'ComponentName',
    mixins: [
      Notifications
    ],
    data() {
      return {
        message: "",
        deployOption:false,
        selectedStep:null,
        dhfSteps:[],
        compilerErrors:[],
        showDialog: false,
        sourceCode : null,
        isCompilerError: false,
        selectedOptions: ["download"],
        generationOptions: [
          {label: "Generate native JavaScript (BETA!)", value: "compileToJavaScript"},
          {label: "Download main.sjs file", value: "download"},
          {label: "Save to project code", value: "toCode"},
         ]
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

const begin = `const DataHub = require("/data-hub/5/datahub.sjs");
var gHelper  = require("/custom-modules/pipes/graphHelper")
const datahub = new DataHub();

`
const interpret1=`
function getGraphDefinition() {
  return `

const interpret2=`}
`

const end1 = `
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
`
const interpretend2 = `  let results = gHelper.executeGraphStep(doc,id,getGraphDefinition(),{collections: xdmp.documentGetCollections(id)})
return results;
}
`

const compiledend2 = `  let results = executeCustomStep(doc,id,xdmp.documentGetCollections(id),context);
return results;
}
`

const end3 = `
module.exports = {
  main: main
};`


       if(this.selectedOptions.length==0)
         this.$q.notify({
           color: 'negative',
           position: 'top',
           message: "No export option is selected",
           icon: 'code'
         })

        let code = null;
        if ( this.selectedOptions.indexOf("compileToJavaScript") >= 0 && this.isCompilerError == false && this.sourceCode != null ) {
           code = begin+end1+compiledend2+this.sourceCode+end3;
        } else {
            code = begin+interpret1+JSON.stringify(request)+interpret2+end1+interpretend2+end3;
        }
        if (this.selectedOptions.indexOf("download") >= 0) {
          var blob = new Blob([code], {
            type: "text/plain;charset=utf-8",
            endings: "transparent"
          });
          saveAs(blob, "main.sjs");
          this.$q.notify({
            color: 'positive',
            position: 'top',
            message: "The code of your Data Hub Custom step is now available in the browser downloads folder (main.sjs file).",
            icon: 'code'
          })
        }

        if (this.selectedOptions.indexOf("toCode") >= 0) {

          if (this.selectedStep != null) {
            var config = {
              headers: {
                'Content-Length': 0,
                'Content-Type': 'text/plain'
              },
              responseType: 'text'
            };

            this.$axios.post('/customSteps?name=' + this.selectedStep.value + '&deploy=' + this.deployOption,code,config).then(
              (response) => {
                let msgAdd = (this.deployOption)?" and deployed to MarkLogic.":"."
                this.$q.notify({
                  color: 'positive',
                  position: 'top',
                  message: "The code of your Data Hub Custom step is saved to the project code" +msgAdd,
                  icon: 'code'
                })


              }


            ).catch((error) => {
              this.notifyError("exportDHFModule", error, this);
            })



          }
          else{

            this.$q.notify({
              color: 'negative',
              position: 'top',
              message: "You must select a DHF step.",
              icon: 'code'
            })

          }
        }
      }
    },
    mounted:function(){
      const jsonGraph = {
                      models: (this.models != null) ? this.models : [],
                      executionGraph: this.graph.serialize()
                    };
      this.$axios.post('/v1/resources/vppBackendServices?rs:action=compile',jsonGraph) .then((response) => {
          console.log(response);
          this.isCompilerError = response.data.errors != null && response.data.errors.length > 0;
          this.sourceCode = response.data.sourceCode;
          if ( this.isCompilerError ) {
            this.compilerErrors = response.data.errors.map(x=>x.errorDescription)
          } else {
            this.compilerErrors = [];
          }
          this.generationOptions = [
                    {label: "Generate native JavaScript (BETA!)", value: "compileToJavaScript", disable : this.isCompilerError},
                    {label: "Download main.sjs file", value: "download"},
                    {label: "Save to project code", value: "toCode"},
                   ];
      }).catch((error) => {
          this.isCompilerError = true;
          this.sourceCode = null;
          this.compilerErrors = ["Error in communication with the backend"];
          console.log(error);
          this.generationOptions =  [
                    {label: "Generate native JavaScript (BETA!)", value: "compileToJavaScript", disable : true},
                    {label: "Download main.sjs file", value: "download"},
                    {label: "Save to project code", value: "toCode"},
                   ];
      });
      this.$axios.get('/customSteps') .then((response) => {
           this.dhfSteps = response.data.customSteps.map(item => {return {"label":item.name,"value":item.name}});
      })
    }
  }
</script>
