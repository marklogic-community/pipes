// Copyright ©2020 MarkLogic Corporation.
const DatabaseFilter = {
  data() {},
  methods: {

// Parse out code, config, security, and schemas DBs. Should be off limits for Pipes to write into 
    filterDatabases: function(databases) {
        // Any code, config, security, schemas DBs should be off limits for Pipes to write into 
        const offLimitDatabases = ["Last-Login","Schemas","Triggers","Security","App-Services","Modules",
        "data-hub-staging-SCHEMAS","data-hub-staging-TRIGGERS","data-hub-final-SCHEMAS","data-hub-final-TRIGGERS","Meters","Extensions",
        "data-hub-MODULES","Fab"]
            var filtered = []
            if ( databases !== null && typeof databases === 'object' && databases.length >= 1) {
              filtered = databases.filter(
                database => ( (offLimitDatabases.indexOf(database.label) == -1) ||
                database.label.endsWith("-TRIGGERS","-MODULES") // for DHF projects with custom DB names
                )  
                )
            }
            return filtered;
        },

}

}

export default DatabaseFilter