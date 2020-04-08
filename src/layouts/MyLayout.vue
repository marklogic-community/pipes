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
          <q-tooltip content-class="pipes-tooltip">
            Settings and block creation
          </q-tooltip>
          <q-icon name="widgets" />
        </q-btn>

        <q-toolbar-title>
          Pipes for MarkLogic Data Hub
          <div slot="subtitle">Draw your ideas</div>
        </q-toolbar-title>

		<q-toolbar-title align="left">
			{{ this.currentGraphTitle }}
		</q-toolbar-title>

        <q-btn-group v-if="loggedIn">

          <q-btn
            flat
            round
            dense
            icon="fas fa-file"
            size="lg"
            @click.stop="loadDHFDefaultGraph()"
          >
            <q-tooltip content-class="pipes-tooltip">
              Start a new graph
            </q-tooltip>

          </q-btn>
          <q-btn
            flat
            round
            dense
            icon="fas fa-file-upload"
            size="lg"
            @click="uploadGraph"
          >
            <q-tooltip content-class="pipes-tooltip">
              Upload graph or block definitions from file
            </q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            dense
            icon="fas fa-file-download"
            size="lg"
            @click="downloadGraph()"
          >
            <q-tooltip content-class="pipes-tooltip">
              Download local copy of current graph
            </q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            dense
            icon="cloud_upload"
            size="lg"
            @click.stop="saveGraph()"
          >
            <q-tooltip content-class="pipes-tooltip">
              Save graph
            </q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            dense
            icon="cloud_download"
            size="lg"
            @click.stop="loadGraph()"
          >
            <q-tooltip content-class="pipes-tooltip">
              Load graph
            </q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            dense
            icon="fas fa-play"
            size="lg"
            @click.stop="executeGraph()"
          >
            <q-tooltip content-class="pipes-tooltip">
              Preview Graph Execution
            </q-tooltip>

          </q-btn>
          <q-btn
            flat
            round
            dense
            icon="fas fa-file-code"
            size="lg"
            @click.stop="exportDHFModule()"
          >
            <q-tooltip content-class="pipes-tooltip">
              Export DHF custom step module
            </q-tooltip>
          </q-btn>
          <q-separator
            vertical
            inset
          ></q-separator>
          <q-btn
            round
            dense
            icon="fas fa-question-circle"
            size="lg"
            @click.stop="openHelp()"
          >
            <q-tooltip content-class="pipes-tooltip">
              Help
            </q-tooltip>
          </q-btn>

          <q-btn
            round
            dense
            icon="fas fa-sign-out-alt"
            size="lg"
            @click.stop="logOut()"
          >
            <q-tooltip content-class="pipes-tooltip">
              Log out
            </q-tooltip>
          </q-btn>
        </q-btn-group>

      </q-toolbar>
    </q-header>

    <q-drawer
      v-if="loggedIn"
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
          <q-tab
            name="metadata"
            label="Step Details"
          />
          <q-tab
            name="sources"
            label="Source Blocks"
          />
          <q-tab
            name="entities"
            label="Entity Blocks"
          />
        </q-tabs>

        <q-separator />

        <q-tab-panels
          v-model="tab"
          animated
        >
          <q-tab-panel name="metadata">

            <div
              class="q-gutter-md"
              style="max-width: 300px"
            >
              <q-input
                v-model="graphMetadata.title"
                filled
                label="Graph Name"
				@blur="updateTitle()"
              />
              <q-input
                filled
                v-model="graphMetadata.version"
                label="Version"
                mask="##.##"
                fill-mask
                hint="Mask: major.minor"
              />
              <q-input
                filled
                disable
                v-model="graphMetadata.dateCreated"
                label="Date Created"
              />
              <q-input
                v-model="graphMetadata.author"
                filled
                label="Author"
              />
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

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { openURL } from 'quasar'
import { Dialog } from 'quasar'
import modelselector from '../components/modelselector.vue'
import resultViewer from '../components/resultViewer.vue'
import entityselector from '../components/entityselector.vue'
import { LiteGraph } from 'litegraph.js';
import { Vuex } from "vuex";

