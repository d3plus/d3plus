//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Updating Elements
//------------------------------------------------------------------------------
d3plus.draw.update = function(vars) {

  if (vars.timing.transitions) {

    // Update Parent Element
    vars.parent.transition().duration(vars.timing.transitions)
      .style("width",vars.width.value+"px")
      .style("height",vars.height.value+"px")

    // Update SVG
    vars.svg.transition().duration(vars.timing.transitions)
        .attr("width",vars.width.value)
        .attr("height",vars.height.value)

    // Update Background Rectangle
    vars.g.bg.transition().duration(vars.timing.transitions)
        .attr("width",vars.width.value)
        .attr("height",vars.height.value)

    // Update App Clipping Rectangle
    vars.g.clipping.select("rect").transition().duration(vars.timing.transitions)
      .attr("width",vars.width.viz)
      .attr("height",vars.height.viz)

    // Update Container Groups
    vars.g.container.transition().duration(vars.timing.transitions)
      .attr("transform","translate("+vars.margin.left+","+vars.margin.top+")")

  }
  else {

    // Update Parent Element
    vars.parent
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

    // Update App Clipping Rectangle
    vars.g.clipping.select("rect")
      .attr("width",vars.width.viz)
      .attr("height",vars.height.viz)

    // Update Container Groups
    vars.g.container
      .attr("transform","translate("+vars.margin.left+","+vars.margin.top+")")

  }

}
