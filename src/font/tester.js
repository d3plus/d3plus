//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates test div to populate with test DIVs
//------------------------------------------------------------------------------
d3plus.font.tester = function() {

  var tester = d3.select("body").selectAll("div.d3plus_tester")
    .data(["d3plus_tester"])

  tester.enter().append("div")
    .attr("class","d3plus_tester")
    .style("position","absolute")
    .style("left","-9999px")
    .style("top","-9999px")
    .style("visibility","hidden")
    .style("display","block")

  return tester

}
