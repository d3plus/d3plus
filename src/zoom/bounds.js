d3plus.zoom.bounds = function(vars,b) {
  
  vars.viewport = b
  
  var aspect = Math.max((b[1][0]-b[0][0])/vars.app_width, (b[1][1]-b[0][1])/vars.app_height)
  
  vars.zoom.scale = .95 / aspect
  
  vars.zoom.translate = [
    -(b[1][0] + b[0][0]) / 2,
    -(b[1][1] + b[0][1]) / 2
  ]
      
  vars.g.zoom
    .attr("transform","translate(" + [vars.app_width/2,vars.app_height/2] + ")"
      + "scale(" + vars.zoom.scale + ")"
      + "translate(" + vars.zoom.translate[0] + "," + vars.zoom.translate[1] + ")")
      
}
