//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Determines form type based on data length.
//------------------------------------------------------------------------------
d3plus.input.auto = function( vars ) {

  var dataLength = vars.data.value.length

  if ( dataLength == 1 ) {
    d3plus.input.button( vars )
  }
  else if ( dataLength < 5 ) {
    d3plus.input.radio( vars )
  }
  else {
    d3plus.input.drop( vars )
  }

}
