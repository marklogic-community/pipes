// Copyright ©2020 MarkLogic Corporation.
const Notifications = {
  data() {},
  methods: {

// Parse out user-friendly information from ML error response and notify
   notifyError: function(action, MLErrorResponse, ref) {
     var errorDetail, errorPath
     var errorSummary
     var outputError

    if (action === null) {
      action = "UNEXPECTED"
    }

    if (MLErrorResponse && MLErrorResponse.response && MLErrorResponse.response.data) {
      errorPath = "0"

      // ?
      if ( MLErrorResponse.message && (typeof MLErrorResponse.message == "string") )
      errorDetail = MLErrorResponse.message

    // we have a reponse object
    if (MLErrorResponse.response.data.message) {

      errorPath = "1"
      errorDetail = this.extractErrorDetail(MLErrorResponse.response.data.message);
      errorSummary = this.summariseError(errorDetail)

     // error = "Error " + this.resolveErrorAction(action) + ": " + errorSummary || errorDetail + " [1]"
    } else if (MLErrorResponse.response.data && MLErrorResponse.response.data.errorResponse) {
      errorPath = "2"
      console.log("responseObject type 2 : " + JSON.stringify(MLErrorResponse.response.data))
      // errorDetail can at this point be an errorResponse object. If so, get the message
      if ( MLErrorResponse.response.data.errorResponse.message)
        errorDetail = MLErrorResponse.response.data.errorResponse.message
    }
      errorSummary = this.summariseError(errorDetail)

    } else if (MLErrorResponse.message) {
      errorPath = "3"
      errorDetail = MLErrorResponse.message
      errorSummary = this.summariseError(errorDetail)
    } else {
      errorPath = "4"
      try {
          errorDetail = JSON.stringify(MLErrorResponse);
      } catch (c) {
          errorDetail = MLErrorResponse
      }
    }

  console.log("FINISHED MAIN LOGIC")

  outputError = "Error " + this.resolveErrorAction(action) + ": " +  errorSummary + "<p>" + errorDetail + " [" + errorPath + "]</p>"
  console.log("FINAL ERROR: " + outputError)

       ref.$q.notify({
          color: 'negative',
          position: 'top',
          message: outputError,
          icon: 'report_problem',
          html: true,
          timeout: 2500
        })

  },

  // return description of action during which error occured
  resolveErrorAction: function(action) {
    var userAction;
    if (action === null) action = "Unknown"

    switch(action) {
      case 'databasesDetails':
        userAction = "getting database details"
        break;
      case 'collectionDetails':
        userAction = "loading collections"
        break;
      case 'ListSavedGraph':
        userAction = "listing graphs"
        break;
      case 'SaveGraph':
        userAction = "saving current graph"
        break;
      case 'SaveBlock':
            userAction = "saving block to database"
            break;
      case 'LoadingEntities':
        userAction = "loading entities"
        break;
      case 'ListSavedBlock':
          userAction = "getting saved blocks"
          break;
      case 'GetSavedGraph':
        userAction = "loading graph"
        break;
        case 'ExecuteGraph':
         userAction = "executing graph"
         break;
      default:
          userAction = action
    }
    return userAction;
  },

  // attempts to identify an easy summary of various exceptions
  summariseError: function(error) {
    var errorMsg;
    console.log("summariseError(" + error + ")")
    if (error === null || error === undefined) return ""
    if (typeof error === 'string') {
      if (error.includes("java.net.UnknownHostException")) errorMsg = "Unknown host"
      if (error.includes("Nothing to preview")) errorMsg = "Wrong preview context"
      if (error.includes("Host is down") ) errorMsg = "MarkLogic host cannot be contacted"
      if (error.includes("Operation timed out") ) errorMsg = "Operation timed out"
      if (error.includes("arg1 is not of type Node") ) errorMsg = ""
      if (error.includes("Error occured while trying to proxy to")) errorMsg = "Database connectivity lost"
      if (error == "401 Unauthorized") errorMsg = "Invalid credentials"
    } else if (typeof error === 'object') {
      errorMsg = JSON.stringify(error)
    }
    return errorMsg;
  },

  // Depending on the situation, error response from MarkLogic can be a JSON object, or a string + JSON object concatenanted together
  // attempts to extract error string from the incoming object
  extractErrorDetail: function(error) {
      var msg
      if ( (typeof error === 'object' && error !== null) ) {
        msg = JSON.stringify(error)
      } else if (typeof error === 'string') {
        console.log("Error: " + error)
        var obj;
        var errorStr = error
        const startpos = errorStr.indexOf(': [{"errorResponse":')
        const endPos = errorStr.indexOf("}]")
          if (startpos > 0) {
            obj = errorStr.substring(startpos+2,endPos+2)
            try {
              if ( obj != null) {
              obj = JSON.parse(obj)
              console.log("Error: " + JSON.stringify(obj) )
              msg = obj[0].errorResponse.message
              }
            } catch(f) {
               msg = f
            }
          } else {
            msg = error
          }
} else {
  console.log("Incoming response: " + error )
}
return msg
  },

 notifyPositive(self,text) {
  this.$q.notify({
    color: 'positive',
    position: 'top',
    message: text,
    icon: 'code'
  })
}
},
mounted() {
  this.$q.notify.setDefaults({
    timeout: 1000,
    textColor: 'white',
    //actions: [{ icon: 'code', color: 'white' }],
    html: true
  })
}

}

export default Notifications
