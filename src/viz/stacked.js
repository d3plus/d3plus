
vizwhiz.viz.stacked = function() {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Public Variables with Default Settings
  //-------------------------------------------------------------------

  var margin = {top: 10, right: 40, bottom: 80, left: 120},
    width = window.innerWidth,
    height = window.innerHeight,
    size = {
      "width": width-margin.left-margin.right,
      "height": height-margin.top-margin.bottom,
      "x": margin.left,
      "y": margin.top
    },
    value_var = null,
    id_var = null,
    text_var = null,
    xaxis_var = null,
    xaxis_label = "",
    yaxis_label = "",
    nesting = [],
    filter = [],
    layout = "value",
    title = null,
    dispatch = d3.dispatch('elementMouseover', 'elementMouseout');

  //===================================================================


  function chart(selection) {
    selection.each(function(data) {
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // INIT vars & data munging
      //-------------------------------------------------------------------

      // first clone input so we know we are working with fresh data
      var cloned_data = JSON.parse(JSON.stringify(data));
      
      // filter raw data
      cloned_data = cloned_data.filter(function(d){
        // if any of this item's parents are in the filter list, remove it
        for(var i = 0; i < nesting.length; i++){
          if(filter.indexOf(d[nesting[i]]) > -1){
            return false;
          }
        }
        return true
      })
      
      // get unique values for xaxis
      xaxis_vals = cloned_data
        .reduce(function(a, b){ return a.concat(b[xaxis_var]) }, [])
        .filter(function(value, index, self) { 
          return self.indexOf(value) === index;
        })
      
      // get max total for sums of each xaxis
      var xaxis_sums = d3.nest()
        .key(function(d){return d[xaxis_var] })
        .rollup(function(leaves){
          return d3.sum(leaves, function(d){return d[value_var];})
        })
        .entries(cloned_data)
      
      var data_max = layout == "share" ? 1 : d3.max(xaxis_sums, function(d){ return d.values; });
      
      // nest data properly according to nesting array
      nested_data = nest_data(xaxis_vals, cloned_data, xaxis_sums);
      
      // increase top margin if it's not large enough
      margin.top = title && margin.top < 40 ? 40 : margin.top;
      // update size
      size.width = width-margin.left-margin.right;
      size.height = height-margin.top-margin.bottom;
      size.x = margin.left;
      size.y = margin.top;
      
      // scales for both X and Y values
      var x_scale = d3.scale.linear()
        .domain([xaxis_vals[0], xaxis_vals[xaxis_vals.length-1]]).range([0, size.width]);
      // **WARNING reverse scale from 0 - max converts from height to 0 (inverse)
      var y_scale = d3.scale.linear()
        .domain([0, data_max]).range([size.height, 0]);
      
      // Helper function unsed to convert stack values to X, Y coords 
      var area = d3.svg.area()
        .interpolate("monotone")
        .x(function(d) { return x_scale(parseInt(d.key)); })
        .y0(function(d) { return y_scale(d.y0); })
        .y1(function(d) { return y_scale(d.y0 + d.y); });
      
      // Select the svg element, if it exists.
      var svg = d3.select(this).selectAll("svg").data([data]);
      var svg_enter = svg.enter().append("svg")
        .attr('width',width)
        .attr('height',height)
      
      // container for the visualization
      var viz_enter = svg_enter.append("g").attr("class", "viz")
        .attr("transform", "translate(" + size.x + "," + size.y + ")")

      // add grey background for viz
      viz_enter.append("rect")
        .style('stroke','#000')
        .style('stroke-width',1)
        .style('fill','#efefef')
        .attr("class","background")
        .attr('width', size.width)
        .attr('height', size.height)
        .attr('x',0)
        .attr('y',0)
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // TITLE
      //-------------------------------------------------------------------
      
      svg_enter.append("text")
        .attr('width', size.width)
        .attr('x', (size.width/2) + margin.left) 
        .attr('y', margin.top/2)
        .attr('class', 'title')
        .attr("text-anchor", "middle")
        .style("font-weight", "bold")
        .attr("font-size", "14px")
        .attr("font-family", "Helvetica")
        .attr("fill", "#4c4c4c");
        
      d3.select(".title").text(title);
      
      //===================================================================
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // X AXIS
      //-------------------------------------------------------------------
      
      // enter
      var xaxis_enter = viz_enter.append("g")
        .attr("class", "xaxis")
        .attr("transform", "translate(0," + size.height + ")")
      
      // update
      d3.select(".xaxis").call(x_axis.scale(x_scale).ticks(xaxis_vals.length))
      
      // label
      xaxis_enter.append('text')
        .attr('width', size.width)
        .attr('x', size.width/2)
        .attr('y', 60)
        .attr('class', 'axis_title x')
        .attr("text-anchor", "middle")
        .style("font-weight", "bold")
        .attr("font-size", "14px")
        .attr("font-family", "Helvetica")
        .attr("fill", "#4c4c4c")
        .text(xaxis_label)
      
      //===================================================================
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Y AXIS
      //-------------------------------------------------------------------
      
      // enter
      var yaxis_enter = viz_enter.append("g")
        .attr("class", "yaxis")
      
      // update
      d3.select(".yaxis").call(y_axis.scale(y_scale))
      
      // label
      yaxis_enter.append('text')
        .attr('width', size.width)
        .attr('class', 'axis_title y')
        .attr("text-anchor", "middle")
        .style("font-weight", "bold")
        .attr("font-size", "14px")
        .attr("font-family", "Helvetica")
        .attr("fill", "#4c4c4c")
        .attr("transform", "translate(" + (-size.x+25) + "," + (size.y+size.height/2) + ") rotate(-90)")
        .text(yaxis_label)
      
      //===================================================================
      
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // LAYERS
      //-------------------------------------------------------------------
      
      // Get layers from d3.stack function (gives x, y, y0 values)
      var offset = layout == "value" ? "zero" : "expand";
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
        .attr("fill-opacity", 0.8)
        .attr("stroke-width",1)
        .attr("stroke", "#ffffff")
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
      paths.on(vizwhiz.evt.over, function(d){
          this.parentNode.appendChild(this)
          d3.select(this)
            .attr("stroke", "black")
        })
        .on(vizwhiz.evt.out, function(d){
            d3.select(this)
              .attr("stroke", "white")
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
      
      var defs = svg_enter.append('svg:defs')
      vizwhiz.utils.drop_shadow(defs)
      
      // filter layers to only the ones with a height larger than 6% of viz
      var text_layers = [];
      var text_height_scale = d3.scale.linear().range([0, 1]).domain([0, data_max]);
      layers.forEach(function(layer){
        
        // find out which is the largest
        var tallest = d3.max(layer.values, function(d){ return d.y; });
        tallest = layer.values.filter(function(d){ return d.y == tallest; })[0]
        
        // if the height is taller than 6% of the viz height add it to the list
        if(text_height_scale(tallest.y) > 0.06){
          // tallest["id"] = layer.key;
          layer.tallest = tallest;
          text_layers.push(layer)
        }
      })
      
      // container for text layers
      viz_enter.append("g").attr("class", "text_layers")
      
      // give data with key function to variables to draw
      var texts = d3.select("g.text_layers").selectAll(".label")
        .data(text_layers, function(d){ return d.key; })
      
      // ENTER
      texts.enter().append("text")
        .attr('filter', 'url(#dropShadow)')
        .attr("class", "label")
        .style("font-weight","bold")
        .attr("font-size","14px")
        .attr("font-family","Helvetica")
        .attr("x", function(d){
          var pad = 0;
          // determine the index of the tallest item
          var values_index = d.values.indexOf(d.tallest)
          // if first, push it off 10 pixels from left side
          if(values_index == 0) pad += 10;
          // if last, push it off 10 pixels from right side
          if(values_index == d.values.length-1) pad -= 10;
          return x_scale(d.tallest.key) + pad;
        })
        .attr("dy", 6)
        .attr("text-anchor", function(d){
          // determine the index of the tallest item
          var values_index = d.values.indexOf(d.tallest)
          // if first, left-align text
          if(values_index == 0) return "start";
          // if last, right-align text
          if(values_index == d.values.length-1) return "end";
          // otherwise go with middle
          return "middle"
        })
        .attr("fill", function(d){
          return "white"
        })
        .text(function(d) {
          return d[nesting[nesting.length-1]]
        })
      
      // UPDATE
      texts
        .attr("y", function(d){
          var height = size.height - y_scale(d.tallest.y);
          if(d.id == 178701){
            console.log(d.tallest.y0, d.tallest.y, height, y_scale.domain())
          }
          return y_scale(d.tallest.y0 + d.tallest.y) + (height/2);
        })
        .each(function(d){
          // set usable width to 2x the width of each x-axis tick
          var tick_width = (size.width / xaxis_vals.length) * 2;
          // if the text box's width is larger than the tick width wrap text
          if(this.getBBox().width > tick_width){
            // first remove the current text
            d3.select(this).text("")
            // figure out the usable height for this location along x-axis
            var height = size.height-y_scale(d.tallest.y)
            // wrap text WITHOUT resizing
            vizwhiz.utils.wordWrap(d[nesting[nesting.length-1]], this, tick_width, height, false)
            // reset Y to compensate for new multi-line height
            var offset = (height - this.getBBox().height) / 2;
            // top of the element's y attr
            var y_top = y_scale(d.tallest.y0 + d.tallest.y);
            d3.select(this).attr("y", y_top + offset)
          }
        })
      
      // EXIT
      texts.exit().remove()
      
      //===================================================================
      
      
      // Draw foreground bounding box
      viz_enter.append('rect')
        .style('stroke','#000')
        .style('stroke-width',1*2)
        .style('fill','none')
        .attr('class', "border")
        .attr('width', size.width)
        .attr('height', size.height)
        .attr('x',0)
        .attr('y',0)
      
      // Always bring to front
      d3.select("rect.border").node().parentNode.appendChild(d3.select("rect.border").node())
      
    });

    return chart;
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Nest data function (needed for getting flat data ready for stacks)
  //-------------------------------------------------------------------
  
  function nest_data(xaxis_vals, data, xaxis_sums){
    var nest_key = nesting[nesting.length-1];
    var info_lookup = {};
    
    var nested = d3.nest()
      .key(function(d){ return d[nest_key]; })
      .rollup(function(leaves){
        info_lookup[leaves[0][nest_key]] = JSON.parse(JSON.stringify(leaves[0]))
        delete info_lookup[leaves[0][nest_key]][xaxis_var]
        delete info_lookup[leaves[0][nest_key]][value_var]
        
        var values = d3.nest()
          .key(function(d){ return d[xaxis_var]; })
          .rollup(function(l) {
            return d3.sum(l, function(d){ return d[value_var]});
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
    return nested
    
    return nested.sort(function(a,b){
      if(a[sort]<b[sort]) return -1;
      if(a[sort]>b[sort]) return 1;
      return 0;
    });
    
  }

  //===================================================================

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
      d3.select(this.parentNode).append("line")
        .attr("class","tick_line")
        .attr("x1", 0+1)
        .attr("x2", 0+size.width-1)
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("stroke", "#ccc")
        .attr("stroke-width",1/2)
      d3.select(this.parentNode).append("line")
        .attr("class","tick_line")
        .attr("x1", -10)
        .attr("x2", 0-1)
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("stroke", "#000")
        .attr("stroke-width",1)
      if(layout == "share"){
        return d3.format("p")(d);
      }
      return vizwhiz.utils.format_num(d, false, 3, true)
    });

  //===================================================================

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Expose Public Variables
  //-------------------------------------------------------------------

  chart.dispatch = dispatch;

  chart.width = function(x) {
    if (!arguments.length) return width;
    width = x;
    return chart;
  };

  chart.height = function(x) {
    if (!arguments.length) return height;
    height = x;
    return chart;
  };
  
  chart.value_var = function(x) {
    if (!arguments.length) return value_var;
    value_var = x;
    return chart;
  };
  
  chart.id_var = function(x) {
    if (!arguments.length) return id_var;
    id_var = x;
    return chart;
  };
  
  chart.text_var = function(x) {
    if (!arguments.length) return text_var;
    text_var = x;
    return chart;
  };
  
  chart.xaxis_var = function(x) {
    if (!arguments.length) return xaxis_var;
    xaxis_var = x;
    return chart;
  };
  
  chart.xaxis_label = function(x) {
    if (!arguments.length) return xaxis_label;
    xaxis_label = x;
    return chart;
  };
  
  chart.yaxis_label = function(x) {
    if (!arguments.length) return yaxis_label;
    yaxis_label = x;
    return chart;
  };
  
  chart.nesting = function(x) {
    if (!arguments.length) return nesting;
    nesting = x;
    return chart;
  };
  
  chart.filter = function(x) {
    if (!arguments.length) return filter;
    // if we're given an array then overwrite the current filter var
    if(x instanceof Array){
      filter = x;
    }
    // otherwise add/remove it from array
    else {
      // if element is in the array remove it
      if(filter.indexOf(x) > -1){
        filter.splice(filter.indexOf(x), 1)
      }
      // element not in current filter so add it
      else {
        filter.push(x)
      }
    }
    return chart;
  };
  
  chart.layout = function(x) {
    if (!arguments.length) return layout;
    layout = x;
    return chart;
  };
  
  chart.title = function(x) {
    if (!arguments.length) return title;
    title = x;
    return chart;
  };

  chart.margin = function(x) {
    if (!arguments.length) return margin;
    margin.top    = typeof x.top    != 'undefined' ? x.top    : margin.top;
    margin.right  = typeof x.right  != 'undefined' ? x.right  : margin.right;
    margin.bottom = typeof x.bottom != 'undefined' ? x.bottom : margin.bottom;
    margin.left   = typeof x.left   != 'undefined' ? x.left   : margin.left;
    size.width    = width-margin.left-margin.right;
    size.height   = height-margin.top-margin.bottom;
    size.x        = margin.left;
    size.y        = margin.top;
    return chart;
  };

  //===================================================================

  return chart;
};