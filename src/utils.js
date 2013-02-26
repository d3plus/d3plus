//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Number formatter
//-------------------------------------------------------------------

vizwhiz.utils.format_num = function(val, percent, sig_figs, abbrv) {
  
  // test if number is REALLY small
  if(Math.abs(val - 1e-16) < 1e-10){
    val = 0;
  }
  
  if(percent){
    val = d3.format("."+sig_figs+"p")(val)
  }
  else if(abbrv){
    var symbol = d3.formatPrefix(val).symbol
    symbol = symbol.replace("G", "B") // d3 uses G for giga

    // Format number to precision level using proper scale
    val = d3.formatPrefix(val).scale(val)
    val = parseFloat(d3.format("."+sig_figs+"g")(val))
    val = val + " " + symbol;
  }
  else {
    val = d3.format(",."+sig_figs+"d")(val)
  }
  
  return val;
};

//===================================================================

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Random color generator (if no color is given)
//-------------------------------------------------------------------

vizwhiz.utils.color_scale = d3.scale.category20();
vizwhiz.utils.rand_color = function() {
  var rand_int = Math.floor(Math.random()*20)
  return vizwhiz.utils.color_scale(rand_int);
}

//===================================================================

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Merge two objects to create a new one with the properties of both
//-------------------------------------------------------------------

vizwhiz.utils.merge = function(obj1, obj2) {
  var obj3 = {};
  for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
  for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
  return obj3;
}

//===================================================================

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// recursive function to rename "values" to "children" and "key" to "id"
// src: https://groups.google.com/group/d3-js/tree/browse_frm/month/2011-11/a5dc689238c3a685
//-------------------------------------------------------------------

vizwhiz.utils.rename_key_value = function(obj) { 
  if (obj.values && obj.values.length) { 
    return { 
      'name': obj.key, 
      'id': obj.key, 
      'children': obj.values.map(function(obj) { 
        return vizwhiz.utils.rename_key_value(obj);
      }) 
    }; 
  } 
  else if(obj.values) { 
    return obj.values
  }
  else {
    return obj; 
  }
}

//===================================================================

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Merge two objects to create a new one with the properties of both
//-------------------------------------------------------------------

vizwhiz.utils.nest = function(flat_data, nesting, flatten, extra) {

  var flattened = [];
  var nested_data = d3.nest();
  
  nesting.forEach(function(nest_key, i){
    
    nested_data.key(function(d){
      return d[nest_key];
    })
    
    if(i == nesting.length-1){
      nested_data.rollup(function(leaves){
        if(leaves.length == 1){
          flattened.push(leaves[0]);
          return leaves[0]
        }
        // to_return = leaves[0]
        to_return = {
          "value": d3.sum(leaves, function(d){ return d.value; }),
          "name": leaves[0][nest_key],
          "num_children": leaves.length,
          "num_children_active": d3.sum(leaves, function(d){ return d.active; })
        }
        
        if(extra){
          extra.forEach(function(e){
            if(e.agg == "sum"){
              to_return[e.key] = d3.sum(leaves, function(d){ return d[e.key]; })
            }
            else if(e.agg == "avg"){
              to_return[e.key] = d3.mean(leaves, function(d){ return d[e.key]; })
            }
            else {
              to_return[e.key] = leaves[0][e.key];
            }
          })
        }
        
        if(flatten){
          nesting.forEach(function(nk){
            to_return[nk] = leaves[0][nk]
          })
          flattened.push(to_return);
        }
        
        return to_return
      })
    }
    
  })
    
  nested_data = nested_data
    .entries(flat_data)
    .map(vizwhiz.utils.rename_key_value);

  if(flatten){
    return flattened;
  }

  return {"name":"root", "children": nested_data};

}

//===================================================================

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// for SVGs word wrapping is not built in, so here we must creat this
// function ourselves
//-------------------------------------------------------------------

