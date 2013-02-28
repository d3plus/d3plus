//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Create a Tooltip
//-------------------------------------------------------------------

vizwhiz.tooltip.create = function(params) {
  
  params.window_width = parseInt(params.svg.attr("width"),10);
  params.window_height = parseInt(params.svg.attr("height"),10);
  params.width = params.width ? params.width : 200;
  params.offset = params.offset ? params.offset : 0;
  params.margin = 5;
  params.padding = 10;
  params.triangle_size = params.arrow ? 20 : 0;
  params.stroke_width = 2;
  params.id = params.id ? params.id : "default";
  
  var group = params.svg.append("g")
    .datum(params)
    .attr("class","vizwhiz_tooltip")
    .attr("id",function(d){ return "vizwhiz_tooltip_"+d.id; })
  
  var box = group.append("rect")
    .attr("width",function(d){ return d.width+"px"; })
    .attr("ry","3")
    .attr("rx","3")
    .attr("fill","white")
    .attr("stroke","#cccccc")
    .attr("stroke-width",function(d){ return d.stroke_width; })
  
  if (params.title) {
    var text = group.append("text")
      .attr("fill","#000000")
      .attr("font-size","16px")
      .style("font-weight","bold")
      .attr("x",function(d){ return d.padding+"px"; })
      .attr("y",function(d){ return (d.padding*0.75)+"px"; })
      .attr("text-anchor","start")
      .attr("font-family","Helvetica")
      .each(function(d){
        vizwhiz.utils.wordwrap({
          "text": d.title,
          "parent": this,
          "width": d.width-(d.padding*2)
        });
      })
      var y_offset = params.padding+text.node().getBBox().height
  } else var y_offset = params.padding
    
    
  if (params.description) {
    var text = group.append("text")
      .attr("fill","#333333")
      .attr("font-size","12px")
      .attr("text-anchor","start")
      .attr("font-family","Helvetica")
      .attr("x",function(d){ return d.padding+"px"; })
      .attr("y",y_offset+"px")
      .style("font-weight","normal")
      .each(function(d){
        vizwhiz.utils.wordwrap({
          "text": d.description,
          "parent": this,
          "width": d.width-(d.padding*2)
        });
      });
    y_offset += text.node().getBBox().height;
  }
  
  for (var id in params.data) {
    group.append("text")
      .attr("fill","#333333")
      .attr("font-size","12px")
      .style("font-weight","normal")
      .attr("x",function(d){ return d.padding+"px"; })
      .attr("y",y_offset+"px")
      .attr("dy","12px")
      .attr("text-anchor","start")
      .attr("font-family","Helvetica")
      .text(id+":")
      
    if (typeof params.data[id] == "number") var t = vizwhiz.utils.format_num(params.data[id])
    else var t = params.data[id]
    
    var text = group.append("text")
      .attr("fill","#333333")
      .attr("font-size","12px")
      .style("font-weight","normal")
      .attr("x",function(d){ return d.width-d.padding+"px"; })
      .attr("y",y_offset+"px")
      .attr("dy","12px")
      .attr("text-anchor","end")
      .attr("font-family","Helvetica")
      .text(t)
    y_offset += text.node().getBBox().height;
  }
  
  if (params.appends) {
    if (params.appends.length > 0) y_offset += params.padding
    var truncate = false;
    params.appends.forEach(function(a){
      if (a.append && !truncate) {
        var text = append(group,a);
        y_offset += text.node().getBBox().height;
        if (y_offset > params.window_height-(params.margin*2)-(params.padding*2)) {
          y_offset -= text.node().getBBox().height;
          text.remove()
          truncate = true;
        }
      }
    })
  }
  
  var box_height = y_offset+params.padding
    
  box.attr("height",function(d){ 
    d.height = box_height;
    return d.height+"px";
  })
  
  if (params.arrow) {
    group.append("line")
      .attr("class","arrow_line")
      .attr("stroke-width",function(d){ return d.stroke_width*2; })
      .attr("stroke","white");
    
    group.append("path")
      .attr("class","arrow")
      .attr("fill","white")
      .attr("stroke","#cccccc")
      .attr("stroke-width",function(d){ return d.stroke_width; });
  }
  
  vizwhiz.tooltip.move(params.x,params.y,params.id);
  
  function append(parent,obj) {
    var obj_x = obj.x || obj.cx ? obj.x : params.padding,
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
      vizwhiz.utils.wordwrap({
        "text": obj.text,
        "parent": this,
        "width": params.width-(params.padding*2)
      });
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
  
  if (id) d3.select("g#vizwhiz_tooltip_"+id).remove();
  else d3.selectAll("g.vizwhiz_tooltip").remove();

}

//===================================================================

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Get X and Y position for Tooltip
//-------------------------------------------------------------------

vizwhiz.tooltip.move = function(x,y,id) {
  
  if (!id) var obj = d3.selectAll("g.vizwhiz_tooltip")
  else var obj = d3.selectAll("g#vizwhiz_tooltip_"+id)
  
  obj.attr("transform",function(d){
  
    if (y-d.offset-d.margin < d.height+d.triangle_size/2) {
      var tooltip_y = y+d.offset+(d.triangle_size/2),
          triangle_y = 0,
          p = "M "+(-d.triangle_size/2)+" 0 L 0 "+(-d.triangle_size/2)+" L "+(d.triangle_size/2)+" 0";
      if (tooltip_y < d.margin) tooltip_y = d.margin;
    } else {
      var tooltip_y = y-d.offset-d.height-(d.triangle_size/2),
          triangle_y = d.height,
          p = "M "+(-d.triangle_size/2)+" 0 L 0 "+(d.triangle_size/2)+" L "+(d.triangle_size/2)+" 0";
    }
  
    if (x-d.offset-d.margin < d.width/2) var tooltip_x = d.margin
    else if (x+d.offset+d.margin > d.window_width-(d.width/2)) var tooltip_x = d.window_width-d.width-d.margin
    else var tooltip_x = x-(d.width/2)
  
    if (d.arrow) {
      d3.select(this).select("line.arrow_line")
        .attr("x1",(x-tooltip_x-d.triangle_size/2+1))
        .attr("x2",(x-tooltip_x+d.triangle_size/2-1))
        .attr("y1",triangle_y)
        .attr("y2",triangle_y);
    

      d3.select(this).select("path.arrow").attr("d",p)
        .attr("transform","translate("+(x-tooltip_x)+","+triangle_y+")");
    }
    
    return "translate("+tooltip_x+","+tooltip_y+")";
  })

}

//===================================================================
