//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Fill style for all shapes
//-------------------------------------------------------------------
d3plus.shape.style = function(nodes,vars) {

  nodes
    .style("fill",function(d){

      if (d.d3plus && d.d3plus.spline) {
        return "none"
      }
      else {
        return d3plus.shape.color(d,vars)
      }

    })
    .style("stroke", function(d){
      var color = d3plus.variable.color(vars,d)
      return d3plus.color.legible(color)
    })
    .style("stroke-width",vars.style.data.stroke.width)
    .attr("opacity",vars.style.data.opacity)
    .attr("vector-effect","non-scaling-stroke")

}
