//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Checks width and height, and gets it if needed.
//------------------------------------------------------------------------------
d3plus.textwrap.getDimensions = function( vars ) {

  if ( !vars.width.value || !vars.height.value ) {

    var rect = d3.select(vars.container.value.node().parentNode)
      .select("rect")

    if ( !rect.empty() ) {

      if ( !vars.width.value ) {
        var width = rect.attr("width") || rect.style("width")
        vars.self.width(parseFloat(width,10))
      }
      if ( !vars.height.value ) {
        var height = rect.attr("height") || rect.style("height")
        vars.self.height(parseFloat(height,10))
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
