
vizwhiz.viz.stacked = function() {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Public Variables with Default Settings
  //-------------------------------------------------------------------

  var margin = {top: 5, right: 40, bottom: 20, left: 120},
    width = window.innerWidth,
    height = window.innerHeight,
    size = {
      "width": width-margin.left-margin.right,
      "height": height-margin.top-margin.bottom,
      "x": margin.left,
      "y": margin.top
    },
    depth = null,
    value_var = null,
    id_var = null,
    text_var = null,
    xaxis_var = null,
    xaxis_label = "",
    yaxis_label = "",
    nesting = [],
    dispatch = d3.dispatch('elementMouseover', 'elementMouseout');

  //===================================================================


  function chart(selection) {
    selection.each(function(data) {
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // INIT vars & data munging
      //-------------------------------------------------------------------
      
      // get unique values for xaxis
      xaxis_vals = data
        .reduce(function(a, b){ return a.concat(b.year) }, [])
        .filter(function(value, index, self) { 
          return self.indexOf(value) === index;
        })
      
      // nest data properly according to nesting array
      nested_data = nest_data(xaxis_vals, data);
      
      // get max total for sums of each year
      var data_max = d3.max(d3.nest()
        .key(function(d){return d.year})
        .rollup(function(leaves){
          return d3.sum(leaves, function(d){return d[value_var];})
        })
        .entries(data), function(d){ return d.values; });
      
      // scales for both X and Y values
      var x_scale = d3.scale.linear()
        .domain([xaxis_vals[0], xaxis_vals[xaxis_vals.length-1]]).range([0, size.width]);
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
      var layers = stack(nested_data)
      
      // give data with key function to variables to draw
      var paths = d3.select("g.viz").selectAll(".layer")
        .data(layers, function(d){ return d.key; })
      
      // enter new paths, could be next level deep or up a level
      paths.enter().append("path")
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
      
      // update
      paths
        .attr("fill", function(d){
          return d.color
        })
        .attr("d", function(d) {
          return area(d.values);
        })
      
      // exit
      paths.exit().remove()
      
      //===================================================================
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // TEXT LAYERS
      // TODO: add text wrapping for long labels
      //-------------------------------------------------------------------
      
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
      
      // give data with key function to variables to draw
      var texts = d3.select("g.viz").selectAll(".label")
        .data(text_layers, function(d){ return d.key; })
      
      // enter new paths, could be next level deep or up a level
      texts.enter().append("text")
        .attr("class", "label")
        .style("font-weight","bold")
        .attr("font-size","14px")
        .attr("font-family","Helvetica")
        .attr("x", function(d){
          var pad = 0;
          var values_index = d.values.indexOf(d.tallest)
          if(values_index == 0) pad += 10;
          if(values_index == d.values.length-1) pad -= 10;
          return x_scale(d.tallest.key) + pad;
        })
        .attr("dy", 6)
        .attr("y", function(d){
          d = d.tallest;
          var height = y_scale(d.y0 - d.y) - y_scale(d.y0 + d.y);
          return y_scale(d.y0 + d.y) + (height/4);
        })
        .attr("text-anchor", function(d){
          var values_index = d.values.indexOf(d.tallest)
          if(values_index == 0) return "start";
          if(values_index == d.values.length-1) return "end";
          return "middle"
        })
        .attr("fill", function(d){
          return "white"
        })
        .text(function(d) { 
          return d[nesting[nesting.length-1]]
        })
      
      // exit
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
  
  function nest_data(xaxis_vals, data){
    var nest_key = nesting[nesting.length-1];
    var info_lookup = {};
    
    var nested = d3.nest()
      .key(function(d){ return d[nest_key]; })
      .rollup(function(leaves){
        info_lookup[leaves[0][nest_key]] = JSON.parse(JSON.stringify(leaves[0]))
        delete info_lookup[leaves[0][nest_key]][xaxis_var]
        delete info_lookup[leaves[0][nest_key]][value_var]
        
        var values = d3.nest()
          .key(function(d){ return d.year; })
          .rollup(function(l) { return d3.sum(l, function(d){ return d[value_var]})})
          .entries(leaves)
        
        // Make sure all years at least have 0 values
        years_available = values
          .reduce(function(a, b){ return a.concat(b.key)}, [])
          .filter(function(y, i, arr) { return arr.indexOf(y) == i })
        
        xaxis_vals.forEach(function(y){
          if(years_available.indexOf(""+y) < 0){
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
  
  chart.depth = function(x) {
    if (!arguments.length) return depth;
    depth = x;
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