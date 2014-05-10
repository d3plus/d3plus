//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Checks to see if the passed object has keys and is not an array.
//------------------------------------------------------------------------------
d3plus.object.validate = function( obj ) {

  return obj !== null && typeof obj === "object" && !(obj instanceof Array)

}
