//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Clones a variable
//------------------------------------------------------------------------------
d3plus.util.copy = function( variable ) {

  if ( d3plus.object.validate(variable) ) {
    return d3plus.object.merge(variable)
  }
  else if ( variable instanceof Array ) {

    var ret = []
    variable.forEach(function(o){
      ret.push(d3plus.util.copy(o))
    })
    return ret

  }
  else {
    return variable
  }

}
