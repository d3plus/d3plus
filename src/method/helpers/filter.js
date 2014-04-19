//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Create dummy methods to catch deprecates
//--------------------------------------------------------------------------
d3plus.method.filter = function( global ) {

  var global = global || false

  return {
    "accepted" : [ Array , Boolean , Function , Object , String ],
    "global"   : global,
    "process"  : Array,
    "value"    : [ ]
  }

}
