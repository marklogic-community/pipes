import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

console.log("initialising Vuex")

export default function () {

  const store =  new Vuex.Store({
    state: {
      models: [],
      GraphMetadata: {
        title: "My graph",
        version: "00.01",
        author: "",
        description: "",
        dateCreated: "",
        dateUpdated: ""
      } 
    },
    getters: {
    models: state => { return state.models },
    getGraphMetadata: (state) => (field) => { return state.GraphMetadata[field] }
    },
    mutations: {
    addBlock(state, block) {
     // console.log("addBlock:" + block.source + "/"+ block.label) 
      var blockExists = false
      for (var x = 0; x < state.models.length; x++) {
        if ( state.models[x].label == block.label && state.models[x].source == block.source) {
          blockExists = true
          if ( state.models[x].fields == block.fields  ) {
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
    removeBlock: (state, rmblock) => {
        const i = state.models.map(block => block.label).indexOf(rmblock.label);
        state.models.splice(i, 1);
      },
    clearBlocks(state) { state.models = [] }
    }
});

  return store
}
