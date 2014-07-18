//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Checks to see if a given variable is allowed to be selected.
//------------------------------------------------------------------------------
module.exports = function ( vars , value , active ) {

  var ret = []
    , active = active || vars.active.value

  if ( active instanceof Array ) {

    for (var i = 0; i < active.length; i++) {
      ret.push(this(vars,value,active[i]))
    }

  }
  else {

    var t = typeof active

    if (t === "number") {
      ret.push(vars.depth.value === active)
    }
    else if (t === "function") {
      ret.push(active(value))
    }
    else {
      ret.push(value === active)
    }

  }

  return ret.indexOf(true) >= 0

}
