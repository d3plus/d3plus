var dataFilter = require("../data/filter.js"),
    dataNest = require("../data/nest.js")
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Fetches specific years of data
//-------------------------------------------------------------------
module.exports = function( vars , years ) {

  if (!vars.data.value) return []

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // If "years" have not been requested, determine the years using .time()
  // solo and mute
  //----------------------------------------------------------------------------
  if ( !years && "time" in vars ) {

    var key   = vars.time.solo.value.length ? "solo" : "mute"
      , years = []

    if ( vars.time[key].value.length ) {

      var years = []
      vars.time[key].value.forEach(function( y ){
        if ( typeof y === "function" ) {
          vars.data.time.values.forEach(function( t ){
            if ( y(t.getTime()) ) years.push( t.getTime() )
          })
        }
        else if ( y.constructor === Date ) {
          years.push(new Date(y).getTime())
        }
        else {
          var d = new Date(y.toString())
          if (d !== "Invalid Date") {
            d.setTime( d.getTime() + d.getTimezoneOffset() * 60 * 1000 )
            years.push(d.getTime())
          }
        }

      })

      if ( key === "mute" ) {
        years = vars.data.time.values.filter(function( t ){
          return years.indexOf( t.getTime() ) < 0
        })
      }

    }
    else years.push("all")

  }
  else {
    years = [ "all" ]
  }

  if (years.indexOf("all") >= 0 && vars.data.time.values.length) {
    years = vars.data.time.values.slice(0)
    for (var i = 0; i < years.length; i++) {
      years[i] = years[i].getTime()
    }
  }

  var cacheID = [ vars.type.value , vars.id.value , vars.depth.value ]
                  .concat( vars.data.filters )
                  .concat( years )
    , filter  = vars.data.solo.length ? "solo" : "mute"
    , cacheKeys = d3.keys(vars.data.cache)
    , vizFilter = vars.shell === "viz"
                 ? vars.types[vars.type.value].filter : null

  if ( vars.data[filter].length ) {
    vars.data[filter].forEach(function(f){
      var vals = vars[f][filter].value.slice(0)
      vals.unshift(f)
      cacheID = cacheID.concat(vals)
    })
  }

  cacheID = cacheID.join("_")

  var match = false

  for ( var i = 0 ; i < cacheKeys.length ; i++ ) {

    var matchKey = cacheKeys[i].split("_").slice(1).join("_")

    if ( matchKey === cacheID ) {
      cacheID = new Date().getTime() + "_" + cacheID
      vars.data.cache[cacheID] = vars.data.cache[cacheKeys[i]]
      delete vars.data.cache[cacheKeys[i]]
      break
    }

  }

  if ( vars.data.cache[cacheID] ) {

    if ( vars.dev.value ) d3plus.console.comment("data already cached")

    var returnData = vars.data.cache[cacheID]

    if ( typeof vizFilter === "function" ) {
      returnData = vizFilter( vars ,  returnData )
    }

    return returnData

  }
  else {

    var missing = []
      , returnData = []

    if ( vars.data.value && vars.data.value.length ) {

      years.forEach(function(y){
        if ( vars.data.nested[y] ) {
          returnData = returnData.concat( vars.data.nested[y][vars.id.value] )
        }
        else missing.push( y )
      })

    }

    if ( returnData.length === 0 && missing.length && !vars.internal_error ) {

      var format = vars.time.format.value || vars.data.time.format

      if (missing.length > 1) {
        missing = d3.extent(missing)
      }

      missing = missing.map(function(m){
        return format(new Date(m))
      })
      missing = missing.join(" - ")

      var str = vars.format.locale.value.error.dataYear
        , and = vars.format.locale.value.ui.and
      missing = d3plus.string.list(missing,and)
      vars.internal_error = d3plus.string.format(str,missing)
      vars.time.missing = true

    }
    else {

      if (vars.time) vars.time.missing = false

      if ( years.length > 1 ) {

        var separated = false
        vars.axes.values.forEach(function(a){
          if ( vars[a].value === vars.time.value
          && vars[a].scale.value === "continuous" ) {
            separated = true
          }
        })

        if (!separated) {
          var nested = vars.id.nesting.slice(0,vars.depth.value+1)
          returnData = dataNest( vars , returnData , nested )
        }

      }

      if ( !returnData ) {
        returnData = []
      }
      else {

        returnData = dataFilter( vars , returnData )

      }

      var cacheKeys = d3.keys(vars.data.cache)
      if ( cacheKeys.length === 20 ) {
        cacheKeys.sort()
        delete vars.data.cache(cacheKeys[0])
      }

      cacheID = new Date().getTime() + "_" + cacheID
      vars.data.cache[cacheID] = returnData

      if ( typeof vizFilter === "function" ) {
        returnData = vizFilter( vars , returnData )
      }

      if ( vars.dev.value ) d3plus.console.comment("storing data in cache")

    }

    return returnData

  }

}
