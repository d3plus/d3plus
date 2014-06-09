//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates test div to populate with test DIVs
//------------------------------------------------------------------------------
d3plus.font.tester = function( type ) {

  if ( [ "div" , "svg" ].indexOf(type) < 0 ) var type = "div"

  var tester = d3.select("body").selectAll(type+".d3plus_tester")
    .data(["d3plus_tester"])

  tester.enter().append(type)
    .attr("class","d3plus_tester")
    .style("position","absolute")
    .style("left","-9999px")
    .style("top","-9999px")
    .style("visibility","hidden")
    .style("display","block")

  return tester

}
