//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Dynamic Tooltip
//-------------------------------------------------------------------

vizwhiz.tooltip.dynamic = function(g,w,data) {
  
  var width = 200,
      padding = 10,
      triangle_size = 20,
      stroke_width = 2,
      exclusions = ["x","y","offset","name"]
  
  var group = g.append("g")
  
  var box = group.append("rect")
    .attr("width",width+"px")
    .attr("ry","3")
    .attr("rx","3")
    .attr("fill","white")
    .attr("stroke","#cccccc")
    .attr("stroke-width",stroke_width)
  
  if (data.name) {
    var text = group.append("text")
      .attr("fill","#000000")
      .attr("font-size","16px")
      .style("font-weight","bold")
      .attr("x",padding+"px")
      .attr("y",padding*0.75+"px")
      .attr("text-anchor","start")
      .attr("font-family","Helvetica")
      .each(function(dd){vizwhiz.utils.wordWrap(data.name,this,width-(padding*2),width,false);})
  }
    
  var y_offset = padding + text.node().getBBox().height
  
  for (var d in data) {
    if (exclusions.indexOf(d) < 0) {
      if (typeof data[d] == "number") var t = d+": "+vizwhiz.utils.format_num(data[d])
      else var t = d+": "+data[d]
      text = group.append("text")
        .attr("fill","#333333")
        .attr("font-size","12px")
        .style("font-weight","normal")
        .attr("x",padding+"px")
        .attr("y",y_offset+"px")
        .attr("text-anchor","start")
        .attr("font-family","Helvetica")
        .each(function(dd){vizwhiz.utils.wordWrap(t,this,width-(padding*2),width,false);})
      y_offset += text.node().getBBox().height
    }
  }
  
  var box_height = y_offset+padding
  
  if (data.y-data.offset-padding < box_height+triangle_size/2) {
    var tooltip_y = data.y+data.offset+(triangle_size/2),
        triangle_y = 0,
        p = "M "+(-triangle_size/2)+" 0 L 0 "+(-triangle_size/2)+" L "+(triangle_size/2)+" 0";
  } else {
    var tooltip_y = data.y-data.offset-box_height-(triangle_size/2),
        triangle_y = box_height,
        p = "M "+(-triangle_size/2)+" 0 L 0 "+(triangle_size/2)+" L "+(triangle_size/2)+" 0";
  }
  
  if (data.x-data.offset-padding < width/2) var tooltip_x = padding
  else if (data.x+data.offset+padding > w-(width/2)) var tooltip_x = w-width-padding
  else var tooltip_x = data.x-(width/2)
  
  group.append("line")
    .attr("x1",(data.x-tooltip_x-triangle_size/2+1))
    .attr("x2",(data.x-tooltip_x+triangle_size/2-1))
    .attr("y1",triangle_y)
    .attr("y2",triangle_y)
    .attr("stroke-width",stroke_width*2)
    .attr("stroke","white")
    
  group.append("path")
    .attr("d",p)
    .attr("fill","white")
    .attr("stroke","#cccccc")
    .attr("stroke-width",stroke_width)
    .attr("transform","translate("+(data.x-tooltip_x)+","+triangle_y+")");
  
  group.attr("transform","translate("+tooltip_x+","+tooltip_y+")")
    
  box
    .attr("height",box_height+"px")

}

//===================================================================
