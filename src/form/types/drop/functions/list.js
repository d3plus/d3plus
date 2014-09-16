var print = require("../../../../core/console/print.coffee")
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates and populates the dropdown list of items.
//------------------------------------------------------------------------------
module.exports = function ( vars ) {

  if ( vars.dev.value ) print.time("populating list")

  vars.container.list = vars.container.selector.selectAll("div.d3plus_drop_list")
    .data(["list"])

  vars.container.list.enter().append("div")
    .attr("class","d3plus_drop_list")
    .attr("id","d3plus_drop_list_"+vars.container.id)
    .style("overflow-y","auto")
    .style("overflow-x","hidden")

  if ( vars.dev.value ) print.timeEnd("populating list")

}
