// Copyright ©2020 MarkLogic Corporation.
const EntityManager = {
  data() {},

  methods: {

  getEntities: function() {   
    return this.$axios.get('/v1/resources/vppBackendServices?rs:action=DHFEntities') 
  },

  // checks the Entity blocks in a graph against current Entities in database
  checkEntityBlocks: function(graph) {

    console.log("Checking Entity Blocks in Graph..")

    function arraysAreIdentical(arr1, arr2){
      if (arr1.length !== arr2.length) return false;
      for (var i = 0, len = arr1.length; i < len; i++){
      if (arr1[i] !== arr2[i]){
        return false;
      }
      }
      return true; 
    }

    var self = this;
    var dbEntities = []

    this.getEntities().then( (response) => {

      dbEntities = response.data

    for (let model of graph.models) {
                  
                if ( model.source == "Entities" ) {

                  console.log("Checking entity " + model.label + "...")

                  var entityExists = false
                  var entityID = ""

                  for (let entity of dbEntities) {
                    if ( entity.label == model.label) {
                      entityExists = true;
                      entityID = entity.value
                      break;
                    }
                  }

                  if ( ! entityExists ) {
                    console.log("Warning: ENTITY '" + model.label + "' IN GRAPH DOES NOT EXIST IN DATABASE")
                  } else {

           this.$axios.get('/v1/resources/vppBackendServices?rs:action=DHFEntityProperties&rs:entity=' + entityID)
          .then((response) => {
              var entityProperties = response.data
              var DBEntitypropertiesArray = []
              var BlockEntitypropertiesArray = []
              if ( entityProperties != null) {
                for (let prop of entityProperties.children) DBEntitypropertiesArray.push(prop.label)
              } 
              if ( model.fields != null) {
                for (let prop of model.fields) BlockEntitypropertiesArray.push(prop.label)
              }
              DBEntitypropertiesArray.sort()
              BlockEntitypropertiesArray.sort()
              if ( ! arraysAreIdentical(DBEntitypropertiesArray,BlockEntitypropertiesArray) ) {
                console.log("Warning: ENTITY '" + model.label + "' IS NOT THE SAME IN GRAPH AND DATABASE!")
                console.log("Entity properties in graph: " + JSON.stringify(BlockEntitypropertiesArray))
                console.log("Entity properties in DB: " + JSON.stringify(DBEntitypropertiesArray))
              }
            })
             
          }
                }
    } 

  })

  }

}


}

export default EntityManager