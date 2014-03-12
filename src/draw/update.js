//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Updating Elements
//------------------------------------------------------------------------------
d3plus.draw.update = function(vars) {

  if (vars.timing) {

    // Update Parent Element
    vars.parent.transition().duration(vars.timing)
      .style("width",vars.width.value+"px")
      .style("height",vars.height.value+"px")

    // Update SVG
    vars.svg.transition().duration(vars.timing)
        .attr("width",vars.width.value)
        .attr("height",vars.height.value)

    // Update Background Rectangle
    vars.g.bg.transition().duration(vars.timing)
        .attr("width",vars.width.value)
        .attr("height",vars.height.value)

    // Update App Clipping Rectangle
    vars.g.clipping.select("rect").transition().duration(vars.timing)
      .attr("width",vars.app_width)
      .attr("height",vars.app_height)

    // Update Container Groups
    vars.g.container.transition().duration(vars.timing)
      .attr("transform","translate("+vars.margin.left+","+vars.margin.top+")")

    // Update Container Overlay
    vars.g.overlay.transition().duration(vars.timing)
        .attr("width",vars.width.value)
        .attr("height",vars.height.value)

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
      .attr("width",vars.app_width)
      .attr("height",vars.app_height)

    // Update Container Groups
    vars.g.container
      .attr("transform","translate("+vars.margin.left+","+vars.margin.top+")")

    // Update Container Overlay
    vars.g.overlay
      .attr("width",vars.width.value)
      .attr("height",vars.height.value)

  }

  // Call zoom on zoom group if applicable
  if (d3plus.apps[vars.type.value].zoom) {
    vars.g.zoom
      .datum(vars)
      .call(vars.zoom_behavior.on("zoom",d3plus.zoom.mouse))
  }
  else {
    vars.g.zoom
      .call(vars.zoom_behavior.on("zoom",null))
  }

}
