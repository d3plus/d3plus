var dataFilter = require("../data/filter.js"),
    dataNest     = require("../data/nest.js"),
    print        = require("../console/print.coffee"),
    stringFormat = require("../../string/format.js"),
    stringList   = require("../../string/list.coffee");

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Fetches specific years of data
//-------------------------------------------------------------------
module.exports = function(vars, years, depth) {

  if (!vars.data.value) return [];

  if (depth === undefined) depth = vars.depth.value;
  var nestLevel = vars.id.nesting[depth];

  if (years && !(years instanceof Array)) years = [years];

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // If "years" have not been requested, determine the years using .time()
  // solo and mute
  //----------------------------------------------------------------------------
  if (!years && "time" in vars) {

    years = [];

    var key = vars.time.solo.value.length ? "solo" : "mute",
        filterList = vars.time[key].value;

    if (filterList.length) {

      years = [];
      for (var yi = 0; yi < filterList.length; yi++) {
        var y = filterList[yi];

        if (typeof y === "function") {
          for (var ti = 0; ti < vars.data.time.values.length; ti++) {
            var ms = vars.data.time.values[ti].getTime();
            if (y(ms)) years.push(ms);
          }
        }
        else if (y.constructor === Date) {
          years.push(new Date(y).getTime());
        }
        else {
          y += "";
          if (y.length === 4 && parseInt(y)+"" === y) y = y + "/01/01";
          var d = new Date(y);
          if (d !== "Invalid Date") {
            // d.setTime(d.getTime() + d.getTimezoneOffset() * 60 * 1000);
            years.push(d.getTime());
          }
        }

      }

      if ( key === "mute" ) {
        years = vars.data.time.values.filter(function( t ){
          return years.indexOf(t.getTime()) < 0;
        });
      }

    }
    else years.push("all");

  }
  else {
    years = ["all"];
  }

  if (years.indexOf("all") >= 0 && vars.data.time.values.length) {
    years = vars.data.time.values.slice(0);
    for (var i = 0; i < years.length; i++) {
      years[i] = years[i].getTime();
    }
  }

  var cacheID = [ vars.type.value , nestLevel , depth ]
                  .concat( vars.data.filters )
                  .concat( years ),
      filter  = vars.data.solo.length ? "solo" : "mute",
      cacheKeys = d3.keys(vars.data.cache),
      vizFilter = vars.types[vars.type.value].filter || undefined;

  if ( vars.data[filter].length ) {
    for (var di = 0; di < vars.data[filter].length; di++) {
      var f = vars.data[filter][di];
      var vals = vars[f][filter].value.slice(0);
      vals.unshift(f);
      cacheID = cacheID.concat(vals);
    }
  }

  if (vars.axes && vars.axes.discrete) cacheID.push(vars.axes.discrete);

  cacheID = cacheID.join("_");
  vars.data.cacheID = cacheID;

  var match = false;

  for (var c = 0 ; c < cacheKeys.length ; c++) {

    var matchKey = cacheKeys[c].split("_").slice(1).join("_");

    if ( matchKey === cacheID ) {
      cacheID = new Date().getTime() + "_" + cacheID;
      vars.data.cache[cacheID] = vars.data.cache[cacheKeys[c]];
      delete vars.data.cache[cacheKeys[c]];
      break;
    }

  }

  var returnData;

  if ( vars.data.cache[cacheID] ) {

    if ( vars.dev.value ) print.comment("data already cached");

    returnData = vars.data.cache[cacheID].data;
    if ("nodes" in vars) {
      vars.nodes.restricted = vars.data.cache[cacheID].nodes;
      vars.edges.restricted = vars.data.cache[cacheID].edges;
    }

    if ( typeof vizFilter === "function" ) {
      returnData = vizFilter( vars ,  returnData );
    }

    return returnData;

  }
  else {

    var missing = [];
    returnData = [];

    if (vars.data.value && vars.data.value.length) {

      for (var yz = 0; yz < years.length; yz++) {
        var year = years[yz];
        if (vars.data.nested[year]) {
          returnData = returnData.concat(vars.data.nested[year][nestLevel]);
        }
        else {
          missing.push(year);
        }
      }

    }

    if (returnData.length === 0 && missing.length && !vars.error.internal) {

      if (missing.length > 1) {
        missing = d3.extent(missing);
      }

      missing = missing.map(function(m){
        return vars.data.time.format(new Date(m));
      });
      missing = missing.join(" - ");

      var str = vars.format.locale.value.error.dataYear,
          and = vars.format.locale.value.ui.and;
      missing = stringList(missing,and);
      vars.error.internal = stringFormat(str,missing);
      vars.time.missing = true;

    }
    else {

      if (vars.time) vars.time.missing = false;

      if ( years.length > 1 ) {

        var separated = false;
        ["x", "y", "x2", "y2"].forEach(function(a){
          if (vars[a].value === vars.time.value &&
              vars[a].scale.value === "discrete" ) {
            separated = true;
          }
        });

        if (!separated) {
          var nested = vars.id.nesting.slice(0,depth+1);
          returnData = dataNest(vars, returnData, nested);
        }

      }

      if (!returnData) {
        returnData = [];
      }
      else {
        returnData = dataFilter(vars, returnData);
      }

      if ( cacheKeys.length === 20 ) {
        cacheKeys.sort();
        delete vars.data.cache[cacheKeys[0]];
      }

      cacheID = new Date().getTime() + "_" + cacheID;
      vars.data.cache[cacheID] = {"data": returnData};
      if ("nodes" in vars) {
        vars.data.cache[cacheID].nodes = vars.nodes.restricted;
        vars.data.cache[cacheID].edges = vars.edges.restricted;
      }

      if ( typeof vizFilter === "function" ) {
        returnData = vizFilter( vars , returnData );
      }

      if ( vars.dev.value ) print.comment("storing data in cache");

    }

    return returnData;

  }

};
