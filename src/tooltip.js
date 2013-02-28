//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Create a Tooltip
//-------------------------------------------------------------------

vizwhiz.tooltip.create = function(data) {
  
  var window_width = parseInt(data.svg.attr("width"),10),
      window_height = parseInt(data.svg.attr("height"),10),
      tooltip_width = data.width ? data.width : 200,
      tooltip_offset = data.offset ? data.offset : 0,
      outer_padding = 5,
      inner_padding = 10,
      triangle_size = data.arrow ? 20 : 0,
      stroke_width = 2;
      
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
      .attr("x",inner_padding+"px")
      .attr("y",inner_padding*0.75+"px")
      .attr("text-anchor","start")
      .attr("font-family","Helvetica")
      .each(function(dd){vizwhiz.utils.wordWrap(data.title,this,tooltip_width-(inner_padding*2),tooltip_width,false);})
      var y_offset = inner_padding + text.node().getBBox().height
  } else var y_offset = inner_padding
    
    
  if (data.description) {
    var text = group.append("text")
      .attr("fill","#333333")
      .attr("font-size","12px")
      .attr("text-anchor","start")
      .attr("font-family","Helvetica")
      .attr("x",inner_padding+"px")
      .attr("y",y_offset+"px")
      .style("font-weight","normal")
      .each(function(dd){vizwhiz.utils.wordWrap(data.description,this,tooltip_width-(inner_padding*2),tooltip_width,false);});
    y_offset += text.node().getBBox().height;
  }
  
  for (var d in data.data) {
    if (typeof data.data[d] == "number") var t = vizwhiz.utils.format_num(data.data[d])
    else var t = data.data[d]
    group.append("text")
      .attr("fill","#333333")
      .attr("font-size","12px")
      .style("font-weight","normal")
      .attr("x",inner_padding+"px")
      .attr("y",y_offset+"px")
      .attr("dy","12px")
      .attr("text-anchor","start")
      .attr("font-family","Helvetica")
      .text(d+":")
    var text = group.append("text")
      .attr("fill","#333333")
      .attr("font-size","12px")
      .style("font-weight","normal")
      .attr("x",tooltip_width-inner_padding+"px")
      .attr("y",y_offset+"px")
      .attr("dy","12px")
      .attr("text-anchor","end")
      .attr("font-family","Helvetica")
      .text(t)
    y_offset += text.node().getBBox().height;
  }
  
  if (data.appends) {
    if (data.appends.length > 0) y_offset += inner_padding
    var truncate = false;
    data.appends.forEach(function(a){
      if (a.append && !truncate) {
        var text = append(group,a);
        y_offset += text.node().getBBox().height;
        if (y_offset > window_height-(outer_padding*2)-(inner_padding*2)) {
          y_offset -= text.node().getBBox().height;
          text.remove()
          truncate = true;
        }
      }
    })
  }
  
  var box_height = y_offset+inner_padding
  
  if (data.y-tooltip_offset-outer_padding < box_height+triangle_size/2) {
    var tooltip_y = data.y+tooltip_offset+(triangle_size/2),
        triangle_y = 0,
        p = "M "+(-triangle_size/2)+" 0 L 0 "+(-triangle_size/2)+" L "+(triangle_size/2)+" 0";
    if (tooltip_y < outer_padding) tooltip_y = outer_padding;
  } else {
    var tooltip_y = data.y-tooltip_offset-box_height-(triangle_size/2),
        triangle_y = box_height,
        p = "M "+(-triangle_size/2)+" 0 L 0 "+(triangle_size/2)+" L "+(triangle_size/2)+" 0";
  }
  
  if (data.x-tooltip_offset-outer_padding < tooltip_width/2) var tooltip_x = outer_padding
  else if (data.x+tooltip_offset+outer_padding > window_width-(tooltip_width/2)) var tooltip_x = window_width-tooltip_width-outer_padding
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
    
  box.attr("height",box_height+"px")
  
  function append(parent,obj) {
    var obj_x = obj.x || obj.cx ? obj.x : inner_padding,
        obj_y = obj.y || obj.cy ? obj.y : y_offset
    var a = parent.append(obj.append)
    if (obj.append == "g") a.attr("transform","translate("+obj_x+","+obj_y+")")
    else if (obj.append == "circle") {
      if (!obj.cx) a.attr("cx",obj_x)
      if (!obj.cy) a.attr("cy",obj_y)
    }
    else {
      if (!obj.x) a.attr("x",obj_x)
      if (!obj.y) a.attr("y",obj_y)
    }
    for (var attr in obj) if (attr != "children" && attr != "events" && attr != "text") a[attr](obj[attr])
    if (obj.append == "text" && obj.text) a.each(function(dd){
      vizwhiz.utils.wordWrap(obj.text,this,tooltip_width-(inner_padding*2),tooltip_width,false);
    })
    if (obj.events) for (var evt in obj.events) a.on(evt,obj.events[evt])
    if (obj.children) obj.children.forEach(function(c){ var child = append(a,c); })
    return a;
  }

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
