var print = require("../../../core/console/print.coffee")
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Updating Elements
//------------------------------------------------------------------------------
module.exports = function(vars) {

  if ( vars.dev.value ) print.time("updating SVG elements")

  if ( vars.draw.timing ) {

    // Update Parent Element
    vars.container.value.transition().duration(vars.draw.timing)
      .style("width",vars.width.value+"px")
      .style("height",vars.height.value+"px")

    // Update SVG
    vars.svg.transition().duration(vars.draw.timing)
        .attr("width",vars.width.value)
        .attr("height",vars.height.value)

    // Update Background Rectangle
    vars.g.bg.transition().duration(vars.draw.timing)
        .attr("width",vars.width.value)
        .attr("height",vars.height.value)
        .attr("fill",vars.background.value);

    // Update App Clipping Rectangle
    vars.g.clipping.select("rect").transition().duration(vars.draw.timing)
      .attr("width",vars.width.viz)
      .attr("height",vars.height.viz)

    // Update Container Groups
    vars.g.container.transition().duration(vars.draw.timing)
      .attr("transform","translate("+vars.margin.left+","+vars.margin.top+")")

  }
  else {

    // Update Parent Element
    vars.container.value
      .style("width",vars.width.value+"px")
      .style("height",vars.height.value+"px")

    // Update SVG
    vars.svg
      .attr("width",vars.width.value)
      .attr("height",vars.height.value)

    // Update Background Rectangle
    vars.g.bg
      .attr("width",vars.width.value)
      .attr("height",vars.height.value)
      .attr("fill",vars.background.value);

    // Update App Clipping Rectangle
    vars.g.clipping.select("rect")
      .attr("width",vars.width.viz)
      .attr("height",vars.height.viz)

    // Update Container Groups
    vars.g.container
      .attr("transform","translate("+vars.margin.left+","+vars.margin.top+")")

  }

  if ( vars.dev.value ) print.timeEnd("updating SVG elements")

}
