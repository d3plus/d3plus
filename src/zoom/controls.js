d3plus.zoom.controls = function() {
  d3.select("#d3plus.utilsts.zoom_controls").remove()
  if (!vars.small) {
    // Create Zoom Controls
    var zoom_enter = vars.parent.append("div")
      .attr("id","d3plus.utilsts.zoom_controls")
      .style("top",(vars.margin.top+5)+"px")
  
    zoom_enter.append("div")
      .attr("id","zoom_in")
      .attr("unselectable","on")
      .on(d3plus.evt.click,function(){ vars.zoom("in") })
      .text("+")
  
    zoom_enter.append("div")
      .attr("id","zoom_out")
      .attr("unselectable","on")
      .on(d3plus.evt.click,function(){ vars.zoom("out") })
      .text("-")
  
    zoom_enter.append("div")
      .attr("id","zoom_reset")
      .attr("unselectable","on")
      .on(d3plus.evt.click,function(){ 
        vars.zoom("reset") 
        vars.draw.update()
      })
      .html("\&#8634;")
  }
}
