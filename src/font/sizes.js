//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates test div to populate with test DIVs
//------------------------------------------------------------------------------
d3plus.font.sizes = function( words , style , parent ) {

  var tester = parent || d3plus.font.tester("svg").append("text")
    , style  = style || {}
    , sizes  = []

  if ( !(words instanceof Array) ) {
    words = [words]
  }

  var tspans = tester.selectAll("tspan.d3plus_testFontSize")
    .data(words)

  tspans.enter().append("tspan")
    .attr("class","d3plus_testFontSize")
    .text(String)
    .style(style)
    .attr("x",0)
    .attr("y",0)
    .each(function(d){

      sizes.push({
        "height" : this.offsetHeight || this.getBoundingClientRect().height,
        "text"   : d,
        "width"  : this.getComputedTextLength()
      })

    })

  tspans.remove()

  if ( !tester ) {
    tester.remove()
  }

  return sizes

}
