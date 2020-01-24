<!-- Copyright ©2020 MarkLogic Corporation. -->
<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated>
      <q-toolbar
        :glossy="$q.theme === 'mat'"
        :inverted="$q.theme === 'ios'"
      >
        <q-btn
          flat
          dense
          round
          @click="leftDrawerOpen = !leftDrawerOpen"
          aria-label="Sources"
        >
          <q-tooltip>
            Settings and block creation
          </q-tooltip>
          <q-icon name="widgets"/>
        </q-btn>


        <q-toolbar-title>
          Pipes for MarkLogic Data Hub
          <div slot="subtitle">Draw your ideas</div>
        </q-toolbar-title>

        <q-btn-group>

          <q-btn flat round dense icon="fas fa-file" size="lg" @click.stop="loadDHFDefaultGraph()">
            <q-tooltip class="pipes-tooltip">
              Reset graph to default DHF config
            </q-tooltip>

          </q-btn>
          <q-btn flat round dense icon="fas fa-file-upload" size="lg" @click="uploadGraph">
             <q-tooltip class="pipes-tooltip">
              Upload graph or block definitions from file
            </q-tooltip>
          </q-btn>
          <q-btn flat round dense icon="fas fa-file-download" size="lg" @click="downloadGraph()">
             <q-tooltip class="pipes-tooltip">
              Download local copy of current graph
            </q-tooltip>
          </q-btn>
          <q-btn flat round dense icon="cloud_upload" size="lg" @click.stop="saveGraph()">
             <q-tooltip class="pipes-tooltip">
              Save current graph to the staging DB
            </q-tooltip>
          </q-btn>
          <q-btn flat round dense icon="cloud_download" size="lg" @click.stop="loadGraph()">
             <q-tooltip class="pipes-tooltip">
              Load graph from the staging DB
            </q-tooltip>
          </q-btn>
          <q-btn flat round dense icon="fas fa-play" size="lg" @click.stop="executeGraph()">
             <q-tooltip class="pipes-tooltip">
              Preview Execute Graph
            </q-tooltip>

          </q-btn>
          <q-btn flat round dense icon="fas fa-file-code" size="lg" @click.stop="exportDHFModule()">
             <q-tooltip class="pipes-tooltip">
              Export DHF custom step module
            </q-tooltip>

          </q-btn>
        </q-btn-group>


      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      elevated
      bordered
      content-class="bg-grey-2"
      side="left"
      :width="600"
    >
      <q-card>
        <q-tabs
          v-model="tab"
          dense
          class="text-grey"
          active-color="primary"
          indicator-color="primary"
          align="justify"
          narrow-indicator
        >
          <q-tab name="metadata" label="Step Details" />
          <q-tab name="sources" label="Source Blocks" />
          <q-tab name="entities" label="Entity Blocks" />
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="tab" animated>
          <q-tab-panel name="metadata">

            <div class="q-gutter-md" style="max-width: 300px">
              <q-input v-model="graphMetadata.title" filled label="Title" />
              <q-input
                filled
                v-model="graphMetadata.version"
                label="Version"
                mask="##.##"
                fill-mask
                hint="Mask: major.minor"
              />
              <q-input v-model="graphMetadata.author" filled label="Author" />
              <q-input
                v-model="graphMetadata.description"
                filled
                type="textarea"
                label="Description"
              />
            </div>


          </q-tab-panel>
          <q-tab-panel name="sources">

            <modelselector></modelselector>
          </q-tab-panel>

          <q-tab-panel name="entities">

            <entityselector></entityselector>
          </q-tab-panel>

        </q-tab-panels>
      </q-card>

    </q-drawer>

    </q-drawer>

    <q-page-container >
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
  import { openURL } from 'quasar'
  import modelselector from '../components/modelselector.vue'
  import resultViewer from '../components/resultViewer.vue'
  import entityselector from '../components/entityselector.vue'

  export default {
    name: 'MyLayout',
    data () {
      return {
        leftDrawerOpen: this.$q.platform.is.desktop,
        rightDrawerOpen: this.$q.platform.is.desktop,
        tab:"metadata",
        graphMetadata:{
          title:"",
          version:"00.01",
          author:"",
          description:""
        }
      }
    },
    methods: {
      openURL
    },
  methods: {
    openURL,
    notify() {
      this.$root.$emit("registerModel");
      console.log("emit")
    },
    executeGraph() {
      this.$root.$emit("executeGraphCall");
    },
    saveGraph() {
      this.$root.$emit("saveGraphCall");
    },
    downloadGraph() {
      this.$root.$emit("downloadGraphCall");
    },
    uploadGraph() {
      this.$root.$emit("uploadGraphCall");
    },
    loadGraph() {
      this.$root.$emit("loadGraphCall");


    },
    exportDHFModule(){

      this.$root.$emit("exportGraphCall");
    },
    loadDHFDefaultGraph(){

      this.$root.$emit("loadDHFDefaultGraphCall");
      this.leftDrawerOpen = false
    },
    setGraphMetadata(meta){
      console.log(meta)
      this.graphMetadata = meta
    }



  },
    components: {
      modelselector,
      resultViewer,
      entityselector
    },
    beforeMount:function(){

      console.log("init receive")
      this.$root.$on("initGraphMetadata", this.setGraphMetadata );
    },
    mounted: function () {
    }
  }
</script>

<style>
</style>
