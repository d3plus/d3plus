//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Sets label opacity based on zoom
//------------------------------------------------------------------------------
d3plus.zoom.labels = function(vars) {

  if (vars.timing) {

    vars.g.viz.selectAll("text.d3plus_label")
      .transition().duration(vars.timing)
      .attr("opacity",function(d){
        var size = parseFloat(d3.select(this).attr("font-size"),10)
        return size/vars.zoom_behavior.scaleExtent()[1]*vars.zoom.scale >= 9 ? 1 : 0
      })

  }
  else {

    vars.g.viz.selectAll("text.d3plus_label")
      .attr("opacity",function(d){
        var size = parseFloat(d3.select(this).attr("font-size"),10)
        return size/vars.zoom_behavior.scaleExtent()[1]*vars.zoom.scale >= 9 ? 1 : 0
      })

  }

}
