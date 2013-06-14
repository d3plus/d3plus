
vizwhiz.pie_scatter = function(vars) {

  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // X & Y Axis formatting help
  //-------------------------------------------------------------------
  
  var x_axis = d3.svg.axis()
    .tickSize(0)
    .tickPadding(25)
    .orient('bottom')
    .tickFormat(function(d, i) {
      d3.select(this)
        .attr("text-anchor","middle")
        .style("font-weight","bold")
        .attr("font-size","12px")
        .attr("font-family","Helvetica")
        .attr("fill","#4c4c4c")
      // background line
      
      var bgtick = d3.select(this.parentNode).selectAll(".bgtick")
        .data([i])
        
      bgtick.enter().append("line")
        .attr("class","bgtick")
        .attr("x1", 0)
        .attr("x2", 0)
        .attr("y1", 0-1)
        .attr("y2", -graph.height+1)
        .attr("stroke", "#ccc")
        .attr("stroke-width",1)
      
      bgtick.transition().duration(vizwhiz.timing) 
        .attr("y2", -graph.height+1)
        
      // tick
      d3.select(this.parentNode).append("line")
        .attr("class","tick_line")
        .attr("x1", 0)
        .attr("x2", 0)
        .attr("y1", 1)
        .attr("y2", 20)
        .attr("stroke", "#000")
        .attr("stroke-width",1)
      return vizwhiz.utils.format_num(d, false, 3, true);
    });
  
  var y_axis = d3.svg.axis()
    .tickSize(0)
    .tickPadding(25)
    .orient('left')
    .tickFormat(function(d, i) {
      d3.select(this)
        .attr("text-anchor","middle")
        .style("font-weight","bold")
        .attr("font-size","12px")
        .attr("font-family","Helvetica")
        .attr("fill","#4c4c4c")
      // background line
      
      var bgtick = d3.select(this.parentNode).selectAll(".bgtick")
        .data([i])
        
      bgtick.enter().append("line")
        .attr("class","bgtick")
        .attr("x1", 0+1)
        .attr("x2", 0+graph.width-1)
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("stroke", "#ccc")
        .attr("stroke-width",1)
        
      bgtick.transition().duration(vizwhiz.timing) 
        .attr("x2", 0+graph.width-1)
        
      // tick
      d3.select(this.parentNode).append("line")
        .attr("class","tick_line")
        .attr("x1", -20)
        .attr("x2", 0)
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("stroke", "#4c4c4c")
        .attr("stroke-width",1)
      // return parseFloat(d.toFixed(3))
      return vizwhiz.utils.format_num(d, false, 3, true);
    });

  //===================================================================
      
  if (vars.small) {
    var graph_margin = {"top": 0, "right": 0, "bottom": 0, "left": 0}
  }
  else {
    var graph_margin = {"top": 10, "right": 40, "bottom": 80, "left": 90}
  }

  graph = {
        "width": vars.width-graph_margin.left-graph_margin.right,
        "height": vars.height-graph_margin.top-graph_margin.bottom,
        "x": graph_margin.left,
        "y": graph_margin.top
      }
  
  // container for the visualization
  var viz_enter = vars.parent_enter.append("g").attr("class", "viz")
    .attr("transform", "translate(" + graph.x + "," + graph.y + ")")

  // add grey background for viz
  viz_enter.append("rect")
    .style('stroke','#000')
    .style('stroke-width',1)
    .style('fill','#efefef')
    .attr("class","background")
    .attr('x',0)
    .attr('y',0)
    .attr('width', graph.width)
    .attr('height', graph.height)
    
  // update (in case width and height are changed)
  d3.select(".viz").transition().duration(vizwhiz.timing)
    .attr("transform", "translate(" + graph.x + "," + graph.y + ")")
    .select("rect")
      .attr('width', graph.width)
      .attr('height', graph.height)
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // INIT vars & data munging
  //-------------------------------------------------------------------
    
  var data_range = d3.extent(vars.data, function(d){ 
    return d[vars.value_var] == 0 ? null : d[vars.value_var] 
  })
  
  if (!data_range[1]) data_range = [0,0]
  
  var size_scale = d3.scale.log()
    .domain(data_range)
    .range([2, d3.max([d3.min([vars.width,vars.height])/35,10])])
    .nice()
    
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // X AXIS
  //-------------------------------------------------------------------
  
  // create scale for buffer of largest item
  if (vars.xaxis_domain.length < 2) var x_domain = d3.extent(vars.data, function(d){ return d[vars.xaxis_var]; })
  else var x_domain = vars.xaxis_domain
  
  var x_scale = d3.scale.linear()
    .domain(x_domain)
    .range([0, graph.width])
    .nice()
    
  // get buffer room (take into account largest size var)
  var inverse_x_scale = d3.scale.linear().domain(x_scale.range()).range(x_scale.domain())
  var largest_size = size_scale.range()[1]
  // convert largest size to x scale domain
  largest_size = inverse_x_scale(largest_size)
  // get radius of largest in pixels by subtracting this value from the x scale minimum
  var x_buffer = largest_size - x_scale.domain()[0];
  // update x scale with new buffer offsets
  x_scale.domain([x_scale.domain()[0]-x_buffer, x_scale.domain()[1]+x_buffer])
  // enter
  var xaxis_enter = viz_enter.append("g")
    .attr("transform", "translate(0," + graph.height + ")")
    .attr("class", "xaxis")
    .call(x_axis.scale(x_scale))
  
  // update
  d3.select(".xaxis").transition().duration(vizwhiz.timing)
    .attr("transform", "translate(0," + graph.height + ")")
    .call(x_axis.scale(x_scale))
  
  // also update background tick lines
  d3.selectAll(".x_bg_line")
    .attr("y2", -graph.height-1)
  
  // label
  xaxis_enter.append('text')
    .attr('y', 60)
    .attr('class', 'axis_title_x')
    .attr("text-anchor", "middle")
    .style("font-weight", "bold")
    .attr("font-size", "14px")
    .attr("font-family", "Helvetica")
    .attr("fill", "#4c4c4c")
    .attr('width', graph.width)
    .attr('x', graph.width/2)
  
  // update label
  d3.select(".axis_title_x").transition().duration(vizwhiz.timing)
    .attr('width', graph.width)
    .attr('x', graph.width/2)
    .text(vars.text_format(vars.xaxis_var))
  
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Y AXIS
  //-------------------------------------------------------------------
  // 
  if (vars.yaxis_domain.length < 2) var y_domain = d3.extent(vars.data, function(d){ return d[vars.yaxis_var]; }).reverse();
  else var y_domain = vars.yaxis_domain;
  
  var y_scale = d3.scale.linear()
    .domain(y_domain)
    .range([0, graph.height])
    .nice()

  // get buffer room (take into account largest size var)
  var inverse_y_scale = d3.scale.linear().domain(y_scale.range()).range(y_scale.domain())
  largest_size = size_scale.range()[1]
  // convert largest size to x scale domain
  largest_size = inverse_y_scale(largest_size)
  // get radius of largest in pixels by subtracting this value from the x scale minimum
  var y_buffer = largest_size - y_scale.domain()[0];
  // update x scale with new buffer offsets
  y_scale.domain([y_scale.domain()[0]-y_buffer, y_scale.domain()[1]+y_buffer])

  // enter
  var yaxis_enter = viz_enter.append("g")
    .attr("class", "yaxis")
    .call(y_axis.scale(y_scale))
  
  // update
  d3.select(".yaxis").transition().duration(vizwhiz.timing)
    .call(y_axis.scale(y_scale))
  
  // also update background tick lines
  d3.selectAll(".y_bg_line")
    .attr("x2", 0+graph.width-1)
  
  // label
  yaxis_enter.append('text')
    .attr('class', 'axis_title_y')
    .attr("text-anchor", "middle")
    .style("font-weight", "bold")
    .attr("font-size", "14px")
    .attr("font-family", "Helvetica")
    .attr("fill", "#4c4c4c")
    .attr('width', graph.width)
    .attr("transform", "translate(" + (graph.x-150) + "," + (graph.y+graph.height/2) + ") rotate(-90)")
    
  // update label
  d3.select(".axis_title_y").transition().duration(vizwhiz.timing)
    .attr('width', graph.width)
    .attr("transform", "translate(" + (graph.x-150) + "," + (graph.y+graph.height/2) + ") rotate(-90)")
    .text(vars.text_format(vars.yaxis_var))
  
  //===================================================================
  
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // NODES
  //-------------------------------------------------------------------
  
  var arc = d3.svg.arc()
    .innerRadius(0)
    .startAngle(0)
    .outerRadius(function(d) { return d.arc_radius })
    .endAngle(function(d) { return d.arc_angle })
  
  // sort nodes so that smallest are always on top
  vars.data.sort(function(node_a, node_b){
    return node_b[vars.value_var] - node_a[vars.value_var];
  })
  
  var nodes = d3.select("g.viz").selectAll("g.circle")
    .data(vars.data,function(d){ return d[vars.id_var] })
  
  nodes.enter().append("g")
    .attr("opacity", 0)
    .attr("class", "circle")
    .attr("transform", function(d) { return "translate("+x_scale(d[vars.xaxis_var])+","+y_scale(d[vars.yaxis_var])+")" } )
    .each(function(d){
      
      d3.select(this)
        .append("circle")
        .style("stroke", function(dd){
          if (d.active || (d.num_children_active == d.num_children && d.active != false)) {
            return "#333";
          }
          else {
            return find_variable(d[vars.id_var],"color");
          }
        })
        .style('stroke-width', 1)
        .style('fill', function(dd){
          if (d.active || (d.num_children_active == d.num_children && d.active != false)) {
            return find_variable(d[vars.id_var],"color");
          }
          else {
            var c = d3.hsl(find_variable(d[vars.id_var],"color"));
            c.l = 0.95;
            return c.toString();
          }
        })
        .attr("r", 0 )
        
      vars.arc_angles[d.id] = 0
      vars.arc_sizes[d.id] = 0
        
      d3.select(this)
        .append("path")
        .style('fill', find_variable(d[vars.id_var],"color") )
        .style("fill-opacity", 1)
        
      d3.select(this).select("path").transition().duration(vizwhiz.timing)
        .attrTween("d",arcTween)
        
    })
  
  // update
  
  nodes
    .on(vizwhiz.evt.over, hover(x_scale, y_scale, size_scale, graph))
    .on(vizwhiz.evt.out, function(){
      vizwhiz.tooltip.remove();
      d3.selectAll(".axis_hover").remove();
    })
    
  nodes.transition().duration(vizwhiz.timing)
    .attr("transform", function(d) { return "translate("+x_scale(d[vars.xaxis_var])+","+y_scale(d[vars.yaxis_var])+")" } )
    .attr("opacity", 1)
    .each(function(d){

      var val = d[vars.value_var]
      val = val && val > 0 ? val : size_scale.domain()[0]
      d.arc_radius = size_scale(val);
      
      d3.select(this).select("circle").transition().duration(vizwhiz.timing)
        .style("stroke", function(dd){
          if (d.active || (d.num_children_active == d.num_children && d.active != false)) return "#333";
          else return find_variable(d[vars.id_var],"color");
        })
        .style('fill', function(dd){
          if (d.active || (d.num_children_active == d.num_children && d.active != false)) return find_variable(d[vars.id_var],"color");
          else {
            var c = d3.hsl(find_variable(d[vars.id_var],"color"));
            c.l = 0.95;
            return c.toString();
          }
        })
        .attr("r", d.arc_radius )

      
      if (d.num_children) {
        d.arc_angle = (((d.num_children_active / d.num_children)*360) * (Math.PI/180));
        d3.select(this).select("path").transition().duration(vizwhiz.timing)
          .attrTween("d",arcTween)
          .each("end", function(dd) {
            vars.arc_angles[d.id] = d.arc_angle
            vars.arc_sizes[d.id] = d.arc_radius
          })
      }
      
    })
  
  // exit
  nodes.exit()
    .transition().duration(vizwhiz.timing)
    .attr("opacity", 0)
    .remove()
  
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // TICKS
  //-------------------------------------------------------------------
  
  var ticks = d3.select("g.viz")
    .selectAll("g.ticks")
    .data(vars.data, function(d){ return d[vars.id_var]; })
  
  var ticks_enter = ticks.enter().append("g")
    .attr("class", "ticks")
  
  // y ticks
  // ENTER
  ticks_enter.append("line")
    .attr("class", "yticks")
    .attr("x1", -10)
    .attr("x2", 0)
    .attr("y1", function(d){ return y_scale(d[vars.yaxis_var]) })
    .attr("y2", function(d){ return y_scale(d[vars.yaxis_var]) })
    .attr("stroke", function(d){ return find_variable(d[vars.id_var],"color"); })
    .attr("stroke-width", 1)
  
  // UPDATE      
  ticks.selectAll(".yticks").transition().duration(vizwhiz.timing)
    .attr("x1", -10)
    .attr("x2", 0)
    .attr("y1", function(d){ return y_scale(d[vars.yaxis_var]) })
    .attr("y2", function(d){ return y_scale(d[vars.yaxis_var]) })
  
  // x ticks
  // ENTER
  ticks_enter.append("line")
    .attr("class", "xticks")
    .attr("y1", graph.height)
    .attr("y2", graph.height + 10)      
    .attr("x1", function(d){ return x_scale(d[vars.xaxis_var]) })
    .attr("x2", function(d){ return x_scale(d[vars.xaxis_var]) })
    .attr("stroke", function(d){ return find_variable(d[vars.id_var],"color"); })
    .attr("stroke-width", 1)
  
  // UPDATE
  ticks.selectAll(".xticks").transition().duration(vizwhiz.timing)
    .attr("y1", graph.height)
    .attr("y2", graph.height + 10)      
    .attr("x1", function(d){ return x_scale(d[vars.xaxis_var]) })
    .attr("x2", function(d){ return x_scale(d[vars.xaxis_var]) })
  
  // EXIT (needed for when things are filtered/soloed)
  ticks.exit().remove()
  
  //===================================================================
  
  
  // Draw foreground bounding box
  viz_enter.append('rect')
    .style('stroke','#000')
    .style('stroke-width',1*2)
    .style('fill','none')
    .attr('class', "border")
    .attr('width', graph.width)
    .attr('height', graph.height)
    .attr('x',0)
    .attr('y',0)
  
  // update (in case width and height are changed)
  d3.select(".border").transition().duration(vizwhiz.timing)
    .attr('width', graph.width)
    .attr('height', graph.height)
  
  // Always bring to front
  d3.select("rect.border").node().parentNode.appendChild(d3.select("rect.border").node())
  
  function arcTween(b) {
    var i = d3.interpolate({arc_angle: vars.arc_angles[b.id], arc_radius: vars.arc_sizes[b.id]}, b);
    return function(t) {
      return arc(i(t));
    };
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Hover over nodes
  //-------------------------------------------------------------------
  
  function hover(x_scale, y_scale, size_scale, xsize){

      return function(d){
        
        var val = d[vars.value_var] ? d[vars.value_var] : size_scale.domain()[0]
        var radius = size_scale(val),
            x = x_scale(d[vars.xaxis_var]),
            y = y_scale(d[vars.yaxis_var]),
            color = d.active || d.num_children_active/d.num_children == 1 ? "#333" : find_variable(d[vars.id_var],"color"),
            viz = d3.select("g.viz");
            
        // vertical line to x-axis
        viz.append("line")
          .attr("class", "axis_hover")
          .attr("x1", x)
          .attr("x2", x)
          .attr("y1", y+radius+1) // offset so hover doens't flicker
          .attr("y2", graph.height)
          .attr("stroke", color)
          .attr("stroke-width", 2)
      
        // horizontal line to y-axis
        viz.append("line")
          .attr("class", "axis_hover")
          .attr("x1", 0)
          .attr("x2", x-radius) // offset so hover doens't flicker
          .attr("y1", y)
          .attr("y2", y)
          .attr("stroke", color)
          .attr("stroke-width", 2)
      
        // x-axis value box
        viz.append("rect")
          .attr("class", "axis_hover")
          .attr("x", x-25)
          .attr("y", graph.height)
          .attr("width", 50)
          .attr("height", 20)
          .attr("fill", "white")
          .attr("stroke", color)
          .attr("stroke-width", 2)
      
        // xvalue text element
        viz.append("text")
          .attr("class", "axis_hover")
          .attr("x", x)
          .attr("y", graph.height)
          .attr("dy", 14)
          .attr("text-anchor","middle")
          .style("font-weight","bold")
          .attr("font-size","12px")
          .attr("font-family","Helvetica")
          .attr("fill","#4c4c4c")
          .text(vizwhiz.utils.format_num(d[vars.xaxis_var], false, 3, true))
      
        // y-axis value box
        viz.append("rect")
          .attr("class", "axis_hover")
          .attr("x", -50)
          .attr("y", y-10)
          .attr("width", 50)
          .attr("height", 20)
          .attr("fill", "white")
          .attr("stroke", color)
          .attr("stroke-width", 2)
      
        // xvalue text element
        viz.append("text")
          .attr("class", "axis_hover")
          .attr("x", -25)
          .attr("y", y-10)
          .attr("dy", 14)
          .attr("text-anchor","middle")
          .style("font-weight","bold")
          .attr("font-size","12px")
          .attr("font-family","Helvetica")
          .attr("fill","#4c4c4c")
          .text(vizwhiz.utils.format_num(d[vars.yaxis_var], false, 3, true))
      
        var tooltip_data = get_tooltip_data(d)
      
        vizwhiz.tooltip.create({
          "id": d[vars.id_var],
          "color": find_variable(d[vars.id_var],"color"),
          "icon": find_variable(d[vars.id_var],"icon"),
          "data": tooltip_data,
          "title": find_variable(d[vars.id_var],vars.text_var),
          "x": x+graph.x+vars.margin.left+vars.parent.node().offsetLeft,
          "y": y+graph.y+vars.margin.top+vars.parent.node().offsetTop,
          "offset": radius,
          "arrow": true,
          "footer": vars.data_source,
          "mouseevents": false
        })
      }
  }
  
  //===================================================================
  
};
