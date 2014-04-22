//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Process object's value
//--------------------------------------------------------------------------
d3plus.method.process = function( object , value ) {

  if ( object.process === Array ) {
    object.value = d3plus.array.update(object.value,value)
  }
  else if ( typeof object.process === "object" ) {
    object.value = object.process[value]
  }
  else if ( typeof object.process === "function" ) {
    object.value = object.process(value)
  }
  else {
    object.value = value
  }

}
