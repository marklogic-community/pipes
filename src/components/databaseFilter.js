// Copyright ©2020 MarkLogic Corporation.
const DatabaseFilter = {
  
  data() { }
,
  methods: {

// Parse out code, config, security, and schemas DBs. Should be off limits for Pipes to write into 
    filterDatabases: function(databases) {

   function compare(a, b) {
        if (a.label > b.label) return 1;
        if (b.label > a.label) return -1;
      return 0;
      }    

   var offLimitDatabaseConfig =
   [
      { matchType: "endsIn", values: [ "-TRIGGERS","-SCHEMAS", "-MODULES"]},
      { matchType: "exact",  values: ["Last-Login", "Triggers","Security","Modules","Fab","Extensions","Meters","Schemas","App-Services"] }
   ]

            var filtered = []
            if ( databases !== null && typeof databases === 'object' && databases.length >= 1) {

              filtered = databases.filter(
                    database => ( ! this.dbNameMatches(database.label,offLimitDatabaseConfig) )  
                )
            }
            return filtered.sort(compare)
        },

 dbNameMatches(dbName, offLimitDatabaseConfig) {

  var match = false;

   for (var i = 0; i < offLimitDatabaseConfig.length; i++) {
     for (var v = 0; v < offLimitDatabaseConfig[i].values.length; v++) {
        switch (offLimitDatabaseConfig[i].matchType) {
          case "endsIn":
         if (dbName.endsWith(offLimitDatabaseConfig[i].values[v])) {
            match = true;
            return match
         }
          break;
         case "exact":
         if (dbName == offLimitDatabaseConfig[i].values[v]) {
            match = true;
            return match
        }
        break;
        default:
           }
       }
   }
   return match
 }

}

}

export default DatabaseFilter