export default {
  name: 'MyLayout',
  components: {
	LiteGraph
  },
  data () {
    return {
      leftDrawerOpen: false,
	  rightDrawerOpen: this.$q.platform.is.desktop,
      tab: "metadata",
	  currentGraphTitle: "My graph",
	  graphStack: ["TOP"], // list of graphs to track title going in/out of subgraphs
      graphMetadata: {
        title: "My graph",
        version: "00.01",
        author: "",
        description: "",
        dateCreated: new Date().toISOString()
      }
    }
  },
  computed: {
    loggedIn: function() {
      console.log('LoggedIn returning ' + this.$store.getters.authenticated)
      return this.$store.getters.authenticated
  }
  },
  methods: {
    updateTitle() {
	// update title if edited and user in main graph / not subgraph
	 if ( this.graphStack.length == 1 ) {
		this.currentGraphTitle = this.graphMetadata.title
	 }
	},
    enteredSubGraph(graphName) {
		this.graphStack.push(graphName)
		this.currentGraphTitle = "Subgraph: " + graphName
	},
	exitedSubGraph() {
		var graphName = this.graphStack.pop();
		if ( this.graphStack.length == 1 )  {
			this.currentGraphTitle = this.graphMetadata.title
		} else {
			this.currentGraphTitle = "Subgraph: " + this.graphStack[this.graphStack.length-1]
		}
	},
	resetGraphTitle(graphName) {
		this.graphStack = ["TOP"]
		this.currentGraphTitle = this.graphMetadata.title
	},
    executeGraph () {
      this.$root.$emit("executeGraphCall");
    },
    saveGraph () {
      this.$root.$emit("saveGraphCall");
    },
    downloadGraph () {
      this.$root.$emit("downloadGraphCall");
    },
    uploadGraph () {
      this.$root.$emit("uploadGraphCall");
    },
    loadGraph () {
      this.$root.$emit("loadGraphCall");
    },
    exportDHFModule () {
      this.$root.$emit("exportGraphCall");
    },
    loadDHFDefaultGraph () {
      // TODO add an "are you sure...?" graph

      this.$q.dialog({
        title: 'New Graph',
        message: 'You will lose any unsaved work. \
        Do you want to proceed?',
        persistent: true,
        cancel: true

      }).onOk(() => {
        this.$root.$emit("loadDHFDefaultGraphCall");
        this.leftDrawerOpen = false
      })

    },
    setGraphMetadata (meta) {
      // console.log("Graph metadata " + (typeof metadata) + ": " + meta)
      this.graphMetadata = meta
    },
    openHelp () {
      window.open("https://github.com/marklogic-community/pipes/wiki", "_pipesHelp");
    },
    logOut () {
      this.$q.dialog({
        title: 'Log out',
        message: 'You will lose any unsaved work. \
        Do you want to proceed?',
        persistent: true,
        cancel: true

      }).onOk(() => {
        this.$axios.post('/logout').then(response => {
          this.$store.commit('authenticated',false)
          this.$q.notify({
            color: 'positive',
            position: 'center',
            message: "User logged out",
            icon: 'info',
            timeout: 800
          })
          this.$router.push({ path: "/login" })
        })
      }).onOk(() => {
        // console.log('>>>> second OK catcher')
      }).onCancel(() => {
        // console.log('>>>> Cancel')
      }).onDismiss(() => {
        // console.log('I am triggered on both OK and Cancel')
      })
    }
  },
  components: {
    modelselector,
    resultViewer,
    entityselector
  },
  beforeMount: function () {

    this.$root.$on("initGraphMetadata", this.setGraphMetadata);
  //  this.$root.$on("logIn", this.logIn);
  //  this.$root.$on("logOut", this.logOut);
  },
  mounted: function() {
	  this.$root.$on('enteredSubGraph', this.enteredSubGraph);
	  this.$root.$on('exitedSubGraph', this.exitedSubGraph);
	  this.$root.$on('resetGraphTitle', this.resetGraphTitle);
  },
  beforeDestroy: function() {
	  this.$root.$off('enteredSubGraph', this.enteredSubGraph);
	  this.$root.$off('exitedSubGraph', this.exitedSubGraph);
	  this.$root.$off('resetGraphTitle', this.resetGraphTitle);
  }
}
</script>

<style>
</style>
