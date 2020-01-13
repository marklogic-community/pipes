// Copyright ©2020 MarkLogic Corporation.
const Notifications = {
  data() {},
  methods: {

// Parse out user-friendly information from ML error response and notify
   notifyError: function(action, errorResponse, ref) {
     var error
     var errorDetail
     var errorType

    console.log("notifyError: " + action + ",'" + errorResponse + "'")

    if (action === null) {
      action = "UNEXPECTED"
    }

    if (errorResponse && errorResponse.response && errorResponse.response.data && errorResponse.response.data.message) {
      errorDetail = this.getErrorDetail(errorResponse.response.data.message);
      errorType = this.resolveErrorType(errorDetail)
      error = "Error " + this.resolveErrorAction(action) + ": " + errorType || errorDetail
    } else {
      try { 
          errorDetail = JSON.stringify(errorResponse);
      } catch (c) {
          errorDetail = errorResponse
      }
      error = "Unexpected error during " + this.resolveErrorAction(action) + ": " + errorDetail
    }

       ref.$q.notify({
          color: 'negative',
          position: 'top',
          message: error,
          icon: 'report_problem'
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

  // identify useful messages from exceptions
  resolveErrorType: function(error) {
    var errorMsg;
    if (error === null) return "Undefined"
    if (typeof error === 'string' && error !== null) {
      if (error.includes("java.net.UnknownHostException")) return errorMsg = "Unknown host"
      if (error.includes("Host is down") ) return "MarkLogic host cannot be contacted"
      if (error.includes("Operation timed out") ) return "Operation timed out"
    } else if (typeof error === 'object' && error !== null) {
      return JSON.stringify(error)
    }

    switch(error) {
      case '401 Unauthorized':
        errorMsg = "Invalid credentials"
        break;
      default:
          errorMsg = error
    }
    return errorMsg;
  },

  // Depending on the situation, error response from MarkLogic can be a JSON object, or a string + JSON object concatenanted together
  getErrorDetail: function(error) {
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
  }
}
}

export default Notifications