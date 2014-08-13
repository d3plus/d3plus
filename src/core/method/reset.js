//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Resets certain keys in global variables.
//-------------------------------------------------------------------
var reset = function( obj , method ) {

  if ( obj.changed ) {
    obj.changed = false
  }

  if ( method === "draw" ) {
    obj.frozen = false
    obj.update = true
    obj.first = false
  }

  for ( var o in obj ) {

    if ( d3plus.object.validate( obj[o] ) ) {

      reset( obj[o] , o )

    }

  }

}

module.exports = reset
