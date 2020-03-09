module.exports = {

  getCurrentDate,

  split,

};


function getCurrentDate(dateOption) {
  switch (dateOption) {
    case "currentDate":
      return fn.currentDate();
      break;
    case "currentDateTime":
      return fn.currentDateTime();
      break;
    case "currentTime":
      return fn.currentTime();
      break;

  }

}


function upperCase(v){

  return String(v).toUpperCase()

}

function split(v,splitChar){

  return String(v).split(splitChar)

}


