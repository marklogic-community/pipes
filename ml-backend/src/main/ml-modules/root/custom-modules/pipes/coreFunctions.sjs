module.exports = {

  getCurrentDate,

  split,
  lookUp
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


function lookUp(block,var1,var2,nbOutputValues,ctsQuery,widgets){

    let template = "`"+ ctsQuery +"`"

    let result = eval(template)
    let query = eval(result)


  let foundDoc =fn.head(xdmp.invokeFunction(()=>{

    return cts.search(query,["unfiltered", "score-zero"])
  }, {database: xdmp.database(block.database.value)}))

  if(foundDoc!=null)
    for(let i =0 ; i < parseInt(nbOutputValues);i++)
    if(block["value" + i +"Path"]!=null && block["value" + i +"Path"].value!="") block.setOutputData( i, foundDoc.xpath(block["value" + i +"Path"].value))



}

