d3plus.zoom.mouse = function(vars) {

  var translate = d3.event.translate,
      scale = d3.event.scale

  vars.g.viz.attr("transform","translate("+translate+")scale("+scale+")")

}
