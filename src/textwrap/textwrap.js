//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Word wraps SVG text
//------------------------------------------------------------------------------
d3plus.textwrap = function() {

  var vars = { "shell" : "textwrap" }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Main drawing function
  //----------------------------------------------------------------------------
  vars.self = function(selection) {

    selection.each(function() {

      d3plus.textwrap.getDimensions( vars )
      d3plus.textwrap.getSize( vars )

      if ( vars.size.value[0] <= vars.height.value ) {
        d3plus.textwrap.getText( vars )
        d3plus.textwrap.wrap( vars )
      }

    })

    return vars.self
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Define methods and expose public variables.
  //----------------------------------------------------------------------------
  var methods = [ "container" , "dev" , "draw" , "format" , "height"
                , "resize" , "text" , "shape" , "size" , "width" ]
  d3plus.method( vars , methods )

  return vars.self

}
