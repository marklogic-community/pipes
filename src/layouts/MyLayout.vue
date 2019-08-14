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
            Create Block from staging sources (by collection)
          </q-tooltip>
          <q-icon name="extension"/>
        </q-btn>
        <q-btn
          flat
          dense
          round
          @click="rightDrawerOpen = !rightDrawerOpen"
          aria-label="Entities"
        >
          <q-tooltip>
            Create Block from DHF Entities
          </q-tooltip>
          <q-icon name="widgets"/>
        </q-btn>

        <q-toolbar-title>
          Designer 4 MarkLogic
          <div slot="subtitle">Draw your ideas</div>
        </q-toolbar-title>

        <q-btn-group>
          <!--  <q-btn flat round dense icon="play_arrow" size="lg" @click.stop="executeGraph()"/> -->
          <q-btn flat round dense icon="code" size="lg" @click.stop="exportDHFModule()">
            <q-tooltip>
              Export DHF custom step module
            </q-tooltip>

          </q-btn>
          <q-btn flat round dense icon="play_arrow" size="lg" @click.stop="exportDHFModule() //executeGraph()">
            <q-tooltip>
              Preview Execute Graph
            </q-tooltip>

          </q-btn>
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
        </q-btn-group>


      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      elevated
      bordered
      content-class="bg-grey-2"
      side="left"
    >

      <modelselector></modelselector>
    </q-drawer>

    <q-drawer side="right"
              v-model="rightDrawerOpen"
              elevated
              bordered
              :content-class="$q.theme === 'mat' ? 'bg-grey-2' : null"
    >

      <entityselector></entityselector>


    </q-drawer>

    <q-page-container>
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
        rightDrawerOpen: this.$q.platform.is.desktop
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
      console.log("emit")

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
    }


  },
    components: {
      modelselector,
      resultViewer,
      entityselector
    }
  }
</script>

<style>
</style>
