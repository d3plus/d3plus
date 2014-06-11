//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Fetches text if not specified, and formats text to array.
//------------------------------------------------------------------------------
d3plus.textwrap.getSize = function( vars ) {

  var size = vars.container.value.attr("font-size")
             || vars.container.value.style("font-size")

  if ( vars.resize.value ) {
    vars.self.size( [ parseFloat( size , 10 ) , vars.size.value[1] ] )
  }
  else {
    vars.self.size( [ vars.size.value[0] , parseFloat( size , 10 ) ] )
  }

}
