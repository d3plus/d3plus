//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Sets label opacity based on zoom
//------------------------------------------------------------------------------
d3plus.zoom.labels = function(vars) {

  var max_scale = vars.zoom_behavior.scaleExtent()[1]

  if (vars.timing) {

    vars.g.viz.selectAll("text.d3plus_label")
      .transition().duration(vars.timing)
      .attr("opacity",function(d){
        if (!d) var d = {}
        var size = parseFloat(d3.select(this).attr("font-size"),10)
        d.visible = size/max_scale*vars.zoom.scale >= 9
        return d.visible ? 1 : 0
      })

  }
  else {

    vars.g.viz.selectAll("text.d3plus_label")
      .attr("opacity",function(d){
        if (!d) var d = {}
        var size = parseFloat(d3.select(this).attr("font-size"),10)
        d.visible = size/max_scale*vars.zoom.scale >= 9
        return d.visible ? 1 : 0
      })

  }

}
