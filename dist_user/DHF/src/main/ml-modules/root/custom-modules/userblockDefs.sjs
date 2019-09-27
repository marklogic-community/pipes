

function initUserBlocks(LiteGraph){

  function myBlock()
  {
    this.addInput("MyInput1");
    this.addOutput("myOutput1");
  }

  myBlock.title = "myBlock";
  myBlock.desc = "myBlock";

  myBlock.prototype.onExecute = function()
  {
    this.setOutputData(0, "Output " + this.getInputData(0) + " by myBlock" )

  }
  LiteGraph.registerNodeType("user/myBlock", myBlock );




  function wktReproject(s_srs,t_srs,inWkt) {
    // get coords from inWkt and send to Esri project service, alternative is to setup something with ogr2ogr as a service (RFE: ogr/gdal in MarkLogic)
    // this reproject here is not the right place, no exception/error handling and won't work with higher data volumes I guess
    let outWkt = esriResponseToWKT(wktToEsriRequest(s_srs,t_srs,inWkt));
    //let outWkt = fn.concat(makeWkt("LINESTRING",5)); // create dummy wkt data
    return outWkt;
  }

  function wktToEsriRequest(s_srs,t_srs,inWkt) {
    let coords = fn.substringBefore(fn.substringAfter(inWkt,"LINESTRING ("),")"); // TODO: improve to work for POINT and POLYGON WKT strings too
    var i;
    var pair;
    var pairs = coords.split(",");
    var esriPairs = '';
    for (var i = 0; i < pairs.length; i++) {
      pair = pairs[i].trim().split(" "); // TODO: now trims whitespaces from both ends of the string otherwise split on space fails, improve
      esriPairs += fn.concat('{"x": ',pair[0],', "y": ',pair[1],'},');
    }
    esriPairs = esriPairs.substr(0, esriPairs.length-1); // cut of last trailing comma
    let esriProjectService = "http://tasks.arcgisonline.com/arcgis/rest/services/Geometry/GeometryServer/project?";
    let esriSR = fn.concat("inSR=+",s_srs,"&outSR=",t_srs,"&geometries=");
    let esriGeometries = xdmp.urlEncode(fn.concat('{"geometryType":"esriGeometryPoint","geometries":[',esriPairs,']}'),false);
    let esriOptions = "&transformation=&transformForward=true&f=pjson";
    let esriRequest = fn.concat(esriProjectService,esriSR,esriGeometries,esriOptions);
    let esriResponse = fn.subsequence(xdmp.httpGet(esriRequest),2,1); // get second part of the response to only return body part, not headers
    return esriResponse;
  }

  function esriResponseToWKT(esriResponse) {
    // from Esri json response to LINESTRING format, can't get the code right in MarkLogic to do it the json/array way.
    // should be able to just get x and y values from geometries object, this is so q&d now...
    let coords = fn.substringBefore(fn.substringAfter(esriResponse,'"geometries": ['),']');
    coords = fn.replace(coords,"\\n","");
    coords = fn.replace(coords,"\\r","");
    coords = fn.replace(coords,"\\t","");
    coords = fn.replace(coords,"\\},","xxx");
    coords = fn.replace(coords,'\\{','');
    coords = fn.replace(coords,'"x": ','');
    coords = fn.replace(coords,'"y": ','');
    coords = fn.replace(coords,'\\}','');
    coords = fn.replace(coords,',',' ');
    coords = fn.replace(coords,'xxx',',');
    let reprojectedWkt = fn.concat("LINESTRING(",coords.trim(),")");
    return reprojectedWkt;
  }

  function GeoReproject()
  {
    this.addInput("srcCoordinateSystem");
    this.addInput("targetCoordinateSystem");
    this.addInput("strWKT");
    this.addOutput("strWKT");
  }

  GeoReproject.title = "GeoReproject";
  GeoReproject.desc = "Geo Reproject";

  GeoReproject.prototype.onExecute = function()
  {

    let srcCS = parseInt(this.getInputData(0))
    let tgtCS = parseInt(this.getInputData(1))
    let strWKT = this.getInputData(2)
    let result = wktReproject(srcCS,tgtCS,strWKT)
    this.setOutputData(0, result )

  }
  LiteGraph.registerNodeType("feature/GeoReproject", GeoReproject );


}



module.exports = {
  initUserBlocks:initUserBlocks
};
