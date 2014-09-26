var validObject = require("../../object/validate.coffee"),
    uniqueValues = require("../../util/uniques.coffee")

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Finds a given variable by searching through the data and attrs
//------------------------------------------------------------------------------
fetch = function( vars , id , variable , id_var , agg ) {

  if ( variable && typeof variable === "function" ) {
    return variable(id, vars)
  }
  else if ( variable && typeof variable === "number" ) {
    return variable
  }
  else if ( !variable ) {
    return null
  }

  if (!id_var) {
    if ( validObject(variable) ) {
      if (variable[vars.id.value]) {
        var id_var = vars.id.value
      }
      else {
        var id_var = d3.keys(variable)[0]
      }
      variable = variable[id_var]
    }
    else {
      var id_var = vars.id.value
    }
  }

  if ( variable === id_var ) {
    if ( validObject(id) && variable in id ) {
      return id[variable]
    }
    else if ( !(id instanceof Array) ) {
      return id
    }
  }

  function filterArray( arr ) {

    if ( id instanceof Array ) {
      var uniques = uniqueValues( id , id_var )
      return arr.filter(function(d){
        return uniques.indexOf(d[id_var]) >= 0
      })
    }
    else {
      return arr.filter(function(d){
        return d[id_var] === id
      })
    }

  }

  if ( validObject(id) && variable in id ) {
    return id[variable]
  }
  else {

    function checkData( data ) {
      var vals = uniqueValues( data , variable )
      if ( vals.length === 1 ) return vals[0]
    }

    if ( validObject(id) && id_var in id ) {
      var val = checkData( id )
      if ( val ) return val
      id = id[id_var]
    }

    if ( id instanceof Array ) {
      var val = checkData( id )
      if ( val ) return val
    }

    if ( vars.data.app instanceof Array ) {
      var val = checkData( filterArray( vars.data.app ) )
      if ( val ) return val
    }

  }

  if ( "attrs" in vars && vars.attrs.value ) {

    if ( vars.attrs.value instanceof Array ) {
      var attr = filterArray(vars.attrs.value)
    }
    else if ( id_var in vars.attrs.value ) {
      if ( vars.attrs.value[id_var] instanceof Array ) {
        var attr = filterArray(vars.attrs.value[id_var])
      }
      else {
        var attr = vars.attrs.value[id_var]
      }
    }
    else {
      var attr = vars.attrs.value
    }

  }

  if ( validObject(attr) ) {

    var newAttr = []

    if ( id instanceof Array ) {
      if (validObject(id[0])) id = uniqueValues(id,id_var)
      id.forEach(function(d){
        newAttr.push(attr[d])
      })
    }
    else newAttr.push(attr[id])

    attr = newAttr

  }

  if ( attr && attr.length ) {
    var vals = uniqueValues( attr , variable )
    if ( vals.length === 1 ) return vals[0]
    else if (vals.length) return vals

  }

  return null

}

module.exports = function( vars , id , variable , id_var , agg ) {

  if (validObject(id) && id.values instanceof Array) {
    var val = null
    for(var i = 0; i < id.values.length; i++) {
      val = fetch( vars , id.values[i] , variable , id_var , agg )
      if (val) break;
    }
    return val
  }
  else {
    return fetch( vars , id , variable , id_var , agg )
  }

}
