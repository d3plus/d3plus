d3plus.zoom.bounds = function(vars,b) {
  
  vars.viewport = b
  
  if (vars.coords.fit.value == "auto") {
    var aspect = Math.max((b[1][0]-b[0][0])/vars.app_width, (b[1][1]-b[0][1])/vars.app_height)
  }
  else {
    var w = vars.coords.fit.value == "width" ? b[1][0]-b[0][0] : b[1][1]-b[0][1],
        aspect = w/vars["app_"+vars.coords.fit.value]
  }
  
  var min = d3.min([vars.app_width,vars.app_height])
  
  vars.zoom.scale = ((min-(vars.coords.padding*2)) / min) / aspect
  
  var translate = [
    -(b[1][0] + b[0][0]) / 2,
    -(b[1][1] + b[0][1]) / 2
  ]
  
  vars.zoom.translate = translate
      
  vars.g.zoom
    .attr("transform","translate(" + [vars.app_width/2,vars.app_height/2] + ")"
      + "scale(" + vars.zoom.scale + ")"
      + "translate(" + vars.zoom.translate[0] + "," + vars.zoom.translate[1] + ")")
      
}
