d3plus.data.stacked = "grouped";
d3plus.vars.stacked = ["xaxis","yaxis"];

d3plus.apps.stacked = function(vars) {
  
  var covered = false
  
  var xaxis_vals = [vars.xaxis_range[0]]
  while (xaxis_vals[xaxis_vals.length-1] < vars.xaxis_range[1]) {
    xaxis_vals.push(xaxis_vals[xaxis_vals.length-1]+1)
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Helper function used to create stack polygon
  //-------------------------------------------------------------------
  
  var stack = d3.layout.stack()
    .values(function(d) { return d.values; })
    .x(function(d) { return d[vars.xaxis]; })
    .y(function(d) { return d[vars.yaxis]; });
  
  //===================================================================
      
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // INIT vars & data munging
  //-------------------------------------------------------------------
  
  // get max total for sums of each xaxis
  if (!vars.app_data) vars.app_data = []
  
  var xaxis_sums = d3.nest()
    .key(function(d){return d[vars.xaxis] })
    .rollup(function(leaves){
      return d3.sum(leaves, function(d){return d[vars.yaxis];})
    })
    .entries(vars.app_data)

  // nest data properly according to nesting array
  var nested_data = nest_data();
  
  var data_max = vars.layout == "share" ? 1 : d3.max(xaxis_sums, function(d){ return d.values; });

  // scales for both X and Y values
  vars.x_scale = d3.scale[vars.xaxis_scale]()
    .domain(d3.extent(xaxis_vals))
    .range([0, vars.graph.width]);
  // **WARNING reverse scale from 0 - max converts from height to 0 (inverse)
  vars.y_scale = d3.scale[vars.yaxis_scale]()
    .domain([0, data_max])
    .range([vars.graph.height, 0]);
    
  graph_update()
  
  // Helper function unsed to convert stack values to X, Y coords 
  var area = d3.svg.area()
    .interpolate(vars.stack_type)
    .x(function(d) { return vars.x_scale(d[vars.xaxis]); })
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
  
  d3.select("#path_clipping rect").transition().duration(d3plus.timing)
    .attr("width",vars.graph.width)
    .attr("height",vars.graph.height)
    .attr("x",1)
    .attr("y",1)
  
  // Get layers from d3.stack function (gives x, y, y0 values)
  var offset = vars.layout == "value" ? "zero" : "expand";

  if (nested_data.length) {
    var layers = stack.offset(offset)(nested_data)
  }
  else {
    var layers = []
  }

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
      return "path_"+d[vars.id]
    })
    .attr("class", "layer")
    .attr("fill", function(d){
      return d3plus.utils.color(vars,d.key)
    })
    .attr("d", function(d) {
      return area(d.values);
    })
    
  small_tooltip = function(d) {
    
    var mouse_x = d3.event.layerX-vars.graph.margin.left;
    var rev_x_scale = d3.scale.linear()
      .domain(vars.x_scale.range()).range(vars.x_scale.domain());
    var this_x = Math.round(rev_x_scale(mouse_x));
    var this_x_index = xaxis_vals.indexOf(this_x)
    var this_value = d.values[this_x_index]
    
    if (this_value[vars.yaxis] != 0) {

      covered = false
    
      var id = d3plus.utils.variable(vars,d,vars.id),
          self = d3.select("#path_"+id).node()
    
      d3.select(self).attr("opacity",1)

      d3.selectAll("line.rule").remove();
    
      // add dashed line at closest X position to mouse location
      d3.selectAll("line.rule").remove()
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
      var tooltip_data = d3plus.utils.tooltip(vars,this_value,"short")
      if (vars.layout == "share") {
        var share = vars.format(this_value.y*100,"share")+"%"
        tooltip_data.push({"name": vars.format("share"), "value": share})
      }
  
      var path_height = vars.y_scale(this_value.y + this_value.y0)-vars.y_scale(this_value.y0),
          tooltip_x = vars.x_scale(this_x)+vars.graph.margin.left+vars.margin.left+vars.parent.node().offsetLeft,
          tooltip_y = vars.y_scale(this_value.y0 + this_value.y)-(path_height/2)+vars.graph.margin.top+vars.margin.top+vars.parent.node().offsetTop

      d3plus.ui.tooltip.remove(vars.type)
      d3plus.ui.tooltip.create({
        "data": tooltip_data,
        "title": d3plus.utils.variable(vars,d[vars.id],vars.text),
        "id": vars.type,
        "icon": d3plus.utils.variable(vars,d[vars.id],"icon"),
        "style": vars.icon_style,
        "color": d3plus.utils.color(vars,d),
        "x": tooltip_x,
        "y": tooltip_y,
        "offset": -(path_height/2),
        "align": "top center",
        "arrow": true,
        "footer": vars.footer_text(),
        "mouseevents": false
      })
      
    }
    
  }
  
  // UPDATE
  paths
    .on(d3plus.evt.over, function(d) {
      small_tooltip(d) 
    })
    .on(d3plus.evt.move, function(d) {
      small_tooltip(d) 
    })
    .on(d3plus.evt.out, function(d){
      
      var id = d3plus.utils.variable(vars,d,vars.id),
          self = d3.select("#path_"+id).node()
      
      d3.selectAll("line.rule").remove()
      d3.select(self).attr("opacity",0.85)
      
      if (!covered) {
        d3plus.ui.tooltip.remove(vars.type)
      }
      
    })
    .on(d3plus.evt.click, function(d){
      
      covered = true
        
      var id = d3plus.utils.variable(vars,d,vars.id)
      var self = this

      var mouse_x = d3.event.layerX-vars.graph.margin.left;
      var rev_x_scale = d3.scale.linear()
        .domain(vars.x_scale.range()).range(vars.x_scale.domain());
      var this_x = Math.round(rev_x_scale(mouse_x));
      var this_x_index = xaxis_vals.indexOf(this_x)
      var this_value = d.values[this_x_index]
      
      make_tooltip = function(html) {
      
        d3.selectAll("line.rule").remove()
        d3plus.ui.tooltip.remove(vars.type)
        d3.select(self).attr("opacity",0.85)
        
        var tooltip_data = d3plus.utils.tooltip(vars,this_value,"long")
        if (vars.layout == "share") {
          var share = vars.format(this_value.y*100,"share")+"%"
          tooltip_data.push({"name": vars.format("share"), "value": share})
        }
        
        d3plus.ui.tooltip.create({
          "title": d3plus.utils.variable(vars,d[vars.id],vars.text),
          "color": d3plus.utils.color(vars,d),
          "icon": d3plus.utils.variable(vars,d[vars.id],"icon"),
          "style": vars.icon_style,
          "id": vars.type,
          "fullscreen": true,
          "html": html,
          "footer": vars.footer,
          "data": tooltip_data,
          "mouseevents": true,
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
  
  paths.transition().duration(d3plus.timing)
    .attr("opacity", 0.85)
    .attr("fill", function(d){
      return d3plus.utils.color(vars,d.key)
    })
    .attr("d", function(d) {
      return area(d.values);
    })

  // EXIT
  paths.exit()
    .transition().duration(d3plus.timing)
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
      if(d.tallest[vars.xaxis] == vars.x_scale.domain()[0]) return "start";
      // if last, right-align text
      if(d.tallest[vars.xaxis] == vars.x_scale.domain()[1]) return "end";
      // otherwise go with middle
      return "middle"
    })
    .attr("fill", function(d){
      return d3plus.utils.text_color(d3plus.utils.color(vars,d))
    })
    .attr("x", function(d){
      var pad = 0;
      // if first, push it off 10 pixels from left side
      if(d.tallest[vars.xaxis] == vars.x_scale.domain()[0]) pad += 10;
      // if last, push it off 10 pixels from right side
      if(d.tallest[vars.xaxis] == vars.x_scale.domain()[1]) pad -= 10;
      return vars.x_scale(d.tallest[vars.xaxis]) + pad;
    })
    .attr("y", function(d){
      var height = vars.graph.height - vars.y_scale(d.tallest.y);
      return vars.y_scale(d.tallest.y0 + d.tallest.y) + (height/2);
    })
    .text(function(d) {
      return d3plus.utils.variable(vars,d[vars.id],vars.text)
    })
    .each(function(d){
      // set usable width to 2x the width of each x-axis tick
      var tick_width = (vars.graph.width / xaxis_vals.length) * 2;
      // if the text box's width is larger than the tick width wrap text
      if(this.getBBox().width > tick_width){
        // first remove the current text
        d3.select(this).text("")
        // figure out the usable height for this location along x-axis
        var height = vars.graph.height-vars.y_scale(d.tallest.y)
        // wrap text WITHOUT resizing
        // d3plus.utils.wordwrap(d[nesting[nesting.length-1]], this, tick_width, height, false)
      
        d3plus.utils.wordwrap({
          "text": d3plus.utils.variable(vars,d[vars.id],vars.text),
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
  texts.transition().duration(d3plus.timing)
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
      .key(function(d){ return d[vars.id]; })
      .rollup(function(leaves){
          
        // Make sure all xaxis_vars at least have 0 values
        var years_available = d3plus.utils.uniques(leaves,vars.xaxis)
        
        xaxis_vals.forEach(function(y){
          if(years_available.indexOf(y) < 0){
            var obj = {}
            obj[vars.xaxis] = y
            obj[vars.yaxis] = 0
            obj[vars.id] = leaves[0][vars.id]
            leaves.push(obj)
          }
        })
        
        return leaves.sort(function(a,b){
          return a[vars.xaxis]-b[vars.xaxis];
        });
        
      })
      .entries(vars.app_data)
    
    nested.forEach(function(d, i){
      d.total = d3.sum(d.values, function(dd){ return dd[vars.yaxis]; })
      d[vars.id] = d.values[0][vars.id]
    })
    
    nested.sort(function(a,b){
          
      var s = vars.sort == "value" ? "total" : vars.sort
      
      a_value = d3plus.utils.variable(vars,a,s)
      b_value = d3plus.utils.variable(vars,b,s)
      
      if (s == vars.color) {
      
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
    
    return nested
    
  }

  //===================================================================
    
};
