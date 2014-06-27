//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Determines form type based on data length.
//------------------------------------------------------------------------------
d3plus.input.auto = function( vars ) {

  var dataLength = vars.data.value.length

  if ( dataLength === 1 ) {
    vars.self.type("button").draw()
  }
  else if ( dataLength < 5 ) {
    vars.self.type("toggle").draw()
  }
  else {
    vars.self.type("drop").draw()
  }

}
