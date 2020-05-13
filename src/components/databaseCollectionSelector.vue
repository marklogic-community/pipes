<!-- Copyright ©2020 MarkLogic Corporation. -->
<template>

<div>
    <q-select
      name="databaseSelector"
      v-model="database"
      :options="dropdownDatabaseOptions"
      @filter="dropdownDynamicDBfilter"
      @input="databaseChanged"
      use-input
      filled
      hide-selected
      input-debounce="0"
      fill-input
      separator
      label="Source database"
      stack-label
    >

   <q-tooltip v-if="helpMode" self="center right" content-class="tool-tip" v-model="toolTips"/>
       <template v-slot:prepend>
        <q-icon name="fas fa-database"/>
      </template>
    </q-select>

<div v-if="showCollectionDropDown">
    <q-select
      name="collectionSelector"
      v-model="collection"
      :options="dropdownCollectionOptions"
      @filter="dropdownDynamicCollectionfilter"
      @input="collectionChanged"
      input-debounce="0"
      use-input
      filled
      hide-selected
      fill-input
      separator
      label="Source collection"
      stack-label
    >
    <template v-slot:prepend>
        <q-icon name="fas fa-tags"/>
      </template>
    </q-select>
</div>
<div style="color: red">{{InfoMessage}}</div>

</div>

</template>

<script>
  import DatabaseFilter from '../components/databaseFilter.js';
  import CollectionFilter from '../components/collectionFilter.js';
  import Notifications from '../components/notificationHandler.js';
  import { Vuex } from "vuex";

  export default {
     name: 'databaseCollectionSelector',
    mixins: [
      DatabaseFilter,
      CollectionFilter,
      Notifications
    ],
    props: {
      selectedDatabase: Object,    // Currently selected database
      selectedCollection: Object, // Currently selected collection
      showCollectionDropDown: Boolean
    },
    data() {
      return {
        dropdownDatabaseOptions: [],
        dropdownCollectionOptions: [],
        database: null,
        collection: null,
        availableDatabases: [],
        availableCollections: [],
        helpMode: false,
        infoMessage: ''
    }
    },
    computed: {
      InfoMessage: function () {
        return this.infoMessage
      }
    },
    methods: {
    // Emit changes back to parent component
     databaseChanged: function() {
       if ( this.showCollectionDropDown ) this.discoverCollections()
       this.$emit('databaseChanged',this.database);
     },
     collectionChanged: function() {
      this.$emit('collectionChanged',this.collection);
     },
     dropdownDynamicDBfilter (val, update, abort) {
      if (val === '') {
        update(() => {
          this.dropdownDatabaseOptions = this.availableDatabases
        })
        return
      }
      update(() => {
        const needle = val.toLowerCase()
        this.dropdownDatabaseOptions = this.availableDatabases.filter(v => v.label.toLowerCase().indexOf(needle) > -1)
      })
    },
     dropdownDynamicCollectionfilter (val, update, abort) {
      if (val === '') {
        update(() => {
          this.dropdownCollectionOptions = this.availableCollections
        })
        return
      }
      update(() => {
        const needle = val.toLowerCase()
        this.dropdownCollectionOptions = this.availableCollections.filter(v => v.label.toLowerCase().indexOf(needle) > -1)
      })
    },
    setAvailableDatabases: function() {
      for (var x = 0; x < this.$store.getters.availableDatabases.length; x++) {
        this.availableDatabases.push(this.$store.getters.availableDatabases[x])
      }
    },
     discoverCollections() {
        this.infoMessage = ""
        var self = this;
        this.collection = null
        let dbOption = ""
        if (this.database !== null) {
          dbOption += "&rs:database=" + this.database.value
        }
          this.$axios.get('/v1/resources/vppBackendServices?rs:action=collectionDetails' + dbOption )
          .then((response) => {
            this.availableCollections = self.filterCollections(response.data)
            if (this.availableCollections.length == 0) {
              this.infoMessage = "Database " + this.database.label + " has no collections"
            }
          })
          .catch((error) => {
            self.notifyError("collectionDetails", error, self);
          })
      },
       setDatabaseCollectionsDropdowns(dbName, collectionName, reloadBlock) {
        if ( dbName === null || dbName == '') return;
        for (var x = 0; x < this.availableDatabases.length; x++) {
          if ( this.availableDatabases[x].label == dbName ) {
            this.database = this.availableDatabases[x]
            var self = this
            this.discoverCollectionsPromise().then((response) => {
            this.availableCollections = self.filterCollections(response.data)
            if (collectionName !== null && collectionName !== '') {
           //   Try to select Collection
              for (var x = 0; x < self.availableCollections.length; x++) {
                  if ( self.availableCollections[x].label == collectionName ) {
                  self.collection = self.availableCollections[x]
                //  self.discoverModel( this.selectedCollection,"", reloadBlock)
                  return
                  }
			  }
			  console.log("Warning: collection " + collectionName + " not found")
            }
          })
          .catch((error) => {
            self.notifyError("collectionDetails", error, self);
          })
          }
        }
      },
      discoverCollectionsPromise() {
        let dbOption =""
        if( this.database !==null ) {
          dbOption += "&rs:database=" + this.database.value
        }
          return this.$axios.get('/v1/resources/vppBackendServices?rs:action=collectionDetails' + dbOption )
      },
    },
    mounted() {

      this.setAvailableDatabases()
      this.database = this.selectedDatabase
      this.collection = this.selectedCollection
    }
  }
</script>
