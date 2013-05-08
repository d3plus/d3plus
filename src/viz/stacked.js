
vizwhiz.stacked = function(data,vars) {

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
  // X & Y Axis formatting help
  //-------------------------------------------------------------------
  
  var x_axis = d3.svg.axis()
    .tickSize(0)
    .tickPadding(15)
    .orient('bottom')
    .tickFormat(function(d, i) {
      
      d3.select(this)
        .attr("text-anchor","middle")
        .style("font-weight","bold")
        .attr("font-size","12px")
        .attr("font-family","Helvetica")
        .attr("fill","#4c4c4c")
      // vertical lines up and down
      
      var bgtick = d3.select(this.parentNode).selectAll(".bgtick")
        .data([i])
        
      bgtick.enter().append("line")
        .attr("class","bgtick")
        .attr("x1", 0)
        .attr("x2", 0)
        .attr("y1", 0-1)
        .attr("y2", -graph.height+1)
        .attr("stroke", "#ccc")
        .attr("stroke-width",1/2)
      
      bgtick.transition().duration(vizwhiz.timing) 
        .attr("y2", -graph.height+1) 
      
      d3.select(this.parentNode).append("line")
        .attr("class","tick_line")
        .attr("x1", 0)
        .attr("x2", 0)
        .attr("y1", 1)
        .attr("y2", 10)
        .attr("stroke", "#000")
        .attr("stroke-width",1)
      return d
    });
  
  var y_axis = d3.svg.axis()
    .tickSize(0)
    .tickPadding(15)
    .orient('left')
    .tickFormat(function(d, i) {
      d3.select(this)
        .attr("text-anchor","middle")
        .style("font-weight","bold")
        .attr("font-size","12px")
        .attr("font-family","Helvetica")
        .attr("fill","#4c4c4c")
      // horizontal lines across
      
      var bgtick = d3.select(this.parentNode).selectAll(".bgtick")
        .data([i])
        
      bgtick.enter().append("line")
        .attr("class","bgtick")
        .attr("x1", 0+1)
        .attr("x2", 0+graph.width-1)
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("stroke", "#ccc")
        .attr("stroke-width",1/2)
      
      bgtick.transition().duration(vizwhiz.timing) 
        .attr("x2", 0+graph.width-1)
        
      d3.select(this.parentNode).append("line")
        .attr("class","tick_line")
        .attr("x1", -10)
        .attr("x2", 0-1)
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("stroke", "#000")
        .attr("stroke-width",1)
      if(vars.layout == "share"){
        return d3.format("p")(d);
      }
      return vizwhiz.utils.format_num(d, false, 3, true)
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
        "height": vars.height-graph_margin.top-graph_margin.bottom-vars.margin.top,
        "x": graph_margin.left,
        "y": graph_margin.top+vars.margin.top
      }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // INIT vars & data munging
  //-------------------------------------------------------------------
  
  // get unique values for xaxis
  xaxis_vals = data
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
    .entries(data)
  
  var data_max = vars.layout == "share" ? 1 : d3.max(xaxis_sums, function(d){ return d.values; });
  
  // nest data properly according to nesting array
  nested_data = nest_data(xaxis_vals, data, xaxis_sums);
  
  // scales for both X and Y values
  var x_scale = d3.scale.linear()
    .domain([xaxis_vals[0], xaxis_vals[xaxis_vals.length-1]]).range([0, graph.width]);
  // **WARNING reverse scale from 0 - max converts from height to 0 (inverse)
  var y_scale = d3.scale.linear()
    .domain([0, data_max]).range([graph.height, 0]);
  
  // Helper function unsed to convert stack values to X, Y coords 
  var area = d3.svg.area()
    .interpolate("monotone")
    .x(function(d) { return x_scale(parseInt(d.key)); })
    .y0(function(d) { return y_scale(d.y0)-1; })
    .y1(function(d) { return y_scale(d.y0 + d.y); });
  
  // container for the visualization
  var viz_enter = vars.svg_enter.append("g")
    .attr("class", "viz")
    .attr("width", graph.width)
    .attr("height", graph.height)
    .attr("transform", "translate(" + graph.x + "," + graph.y + ")")

  // add grey background for viz
  viz_enter.append("rect")
    .style('stroke','#000')
    .style('stroke-width',1)
    .style('fill','#efefef')
    .attr("class","background")
    .attr('x',0)
    .attr('y',0)
    .attr("opacity",0)
    .attr('width', graph.width)
    .attr('height', graph.height)
  
  // update (in case width and height are changed)
  d3.select(".viz rect").transition().duration(vizwhiz.timing)
    .attr("opacity",1)
    .attr('width', graph.width)
    .attr('height', graph.height)
  
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // X AXIS
  //-------------------------------------------------------------------
  
  // enter axis ticks
  var xaxis_enter = viz_enter.append("g")
    .attr("class", "xaxis")
    .attr("transform", "translate(0," + graph.height + ")")
    .attr("opacity",0)
    .call(x_axis.scale(x_scale))
  
  // update axis ticks
  d3.select(".xaxis").transition().duration(vizwhiz.timing)
    .attr("transform", "translate(0," + graph.height + ")")
    .attr("opacity",1)
    .call(x_axis.scale(x_scale))
  
  // enter label
  xaxis_enter.append('text')
    .attr('class', 'axis_title_x')
    .attr('y', 60)
    .attr("text-anchor", "middle")
    .style("font-weight", "bold")
    .attr("font-size", "14px")
    .attr("font-family", "Helvetica")
    .attr("fill", "#4c4c4c")
    .attr("opacity",0)
    .attr('width', graph.width)
    .attr('x', graph.width/2)
    .text(vars.xaxis_var)
  
  // update label
  d3.select(".axis_title_x").transition().duration(vizwhiz.timing)
    .attr("opacity",1)
    .attr('width', graph.width)
    .attr('x', graph.width/2)
    .text(vars.xaxis_var)
  
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Y AXIS
  //-------------------------------------------------------------------
  
  // enter
  var yaxis_enter = viz_enter.append("g")
    .attr("class", "yaxis")
    .attr("opacity",0)
    .call(y_axis.scale(y_scale))
  
  // update
  d3.select(".yaxis").transition().duration(vizwhiz.timing)
    .attr("opacity",1)
    .call(y_axis.scale(y_scale))
  
  // also update background tick lines
  d3.selectAll(".y_bg_line")
    .attr("x2", graph.width)
  
  // label
  yaxis_enter.append('text')
    .attr('class', 'axis_title_y')
    .attr("text-anchor", "middle")
    .style("font-weight", "bold")
    .attr("font-size", "14px")
    .attr("font-family", "Helvetica")
    .attr("fill", "#4c4c4c")
    .attr("opacity",0)
    .attr('width', graph.width)
    .attr("transform", "translate(" + (graph.x-150) + "," + (graph.y+graph.height/2) + ") rotate(-90)")
    .text(vars.value_var)
  
  // update label
  d3.select(".axis_title_y").transition().duration(vizwhiz.timing)
    .attr("opacity",1)
    .attr('width', graph.width)
    .attr("transform", "translate(" + (graph.x-150) + "," + (graph.y+graph.height/2) + ") rotate(-90)")
    .text(vars.value_var)
  
  //===================================================================
  
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // LAYERS
  //-------------------------------------------------------------------
  
  // Get layers from d3.stack function (gives x, y, y0 values)
  var offset = vars.layout == "value" ? "zero" : "expand";
  var layers = stack.offset(offset)(nested_data)
  
  // container for layers
  viz_enter.append("g").attr("class", "layers")
  
  // give data with key function to variables to draw
  var paths = d3.select("g.layers").selectAll(".layer")
    .data(layers, function(d){ return d.key; })
  
  // ENTER
  // enter new paths, could be next level deep or up a level
  paths.enter().append("path")
    .attr("opacity", 0)
    .attr("class", "layer")
    // .attr("fill-opacity", 0.8)
    // .attr("stroke-width",1)
    // .attr("stroke", "#ffffff")
    .attr("fill", function(d){
      return d.color
    })
    .attr("d", function(d) {
      return area(d.values);
    })
  
  // UPDATE
  paths.transition().duration(vizwhiz.timing)
    .attr("opacity", 1)
    .attr("fill", function(d){
      return d.color
    })
    .attr("d", function(d) {
      return area(d.values);
    });
  // mouseover
  paths
    .on(vizwhiz.evt.move, path_tooltip)
    .on(vizwhiz.evt.out, function(d){
      d3.selectAll("line.rule").remove();
      vizwhiz.tooltip.remove();
    })
    
  function path_tooltip(d){
    d3.selectAll("line.rule").remove();
    var mouse_x = d3.event.layerX-graph_margin.left;
    var rev_x_scale = d3.scale.linear()
      .domain(x_scale.range()).range(x_scale.domain());
    var this_x = Math.round(rev_x_scale(mouse_x));
    var this_x_index = xaxis_vals.indexOf(this_x)
    var this_value = d.values[this_x_index]
    // add dashed line at closest X position to mouse location
    d3.select("g.viz").append("line")
      .datum(d)
      .attr("class", "rule")
      .attr({"x1": x_scale(this_x), "x2": x_scale(this_x)})
      .attr({"y1": y_scale(this_value.y0), "y2": y_scale(this_value.y + this_value.y0)})
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.5)
      .attr("stroke-dasharray", "5,3")
      .on(vizwhiz.evt.over, path_tooltip)
    
    // tooltip
    var tooltip_data = {}
    tooltip_data["Value ("+this_x+")"] = this_value.values;
    vars.tooltip_info.forEach(function(t){
      if (d[t]) tooltip_data[t] = d[t]
    })

    vizwhiz.tooltip.remove();
    vizwhiz.tooltip.create({
      "parent": vars.svg,
      "id": d[vars.id_var],
      "data": tooltip_data,
      "title": d[vars.text_var],
      "x": x_scale(this_x)+graph_margin.left,
      "y": y_scale(this_value.y0 + this_value.y)+(graph.height-y_scale(this_value.y))/2+graph_margin.top,
      "offset": ((graph.height-y_scale(this_value.y))/2)+2,
      "arrow": true
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

    var defs = vars.svg_enter.append('svg:defs')
    vizwhiz.utils.drop_shadow(defs)
  
    // filter layers to only the ones with a height larger than 6% of viz
    var text_layers = [];
    var text_height_scale = d3.scale.linear().range([0, 1]).domain([0, data_max]);
  
    layers.forEach(function(layer){
      // find out which is the largest
      var available_areas = layer.values.filter(function(d,i,a){
      
        var min_height = 30;
        if (i == 0) {
          return (graph.height-y_scale(d.y)) >= min_height 
              && (graph.height-y_scale(a[i+1].y)) >= min_height
              && (graph.height-y_scale(a[i+2].y)) >= min_height
              && y_scale(d.y)-(graph.height-y_scale(d.y0)) < y_scale(a[i+1].y0)
              && y_scale(a[i+1].y)-(graph.height-y_scale(a[i+1].y0)) < y_scale(a[i+2].y0)
              && y_scale(d.y0) > y_scale(a[i+1].y)-(graph.height-y_scale(a[i+1].y0))
              && y_scale(a[i+1].y0) > y_scale(a[i+2].y)-(graph.height-y_scale(a[i+2].y0));
        }
        else if (i == a.length-1) {
          return (graph.height-y_scale(d.y)) >= min_height 
              && (graph.height-y_scale(a[i-1].y)) >= min_height
              && (graph.height-y_scale(a[i-2].y)) >= min_height
              && y_scale(d.y)-(graph.height-y_scale(d.y0)) < y_scale(a[i-1].y0)
              && y_scale(a[i-1].y)-(graph.height-y_scale(a[i-1].y0)) < y_scale(a[i-2].y0)
              && y_scale(d.y0) > y_scale(a[i-1].y)-(graph.height-y_scale(a[i-1].y0))
              && y_scale(a[i-1].y0) > y_scale(a[i-2].y)-(graph.height-y_scale(a[i-2].y0));
        }
        else {
          return (graph.height-y_scale(d.y)) >= min_height 
              && (graph.height-y_scale(a[i-1].y)) >= min_height
              && (graph.height-y_scale(a[i+1].y)) >= min_height
              && y_scale(d.y)-(graph.height-y_scale(d.y0)) < y_scale(a[i+1].y0)
              && y_scale(d.y)-(graph.height-y_scale(d.y0)) < y_scale(a[i-1].y0)
              && y_scale(d.y0) > y_scale(a[i+1].y)-(graph.height-y_scale(a[i+1].y0))
              && y_scale(d.y0) > y_scale(a[i-1].y)-(graph.height-y_scale(a[i-1].y0));
        }
      });
      var best_area = d3.max(layer.values,function(d,i){
        if (available_areas.indexOf(d) >= 0) {
          if (i == 0) {
            return (graph.height-y_scale(d.y))
                 + (graph.height-y_scale(layer.values[i+1].y))
                 + (graph.height-y_scale(layer.values[i+2].y));
          }
          else if (i == layer.values.length-1) {
            return (graph.height-y_scale(d.y))
                 + (graph.height-y_scale(layer.values[i-1].y))
                 + (graph.height-y_scale(layer.values[i-2].y));
          }
          else {
            return (graph.height-y_scale(d.y))
                 + (graph.height-y_scale(layer.values[i-1].y))
                 + (graph.height-y_scale(layer.values[i+1].y));
          }
        } else return null;
      });
      var best_area = layer.values.filter(function(d,i,a){
        if (i == 0) {
          return (graph.height-y_scale(d.y))
               + (graph.height-y_scale(layer.values[i+1].y))
               + (graph.height-y_scale(layer.values[i+2].y)) == best_area;
        }
        else if (i == layer.values.length-1) {
          return (graph.height-y_scale(d.y))
               + (graph.height-y_scale(layer.values[i-1].y))
               + (graph.height-y_scale(layer.values[i-2].y)) == best_area;
        }
        else {
          return (graph.height-y_scale(d.y))
               + (graph.height-y_scale(layer.values[i-1].y))
               + (graph.height-y_scale(layer.values[i+1].y)) == best_area;
        }
      })[0]
      if (best_area) {
        layer.tallest = best_area
        text_layers.push(layer)
      }
    
    })
    // container for text layers
    viz_enter.append("g").attr("class", "text_layers")

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
      .attr('filter', 'url(#dropShadow)')
      .attr("class", "label")
      .style("font-weight","bold")
      .attr("font-size","14px")
      .attr("font-family","Helvetica")
      .attr("dy", 6)
      .attr("opacity",0)
      .attr("text-anchor", function(d){
        // if first, left-align text
        if(d.tallest.key == x_scale.domain()[0]) return "start";
        // if last, right-align text
        if(d.tallest.key == x_scale.domain()[1]) return "end";
        // otherwise go with middle
        return "middle"
      })
      .attr("fill", function(d){
        return "white"
      })
      .attr("x", function(d){
        var pad = 0;
        // if first, push it off 10 pixels from left side
        if(d.tallest.key == x_scale.domain()[0]) pad += 10;
        // if last, push it off 10 pixels from right side
        if(d.tallest.key == x_scale.domain()[1]) pad -= 10;
        return x_scale(d.tallest.key) + pad;
      })
      .attr("y", function(d){
        var height = graph.height - y_scale(d.tallest.y);
        return y_scale(d.tallest.y0 + d.tallest.y) + (height/2);
      })
      .text(function(d) {
        return d[vars.text_var]
      })
      .on(vizwhiz.evt.over, path_tooltip)
      .each(function(d){
        // set usable width to 2x the width of each x-axis tick
        var tick_width = (graph.width / xaxis_vals.length) * 2;
        // if the text box's width is larger than the tick width wrap text
        if(this.getBBox().width > tick_width){
          // first remove the current text
          d3.select(this).text("")
          // figure out the usable height for this location along x-axis
          var height = graph.height-y_scale(d.tallest.y)
          // wrap text WITHOUT resizing
          // vizwhiz.utils.wordwrap(d[nesting[nesting.length-1]], this, tick_width, height, false)
        
          vizwhiz.utils.wordwrap({
            "text": d[vars.text_var],
            "parent": this,
            "width": tick_width,
            "height": height,
            "resize": false
          })
        
          // reset Y to compensate for new multi-line height
          var offset = (height - this.getBBox().height) / 2;
          // top of the element's y attr
          var y_top = y_scale(d.tallest.y0 + d.tallest.y);
          d3.select(this).attr("y", y_top + offset)
        }
      })
  
    // UPDATE
    texts.transition().duration(vizwhiz.timing)
      .attr("opacity",1)
      
  }
  
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
    .attr("opacity",0)
  
  // update (in case width and height are changed)
  d3.select(".border").transition().duration(vizwhiz.timing)
    .attr('width', graph.width)
    .attr('height', graph.height)
    .attr("opacity",1)
  
  // Always bring to front
  d3.select("rect.border").node().parentNode.appendChild(d3.select("rect.border").node())
  
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
      .entries(data)
    
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
