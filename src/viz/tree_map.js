vizwhiz.tree_map = function(data,vars) {
  
  // Ok, to get started, lets run our heirarchically nested
  // data object through the d3 treemap function to get a
  // flat array of data with X, Y, width and height vars
  var tmap_data = d3.layout.treemap()
    .round(false)
    .size([vars.width, vars.height])
    .children(function(d) { return d.children; })
    .sort(function(a, b) { return a.value - b.value; })
    .value(function(d) { return d[vars.value_var]; })
    .nodes(data)
    .filter(function(d) {
      return !d.children;
    })
    
  var cell = d3.select("g.parent").selectAll("g")
    .data(tmap_data, function(d){ return d[vars.id_var]; })
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // New cells enter, initialize them here
  //-------------------------------------------------------------------
  
  // cell aka container
  var cell_enter = cell.enter().append("g")
    .attr("opacity", 0)
    .attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")"; 
    })
    
  // rectangle
  cell_enter.append("rect")
    .attr("stroke","#ffffff")
    .attr('width', function(d) {
      return d.dx+'px'
    })
    .attr('height', function(d) { 
      return d.dy+'px'
    })
    .attr("fill", function(d){
      // in case this depth doesn't have a color but a child of
      // this element DOES... use that color
      while(!d.color && d.children){
        d = d.children[0]
      }
      // if a color cannot be found (at this depth of deeper) use random
      return d.color ? d.color : vizwhiz.utils.rand_color();
    })
    
  // text (name)
  cell_enter.append("text")
    .attr("opacity", 1)
    .attr("text-anchor","start")
    .style("font-weight","bold")
    .attr("font-family","Helvetica")
    .attr('class','name')
    .attr('x','0.2em')
    .attr('y','0em')
    .attr('dy','1em')
    .attr("fill", function(d){ return vizwhiz.utils.text_color(d.color); })
    .style("pointer-events","none")
    
  // text (share)
  cell_enter.append("text")
    .attr('class','share')
    .attr("text-anchor","middle")
    .style("font-weight","bold")
    .attr("font-family","Helvetica")
    .attr("fill", function(d){ return vizwhiz.utils.text_color(d.color); })
    .attr("fill-opacity",0.75)
    .style("pointer-events","none")
    .text(function(d) {
      var root = d;
      while(root.parent){ root = root.parent; } // find top most parent node
      d.share = vizwhiz.utils.format_num(d.value/root.value, true, 2);
      return d.share;
    })
    .attr('font-size',function(d){
      var size = (d.dx)/7
      if(d.dx < d.dy) var size = d.dx/7
      else var size = d.dy/7
      if (size < 10) size = 10;
      return size
    })
    .attr('x', function(d){
      return d.dx/2
    })
    .attr('y',function(d){
      return d.dy-(parseInt(d3.select(this).attr('font-size'),10)*0.10)
    })
    .each(function(d){
      var el = d3.select(this).node().getBBox()
      if (d.dx < el.width) d3.select(this).remove()
      else if (d.dy < el.height) d3.select(this).remove()
    })
    
    
  
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Update, for cells that are already in existance
  //-------------------------------------------------------------------
  
  cell
    .on(vizwhiz.evt.over,function(d){
      
      d3.select(this).style("cursor","pointer")
      vizwhiz.tooltip.remove()

      var tooltip_data = []
      if (typeof vars.tooltip_info == "object") var a = vars.tooltip_info.short
      else var a = vars.tooltip_info
      a.forEach(function(t){
        if (d[t]) {
          h = t == vars.value_var
          tooltip_data.push({"name": t, "value": d[t], "highlight": h, "format": vars.number_format})
        }
      })
      tooltip_data.push({"name": "Share", "value": d.share});
      
      var footer_text = vars.click_function ? "Click box for more info" : null
      
      vizwhiz.tooltip.create({
        "title": d[vars.text_var],
        "color": d.color,
        "icon": d.icon,
        "id": d[vars.id_var],
        "x": d3.event.pageX,
        "y": d3.event.pageY,
        "offset": 5,
        "arrow": true,
        "mouseevents": false,
        "footer": footer_text,
        "data": tooltip_data
      })
      
    })
    .on(vizwhiz.evt.move,function(d){
      vizwhiz.tooltip.move(d3.event.pageX,d3.event.pageY,d[vars.id_var])
    })
    .on(vizwhiz.evt.out,function(d){
      var target = d3.event.toElement
      if (target) {
        var class_name = typeof target.className == "object" ? target.className.baseVal : target.className
        if (class_name.indexOf("vizwhiz_tooltip") < 0) {
          vizwhiz.tooltip.remove(d[vars.id_var])
        }
      }
    })
    .on(vizwhiz.evt.click,function(d){
      if (vars.click_function) {
        vizwhiz.tooltip.remove()
        
        var html = vars.click_function(d)
        
        var tooltip_data = []
        if (vars.tooltip_info instanceof Array) var a = vars.tooltip_info
        else var a = vars.tooltip_info.long
        a.forEach(function(t){
          if (d[t]) {
            h = t == vars.value_var
            tooltip_data.push({"name": t, "value": d[t], "highlight": h, "format": vars.number_format})
          }
        })
        tooltip_data.push({"name": "Share", "value": d.share});
        
        vizwhiz.tooltip.create({
          "title": d[vars.text_var],
          "color": d.color,
          "icon": d.icon,
          "id": d[vars.id_var],
          "fullscreen": true,
          "html": html,
          "footer": vars.data_source,
          "data": tooltip_data
        })
      }
    })
  
  cell.transition().duration(vizwhiz.timing)
    .attr("transform", function(d) { 
      return "translate(" + d.x + "," + d.y + ")"; 
    })
    .attr("opacity", 1)
    
  // update rectangles
  cell.select("rect").transition().duration(vizwhiz.timing)
    .attr('width', function(d) {
      return d.dx+'px'
    })
    .attr('height', function(d) { 
      return d.dy+'px'
    })

  // text (name)
  cell.select("text.name").transition()
    .duration(vizwhiz.timing/2)
    .attr("opacity", 0)
    .transition().duration(vizwhiz.timing/2)
    .each("end", function(d){
      d3.select(this).selectAll("tspan").remove();
      if(d[vars.text_var] && d.dx > 30 && d.dy > 30){
        if (vars.name_array) {
          var text = []
          vars.name_array.forEach(function(n){
            if (d[n]) text.push(d[n])
          })
        } 
        else {
          var text = d[vars.id_var] ? [d[vars.text_var],d[vars.id_var]] : d[vars.text_var]
        }
        vizwhiz.utils.wordwrap({
          "text": text,
          "parent": this,
          "width": d.dx,
          "height": d.dy,
          "resize": true
        })
      }
      
      d3.select(this).transition().duration(vizwhiz.timing/2)
        .attr("opacity", 1)
    })


  // text (share)
  cell.select("text.share").transition().duration(vizwhiz.timing/2)
    .attr("opacity", 0)
    .each("end",function(d){
      d3.select(this)
        .text(function(d){
          var root = d.parent;
          while(root.parent){ root = root.parent; } // find top most parent ndoe
          d.share = vizwhiz.utils.format_num(d.value/root.value, true, 2)
          return d.share;
        })
        .attr('font-size',function(d){
          var size = (d.dx)/7
          if(d.dx < d.dy) var size = d.dx/7
          else var size = d.dy/7
          if (size < 10) size = 10;
          return size
        })
        .attr('x', function(d){
          return d.dx/2
        })
        .attr('y',function(d){
          return d.dy-(parseInt(d3.select(this).attr('font-size'),10)*0.10)
        })
        .each(function(d){
          var el = d3.select(this).node().getBBox()
          if (d.dx < el.width) d3.select(this).remove()
          else if (d.dy < el.height) d3.select(this).remove()
        })
      d3.select(this).transition().duration(vizwhiz.timing/2)
        .attr("opacity", 1)
    })
    

  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Exis, get rid of old cells
  //-------------------------------------------------------------------
  
  cell.exit().transition().duration(vizwhiz.timing)
    .attr("opacity", 0)
    .remove()

  //===================================================================
  
}
