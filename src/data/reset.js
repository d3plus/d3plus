//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Resets certain keys in global variables.
//-------------------------------------------------------------------
d3plus.data.reset = function( obj , method ) {

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

      d3plus.data.reset( obj[o] , o )

    }

  }

}
