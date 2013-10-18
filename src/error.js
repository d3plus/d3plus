d3plus.error = function(vars) {
  
  var error = d3.select("g.parent").selectAll("g.d3plus-error")
    .data([vars.error])
    
  error.enter().append("g")
    .attr("class","d3plus-error")
    .attr("opacity",0)
    .append("text")
      .attr("x",vars.svg_width/2)
      .attr("font-size","30px")
      .attr("fill","#888")
      .attr("text-anchor", "middle")
      .attr("font-family", vars.font)
      .style("font-weight", vars.font_weight)
      .style(vars.info_style)
      .each(function(d){
        d3plus.utils.wordwrap({
          "text": d,
          "parent": this,
          "width": vars.svg_width-20,
          "height": vars.svg_height-20,
          "resize": false
        })
      })
      .attr("y",function(){
        var height = d3.select(this).node().getBBox().height
        return vars.svg_height/2-height/2
      })
      
  error.transition().duration(d3plus.timing)
    .attr("opacity",1)
      
  error.select("text").transition().duration(d3plus.timing)
    .attr("x",vars.svg_width/2)
    .each(function(d){
      d3plus.utils.wordwrap({
        "text": d,
        "parent": this,
        "width": vars.svg_width-20,
        "height": vars.svg_height-20,
        "resize": false
      })
    })
    .attr("y",function(){
      var height = d3.select(this).node().getBBox().height
      return vars.svg_height/2-height/2
    })
      
  error.exit().transition().duration(d3plus.timing)
    .attr("opacity",0)
    .remove()
  
}
