d3plus.data.pie_scatter = "grouped";
d3plus.vars.pie_scatter = ["xaxis","yaxis"];

d3plus.apps.pie_scatter = function(vars) {
  
  var covered = false
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Define size scaling
  //-------------------------------------------------------------------
  if (!vars.app_data) vars.app_data = []
  var size_domain = d3.extent(vars.app_data, function(d){ 
    return d[vars.value] == 0 ? null : d[vars.value] 
  })
  
  if (!size_domain[1]) size_domain = [0,0]
  
  var max_size = d3.max([d3.min([vars.graph.width,vars.graph.height])/15,10]),
      min_size = 10
      
  if (size_domain[0] == size_domain[1]) var min_size = max_size
  
  var size_range = [min_size,max_size]
  
  vars.size_scale = d3.scale[vars.size_scale_type]()
    .domain(size_domain)
    .range(size_range)
    
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Graph setup
  //-------------------------------------------------------------------
  
  // Create Axes
  vars.x_scale = d3.scale[vars.xaxis_scale]()
    .domain(vars.xaxis_range)
    .range([0, vars.graph.width])
    .nice()
  
  vars.y_scale = d3.scale[vars.yaxis_scale]()
    .domain(vars.yaxis_range)
    .range([0, vars.graph.height])
    .nice()

  if (vars.xaxis_scale != "log") set_buffer("x")
  if (vars.yaxis_scale != "log") set_buffer("y")
  
  // set buffer room (take into account largest size var)
  function set_buffer(axis) {
    
    var scale = vars[axis+"_scale"]
    var inverse_scale = d3.scale[vars[axis+"axis_scale"]]()
      .domain(scale.range())
      .range(scale.domain())
      
    var largest_size = vars.size_scale.range()[1]

    // convert largest size to x scale domain
    largest_size = inverse_scale(largest_size)
    
    // get radius of largest in pixels by subtracting this value from the x scale minimum
    var buffer = largest_size - scale.domain()[0];

    // update x scale with new buffer offsets
    vars[axis+"_scale"]
      .domain([scale.domain()[0]-buffer,scale.domain()[1]+buffer])
  }
  
  graph_update();
  
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
  vars.app_data.sort(function(node_a, node_b){
    return node_b[vars.value] - node_a[vars.value];
  })
  
  vars.chart_enter.append("g").attr("class","circles")
  
  var nodes = d3.select("g.circles").selectAll("g.circle")
    .data(vars.app_data,function(d){ return d[vars.id] })
  
  nodes.enter().append("g")
    .attr("opacity", 0)
    .attr("class", "circle")
    .attr("transform", function(d) { return "translate("+vars.x_scale(d[vars.xaxis])+","+vars.y_scale(d[vars.yaxis])+")" } )
    .each(function(d){
      
      d3.select(this)
        .append("circle")
        .style("stroke", function(dd){
          if (d[vars.active] || (d.num_children_active == d.num_children && d[vars.active] != false)) {
            return "#333";
          }
          else {
            return d3plus.utils.color(vars,d);
          }
        })
        .style('stroke-width', 1)
        .style('fill', function(dd){
          if (d[vars.active] || (d.num_children_active == d.num_children && d[vars.active] != false)) {
            return d3plus.utils.color(vars,d);
          }
          else {
            var c = d3.hsl(d3plus.utils.color(vars,d));
            c.l = 0.95;
            return c.toString();
          }
        })
        .attr("r", 0 )
        
      vars.arc_angles[d.id] = 0
      vars.arc_sizes[d.id] = 0
        
      d3.select(this)
        .append("path")
        .style('fill', d3plus.utils.color(vars,d) )
        .style("fill-opacity", 1)
        
      d3.select(this).select("path").transition().duration(d3plus.timing)
        .attrTween("d",arcTween)
        
    })
  
  // update
  
  nodes
    .on(d3plus.evt.over, function(d){
      covered = false
      
      var val = d[vars.value] ? d[vars.value] : vars.size_scale.domain()[0]
      var radius = vars.size_scale(val),
          x = vars.x_scale(d[vars.xaxis]),
          y = vars.y_scale(d[vars.yaxis]),
          color = d[vars.active] || d.num_children_active/d.num_children == 1 ? "#333" : d3plus.utils.color(vars,d),
          viz = d3.select("g.chart");
          
      // vertical line to x-axis
      viz.append("line")
        .attr("class", "axis_hover")
        .attr("x1", x)
        .attr("x2", x)
        .attr("y1", y+radius+1) // offset so hover doens't flicker
        .attr("y2", vars.graph.height)
        .attr("stroke", color)
        .attr("stroke-width", 1)
        .attr("shape-rendering","crispEdges")
    
      // horizontal line to y-axis
      viz.append("line")
        .attr("class", "axis_hover")
        .attr("x1", 0)
        .attr("x2", x-radius) // offset so hover doens't flicker
        .attr("y1", y)
        .attr("y2", y)
        .attr("stroke", color)
        .attr("stroke-width", 1)
        .attr("shape-rendering","crispEdges")
    
      // x-axis value box
      var xrect = viz.append("rect")
        .attr("class", "axis_hover")
        .attr("y", vars.graph.height)
        .attr("height", 20)
        .attr("fill", "white")
        .attr("stroke", color)
        .attr("stroke-width", 1)
        .attr("shape-rendering","crispEdges")
    
      var xtext = vars.format(d[vars.xaxis],vars.xaxis)
      
      // xvalue text element
      var xtext = viz.append("text")
        .attr("class", "axis_hover")
        .attr("x", x)
        .attr("y", vars.graph.height)
        .attr("dy", 14)
        .attr("text-anchor","middle")
        .style("font-weight",vars.font_weight)
        .attr("font-size","12px")
        .attr("font-family",vars.font)
        .attr("fill","#4c4c4c")
        .text(xtext)
        
      var xwidth = xtext.node().getBBox().width+10
      xrect.attr("width",xwidth)
        .attr("x",x-(xwidth/2))
    
      // y-axis value box
      var yrect = viz.append("rect")
        .attr("class", "axis_hover")
        .attr("y", y-10)
        .attr("height", 20)
        .attr("fill", "white")
        .attr("stroke", color)
        .attr("stroke-width", 1)
        .attr("shape-rendering","crispEdges")
      
      var ytext = vars.format(d[vars.yaxis],vars.yaxis)
      
      // xvalue text element
      var ytext = viz.append("text")
        .attr("class", "axis_hover")
        .attr("x", -25)
        .attr("y", y-10)
        .attr("dy", 14)
        .attr("text-anchor","middle")
        .style("font-weight",vars.font_weight)
        .attr("font-size","12px")
        .attr("font-family",vars.font)
        .attr("fill","#4c4c4c")
        .text(ytext)

      var ywidth = ytext.node().getBBox().width+10
      ytext.attr("x",-ywidth/2)
      yrect.attr("width",ywidth)
        .attr("x",-ywidth)
        
      var ex = null
      if (d.num_children > 1 && !vars.spotlight && d.num_children_active != d.num_children) {
        var num = d.num_children_active,
            den = d.num_children
        ex = {"fill":num+"/"+den+" ("+vars.format((num/den)*100,"share")+"%)"}
      }
      var tooltip_data = d3plus.utils.tooltip(vars,d,"short",ex)
      
      d3plus.ui.tooltip.remove(vars.type)
      d3plus.ui.tooltip.create({
        "id": vars.type,
        "color": d3plus.utils.color(vars,d),
        "icon": d3plus.utils.variable(vars,d[vars.id],"icon"),
        "style": vars.icon_style,
        "data": tooltip_data,
        "title": d3plus.utils.variable(vars,d[vars.id],vars.text),
        "x": x+vars.graph.margin.left+vars.margin.left+vars.parent.node().offsetLeft,
        "y": y+vars.graph.margin.top+vars.margin.top+vars.parent.node().offsetTop,
        "offset": radius,
        "arrow": true,
        "footer": vars.footer_text(),
        "mouseevents": false
      })
      
    })
    .on(d3plus.evt.out, function(d){
      if (!covered) d3plus.ui.tooltip.remove(vars.type)
      d3.selectAll(".axis_hover").remove()
    })
    .on(d3plus.evt.click, function(d){
      covered = true
      var id = d3plus.utils.variable(vars,d,vars.id)
      var self = this
      
      make_tooltip = function(html) {
        
        d3plus.ui.tooltip.remove(vars.type)
        d3.selectAll(".axis_hover").remove()
        
        var ex = null
        if (d.num_children > 1 && !vars.spotlight && d.num_children_active != d.num_children) {
          var num = d.num_children_active,
              den = d.num_children
          ex = {"fill":num+"/"+den+" ("+vars.format((num/den)*100,"share")+"%)"}
        }
        var tooltip_data = d3plus.utils.tooltip(vars,d,"long",ex)
        
        d3plus.ui.tooltip.create({
          "title": d3plus.utils.variable(vars,d,vars.text),
          "color": d3plus.utils.color(vars,d),
          "icon": d3plus.utils.variable(vars,d,"icon"),
          "style": vars.icon_style,
          "id": vars.type,
          "fullscreen": true,
          "html": html,
          "footer": vars.footer,
          "data": tooltip_data,
          "mouseevents": self,
          "parent": vars.parent,
          "background": vars.background
        })
        
      }
      
      var html = vars.click_function ? vars.click_function(id) : null
      
      if (typeof html == "string") make_tooltip(html)
      else if (html && html.url && html.callback) {
        d3.json(html.url,function(data){
          html = html.callback(data)
          make_tooltip(html)
        })
      }
      else if (vars.tooltip.long) {
        make_tooltip(html)
      }
      
    })
    
  nodes.transition().duration(d3plus.timing)
    .attr("transform", function(d) { return "translate("+vars.x_scale(d[vars.xaxis])+","+vars.y_scale(d[vars.yaxis])+")" } )
    .attr("opacity", 1)
    .each(function(d){

      var val = d3plus.utils.variable(vars,d,vars.value)
      val = val || vars.size_scale.domain()[0]
      d.arc_radius = vars.size_scale(val);
      
      d3.select(this).select("circle").transition().duration(d3plus.timing)
        .style("stroke", function(dd){
          if (d[vars.active] || (d.num_children_active == d.num_children && d[vars.active] != false)) return "#333";
          else return d3plus.utils.color(vars,d);
        })
        .style('fill', function(dd){
          if (d[vars.active] || (d.num_children_active == d.num_children && d[vars.active] != false)) return d3plus.utils.color(vars,d);
          else {
            var c = d3.hsl(d3plus.utils.color(vars,d));
            c.l = 0.95;
            return c.toString();
          }
        })
        .attr("r", d.arc_radius )

      
      if (d.num_children) {
        d.arc_angle = (((d.num_children_active / d.num_children)*360) * (Math.PI/180));
        d3.select(this).select("path").transition().duration(d3plus.timing)
          .style('fill', d3plus.utils.color(vars,d) )
          .attrTween("d",arcTween)
          .each("end", function(dd) {
            vars.arc_angles[d.id] = d.arc_angle
            vars.arc_sizes[d.id] = d.arc_radius
          })
      }
      
    })
  
  // exit
  nodes.exit()
    .transition().duration(d3plus.timing)
    .attr("opacity", 0)
    .remove()
  
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Data Ticks
  //-------------------------------------------------------------------
  
  var tick_group = vars.chart_enter.append("g")
    .attr("id","data_ticks")
  
  var ticks = d3.select("g#data_ticks")
    .selectAll("g.data_tick")
    .data(vars.app_data, function(d){ return d[vars.id]; })
  
  var ticks_enter = ticks.enter().append("g")
    .attr("class", "data_tick")
  
  // y ticks
  // ENTER
  ticks_enter.append("line")
    .attr("class", "ytick")
    .attr("x1", -10)
    .attr("x2", 0)
    .attr("y1", function(d){ return vars.y_scale(d[vars.yaxis]) })
    .attr("y2", function(d){ return vars.y_scale(d[vars.yaxis]) })
    .attr("stroke", function(d){ return d3plus.utils.color(vars,d); })
    .attr("stroke-width", 1)
    .attr("shape-rendering","crispEdges")
  
  // UPDATE      
  ticks.select(".ytick").transition().duration(d3plus.timing)
    .attr("x1", -10)
    .attr("x2", 0)
    .attr("y1", function(d){ return vars.y_scale(d[vars.yaxis]) })
    .attr("y2", function(d){ return vars.y_scale(d[vars.yaxis]) })
  
  // x ticks
  // ENTER
  ticks_enter.append("line")
    .attr("class", "xtick")
    .attr("y1", vars.graph.height)
    .attr("y2", vars.graph.height + 10)      
    .attr("x1", function(d){ return vars.x_scale(d[vars.xaxis]) })
    .attr("x2", function(d){ return vars.x_scale(d[vars.xaxis]) })
    .attr("stroke", function(d){ return d3plus.utils.color(vars,d); })
    .attr("stroke-width", 1)
    .attr("shape-rendering","crispEdges")
  
  // UPDATE
  ticks.select(".xtick").transition().duration(d3plus.timing)
    .attr("y1", vars.graph.height)
    .attr("y2", vars.graph.height + 10)      
    .attr("x1", function(d){ return vars.x_scale(d[vars.xaxis]) })
    .attr("x2", function(d){ return vars.x_scale(d[vars.xaxis]) })
  
  // EXIT (needed for when things are filtered/soloed)
  ticks.exit().remove()
  
  //===================================================================
  
  function arcTween(b) {
    var i = d3.interpolate({arc_angle: vars.arc_angles[b.id], arc_radius: vars.arc_sizes[b.id]}, b);
    return function(t) {
      return arc(i(t));
    };
  }
  
};
