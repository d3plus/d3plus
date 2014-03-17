d3plus.zoom.bounds = function(vars,b,timing) {

  if (!b) {
    var b = vars.zoom.bounds
  }

  if (typeof timing != "number") {
    var timing = vars.style.timing.transitions
  }

  vars.zoom.size = {
    "height": b[1][1]-b[0][1],
    "width": b[1][0]-b[0][0]
  }

  var fit = vars.coords.fit.value
  if (fit == "auto") {
    var aspect = d3.max([vars.zoom.size.width/vars.app_width,vars.zoom.size.height/vars.app_height])
  }
  else {
    var aspect = vars.zoom.size[fit]/vars["app_"+fit]
  }

  var min = d3.min([vars.app_width,vars.app_height])

  var scale = ((min-(vars.coords.padding*2)) / min) / aspect,
      max_scale = vars.zoom_behavior.scaleExtent()[1]
  if (scale > max_scale) {
    scale = max_scale
  }
  vars.zoom.scale = scale

  var translate = []

  translate[0] = vars.app_width/2-(vars.zoom.size.width*scale)/2-(b[0][0]*scale)
  translate[1] = vars.app_height/2-(vars.zoom.size.height*scale)/2-(b[0][1]*scale)

  vars.zoom.translate = translate
  vars.zoom_behavior.translate(translate).scale(scale)

  if (!vars.zoom.viewport) {
    vars.zoom_behavior.scaleExtent([scale,scale*8])
  }

  vars.zoom.viewport = b
  vars.zoom.size = {
    "height": vars.zoom.bounds[1][1]-vars.zoom.bounds[0][1],
    "width": vars.zoom.bounds[1][0]-vars.zoom.bounds[0][0]
  }
  
  if (timing) {
    vars.g.viz.transition().duration(timing)
      .attr("transform","translate("+translate+")scale("+scale+")")

    vars.defs.selectAll("marker").selectAll("path")
      .transition().duration(timing)
      .attr("transform","scale("+1/scale+")")

  }
  else {
    vars.g.viz.attr("transform","translate("+translate+")scale("+scale+")")
    vars.defs.selectAll("marker").selectAll("path").attr("transform","scale("+1/scale+")")
  }

}
