//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates test div to populate with test DIVs
//------------------------------------------------------------------------------
d3plus.font.sizes = function( words , style , parent ) {

  var tester = parent || d3plus.font.tester("svg").append("text")
    , style  = style || {}
    , sizes  = []

  var tspans = parent.selectAll("tspan.d3plus_testFontSize")
    .data(words)

  tspans.enter().append("tspan")
    .attr("class","d3plus_testFontSize")
    .text(String)
    .style(style)
    .attr("x",0)
    .attr("y",0)
    .each(function(d){

      sizes.push({
        "height" : this.offsetHeight,
        "text"   : d,
        "width"  : this.offsetWidth
      })

    })

  tspans.remove()

  if ( !parent ) {
    parent.remove()
  }

  return sizes

}
