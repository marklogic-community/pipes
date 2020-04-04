module.exports = {
  executeBlock,
  getCurrentDate,
  lookUpCollectionPropertyValue,
  split,
  lookUp,
  regExpReplace,
  mapValues
};

function executeBlock(block) {
  if (! ("getRuntimeLibraryFunctionName" in block) ) {
    throw Error("Block does not implement getRuntimeLibraryFunctionName")
  }
  const functionName = block.getRuntimeLibraryFunctionName();
  const library = "getRuntimeLibraryPath" in  block ? block.getRuntimeLibraryPath() : null;
  const inputs = getInputs(block);
  const propertiesAndWidgets = getPropertiesAndWidgets(block);
  const lib = library !== null ? require(library) : this;
  const func = lib[functionName];
  if ( typeof func !== "function") {
    const libraryString = library === null ? "/custom-modules/pipes/coreFunctions.sjs" : library;
    throw Error("Function '"+functionName+"' not found in '"+libraryString+"'")
  }
  const outputValues = func(propertiesAndWidgets, ...inputs);
  outputValues.map((v,index) =>{ if ( typeof  v !== "undefined" ) { block.setOutputData(index,v) }  } );
  return outputValues;
}

function getPropertiesAndWidgets(block) {
  let propertiesWidgets ={
    properties : block.properties,
    widgets : {}
  }
  for ( widget of block.widgets ) {
    const name = widget.name;
    const value = block[widget.name].value;
    propertiesWidgets.widgets[name] = value;
  }
  return propertiesWidgets;
}

function getInputs(block) {
  // flatten the inputs
  let inputs = [];
  if ( block.inputs && block.inputs.length > 0 ) {
    for ( let i = 0 ; i <= block.inputs.length ; i++ ) {
        inputs.push(block.getInputData(i));
    }
  } else {
    inputs = []
  }
  return inputs;
}

function mapValues(propertiesAndWidgets,val) {
  if( val === undefined ) {
    val = "#NULL#";
  }
  if( val === null ) {
    val ="#NULL#";
  }
  if( val=== "" ) {
    val = "#EMPTY#";
  }
  let mappedValue = null;
  if ( propertiesAndWidgets.widgets.wildcarded
  ) {
    mappedValue = [];
    for ( const map of propertiesAndWidgets.properties['mapping'] ) {
      const wildcard = map.source;
      const re = new RegExp(`^${wildcard.replace(/\*/g,'.*').replace(/\?/g,'.')}$`,'');
      if ( re.test(val) ) {
        mappedValue.push(map);
      }
    }
  } else {
    mappedValue = propertiesAndWidgets.properties['mapping'].filter(item => {
      return item.source === val;
    });
  }
  let output= val;
  if( mappedValue != null && mappedValue.length > 0 ) {
    output = mappedValue[0].target;
  }
  if (propertiesAndWidgets.widgets.castOutput === 'bool'){
    if( output === "true" ) {
      output = true;
    } else if( output === "false" ) {
      output = false;
    }
  }
  if(output=="#NULL#") { output = null; }
  if(output=="#EMPTY#") { output =""; }

  return [output];
}

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
