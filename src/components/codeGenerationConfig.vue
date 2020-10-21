<template>
  <div>
    <q-dialog v-model="showDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">JavaScript Compiler Errors</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-list
            highlight
            separator
          >
            <q-item-main>Unable to compile to native JavaScript. Errors:</q-item-main>
            <div
              v-for="error in compilerErrors"
              highlight
              separator
            >
              <q-item v-ripple>
                <q-item-section avatar>
                  <q-avatar
                    color="primary"
                    text-color="white"
                    icon="stop"
                  ></q-avatar>
                </q-item-section>
                <q-item-section>{{ error }}</q-item-section>
              </q-item>
            </div>
          </q-list>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            label="OK"
            color="primary"
            v-close-popup
          ></q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-option-group
      v-model="selectedOptions"
      :options="generationOptions"
      color="green"
      type="checkbox"
    />
    <q-checkbox
      name="deployOption"
      v-if="selectedOptions.indexOf('toCode')>=0"
      left-label
      v-model="deployOption"
      label="Deploy to MarkLogic"
    />
    <q-select
      dense
      v-if="selectedOptions.indexOf('toCode')>=0"
      outlined
      v-model="selectedStep"
      :options="dhfSteps"
      label="Select DHF5 Step to update"
    />
    <br />
    <q-btn-group>
      <q-btn
        label="JS Compiler Errors"
        :disable="!isCompilerError"
        icon="info"
        @click="showDialog = true"
      />
      <q-btn
        label="Export"
        :disable="isCompilerError"
        icon="archive"
        @click="exportDHFModule"
      />
      <q-btn
        label="Close"
        icon="close"
        v-close-popup
      />
    </q-btn-group>

    <br />

  </div>
</template>

<script>
import { saveAs } from "file-saver";
import Notifications from '../components/notificationHandler.js';
export default {
  // name: 'ComponentName',
  mixins: [
    Notifications
  ],
  data () {
    return {
      message: "",
      deployOption: false,
      selectedStep: null,
      dhfSteps: [],
      compilerErrors: [],
      showDialog: false,
      compilerOutput: null,
      isCompilerError: false,
      selectedOptions: ["download"],
      generationOptions: [
        { label: "Download main.sjs file", value: "download" },
        { label: "Save to project code", value: "toCode" },
      ]
    }
  },
  props: ['models', 'graph', "isExported"],
  methods: {
    exportDHFModule () {
      //console.log("export DHF module")
      // this.showCodeGenConfig = true
      let jsonGraph = this.graph.serialize()
      let request = {
        models: (this.models != null) ? this.models : [],
        executionGraph: jsonGraph

      }

      if (this.selectedOptions.length == 0)
        this.$q.notify({
          color: 'negative',
          position: 'top',
          message: "No export option is selected",
          icon: 'code'
        })

      if (this.selectedOptions.indexOf("download") >= 0) {
        var blob = new Blob([this.compilerOutput.sourceCode], {
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

          this.$axios.post('/customSteps?name=' + this.selectedStep.value + '&deploy=' + this.deployOption + "&dependencies="+encodeURIComponent(this.compilerOutput.dependencies.join(",")), this.compilerOutput.sourceCode, config).then(
            (response) => {
              let msgAdd = (this.deployOption) ? " and deployed to MarkLogic." : "."
              this.$q.notify({
                color: 'positive',
                position: 'top',
                message: "The code of your Data Hub Custom step is saved to the project code" + msgAdd,
                icon: 'code'
              })


            }


          ).catch((error) => {
            this.notifyError("exportDHFModule", error, this);
          })



        }
        else {

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
  mounted: function () {
    const jsonGraph = {
      models: (this.models != null) ? this.models : [],
      executionGraph: this.graph.serialize()
    };
    this.$axios.post('/v1/resources/vppBackendServices?rs:action=compile', jsonGraph).then((response) => {
      console.log(response);
      this.isCompilerError = response.data.errors != null && response.data.errors.length > 0;
      this.compilerOutput = response.data;
      if (this.isCompilerError) {
        this.compilerErrors = response.data.errors.map(x => x.errorDescription)
      } else {
        this.compilerErrors = [];
      }
      this.generationOptions = [
        { label: "Download main.sjs file", value: "download" },
        { label: "Save to project code", value: "toCode" },
      ];
    }).catch((error) => {
      this.isCompilerError = true;
      this.sourceCode = null;
      this.compilerErrors = ["Error in communication with the backend"];
      console.log(error);
      this.generationOptions = [
        { label: "Download main.sjs file", value: "download" },
        { label: "Save to project code", value: "toCode" },
      ];
    });
    this.$axios.get('/customSteps').then((response) => {
      console.log("customSteps:", response.toString());
      this.dhfSteps = response.data.customSteps.map(item => { return { "label": item.name, "value": item.name } });
    })
  }
}
</script>
