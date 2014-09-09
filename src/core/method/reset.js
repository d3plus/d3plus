var validObject = require("../../object/validate.coffee")

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Resets certain keys in global variables.
//-------------------------------------------------------------------
module.exports = function( obj , method ) {

  if ( obj.changed ) {
    obj.changed = false
  }

  if ( method === "draw" ) {
    obj.frozen = false
    obj.update = true
    obj.first = false
  }

  for ( var o in obj ) {

    if ( validObject( obj[o] ) ) {

      reset( obj[o] , o )

    }

  }

}
