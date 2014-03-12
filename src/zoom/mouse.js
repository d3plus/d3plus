d3plus.zoom.mouse = function(vars) {

  var translate = d3.event.translate,
      scale = d3.event.scale
      
  // console.log(translate)
  // Auto center visualization
  if (translate[0] > 0) {
    translate[0] = 0
  }
  else if (translate[0] < -((vars.app_width*scale)-vars.app_width)) {
    translate[0] = -((vars.app_width*scale)-vars.app_width)
  }
  if (translate[1] > 0) {
    translate[1] = 0
  }
  else if (translate[1] < -((vars.app_height*scale)-vars.app_height)) {
    translate[1] = -((vars.app_height*scale)-vars.app_height)
  }

  vars.zoom_behavior.translate(translate).scale(scale)

  vars.g.viz.attr("transform","translate("+translate+")scale("+scale+")")

}
