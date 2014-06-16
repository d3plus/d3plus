//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Checks width and height, and gets it if needed.
//------------------------------------------------------------------------------
d3plus.textwrap.getDimensions = function( vars ) {

  if ( !vars.width.value || !vars.height.value ) {

    var parent = d3.select(vars.container.value.node().parentNode)
      , rect   = parent.select("rect")
      , circle = parent.select("circle")

    if ( !rect.empty() ) {

      if ( !vars.width.value ) {
        var width = rect.attr("width") || rect.style("width")
        vars.self.width( parseFloat( width , 10 ) )
      }
      if ( !vars.height.value ) {
        var height = rect.attr("height") || rect.style("height")
        vars.self.height( parseFloat( height , 10 ) )
      }

    }
    else if ( !circle.empty() ) {

      var radius = circle.attr("r")

      if ( !vars.width.value ) {
        vars.self.width( parseFloat( radius * 2 , 10 ) )
      }
      if ( !vars.height.value ) {
        vars.self.height( parseFloat( radius * 2 , 10 ) )
      }

    }
    else {

      if ( !vars.width.value ) {
        vars.self.width(500)
      }
      if ( !vars.height.value ) {
        vars.self.height(500)
      }

    }
  }

}