vizwhiz.utils.wordWrap = function(text, parent, width, height, resize) {
  
  var words = text.split(/[\s-]/),
      tspan,
      width = width*0.9, // width & height slightly smaller for buffer
      height = height*0.9;
  
  if (resize) {
    
    // default max and min font sizes
    var max_font_size = 40, min_font_size = 8;
    
    // base scaling on whichever is larger width or height
    var size = height
    if (width < height) {
      var size = width
    }
    
    d3.select(parent).attr('font-size',size)

    var text_width = 0
    for(var i=0; i<words.length; i++) {
      tspan = d3.select(parent).append('tspan')
        .attr('x',0)
        .attr('dx','0.15em')
        .text(words[i]+" ...")
        
      if (tspan.node().getComputedTextLength() > text_width) {
        text_width = tspan.node().getComputedTextLength()
      }
    }
  
    if (text_width > width) {
      size = size*(width/text_width)
    }
  
    if (size < min_font_size) {
      d3.select(parent).selectAll('tspan').remove()
      return
    } else if (size > max_font_size) size = max_font_size
    
    d3.select(parent).attr('font-size',size)
    
    flow()
    
    if (parent.childNodes.length*parent.getBBox().height > height) {
      var temp_size = size*(height/(parent.childNodes.length*parent.getBBox().height))
      if (temp_size < min_font_size) size = min_font_size
      else size = temp_size
      d3.select(parent).attr('font-size',size)
    }
    
  }
  
  flow()
  truncate()
  d3.select(parent).selectAll('tspan').attr("dy", d3.select(parent).style('font-size'))
  
  function flow() {
    
    d3.select(parent).selectAll('tspan').remove()
    
    var tspan = d3.select(parent).append('tspan')
      .attr('x',parent.getAttribute('x'))
      .text(words[0])

    for (var i=1; i<words.length; i++) {
        
      tspan.text(tspan.text()+" "+words[i])
      
      if (tspan.node().getComputedTextLength() > width) {
            
        tspan.text(tspan.text().substr(0,tspan.text().lastIndexOf(" ")))
    
        tspan = d3.select(parent).append('tspan')
          .attr('x',parent.getAttribute('x'))
          .text(words[i])
            
      }
    }
  
  }
  
  function truncate() {
    var cut = false
    while (parent.childNodes.length*parent.getBBox().height > height) {
      parent.removeChild(parent.lastChild)
      cut = true
    }
    if (cut && parent.childNodes.length != 0) {
    // if (cut) {
      tspan = parent.lastChild
      words = d3.select(tspan).text().split(/[\s-]/)
      
      var last_char = words[words.length-1].charAt(words[words.length-1].length-1)
      if (last_char == ',' || last_char == ';' || last_char == ':') words[words.length-1] = words[words.length-1].substr(0,words[words.length-1].length-1)
      
      d3.select(tspan).text(words.join(' ')+'...')
      
      if (tspan.getComputedTextLength() > width) {
        if (words.length > 1) words.pop(words.length-1)
        last_char = words[words.length-1].charAt(words[words.length-1].length-1)
        if (last_char == ',' || last_char == ';' || last_char == ':') words[words.length-1].substr(0,words[words.length-1].length-2)
        d3.select(tspan).text(words.join(' ')+'...')
      }
    }
  }
  
}

//===================================================================


//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Drop shadow function, adds the proper definition with th parameters
// used to the page
//-------------------------------------------------------------------

vizwhiz.utils.drop_shadow = function(defs) {
  
  // add filter to svg defs
  var drop_shadow_filter = defs.append('filter')
    .attr('id', 'dropShadow')
    .attr('filterUnits', "userSpaceOnUse")
    .attr('width', '100%')
    .attr('height', '100%');
  
  // shadow blue
  drop_shadow_filter.append('feGaussianBlur')
    .attr('in', 'SourceAlpha')
    .attr('stdDeviation', 2);
  
  // shadow offset
  drop_shadow_filter.append('feOffset')
    .attr('dx', 1)
    .attr('dy', 1)
    .attr('result', 'offsetblur');
  
  var feMerge = drop_shadow_filter.append('feMerge');  
  feMerge.append('feMergeNode');
  
  // put original on top of shadow
  feMerge.append('feMergeNode')
    .attr('in', "SourceGraphic");

}

//===================================================================


//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Tooltip function
//-------------------------------------------------------------------

vizwhiz.utils.tooltip = function(g,w,data) {
  
  var width = 200,
      padding = 5,
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
      .attr("font-size","14px")
      .style("font-weight","bold")
      .attr("x",padding+"px")
      .attr("y",padding+"px")
      .attr("text-anchor","start")
      .attr("font-family","Helvetica")
      .each(function(dd){vizwhiz.utils.wordWrap(data.name,this,width,width,false);})
  }
    
  var y_offset = padding + text.node().getBBox().height
  
  for (var d in data) {
    if (exclusions.indexOf(d) < 0) {
      var t = d+": "+data[d]
      text = group.append("text")
        .attr("fill","#333333")
        .attr("font-size","12px")
        .style("font-weight","normal")
        .attr("x",padding+"px")
        .attr("y",y_offset+"px")
        .attr("text-anchor","start")
        .attr("font-family","Helvetica")
        .each(function(dd){vizwhiz.utils.wordWrap(t,this,width,width,false);})
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
