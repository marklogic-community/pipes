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
            Create new Blocks
          </q-tooltip>
          <q-icon name="widgets"/>
        </q-btn>


        <q-toolbar-title>
          MarkLogic Data Hub - Visual Programming Plugin
          <div slot="subtitle">Draw your ideas</div>
        </q-toolbar-title>

        <q-btn-group>

          <q-btn flat round dense icon="folder_open" size="lg" @click.stop="loadDHFDefaultGraph()">
            <q-tooltip>
              Reset the graph with a default DHF config
            </q-tooltip>

          </q-btn>
          <!--  <q-btn flat round dense icon="play_arrow" size="lg" @click.stop="executeGraph()"/> -->


          <q-btn flat round dense icon="cloud_upload" size="lg" @click.stop="saveGraph()">
            <q-tooltip>
              Save current grap to the staging DB
            </q-tooltip>
          </q-btn>
          <q-btn flat round dense icon="cloud_download" size="lg" @click.stop="loadGraph()">

            <q-tooltip>
              Load a graph from the staging DB
            </q-tooltip>
          </q-btn>
          <q-btn flat round dense icon="play_arrow" size="lg" @click.stop="executeGraph()">
            <q-tooltip>
              Preview Execute Graph
            </q-tooltip>

          </q-btn>
          <q-btn flat round dense icon="code" size="lg" @click.stop="exportDHFModule()">
            <q-tooltip>
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
      :width="500"
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
          <q-tab name="sources" label="From Sources" />
          <q-tab name="entities" label="From Entities" />
          <q-tab name="csv" label="From Csv" />
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="tab" animated>
          <q-tab-panel name="sources">

            <modelselector></modelselector>
          </q-tab-panel>

          <q-tab-panel name="entities">

            <entityselector></entityselector>
          </q-tab-panel>

          <q-tab-panel name="csv">

           <csv-loader></csv-loader>
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
  import csvLoader from '../components/csvLoader.vue'

  export default {
    name: 'MyLayout',
    data () {
      return {
        leftDrawerOpen: this.$q.platform.is.desktop,
        rightDrawerOpen: this.$q.platform.is.desktop,
        tab:"sources"
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


    }
  ,
    loadGraph() {
      this.$root.$emit("loadGraphCall");


    },
    exportDHFModule(){

      this.$root.$emit("exportGraphCall");
    },
    loadDHFDefaultGraph(){

      this.$root.$emit("loadDHFDefaultGraphCall");
      this.leftDrawerOpen = false
    }



  },
    components: {
      modelselector,
      resultViewer,
      entityselector,
      csvLoader
    }
  }
</script>

<style>
</style>
