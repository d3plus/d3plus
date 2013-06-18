
vizwhiz.stacked = function(vars) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Helper function used to create stack polygon
  //-------------------------------------------------------------------
  
  var stack = d3.layout.stack()
    .offset("zero")
    .values(function(d) { return d.values; })
    .x(function(d) { return parseInt(d.key); })
    .y(function(d) { return d.values; });
  
  //===================================================================
      
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // INIT vars & data munging
  //-------------------------------------------------------------------
  
  // get unique values for xaxis
  xaxis_vals = vars.data
    .reduce(function(a, b){ return a.concat(b[vars.xaxis_var]) }, [])
    .filter(function(value, index, self) { 
      return self.indexOf(value) === index;
    })
    
  // get max total for sums of each xaxis
  var xaxis_sums = d3.nest()
    .key(function(d){return d[vars.xaxis_var] })
    .rollup(function(leaves){
      return d3.sum(leaves, function(d){return d[vars.value_var];})
    })
    .entries(vars.data)
  
  var data_max = vars.layout == "share" ? 1 : d3.max(xaxis_sums, function(d){ return d.values; });
  
  // nest data properly according to nesting array
  nested_data = nest_data(xaxis_vals, vars.data, xaxis_sums);
  
  // scales for both X and Y values
  vars.x_scale = d3.scale.linear()
    .domain([xaxis_vals[0], xaxis_vals[xaxis_vals.length-1]])
    .range([0, vars.graph.width]);
  // **WARNING reverse scale from 0 - max converts from height to 0 (inverse)
  vars.y_scale = d3.scale.linear()
    .domain([0, data_max])
    .range([vars.graph.height, 0]);
    
  vars.yaxis_var = vars.value_var
    
  graph_update()
  
  // Helper function unsed to convert stack values to X, Y coords 
  var area = d3.svg.area()
    .interpolate("monotone")
    .x(function(d) { return vars.x_scale(parseInt(d.key)); })
    .y0(function(d) { return vars.y_scale(d.y0); })
    .y1(function(d) { return vars.y_scale(d.y0 + d.y)+1; });
  
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // LAYERS
  //-------------------------------------------------------------------
  
  // Get layers from d3.stack function (gives x, y, y0 values)
  var offset = vars.layout == "value" ? "zero" : "expand";
  var layers = stack.offset(offset)(nested_data)
  
  // container for layers
  vars.chart_enter.append("g").attr("class", "layers")
  
  // give data with key function to variables to draw
  var paths = d3.select("g.layers").selectAll(".layer")
    .data(layers, function(d){ return d.key; })
  
  // ENTER
  // enter new paths, could be next level deep or up a level
  paths.enter().append("path")
    .attr("opacity", 0)
    .attr("class", "layer")
    .attr("stroke",vars.highlight_color)
    .attr("stroke-width",0)
    .attr("fill", function(d){
      return find_variable(d[vars.id_var],"color")
    })
    .attr("d", function(d) {
      return area(d.values);
    })
  
  // UPDATE
  paths
    .on(vizwhiz.evt.over, function(d){
      d3.select(this).attr("stroke-width",3)
    })
    .on(vizwhiz.evt.move, path_tooltip)
    .on(vizwhiz.evt.out, function(d){
      d3.selectAll("line.rule").remove();
      vizwhiz.tooltip.remove();
      d3.select(this).attr("stroke-width",0)
    })
  
  paths.transition().duration(vizwhiz.timing)
    .attr("opacity", 1)
    .attr("fill", function(d){
      return find_variable(d[vars.id_var],"color")
    })
    .attr("d", function(d) {
      return area(d.values);
    })
    
  function path_tooltip(d){
    d3.selectAll("line.rule").remove();
    var mouse_x = d3.event.layerX-vars.graph.margin.left;
    var rev_x_scale = d3.scale.linear()
      .domain(vars.x_scale.range()).range(vars.x_scale.domain());
    var this_x = Math.round(rev_x_scale(mouse_x));
    var this_x_index = xaxis_vals.indexOf(this_x)
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
      .on(vizwhiz.evt.over, path_tooltip)
    
    // tooltip
    var tooltip_data = get_tooltip_data(d[vars.id_var])

    vizwhiz.tooltip.remove();
    vizwhiz.tooltip.create({
      "data": tooltip_data,
      "title": find_variable(d[vars.id_var],vars.text_var),
      "id": d[vars.id_var],
      "color": find_variable(d[vars.id_var],"color"),
      "x": vars.x_scale(this_x)+vars.graph.margin.left+vars.margin.left+vars.parent.node().offsetLeft,
      "y": vars.y_scale(this_value.y0 + this_value.y)+(vars.graph.height-vars.y_scale(this_value.y))/2+vars.graph.margin.top+vars.margin.top+vars.parent.node().offsetTop,
      "offset": ((vars.graph.height-vars.y_scale(this_value.y))/2)+2,
      "arrow": true,
      "mouseevents": false
    })
  }
  
  // EXIT
  paths.exit()
    .transition().duration(vizwhiz.timing)
    .attr("opacity", 0)
    .remove()
  
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // TEXT LAYERS
  //-------------------------------------------------------------------
  
  if (!vars.small) {

    var defs = vars.chart_enter.append('svg:defs')
    vizwhiz.utils.drop_shadow(defs)
  
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
      .style("font-weight","bold")
      .attr("font-size","14px")
      .attr("font-family","Helvetica")
      .attr("dy", 6)
      .attr("opacity",0)
      .attr("text-anchor", function(d){
        // if first, left-align text
        if(d.tallest.key == vars.x_scale.domain()[0]) return "start";
        // if last, right-align text
        if(d.tallest.key == vars.x_scale.domain()[1]) return "end";
        // otherwise go with middle
        return "middle"
      })
      .attr("fill", function(d){
        return vizwhiz.utils.text_color(find_variable(d[vars.id_var],"color"))
      })
      .attr("x", function(d){
        var pad = 0;
        // if first, push it off 10 pixels from left side
        if(d.tallest.key == vars.x_scale.domain()[0]) pad += 10;
        // if last, push it off 10 pixels from right side
        if(d.tallest.key == vars.x_scale.domain()[1]) pad -= 10;
        return vars.x_scale(d.tallest.key) + pad;
      })
      .attr("y", function(d){
        var height = vars.graph.height - vars.y_scale(d.tallest.y);
        return vars.y_scale(d.tallest.y0 + d.tallest.y) + (height/2);
      })
      .text(function(d) {
        return find_variable(d[vars.id_var],vars.text_var)
      })
      .on(vizwhiz.evt.over, path_tooltip)
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
      .attr("opacity",1)
      
  }
  
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Nest data function (needed for getting flat data ready for stacks)
  //-------------------------------------------------------------------
  
  function nest_data(xaxis_vals, data, xaxis_sums){
    var info_lookup = {};
    
    var nested = d3.nest()
      .key(function(d){ return d[vars.id_var]; })
      .rollup(function(leaves){
        
        info_lookup[leaves[0][vars.id_var]] = JSON.parse(JSON.stringify(leaves[0]))
        delete info_lookup[leaves[0][vars.id_var]][vars.xaxis_var]
        delete info_lookup[leaves[0][vars.id_var]][vars.value_var]
        
        var values = d3.nest()
          .key(function(d){ return d[vars.xaxis_var]; })
          .rollup(function(l) {
            return d3.sum(l, function(d){ return d[vars.value_var]});
          })
          .entries(leaves)
        
        // Make sure all xaxis_vars at least have 0 values
        xaxis_vars_available = values
          .reduce(function(a, b){ return a.concat(b.key)}, [])
          .filter(function(y, i, arr) { return arr.indexOf(y) == i })
        
        xaxis_vals.forEach(function(y){
          if(xaxis_vars_available.indexOf(""+y) < 0){
            values.push({"key": ""+y, "values": 0})
          }
        })

        return values.sort(function(a,b){return a.key-b.key;});
      })
      .entries(vars.data)
    
    nested.forEach(function(d, i){
      d["total"] = d3.sum(d.values, function(dd){ return dd.values; })
      nested[i] = vizwhiz.utils.merge(d, info_lookup[d.key]);
    })
    // return nested
    
    return nested.sort(function(a,b){
      if(a[vars.sort]<b[vars.sort]) return vars.order == "desc" ? -1 : 1;
      if(a[vars.sort]>b[vars.sort]) return vars.order == "desc" ? 1 : -1;
      return 0;
    });
    
  }

  //===================================================================
    
};
