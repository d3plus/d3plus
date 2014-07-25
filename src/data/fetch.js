//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Fetches specific years of data
//-------------------------------------------------------------------

d3plus.data.fetch = function( vars , years ) {

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
          vars.data.time.forEach(function( t ){
            if ( y(t) ) years.push( t )
          })
        }
        else years.push(y)

      })

      if ( key === "mute" ) {
        years = vars.data.time.filter(function( t ){
          return years.indexOf( t ) < 0
        })
      }

    }
    else years.push("all")

  }
  else {
    years = [ "all" ]
  }

  if (years.indexOf("all") >= 0 && vars.data.time.length) {
    years = vars.data.time
  }

  var cacheID = [ vars.type.value , vars.id.value , vars.depth.value ]
                  .concat( vars.data.filters )
                  .concat( years )
    , filter  = vars.data.solo.length ? "solo" : "mute"
    , cacheKeys = d3.keys(vars.data.cache)
    , dataFilter = vars.shell === "viz"
                 ? d3plus.visualization[vars.type.value].filter : null

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

    if ( typeof dataFilter === "function" ) {
      returnData = dataFilter( vars ,  returnData )
    }

    return returnData

  }
  else {

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // If there's no data, return an empty array!
    //--------------------------------------------------------------------------
    if ( !vars.data.value || !vars.data.value.length ) {
      var returnData = []
    }
    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // If there is only 1 year needed, just grab it!
    //--------------------------------------------------------------------------
    else if ( years.length === 1 ) {
      var returnData = vars.data.nested[ years[0] ][ vars.id.value ]
    }
    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Otherwise, we need to grab each year individually
    //--------------------------------------------------------------------------
    else {

      var missing = []
        , returnData = []

      years.forEach(function(y){
        if ( vars.data.nested[y] ) {
          returnData = returnData.concat( vars.data.nested[y][vars.id.value] )
        }
        else missing.push( y )
      })

      if ( returnData.length === 0 && missing.length && !vars.internal_error ) {

        var str = vars.format.locale.value.error.dataYear
          , and = vars.format.locale.value.ui.and
        missing = d3plus.string.list(missing,and)
        vars.internal_error = d3plus.string.format(str,missing)

      }
      else {

        var separated = false
        vars.axes.values.forEach(function(a){
          if ( vars[a].value === vars.time.value
          && vars[a].scale.value === "continuous" ) {
            separated = true
          }
        })

        if (!separated) {
          var nested = vars.id.nesting.slice(0,vars.depth.value+1)
          returnData = d3plus.data.nest( vars , returnData , nested )
        }

      }

    }

    if ( !returnData ) {
      returnData = []
    }
    else {

      returnData = d3plus.data.filter( vars , returnData )

    }

    var cacheKeys = d3.keys(vars.data.cache)
    if ( cacheKeys.length === 20 ) {
      cacheKeys.sort()
      delete vars.data.cache(cacheKeys[0])
    }

    cacheID = new Date().getTime() + "_" + cacheID
    vars.data.cache[cacheID] = returnData

    if ( typeof dataFilter === "function" ) {
      returnData = dataFilter( vars , returnData )
    }

    if ( vars.dev.value ) d3plus.console.comment("storing data in cache")

    return returnData

  }

}
