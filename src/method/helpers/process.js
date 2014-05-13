//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Process object's value
//--------------------------------------------------------------------------
d3plus.method.process = function( object , value ) {

  if ( object.process === Array ) {
    return d3plus.array.update(object.value,value)
  }
  else if ( typeof object.process === "object" && typeof value === "string" ) {
    return object.process[value]
  }
  else if ( typeof object.process === "function" ) {
    return object.process(value)
  }
  else {
    return value
  }

}
