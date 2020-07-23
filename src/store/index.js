import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)



const store = new Vuex.Store({
  state: {
    models: [],
    helpMode: false,
    authenticated: false,
    databases: [],
    databasesMap: {},
    graphTitle: 'My Graph',
    graphVersion: "00.01",
    graphAuthor: "",
    graphDescription: "",
    queryBuilderDB: null
  },
  getters: {
    user: state => { return state.user },
    environment: state => { return state.environment },
    database: state => { return state.database },
    port: state => { return state.port },
    host: state => { return state.host },
    graphToLoad: state => { return state.graphToLoad },
    availableDatabases: state => { return state.databases },
    authenticated: state => { return state.authenticated },
    models: state => { return state.models },
    graphTitle: state => { return state.graphTitle },
    graphVersion: state => { return state.graphVersion },
    graphAuthor: state => { return state.graphAuthor },
    graphDescription: state => { return state.graphDescription },
    queryBuilderDB: state => { return state.queryBuilderDB },
    helpMode: state => { return state.helpMode },
    sourceBlocks: state => {
      return this.$store.state.models.filter(function (block) {
        return block.source == "Sources"
      })
    }
  },
  actions: {
    authenticated ({ commit }, { auth, user, environment, port, database, host, graphToLoad }) {
      commit('authenticated', { auth })
      commit('user', user)
      commit('environment', environment)
      commit('port', port)
      commit('database', database)
      commit('host', host)
      commit('graphToLoad', graphToLoad)
    }
  },
  mutations: {
    user (state, user) {
      state.user = user
    },
    environment (state, environment) {
      state.environment = environment
    },
    port (state, port) {
      state.port = port
    },
    database (state, database) {
      state.database = database
    },
    host (state, host) {
      state.host = host
    },
    graphToLoad (state, graphToLoad) {
      state.graphToLoad = graphToLoad;
    },
    availableDatabases (state, dbs) {
      state.databases = dbs
    },
    authenticated (state, auth) {
      state.authenticated = auth
    },
    graphTitle (state, title) {
      state.graphTitle = title
    },
    graphVersion (state, version) {
      state.graphVersion = version
    },
    graphAuthor (state, author) {
      state.graphAuthor = author
    },
    graphDescription (state, description) {
      state.graphDescription = description
    },
    queryBuilderDB (state, db) {
      state.queryBuilderDB = db
    },
    helpMode (state, mode) {
      state.helpMode = mode
    },
    addBlock (state, block) {
      // console.log("addBlock:" + block.source + "/"+ block.label)
      var blockExists = false
      for (var x = 0; x < state.models.length; x++) {
        if (state.models[x].label == block.label && state.models[x].source == block.source) {
          blockExists = true
          if (state.models[x].fields == block.fields) {
            //    console.log("addBloc: Block " + block.source+"/"+block.label + " already in list (exact same fields)")
          } else {
            //    console.log("addBloc: Block " + block.source+"/"+block.label + " already in list (fields different)")
            //    console.log( "[current] " + state.models[x].fields.length + " vs " + block.fields.length + "[new]" )
          }
          break;
        }
      }

      state.models.push(block)

    },
    // blockKey should be block.source/block.label
    removeBlock: (state, blockKey) => {
      const i = state.models.map(item => (item.source + "/" + item.label)).indexOf(blockKey);
      state.models.splice(i, 1);
    },
    clearBlocks (state) { state.models = [] }
  }
});



export default store
