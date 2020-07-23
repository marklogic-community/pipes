module.exports = {

  getCurrentDate,
  LookupByValue,
  split,
  lookUp,
  regExpReplace,
  computeQueryRecursively
};

const TRACE_ID = "vpp-coreFunctions";

function replaceInputValueQuery (value, block) {
  for (var i = 0; i < block.inputs.length; i++) {
    if (value.includes("${v" + i + "}")) {
      return value.replace("${v" + i + "}", block.getInputData(i))
    }
  }
  return value
}

function computeQueryRecursively (queryString, block) {
  let qArray = []

  for (let child of queryString.children) {
    if (child.type == "query-builder-rule") {
      if (child.query.rule == "cts.collectionQuery") {
        qArray.push(cts.collectionQuery(replaceInputValueQuery(child.query.value.value, block)))
      } else if (child.query.rule == "jsonPropertyValueQuery") {

        let value = child.query.value.selectedType == "string" ? fn.string(replaceInputValueQuery(child.query.value.selectedValue.name ? child.query.value.selectedValue.name : child.query.value.selectedValue, block)) : child.query.value.selectedType == "number" ? fn.number(replaceInputValueQuery(child.query.value.selectedValue.name ? child.query.value.selectedValue.name : child.query.value.selectedValue, block)) : replaceInputValueQuery(child.query.value.selectedValue.name ? child.query.value.selectedValue.name : child.query.value.selectedValue, block)

        qArray.push(cts.jsonPropertyValueQuery(child.query.value.selectedAttribute, value))
      } else if (child.query.rule == "wordQuery") {
        qArray.push(cts.wordQuery(replaceInputValueQuery(child.query.value, block)))
      }
    } else if (child.type == "query-builder-group") {
      if (child.query.logicalOperator == "all") {
        qArray.push(cts.andQuery(computeQueryRecursively(child.query, block)))
        xdmp.trace(TRACE_ID, qArray)
      } else {
        qArray.push(cts.orQuery(computeQueryRecursively(child.query, block)))
      }
    }
  }
  return qArray
}

function getCurrentDate (dateOption) {
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

function upperCase (v) {
  return String(v).toUpperCase()
}

function split (v, splitChar) {
  return String(v).split(splitChar)
}

function lookUp (block, var1, var2, nbOutputValues, ctsQuery) {
  let template = "`" + ctsQuery + "`";
  let result = eval(template);
  let query = eval(result);
  let foundDoc = fn.head(xdmp.invokeFunction(() => {
    return cts.search(query, ["unfiltered", "score-zero"], 0);
  }, { database: xdmp.database(block.database.value) }));
  if (foundDoc != null) {
    for (let i = 0; i < parseInt(nbOutputValues); i++) {
      if (block["value" + i + "Path"] != null && block["value" + i + "Path"].value != "") {
        const r = foundDoc.xpath(block["value" + i + "Path"].value)
        block.setOutputData(i, r)
      }
    }
  }
}

function LookupByValue (block, var1, nbOutputValues) {
  let collection = block.collection.value;
  collection = !collection ? "" : collection;
  let dataType = block.dataType.value;
  let property = block.property.value;
  dataType = !dataType || (dataType !== 'bool' && dataType !== 'string' && dataType !== 'number') ? "string" : dataType;
  let foundDoc = fn.head(xdmp.invokeFunction(() => {
    let arr = [];
    if (!(var1 instanceof Array)) {
      var1 = [var1]
    }
    for (const v of var1) {
      if (!v) {
        continue;
      }
      if (dataType === 'bool') {
        arr.push(v.toString() === 'true');
      }
      if (dataType === 'string') {
        arr.push(v.toString());
      }
      if (dataType === 'number') {
        arr.push(Number(v.toString()));
      }
    }
    const query = cts.andQuery([cts.collectionQuery(collection), cts.jsonPropertyValueQuery(property, arr)]);
    return cts.search(query, ["unfiltered", "score-zero"], 0);
  }, { database: xdmp.database(block.database.value) }));

  if (foundDoc != null) {
    for (let i = 0; i < parseInt(nbOutputValues); i++) {
      if (block["value" + i + "Path"] != null && block["value" + i + "Path"].value != "") {
        const r = foundDoc.xpath(block["value" + i + "Path"].value);
        block.setOutputData(i, r)
      }
    }
  }
}

function regExpReplace (block, regEx, replace, global, caseInsensitive) {
  let options = "";
  if (global) {
    options += "g"
  }
  if (caseInsensitive) {
    options += "i"
  }
  replace = !replace ? "" : replace;
  const regExObj = new RegExp(regEx, options);
  const input = block.getInputData(0);
  if (input) {
    if (input instanceof Array) {
      let arr = [];
      for (const i of input) {
        if (!i) {
          continue;
        }
        arr.push(i.toString().replace(regExObj, replace))
      }
      block.setOutputData(0, arr);
    } else {
      block.setOutputData(0, input.toString().replace(regExObj, replace));
    }
  }
}
