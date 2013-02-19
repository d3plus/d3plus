
vizwhiz.viz.stacked = function() {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Public Variables with Default Settings
  //-------------------------------------------------------------------

  var margin = {top: 5, right: 40, bottom: 20, left: 120},
    width = window.innerWidth,
    height = window.innerHeight,
    depth = null,
    value_var = null,
    id_var = null,
    text_var = null,
    xaxis_var = null,
    nesting = [],
    dispatch = d3.dispatch('elementMouseover', 'elementMouseout');

  //===================================================================


  function chart(selection) {
    selection.each(function(data) {
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // INIT vars & data munging
      //-------------------------------------------------------------------
      
      var size = {
        "width": width-margin.left-margin.right,
        "height": height-margin.top-margin.bottom,
        "x": margin.left,
        "y": margin.top
      }
      
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
      viz_enter.append("g")
        .attr("class", "xaxis")
        .attr("transform", "translate(0," + size.height + ")")
      
      // update
      d3.select(".xaxis").call(x_axis.scale(x_scale).ticks(xaxis_vals.length))
      
      //===================================================================
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Y AXIS
      //-------------------------------------------------------------------
      
      // enter
      viz_enter.append("g")
        .attr("class", "yaxis")
      
      // update
      d3.select(".yaxis").call(y_axis)
      
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
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Helper function unsed to convert stack values to X, Y coords 
  //-------------------------------------------------------------------
  
  var area = d3.svg.area()
    .interpolate("monotone")
    .x(function(d) { return x_scale(parseInt(d.key)); })
    .y0(function(d) { return y_scale(d.y0); })
    .y1(function(d) { return y_scale(d.y0 + d.y); });
  
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
    .scale(y_scale)
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
      return vizwhiz.utils.format_num(d, false, 2)
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
    return chart;
  };

  //===================================================================

  return chart;
};