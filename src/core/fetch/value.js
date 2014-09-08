//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Finds a given variable by searching through the data and attrs
//------------------------------------------------------------------------------
module.exports = function( vars , id , variable , id_var , agg ) {

  if ( variable && typeof variable === "function" ) {
    return variable( id )
  }
  else if ( variable && typeof variable === "number" ) {
    return variable
  }
  else if ( !variable ) {
    return null
  }

  if (!id_var) {
    if ( d3plus.object.validate(variable) ) {
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
    if ( d3plus.object.validate(id) && variable in id ) {
      return id[variable]
    }
    else if ( !(id instanceof Array) ) {
      return id
    }
  }

  function filterArray( arr ) {

    if ( id instanceof Array ) {
      var uniques = d3plus.util.uniques( id , id_var )
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

  if ( d3plus.object.validate(id) && variable in id ) {
    return id[variable]
  }
  else {

    function checkData( data ) {
      var vals = d3plus.util.uniques( data , variable )
      if ( vals.length === 1 ) return vals[0]
    }

    if ( d3plus.object.validate(id) && id_var in id ) {
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

  if ( d3plus.object.validate(attr) ) {

    var newAttr = []

    if ( id instanceof Array ) {
      if (d3plus.object.validate(id[0])) id = d3plus.util.uniques(id,id_var)
      id.forEach(function(d){
        newAttr.push(attr[d])
      })
    }
    else newAttr.push(attr[id])

    attr = newAttr

  }

  if ( attr && attr.length ) {
    var vals = d3plus.util.uniques( attr , variable )
    if ( vals.length === 1 ) return vals[0]
    else if (vals.length) return vals

  }

  return null

}
