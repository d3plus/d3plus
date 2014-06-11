//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Flows the text into the container
//------------------------------------------------------------------------------
d3plus.textwrap.flow = function( vars ) {

  if ( vars.text.html.value ) {
    this.foreign( vars )
  }
  else {
    this.tspan( vars )
  }

}
