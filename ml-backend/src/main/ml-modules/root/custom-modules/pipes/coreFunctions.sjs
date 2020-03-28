module.exports = {

  getCurrentDate,
  lookUpCollectionPropertyValue,
  split,
  lookUp,
  regExpReplace
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

function lookUp(block,var1,var2,nbOutputValues,ctsQuery){
  let template = "`"+ ctsQuery +"`";
  let result = eval(template);
  let query = eval(result);
  let foundDoc = fn.head(xdmp.invokeFunction(()=>{
     return cts.search(query,["unfiltered", "score-zero"],0);
  }, {database: xdmp.database(block.database.value)}));
  if(foundDoc != null) {
    for (let i = 0; i < parseInt(nbOutputValues); i++) {
      if (block["value" + i + "Path"] != null && block["value" + i + "Path"].value != "") {
        const r = foundDoc.xpath(block["value" + i + "Path"].value)
        block.setOutputData(i, r)
      }
    }
  }
}

function lookUpCollectionPropertyValue(block,var1,nbOutputValues){
  let collection = block.collection.value;
  collection = !collection ? "" : collection;
  let dataType = block.dataType.value;
  let property = block.property.value;
  dataType = !dataType || (dataType !== 'bool' && dataType !== 'string' && dataType !== 'number') ? "string" : dataType;
  let foundDoc = fn.head(xdmp.invokeFunction(()=>{
    let arr = [];
    if (! ( var1 instanceof Array )) {
      var1 = [var1]
    }
    for ( const v of var1 ) {
      if (!v) {
        continue;
      }
      if ( dataType === 'bool') {
        arr.push(v.toString() === 'true');
      }
      if ( dataType === 'string') {
        arr.push(v.toString());
      }
      if ( dataType === 'number') {
        arr.push(Number(v.toString()));
      }
    }
    const query = cts.andQuery([cts.collectionQuery(collection),cts.jsonPropertyValueQuery(property,arr)]);
    return cts.search(query,["unfiltered", "score-zero"],0);
  }, {database: xdmp.database(block.database.value)}));

  if( foundDoc!= null) {
    for (let i = 0; i < parseInt(nbOutputValues); i++) {
      if (block["value" + i + "Path"] != null && block["value" + i + "Path"].value != "") {
        const r = foundDoc.xpath(block["value" + i + "Path"].value);
        block.setOutputData(i, r)
      }
    }
  }
}

function regExpReplace(block,regEx,replace,global,caseInsensitive)  {
  let options = "";
  if ( global ) {
    options += "g"
  }
  if ( caseInsensitive ) {
    options += "i"
  }
  replace = !replace?  "" : replace;
  const regExObj = new RegExp(regEx,options);
  const input = block.getInputData(0);
  if ( input ) {
    if ( input instanceof Array ) {
     let arr = [];
     for ( const i of input ) {
       if (!i ) {
         continue;
       }
       arr.push(i.toString().replace(regExObj,replace))
     }
      block.setOutputData(0,arr);
    } else {
      block.setOutputData(0,input.toString().replace(regExObj,replace));
    }
  }
}
