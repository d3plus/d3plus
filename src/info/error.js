//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates Error Message
//-------------------------------------------------------------------

d3plus.info.error = function(vars) {
  
  var error = vars.svg.selectAll("g#error")
    .data(["error"])
    
  error.enter().append("g")
    .attr("id","error")
    .attr("opacity",0)
    .append("text")
      .attr("x",vars.width.value/2)
      .attr("font-size","30px")
      .attr("fill","#888")
      .attr("text-anchor", "middle")
      .attr("font-family", vars.style.font.family)
      .style("font-weight", vars.style.font.weight)
      .style(vars.style.info)
      .attr("y",function(){
        var height = d3.select(this).node().getBBox().height
        return vars.height.value/2-height/2
      })
      
  error.transition().duration(vars.style.timing.transitions)
    .attr("opacity",1)
      
  error.select("text").transition().duration(vars.style.timing.transitions)
    .attr("x",vars.width.value/2)
    .each(function(d){
      if (vars.internal_error) {
        d3plus.utils.wordwrap({
          "text": vars.format(vars.internal_error,"error"),
          "parent": this,
          "width": vars.width.value-20,
          "height": vars.height.value-20,
          "resize": false
        })
      }
    })
    .attr("y",function(){
      var height = d3.select(this).node().getBBox().height
      return vars.height.value/2-height/2
    })
    .attr("opacity",function(){
      return vars.internal_error ? 1 : 0
    })
  
}
