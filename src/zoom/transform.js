d3plus.zoom.transform = function(vars,timing) {

  if (typeof timing != "number") {
    var timing = vars.timing.transitions
  }

  var translate = vars.zoom.translate
    , scale = vars.zoom.scale

  if (timing) {
    vars.g.viz.transition().duration(timing)
      .attr("transform","translate("+translate+")scale("+scale+")")

  }
  else {

    vars.g.viz
      .attr("transform","translate("+translate+")scale("+scale+")")

  }

}
