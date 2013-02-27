//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Create a Tooltip
//-------------------------------------------------------------------

vizwhiz.tooltip.create = function(data) {
  
  var tooltip_width = 200,
      window_width = parseInt(data.svg.attr("width"),10),
      padding = 10,
      triangle_size = 20,
      stroke_width = 2
      
  if (data.arrow) var triangle_size = 20
  else var triangle_size = 0
      
  var group = data.svg.append("g")
    .attr("class","vizwhiz_tooltip")
    
  if (data.id) group.attr("id","vizwhiz_tooltip_"+data.id)
  
  var box = group.append("rect")
    .attr("width",tooltip_width+"px")
    .attr("ry","3")
    .attr("rx","3")
    .attr("fill","white")
    .attr("stroke","#cccccc")
    .attr("stroke-width",stroke_width)
  
  if (data.title) {
    var text = group.append("text")
      .attr("fill","#000000")
      .attr("font-size","16px")
      .style("font-weight","bold")
      .attr("x",padding+"px")
      .attr("y",padding*0.75+"px")
      .attr("text-anchor","start")
      .attr("font-family","Helvetica")
      .each(function(dd){vizwhiz.utils.wordWrap(data.title,this,tooltip_width-(padding*2),tooltip_width,false);})
      var y_offset = padding + text.node().getBBox().height
  } else var y_offset = padding
    
  
  for (var d in data.data) {
    if (typeof data.data[d] == "number") var t = vizwhiz.utils.format_num(data.data[d])
    else var t = data.data[d]
    group.append("text")
      .attr("fill","#333333")
      .attr("font-size","12px")
      .style("font-weight","normal")
      .attr("x",padding+"px")
      .attr("y",y_offset+"px")
      .attr("dy","12px")
      .attr("text-anchor","start")
      .attr("font-family","Helvetica")
      .text(d+":")
    text = group.append("text")
      .attr("fill","#333333")
      .attr("font-size","12px")
      .style("font-weight","normal")
      .attr("x",tooltip_width-padding+"px")
      .attr("y",y_offset+"px")
      .attr("dy","12px")
      .attr("text-anchor","end")
      .attr("font-family","Helvetica")
      .text(t)
    y_offset += text.node().getBBox().height
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
  
  if (data.x-data.offset-padding < tooltip_width/2) var tooltip_x = padding
  else if (data.x+data.offset+padding > window_width-(tooltip_width/2)) var tooltip_x = window_width-tooltip_width-padding
  else var tooltip_x = data.x-(tooltip_width/2)
  
  if (data.arrow) {
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
  }
  
  group.attr("transform","translate("+tooltip_x+","+tooltip_y+")")
    
  box
    .attr("height",box_height+"px")

}

//===================================================================

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Destroy Tooltips
//-------------------------------------------------------------------

vizwhiz.tooltip.remove = function(id) {
  
  if (id) d3.select("g#vizwhiz_tooltip_"+id).remove()
  else d3.selectAll("g.vizwhiz_tooltip").remove()

}

//===================================================================
