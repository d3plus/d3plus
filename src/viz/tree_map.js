vizwhiz.tree_map = function(vars) {
  
  // Ok, to get started, lets run our heirarchically nested
  // data object through the d3 treemap function to get a
  // flat array of data with X, Y, width and height vars
  var tmap_data = d3.layout.treemap()
    .round(false)
    .size([vars.width, vars.height])
    .children(function(d) { return d.children; })
    .sort(function(a, b) { return a.value - b.value; })
    .value(function(d) { return d[vars.value_var]; })
    .nodes(vars.data)
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
    .attr("id",function(d){
      return "cell_"+d[vars.id_var]
    })
    .attr("opacity", 0)
    .attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")"; 
    })
    
  // rectangle
  cell_enter.append("rect")
    .attr("stroke",vars.background)
    .attr("stroke-width",1)
    .attr('width', function(d) {
      return d.dx+'px'
    })
    .attr('height', function(d) { 
      return d.dy+'px'
    })
    .attr("fill", function(d){
      return find_variable(d,vars.color_var);
    })
    .attr("shape-rendering","crispEdges")
    
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
    .attr("fill", function(d){ 
      var color = find_variable(d,vars.color_var)
      return vizwhiz.utils.text_color(color); 
    })
    .style("pointer-events","none")
    
  // text (share)
  cell_enter.append("text")
    .attr('class','share')
    .attr("text-anchor","middle")
    .style("font-weight","bold")
    .attr("font-family","Helvetica")
    .attr("fill", function(d){
      var color = find_variable(d,vars.color_var)
      return vizwhiz.utils.text_color(color); 
    })
    .attr("fill-opacity",0.5)
    .style("pointer-events","none")
    .text(function(d) {
      var root = d;
      while(root.parent){ root = root.parent; } // find top most parent node
      d.share = vars.number_format((d.value/root.value)*100,"share")+"%";
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
      
      var id = find_variable(d,vars.id_var),
          self = d3.select("#cell_"+id).node()
      
      self.parentNode.appendChild(self)
      
      d3.select("#cell_"+id).select("rect")
        .style("cursor","pointer")
        .attr("stroke",vars.highlight_color)
        .attr("stroke-width",2)

      var tooltip_data = get_tooltip_data(d,"short")
      tooltip_data.push({"name": vars.text_format("share"), "value": d.share});
      
      vizwhiz.tooltip.create({
        "title": find_variable(d,vars.text_var),
        "color": find_variable(d,vars.color_var),
        "icon": find_variable(d,"icon"),
        "id": id,
        "x": d3.event.pageX,
        "y": d3.event.pageY,
        "offset": 3,
        "arrow": true,
        "mouseevents": false,
        "footer": footer_text(),
        "data": tooltip_data
      })
      
    })
    .on(vizwhiz.evt.out,function(d){
      
      var id = find_variable(d,vars.id_var)
      
      d3.select("#cell_"+id).select("rect")
        .attr("stroke",vars.background)
        .attr("stroke-width",1)
      
      vizwhiz.tooltip.remove(id)
      
    })
    .on(vizwhiz.evt.click,function(d){
      
      var html = null
      if (vars.click_function) html = vars.click_function(d)
      if (html || vars.tooltip_info.long) {
        
        var id = find_variable(d,vars.id_var)
      
        d3.select("#cell_"+id).select("rect")
          .attr("stroke",vars.background)
          .attr("stroke-width",1)
        
        vizwhiz.tooltip.remove(id)
        
        var tooltip_data = get_tooltip_data(d,"long")
        tooltip_data.push({"name": vars.text_format("share"), "value": d.share});
        
        vizwhiz.tooltip.create({
          "title": find_variable(d,vars.text_var),
          "color": find_variable(d,vars.color_var),
          "icon": find_variable(d,"icon"),
          "id": id,
          "fullscreen": true,
          "html": html,
          "footer": vars.data_source,
          "data": tooltip_data,
          "mouseevents": this,
          "parent": vars.parent,
          "background": vars.background
        })
        
      }
      
    })
    .on(vizwhiz.evt.move,function(d){
      var id = find_variable(d,vars.id_var)
      vizwhiz.tooltip.move(d3.event.pageX,d3.event.pageY,id)
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
      var name = find_variable(d,vars.text_var)
      if(name && d.dx > 30 && d.dy > 30){
        var text = []
        var arr = vars.name_array ? vars.name_array : [vars.text_var,vars.id_var]
        arr.forEach(function(n){
          var name = find_variable(d,n)
          if (name) text.push(vars.text_format(name))
        })
        
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
          while(root.parent){ root = root.parent; } // find top most parent node
          d.share = vars.number_format((d.value/root.value)*100,"share")+"%";
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
