//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Fetches text if not specified, and formats text to array.
//------------------------------------------------------------------------------
d3plus.textwrap.getSize = function( vars ) {

  var size = vars.container.value.attr("font-size")
             || vars.container.value.style("font-size")

  if ( !vars.size.value ) {

    size = parseFloat( size , 10 )

    if ( vars.resize.value ) {
      vars.self.size( [ size , size*2 ] )
    }
    else {
      vars.self.size( [ size/2 , size ] )
    }

  }

  vars.container.fontSize = size

}
