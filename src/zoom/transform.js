d3plus.zoom.transform = function(vars,timing) {

  if (typeof timing != "number") {
    var timing = vars.timing
  }

  var translate = vars.zoom.translate,
      scale = vars.zoom.scale

  if (timing) {
    vars.g.viz.transition().duration(timing)
      .attr("transform","translate("+translate+")scale("+scale+")")

    vars.defs.selectAll("marker").selectAll("path")
      .transition().duration(timing)
      .attr("transform","scale("+1/scale+")")

  }
  else {

    vars.g.viz
      .attr("transform","translate("+translate+")scale("+scale+")")

    vars.defs.selectAll("marker").selectAll("path")
      .attr("transform","scale("+1/scale+")")
      
  }

}
