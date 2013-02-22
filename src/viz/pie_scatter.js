
vizwhiz.viz.pie_scatter = function() {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Public Variables with Default Settings
  //-------------------------------------------------------------------

  var margin = {top: 20, right: 40, bottom: 80, left: 120},
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
    yaxis_var = null,
    yaxis_label = "",
    size_var = null,
    nesting = [],
    stroke = 2,
    dispatch = d3.dispatch('elementMouseover', 'elementMouseout');

  //===================================================================


  function chart(selection) {
    selection.each(function(data) {
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // INIT vars & data munging
      //-------------------------------------------------------------------
      
      // first clone input so we know we are working with fresh data
      var cloned_data = JSON.parse(JSON.stringify(data));
      // nest the flat data by nesting array
      var nested_data = vizwhiz.utils.nest(cloned_data, nesting, true,
          [{"key":"complexity", "agg":"avg"}, {"key":"distance", "agg":"avg"}]);
      // console.log(nested_data.length)
      // return
      
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
      
        var size_scale = d3.scale.linear()
          .domain(d3.extent(nested_data, function(d){ return d[size_var]; }))
          .range([10, d3.min([width,height])/10])
          .nice()

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // X AXIS
      //-------------------------------------------------------------------
      var x_scale = d3.scale.linear()
        .domain(d3.extent(nested_data, function(d){ return d[xaxis_var]; }))
        .range([0, size.width])
        .nice()
      
      // enter
      var xaxis_enter = viz_enter.append("g")
        .attr("class", "xaxis")
        .attr("transform", "translate(0," + size.height + ")")
      
      // update
      d3.select(".xaxis").call(x_axis.scale(x_scale))
      
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
      
      var y_scale = d3.scale.linear()
        .domain(d3.extent(nested_data, function(d){ return d[yaxis_var]; }).reverse())
        .range([0, size.height])
        .nice()
        
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
      // NODES
      //-------------------------------------------------------------------
      
      var arc = d3.svg.arc()
        .innerRadius(0)
        .startAngle(0)
      
      var has_children = nested_data[0].num_children ? true : false;
      
      var nodes = d3.select("g.viz")
        .selectAll("g.circle")
        .data(nested_data, function(d){ return d[nesting[nesting.length-1]]; })
      
      var nodes_enter = nodes.enter().append("g")
        .attr("class", "circle")
        .attr("transform", function(d) { return "translate("+x_scale(d[xaxis_var])+","+y_scale(d[yaxis_var])+")" } )
      
      nodes_enter
        .append("circle")
        .style('stroke', function(d){ return d.color })
        .style('stroke-width', 3)
        .style('fill', function(d){ return d.color })
        .style("fill-opacity", function(d) {
          return d.active ? 0.75 : 0.25;
        })
        .attr("r", function(d){ 
          return size_scale(d[size_var]);
        })
      

      nodes_enter
        .append("path")
        .style('fill', function(d){ return d.color })
        .style("fill-opacity", 1)
      
      // update
      nodes
        .attr("transform", function(d) { return "translate("+x_scale(d[xaxis_var])+","+y_scale(d[yaxis_var])+")" } )
      
      nodes.selectAll("circle")
        .style('fill', function(d){ return d.color })
        .attr("r", function(d){ 
          return size_scale(d[size_var]);
        })
        .on("mouseover", function(d){ console.log(d); })
      
      nodes.selectAll("path")
        .attr("d", function(d){
          var angle = 0, radius = 0;
          if(d.num_children){
            angle = (((d.num_children_active / d.num_children)*360) * (Math.PI/180));
            radius = size_scale(d[size_var]);
          }
          return arc.endAngle(angle).outerRadius(radius)(d);
        })
      
      // exit
      nodes.exit().remove()
      
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
        .attr("y1", 0+stroke)
        .attr("y2", -size.height-stroke)
        .attr("stroke", "#ccc")
        .attr("stroke-width",stroke/2)
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
        .attr("x1", 0+stroke)
        .attr("x2", 0+size.width-stroke)
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("stroke", "#ccc")
        .attr("stroke-width",stroke/2)
      d3.select(this.parentNode).append("line")
        .attr("class","tick_line")
        .attr("x1", -10)
        .attr("x2", 0-stroke)
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("stroke", "#4c4c4c")
        .attr("stroke-width",stroke)
      // return parseFloat(d.toFixed(3))
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
  
  chart.yaxis_var = function(x) {
    if (!arguments.length) return yaxis_var;
    yaxis_var = x;
    return chart;
  };
  
  chart.yaxis_label = function(x) {
    if (!arguments.length) return yaxis_label;
    yaxis_label = x;
    return chart;
  };
  
  chart.size_var = function(x) {
    if (!arguments.length) return size_var;
    size_var = x;
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