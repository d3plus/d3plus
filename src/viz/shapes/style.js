//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Fill style for all shapes
//-------------------------------------------------------------------
d3plus.shape.style = function(nodes,vars) {

  nodes
    .attr("fill",function(d){

      if (d.d3plus && d.d3plus.spline) {
        return "none"
      }
      else {
        return d3plus.shape.color(d,vars)
      }

    })
    .style("stroke", function(d){
      if (d.values) {
        var color = d3plus.shape.color(d.values[0],vars)
      }
      else {
        var color = d3plus.shape.color(d,vars)
      }
      return d3.rgb(color).darker(0.5)
    })
    .style("stroke-width",function(d){
      var mod = d.d3plus.shapeType === "line" ? 2 : 1
      return vars.data.stroke.width * mod
    })
    .attr("opacity",vars.data.opacity)
    .attr("vector-effect","non-scaling-stroke")

}
