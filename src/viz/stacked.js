
vizwhiz.stacked = function(vars) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Helper function used to create stack polygon
  //-------------------------------------------------------------------
  
  var stack = d3.layout.stack()
    .values(function(d) { return d.values; })
    .x(function(d) { return d[vars.year_var]; })
    .y(function(d) { return d[vars.yaxis_var]; });
  
  //===================================================================
      
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // INIT vars & data munging
  //-------------------------------------------------------------------
  
  // get max total for sums of each xaxis
  var xaxis_sums = d3.nest()
    .key(function(d){return d[vars.xaxis_var] })
    .rollup(function(leaves){
      return d3.sum(leaves, function(d){return d[vars.yaxis_var];})
    })
    .entries(vars.data)
  
  var data_max = vars.layout == "share" ? 1 : d3.max(xaxis_sums, function(d){ return d.values; });
  
  // nest data properly according to nesting array
  nested_data = nest_data();
  
  // scales for both X and Y values
  var year_extent = vars.year instanceof Array ? vars.year : d3.extent(vars.years)
  
  vars.x_scale = d3.scale[vars.xscale_type]()
    .domain(year_extent)
    .range([0, vars.graph.width]);
  // **WARNING reverse scale from 0 - max converts from height to 0 (inverse)
  vars.y_scale = d3.scale[vars.yscale_type]()
    .domain([0, data_max])
    .range([vars.graph.height, 0]);
    
  graph_update()
  
  // Helper function unsed to convert stack values to X, Y coords 
  var area = d3.svg.area()
    .interpolate(vars.stack_type)
    .x(function(d) { return vars.x_scale(d[vars.year_var]); })
    .y0(function(d) { return vars.y_scale(d.y0); })
    .y1(function(d) { return vars.y_scale(d.y0 + d.y)+1; });
  
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // LAYERS
  //-------------------------------------------------------------------
  
  vars.chart_enter.append("clipPath")
    .attr("id","path_clipping")
    .append("rect")
      .attr("width",vars.graph.width)
      .attr("height",vars.graph.height)
  
  d3.select("#path_clipping rect").transition().duration(vizwhiz.timing)
    .attr("width",vars.graph.width)
    .attr("height",vars.graph.height)
    .attr("x",1)
    .attr("y",1)
  
  // Get layers from d3.stack function (gives x, y, y0 values)
  var offset = vars.layout == "value" ? "zero" : "expand";
  var layers = stack.offset(offset)(nested_data)
  
  // container for layers
  vars.chart_enter.append("g").attr("class", "layers")
    .attr("clip-path","url(#path_clipping)")
  
  // give data with key function to variables to draw
  var paths = d3.select("g.layers").selectAll(".layer")
    .data(layers, function(d){ return d.key; })
  
  // ENTER
  // enter new paths, could be next level deep or up a level
  paths.enter().append("path")
    .attr("opacity", 0)
    .attr("id", function(d){
      return "path_"+d[vars.id_var]
    })
    .attr("class", "layer")
    .attr("fill", function(d){
      return find_variable(d.key,vars.color_var)
    })
    .attr("d", function(d) {
      return area(d.values);
    })
  
  // UPDATE
  paths
    .on(vizwhiz.evt.over, function(d){
      
      var id = find_variable(d,vars.id_var),
          self = d3.select("#path_"+id).node()
      
      d3.select(self).attr("opacity",1)

      d3.selectAll("line.rule").remove();
      
      var mouse_x = d3.event.layerX-vars.graph.margin.left;
      var rev_x_scale = d3.scale.linear()
        .domain(vars.x_scale.range()).range(vars.x_scale.domain());
      var this_x = Math.round(rev_x_scale(mouse_x));
      var this_x_index = vars.years.indexOf(this_x)
      var this_value = d.values[this_x_index]
      
      // add dashed line at closest X position to mouse location
      d3.select("g.chart").append("line")
        .datum(d)
        .attr("class", "rule")
        .attr({"x1": vars.x_scale(this_x), "x2": vars.x_scale(this_x)})
        .attr({"y1": vars.y_scale(this_value.y0), "y2": vars.y_scale(this_value.y + this_value.y0)})
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .attr("stroke-opacity", 0.5)
        .attr("stroke-dasharray", "5,3")
        .attr("pointer-events","none")
      
      // tooltip
      var tooltip_data = get_tooltip_data(this_value,"short")
    
      var path_height = vars.y_scale(this_value.y + this_value.y0)-vars.y_scale(this_value.y0),
          tooltip_x = vars.x_scale(this_x)+vars.graph.margin.left+vars.margin.left+vars.parent.node().offsetLeft,
          tooltip_y = vars.y_scale(this_value.y0 + this_value.y)+(path_height)/2+vars.graph.margin.top+vars.margin.top+vars.parent.node().offsetTop

      vizwhiz.tooltip.create({
        "data": tooltip_data,
        "title": find_variable(d[vars.id_var],vars.text_var),
        "id": vars.type,
        "icon": find_variable(d[vars.id_var],"icon"),
        "color": find_variable(d[vars.id_var],vars.color_var),
        "x": tooltip_x,
        "y": tooltip_y,
        "offset": (path_height/2),
        "arrow": true,
        "footer": footer_text(),
        "mouseevents": false
      })
      
    })
    .on(vizwhiz.evt.move, function(d){
      
      var id = find_variable(d,vars.id_var),
          self = d3.select("#path_"+id).node()
          
      var mouse_x = d3.event.layerX-vars.graph.margin.left;
      var rev_x_scale = d3.scale.linear()
        .domain(vars.x_scale.range()).range(vars.x_scale.domain());
      var this_x = Math.round(rev_x_scale(mouse_x));
      var this_x_index = vars.years.indexOf(this_x)
      var this_value = d.values[this_x_index]
          
      d3.selectAll("line.rule")
        .attr({"x1": vars.x_scale(this_x), "x2": vars.x_scale(this_x)})
        .attr({"y1": vars.y_scale(this_value.y0), "y2": vars.y_scale(this_value.y + this_value.y0)})
        
      var tooltip_data = get_tooltip_data(this_value,"short")
    
      var path_height = vars.y_scale(this_value.y0)-vars.y_scale(this_value.y + this_value.y0),
          tooltip_x = vars.x_scale(this_x)+vars.graph.margin.left+vars.margin.left+vars.parent.node().offsetLeft,
          tooltip_y = vars.y_scale(this_value.y + this_value.y0)+(path_height/2)+vars.graph.margin.top+vars.margin.top+vars.parent.node().offsetTop

      vizwhiz.tooltip.remove(vars.type)
      vizwhiz.tooltip.create({
        "data": tooltip_data,
        "title": find_variable(d[vars.id_var],vars.text_var),
        "id": vars.type,
        "icon": find_variable(d[vars.id_var],"icon"),
        "color": find_variable(d[vars.id_var],vars.color_var),
        "x": tooltip_x,
        "y": tooltip_y,
        "offset": (path_height/2),
        "arrow": true,
        "footer": footer_text(),
        "mouseevents": false
      })
      
    })
    .on(vizwhiz.evt.out, function(d){
      
      var id = find_variable(d,vars.id_var),
          self = d3.select("#path_"+id).node()
      
      d3.selectAll("line.rule").remove()
      vizwhiz.tooltip.remove(vars.type)
      d3.select(self).attr("opacity",0.85)
      
    })
    .on(vizwhiz.evt.click, function(d){
        
      var id = find_variable(d,vars.id_var)
      var self = this

      var mouse_x = d3.event.layerX-vars.graph.margin.left;
      var rev_x_scale = d3.scale.linear()
        .domain(vars.x_scale.range()).range(vars.x_scale.domain());
      var this_x = Math.round(rev_x_scale(mouse_x));
      var this_x_index = vars.years.indexOf(this_x)
      var this_value = d.values[this_x_index]
      
      make_tooltip = function(html) {
      
        d3.selectAll("line.rule").remove()
        vizwhiz.tooltip.remove(vars.type)
        d3.select(self).attr("stroke-width",0)
        
        var tooltip_data = get_tooltip_data(this_value,"long")
        
        vizwhiz.tooltip.create({
          "title": find_variable(d[vars.id_var],vars.text_var),
          "color": find_variable(d[vars.id_var],vars.color_var),
          "icon": find_variable(d[vars.id_var],"icon"),
          "id": vars.type,
          "fullscreen": true,
          "html": html,
          "footer": vars.data_source,
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
      else if (vars.tooltip_info.long) {
        make_tooltip(html)
      }
      
    })
  
  paths.transition().duration(vizwhiz.timing)
    .attr("opacity", 0.85)
    .attr("fill", function(d){
      return find_variable(d.key,vars.color_var)
    })
    .attr("d", function(d) {
      return area(d.values);
    })

  // EXIT
  paths.exit()
    .transition().duration(vizwhiz.timing)
    .attr("opacity", 0)
    .remove()
  
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // TEXT LAYERS
  //-------------------------------------------------------------------

  // filter layers to only the ones with a height larger than 6% of viz
  var text_layers = [];
  var text_height_scale = d3.scale.linear().range([0, 1]).domain([0, data_max]);

  layers.forEach(function(layer){
    // find out which is the largest
    var available_areas = layer.values.filter(function(d,i,a){
      
      var min_height = 30;
      if (i == 0) {
        return (vars.graph.height-vars.y_scale(d.y)) >= min_height 
            && (vars.graph.height-vars.y_scale(a[i+1].y)) >= min_height
            && (vars.graph.height-vars.y_scale(a[i+2].y)) >= min_height
            && vars.y_scale(d.y)-(vars.graph.height-vars.y_scale(d.y0)) < vars.y_scale(a[i+1].y0)
            && vars.y_scale(a[i+1].y)-(vars.graph.height-vars.y_scale(a[i+1].y0)) < vars.y_scale(a[i+2].y0)
            && vars.y_scale(d.y0) > vars.y_scale(a[i+1].y)-(vars.graph.height-vars.y_scale(a[i+1].y0))
            && vars.y_scale(a[i+1].y0) > vars.y_scale(a[i+2].y)-(vars.graph.height-vars.y_scale(a[i+2].y0));
      }
      else if (i == a.length-1) {
        return (vars.graph.height-vars.y_scale(d.y)) >= min_height 
            && (vars.graph.height-vars.y_scale(a[i-1].y)) >= min_height
            && (vars.graph.height-vars.y_scale(a[i-2].y)) >= min_height
            && vars.y_scale(d.y)-(vars.graph.height-vars.y_scale(d.y0)) < vars.y_scale(a[i-1].y0)
            && vars.y_scale(a[i-1].y)-(vars.graph.height-vars.y_scale(a[i-1].y0)) < vars.y_scale(a[i-2].y0)
            && vars.y_scale(d.y0) > vars.y_scale(a[i-1].y)-(vars.graph.height-vars.y_scale(a[i-1].y0))
            && vars.y_scale(a[i-1].y0) > vars.y_scale(a[i-2].y)-(vars.graph.height-vars.y_scale(a[i-2].y0));
      }
      else {
        return (vars.graph.height-vars.y_scale(d.y)) >= min_height 
            && (vars.graph.height-vars.y_scale(a[i-1].y)) >= min_height
            && (vars.graph.height-vars.y_scale(a[i+1].y)) >= min_height
            && vars.y_scale(d.y)-(vars.graph.height-vars.y_scale(d.y0)) < vars.y_scale(a[i+1].y0)
            && vars.y_scale(d.y)-(vars.graph.height-vars.y_scale(d.y0)) < vars.y_scale(a[i-1].y0)
            && vars.y_scale(d.y0) > vars.y_scale(a[i+1].y)-(vars.graph.height-vars.y_scale(a[i+1].y0))
            && vars.y_scale(d.y0) > vars.y_scale(a[i-1].y)-(vars.graph.height-vars.y_scale(a[i-1].y0));
      }
    });
    var best_area = d3.max(layer.values,function(d,i){
      if (available_areas.indexOf(d) >= 0) {
        if (i == 0) {
          return (vars.graph.height-vars.y_scale(d.y))
               + (vars.graph.height-vars.y_scale(layer.values[i+1].y))
               + (vars.graph.height-vars.y_scale(layer.values[i+2].y));
        }
        else if (i == layer.values.length-1) {
          return (vars.graph.height-vars.y_scale(d.y))
               + (vars.graph.height-vars.y_scale(layer.values[i-1].y))
               + (vars.graph.height-vars.y_scale(layer.values[i-2].y));
        }
        else {
          return (vars.graph.height-vars.y_scale(d.y))
               + (vars.graph.height-vars.y_scale(layer.values[i-1].y))
               + (vars.graph.height-vars.y_scale(layer.values[i+1].y));
        }
      } else return null;
    });
    var best_area = layer.values.filter(function(d,i,a){
      if (i == 0) {
        return (vars.graph.height-vars.y_scale(d.y))
             + (vars.graph.height-vars.y_scale(layer.values[i+1].y))
             + (vars.graph.height-vars.y_scale(layer.values[i+2].y)) == best_area;
      }
      else if (i == layer.values.length-1) {
        return (vars.graph.height-vars.y_scale(d.y))
             + (vars.graph.height-vars.y_scale(layer.values[i-1].y))
             + (vars.graph.height-vars.y_scale(layer.values[i-2].y)) == best_area;
      }
      else {
        return (vars.graph.height-vars.y_scale(d.y))
             + (vars.graph.height-vars.y_scale(layer.values[i-1].y))
             + (vars.graph.height-vars.y_scale(layer.values[i+1].y)) == best_area;
      }
    })[0]
    if (best_area) {
      layer.tallest = best_area
      text_layers.push(layer)
    }
  
  })
  // container for text layers
  vars.chart_enter.append("g").attr("class", "text_layers")

  // RESET
  var texts = d3.select("g.text_layers").selectAll(".label")
    .data([])

  // EXIT
  texts.exit().remove()

  // give data with key function to variables to draw
  var texts = d3.select("g.text_layers").selectAll(".label")
    .data(text_layers)
  
  // ENTER
  texts.enter().append("text")
    // .attr('filter', 'url(#dropShadow)')
    .attr("class", "label")
    .style("font-weight",vars.font_weight)
    .attr("font-size","18px")
    .attr("font-family",vars.font)
    .attr("dy", 6)
    .attr("opacity",0)
    .attr("pointer-events","none")
    .attr("text-anchor", function(d){
      // if first, left-align text
      if(d.tallest[vars.year_var] == vars.x_scale.domain()[0]) return "start";
      // if last, right-align text
      if(d.tallest[vars.year_var] == vars.x_scale.domain()[1]) return "end";
      // otherwise go with middle
      return "middle"
    })
    .attr("fill", function(d){
      return vizwhiz.utils.text_color(find_variable(d[vars.id_var],vars.color_var))
    })
    .attr("x", function(d){
      var pad = 0;
      // if first, push it off 10 pixels from left side
      if(d.tallest[vars.year_var] == vars.x_scale.domain()[0]) pad += 10;
      // if last, push it off 10 pixels from right side
      if(d.tallest[vars.year_var] == vars.x_scale.domain()[1]) pad -= 10;
      return vars.x_scale(d.tallest[vars.year_var]) + pad;
    })
    .attr("y", function(d){
      var height = vars.graph.height - vars.y_scale(d.tallest.y);
      return vars.y_scale(d.tallest.y0 + d.tallest.y) + (height/2);
    })
    .text(function(d) {
      return find_variable(d[vars.id_var],vars.text_var)
    })
    .each(function(d){
      // set usable width to 2x the width of each x-axis tick
      var tick_width = (vars.graph.width / vars.years.length) * 2;
      // if the text box's width is larger than the tick width wrap text
      if(this.getBBox().width > tick_width){
        // first remove the current text
        d3.select(this).text("")
        // figure out the usable height for this location along x-axis
        var height = vars.graph.height-vars.y_scale(d.tallest.y)
        // wrap text WITHOUT resizing
        // vizwhiz.utils.wordwrap(d[nesting[nesting.length-1]], this, tick_width, height, false)
      
        vizwhiz.utils.wordwrap({
          "text": find_variable(d[vars.id_var],vars.text_var),
          "parent": this,
          "width": tick_width,
          "height": height,
          "resize": false
        })
      
        // reset Y to compensate for new multi-line height
        var offset = (height - this.getBBox().height) / 2;
        // top of the element's y attr
        var y_top = vars.y_scale(d.tallest.y0 + d.tallest.y);
        d3.select(this).attr("y", y_top + offset)
      }
    })
    
  // UPDATE
  texts.transition().duration(vizwhiz.timing)
    .attr("opacity",function(){
      if (vars.small || !vars.labels) return 0
      else return 1
    })
  
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Nest data function (needed for getting flat data ready for stacks)
  //-------------------------------------------------------------------
  
  function nest_data(){
    
    var nested = d3.nest()
      .key(function(d){ return d[vars.id_var]; })
      .rollup(function(leaves){
          
        // Make sure all xaxis_vars at least have 0 values
        var years_available = leaves
          .reduce(function(a, b){ return a.concat(b[vars.xaxis_var])}, [])
          .filter(function(y, i, arr) { return arr.indexOf(y) == i })
          
        vars.years.forEach(function(y){
          if(years_available.indexOf(y) < 0){
            var obj = {}
            obj[vars.xaxis_var] = y
            obj[vars.yaxis_var] = 0
            if (leaves[0][vars.id_var]) obj[vars.id_var] = leaves[0][vars.id_var]
            if (leaves[0][vars.text_var]) obj[vars.text_var] = leaves[0][vars.text_var]
            if (leaves[0][vars.color_var]) obj[vars.color_var] = leaves[0][vars.color_var]
            leaves.push(obj)
          }
        })
        
        return leaves.sort(function(a,b){
          return a[vars.xaxis_var]-b[vars.xaxis_var];
        });
        
      })
      .entries(vars.data)
    
    nested.forEach(function(d, i){
      d.total = d3.sum(d.values, function(dd){ return dd[vars.yaxis_var]; })
      d[vars.text_var] = d.values[0][vars.text_var]
      d[vars.id_var] = d.values[0][vars.id_var]
    })
    // return nested
    
    return nested.sort(function(a,b){
          
      var s = vars.sort == "value" ? "total" : vars.sort
      
      a_value = find_variable(a,s)
      b_value = find_variable(b,s)
      
      if (s == vars.color_var) {
      
        a_value = d3.rgb(a_value).hsl()
        b_value = d3.rgb(b_value).hsl()
        
        if (a_value.s == 0) a_value = 361
        else a_value = a_value.h
        if (b_value.s == 0) b_value = 361
        else b_value = b_value.h
        
      }
      
      if(a_value<b_value) return vars.order == "desc" ? -1 : 1;
      if(a_value>b_value) return vars.order == "desc" ? 1 : -1;
      return 0;
      
    });
    
  }

  //===================================================================
    
};
