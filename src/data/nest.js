//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Nests and groups the data.
//------------------------------------------------------------------------------
d3plus.data.nest = function( vars , flatData , nestingLevels , requirements ) {

  var nestedData   = d3.nest()
    , groupedData  = []
    , segments     = vars.shell === "viz"
                    ? [ "active" , "temp" , "total" ] : []
    , requirements = requirements instanceof Array ? requirements : vars.shell === "viz"
                   ? d3plus.visualization[vars.type.value].requirements : []
    , exceptions   = vars.shell === "viz"
                   ? [ vars.time.value , vars.icon.value ] : []
    , checkAxes    = function() {

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // If the visualization has method requirements, check to see if we need
      // to key the data by a continuous scale variable.
      //------------------------------------------------------------------------
      if ( requirements && requirements.length ) {

        vars.axes.values.forEach(function(axis){

          var axisKey = vars[axis].value

          if ( requirements.indexOf(axis) >= 0 && axisKey
               && vars[axis].scale.value === "continuous") {

            exceptions.push(axisKey)

            nestedData.key(function(d){
              return d3plus.variable.value( vars , d , axisKey )
            })

          }

        })

      }

    }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Loop through each nesting level.
  //----------------------------------------------------------------------------
  nestingLevels.forEach(function( level , i ){

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Create a nest key for the current level.
    //--------------------------------------------------------------------------
    nestedData
      .key(function(d){

        if ( typeof level === "function" ) {
          return level(d)
        }

        return d3plus.variable.value( vars , d , level )
      })

    checkAxes()

  })

  if ( !nestingLevels.length ) {

    nestedData
      .key(function(d){
        return true
      })

    checkAxes()
  }

  var i = nestingLevels.length ? nestingLevels.length - 1 : 0

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // If we're at the deepest level, create the rollup function.
  //----------------------------------------------------------------------------
  nestedData.rollup(function( leaves ) {

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // If there's only 1 leaf, and it's been processed, return it as-is.
    //--------------------------------------------------------------------------
    if ( leaves.length === 1 && ("d3plus" in leaves[0]) ) {
      var returnObj = leaves[0]
      returnObj.d3plus.depth = i
      groupedData.push(returnObj)
      return returnObj
    }

    if ( "size" in vars && vars.size.value && d3plus.util.uniques(leaves,vars.size.value).length ) {

      d3plus.array.sort( leaves , vars.size.value , "desc" , [] , vars )

    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Create the "d3plus" object for the return variable, starting with
    // just the current depth.
    //--------------------------------------------------------------------------
    var returnObj = {
      "d3plus": {
        "depth": i
      }
    }

    if ("d3plus" in leaves[0]) {

      if ("merged" in leaves[0].d3plus) returnObj.d3plus.merged = []

      leaves.forEach(function(l){
        if (l.d3plus.merged instanceof Array) {
          returnObj.d3plus.merged = returnObj.d3plus.merged.concat(l.d3plus.merged)
        }
        if (l.d3plus.text) returnObj.d3plus.text = l.d3plus.text
      })
    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Create a reference sum for the 3 different "segment" variables.
    //--------------------------------------------------------------------------
    segments.forEach(function(c){

      var key = vars[c].value || c

      returnObj.d3plus[key] = d3.sum(leaves, function( d ) {

        if ( vars[c].value ) {

          var a = d3plus.variable.value(vars,d,vars[c].value)

          if ( typeof a !== "number" ) {
            a = a ? 1 : 0
          }

        }
        else if ( c === "total" ) {
          var a = 1
        }
        else {
          var a = 0
        }

        return a

      })

    })

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Aggregate all values detected in the data.
    //--------------------------------------------------------------------------
    for ( var key in vars.data.keys ) {

      var agg     = vars.aggs.value[key] || "sum"
        , aggType = typeof agg
        , keyType = vars.data.keys[key]
        , idKey   = vars.id.nesting.indexOf(key) >= 0
        , timeKey = "time" in vars && key === vars.time.value

      if ( key in returnObj.d3plus ) {

        returnObj[key] = returnObj.d3plus[key]

      }
      else if ( aggType === "function" ) {

        returnObj[key] = vars.aggs.value[key](leaves)

      }
      else if ( keyType === "number" && aggType === "string" && !idKey && !timeKey ) {

        returnObj[key] = d3[agg]( leaves , function(d){
          return key in d ? d[key] : false
        })

      }
      else {

        var keyValues = leaves.length === 1 ? leaves[0][key]
                      : d3plus.util.uniques( leaves , key )

        if ( keyValues instanceof Array && typeof keyValues[0] === "string" && keyValues[0].indexOf("[object Object]") === 0) {
          var vals = []
          leaves.forEach(function(d){
            vals = vals.concat(d[key])
          })
          var keyValues = d3plus.util.uniques(vals,key)
        }

        if ( keyValues !== undefined && keyValues !== null ) {

          if ( !(keyValues instanceof Array) ) {
            keyValues = [ keyValues ]
          }

          if ( keyValues.length ) {

            if ( keyValues.length <= leaves.length && idKey && vars.id.nesting.indexOf(key) > i && keyValues.length > 1 ) {

              returnObj[key] = leaves

            }
            else {

              returnObj[key] = keyValues.length === 1
                             ? keyValues[0] : keyValues

            }

          }

        }
        else if (idKey) {
          var endPoint = vars.id.nesting.indexOf(key) - 1
          if (endPoint >= i && (!("endPoint" in returnObj.d3plus) || returnObj.d3plus.endPoint > i)) {
            returnObj.d3plus.endPoint = i
          }
        }

      }

    }

    groupedData.push(returnObj)

    return returnObj

  })

  var rename_key_value = function(obj) {
    if (obj.values && obj.values.length) {
      obj.children = obj.values.map(function(obj) {
        return rename_key_value(obj);
      })
      delete obj.values
      return obj
    }
    else if(obj.values) {
      return obj.values
    }
    else {
      return obj;
    }
  }

  var find_keys = function(obj,depth,keys) {
    if (obj.children) {
      if (vars.data.keys[nestingLevels[depth]] == "number") {
        obj.key = parseFloat(obj.key)
      }
      keys[nestingLevels[depth]] = obj.key
      delete obj.key
      for ( var k in keys ) {
        obj[k] = keys[k]
      }
      depth++
      obj.children.forEach(function(c){
        find_keys(c,depth,keys)
      })
    }
  }

  nestedData = nestedData
    .entries(flatData)
    .map(rename_key_value)
    .map(function(obj){
      find_keys(obj,0,{})
      return obj
    })

  return groupedData

}
