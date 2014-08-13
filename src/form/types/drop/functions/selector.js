//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates and styles the div that holds the search box and item list.
//------------------------------------------------------------------------------
module.exports = function ( vars ) {

  vars.container.selector = vars.container.ui
    .selectAll("div.d3plus_drop_selector")
    .data(["selector"])

  vars.container.selector.enter().append("div")
    .attr("class","d3plus_drop_selector")
    .style("position","absolute")
    .style("top","0px")
    .style("z-index","-1")
    .style("overflow","hidden")

    vars.container.selector
      .style("padding",vars.ui.border+"px")

}
