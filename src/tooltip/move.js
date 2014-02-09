//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Set X and Y position for Tooltip
//-------------------------------------------------------------------

d3plus.tooltip.move = function(x,y,id) {
  
  if (!id) var tooltip = d3.select("div#d3plus_tooltip_id_default")
  else var tooltip = d3.select("div#d3plus_tooltip_id_"+id)
  
  if (tooltip.node()) {
    
    var d = tooltip.datum()
  
    d.cx = x
    d.cy = y
    
    if (!d.fixed) {

      // Set initial values, based off of anchor
      if (d.anchor.y != "center") {

        if (d.anchor.x == "right") {
          d.x = d.cx - d.arrow_offset - 4
        }
        else if (d.anchor.x == "center") {
          d.x = d.cx - d.width/2
        }
        else if (d.anchor.x == "left") {
          d.x = d.cx - d.width + d.arrow_offset + 2
        }

        // Determine whether or not to flip the tooltip
        if (d.anchor.y == "bottom") {
          d.flip = d.cy + d.height + d.offset <= d.limit[1]
        }
        else if (d.anchor.y == "top") {
          d.flip = d.cy - d.height - d.offset < 0
        }
        
        if (d.flip) {
          d.y = d.cy + d.offset + d.arrow_offset
        }
        else {
          d.y = d.cy - d.height - d.offset - d.arrow_offset
        }
    
      }
      else {

        d.y = d.cy - d.height/2
        
        // Determine whether or not to flip the tooltip
        if (d.anchor.x == "right") {
          d.flip = d.cx + d.width + d.offset <= d.limit[0]
        }
        else if (d.anchor.x == "left") {
          d.flip = d.cx - d.width - d.offset < 0
        }
    
        if (d.anchor.x == "center") {
          d.flip = false
          d.x = d.cx - d.width/2
        }
        else if (d.flip) {
          d.x = d.cx + d.offset + d.arrow_offset
        }
        else {
          d.x = d.cx - d.width - d.offset
        }
      }
  
      // Limit X to the bounds of the screen
      if (d.x < 0) {
        d.x = 0
      }
      else if (d.x + d.width > d.limit[0]) {
        d.x = d.limit[0] - d.width
      }
  
      // Limit Y to the bounds of the screen
      if (d.y < 0) {
        d.y = 0
      }
      else if (d.y + d.height > d.limit[1]) {
        d.y = d.limit[1] - d.height
      }
      
    }
    
    tooltip
      .style("top",d.y+"px")
      .style("left",d.x+"px")
  
    if (d.arrow) {
      tooltip.selectAll(".d3plus_tooltip_arrow")
        .call(d3plus.tooltip.arrow)
    }
    
  }
    
}
