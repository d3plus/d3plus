(function(){
var d3plus = window.d3plus || {};
window.d3plus = d3plus;

d3plus.version = "0.9";

d3plus.timing = 600; // milliseconds for animations

d3plus.ie = /*@cc_on!@*/false;

d3plus.evt = {}; // stores all mouse events that could occur

// Modernizr touch events
if (Modernizr && Modernizr.touch) {
  d3plus.evt.click = "touchend"
  d3plus.evt.down = "touchstart"
  d3plus.evt.up = "touchend"
  d3plus.evt.over = "touchstart"
  d3plus.evt.out = "touchend"
  d3plus.evt.move = "touchmove"
} else {
  d3plus.evt.click = "click"
  d3plus.evt.down = "mousedown"
  d3plus.evt.up = "mouseup"
  if (d3plus.ie) {
    d3plus.evt.over = "mouseenter"
    d3plus.evt.out = "mouseleave"
  }
  else {
    d3plus.evt.over = "mouseover"
    d3plus.evt.out = "mouseout"
  }
  d3plus.evt.move = "mousemove"
}

d3plus.apps = {};
d3plus.data = {};
d3plus.vars = {};
d3plus.ui = {};
d3plus.utils = {};d3plus.viz = function() {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Public Variables with Default Settings
  //-------------------------------------------------------------------
  
  var vars = {
    "arc_angles": {},
    "arc_inners": {},
    "arc_sizes": {},
    "aggs": {},
    "attrs": {},
    "background": "#ffffff",
    "check": [],
    "check_vars": ["value","xaxis","yaxis","year_var","active","unique_axis"],
    "color_domain": [],
    "color_range": ["#ff0000","#888888","#00ff00"],
    "color_scale": d3.scale.sqrt().interpolate(d3.interpolateRgb),
    "coord_change": false,
    "depth": 0,
    "descs": {},
    "dev": false,
    "donut": true,
    "else_var": "elsewhere",
    "error": "",
    "filter": [],
    "font": "sans-serif",
    "font_weight": "normal",
    "footer": false,
    "footer_text": function() {

      var text = vars.click_function || vars.tooltip.long ? vars.format("Click for More Info") : null
    
      if (!text && vars.type == "geo_map") return vars.format("Click to Zoom")
      else return text
    
    },
    "format": function(value,name) {
      if (typeof value === "number") return vars.number_format(value,name)
      if (typeof value === "string") return vars.text_format(value,name)
      else return value
    },
    "graph": {"timing": 0},
    "group_bgs": true,
    "grouping": "name",
    "heat_map": ["#00008f", "#003fff", "#00efff", "#ffdf00", "#ff3000", "#7f0000"],
    "highlight_color": "#cc0000",
    "icon": "icon",
    "icon_style": "default",
    "id": "id",
    "init": true,
    "labels": true,
    "layout": "value",
    "margin": {"top": 0, "right": 0, "bottom": 0, "left": 0},
    "mirror_axis": false,
    "number_format": function(value,name) { 
      if (["year",vars.id].indexOf(name) >= 0 || typeof value === "string") {
        return value
      }
      else if (value < 1) {
        return d3.round(value,2)
      }
      else if (value.toString().split(".")[0].length > 4) {
        var symbol = d3.formatPrefix(value).symbol
        symbol = symbol.replace("G", "B") // d3 uses G for giga
        
        // Format number to precision level using proper scale
        value = d3.formatPrefix(value).scale(value)
        value = parseFloat(d3.format(".3g")(value))
        return value + symbol;
      }
      else if (name == "share") {
        return d3.format(".2f")(value)
      }
      else {
        return d3.format(",f")(value)
      }
      
    },
    "order": "asc",
    "projection": d3.geo.mercator(),
    "scroll_zoom": false,
    "secondary_color": "#ffdddd",
    "size_scale_type": "sqrt",
    "solo": [],
    "sort": "total",
    "spotlight": true,
    "stack_type": "linear",
    "static_axes": true,
    "svg_height": window.innerHeight,
    "svg_width": window.innerWidth,
    "text_format": function(text,name) {
      return text.charAt(0).toUpperCase() + text.substr(1).toLowerCase() 
    },
    "text": "name",
    "text_obj": {},
    "title_center": true,
    "title_height": 0,
    "tooltip": [],
    "total_bar": false,
    "type": "tree_map",
    "value": "value",
    "xaxis_scale": "linear",
    "yaxis_scale": "linear",
    "year": "all",
    "zoom_behavior": d3.behavior.zoom()
  }
  
  //===================================================================

  chart = function(selection) {
    selection.each(function(datum) {
      
      // Set vars.parent to the container <div> element
      if (!vars.parent) vars.parent = d3.select(this)
      
      // All of the data-munging
      d3plus.utils.data(vars,datum);
      
      // Set up the color range, if necessary
      d3plus.utils.color(vars);
      
      // remove all tooltip for app type
      d3plus.ui.tooltip.remove(vars.type);
      
      vars.svg = vars.parent.selectAll("svg").data([vars.app_data]);
      
      vars.svg_enter = vars.svg.enter().append("svg")
        .attr('width',vars.svg_width)
        .attr('height',vars.svg_height)
        
      vars.svg_enter.append("rect")
        .attr("id","svgbg")
        .attr("fill",vars.background)
        .attr('width',vars.svg_width)
        .attr('height',vars.svg_height)
    
      vars.svg.transition().duration(d3plus.timing)
        .attr('width',vars.svg_width)
        .attr('height',vars.svg_height)
    
      vars.svg.select("rect#svgbg").transition().duration(d3plus.timing)
        .attr('width',vars.svg_width)
        .attr('height',vars.svg_height)
      
      vars.parent
        .style("width",vars.svg_width+"px")
        .style("height",vars.svg_height+"px")
        .style("overflow","hidden")
      
      vars.width = vars.svg_width;
      
      vars.svg_enter.append("g")
        .attr("class","titles")
      
      vars.svg_enter.append("g")
        .attr("class","footer")
        .attr("transform","translate(0,"+vars.svg_height+")")

      // Update Titles
      d3plus.utils.titles(vars);
      
      vars.height = vars.svg_height - vars.margin.top - vars.margin.bottom;
      
      vars.graph.height = vars.height-vars.graph.margin.top-vars.graph.margin.bottom
      
      vars.svg_enter.append("clipPath")
        .attr("id","clipping")
        .append("rect")
          .attr("id","parent_clip")
          .attr("width",vars.width)
          .attr("height",vars.height)
    
      vars.parent_enter = vars.svg_enter.append("g")
        .attr("class","parent")
        .attr("clip-path","url(#clipping)")
        .attr("transform","translate("+vars.margin.left+","+vars.margin.top+")")
    
      vars.svg.select("g.parent").transition().duration(d3plus.timing)
        .attr("transform","translate("+vars.margin.left+","+vars.margin.top+")")
    
      vars.svg.select("rect#parent_clip").transition().duration(d3plus.timing)
        .attr("width",vars.width)
        .attr("height",vars.height)
      
      vars.parent_enter.append("defs")
      vars.defs = d3.select("g.parent").select("defs")
      
      
      vars.loader = vars.parent.selectAll("div#d3plus_loader").data([vars.app_data]);
      
      vars.loader.enter().append("div")
        .attr("id","d3plus_loader")
        .style("background-color",vars.background)
        .style("display","none")
        .append("div")
          .attr("id","d3plus_loader_text")
          .style("font-family",vars.font)
          .style("font-weight",vars.font_weight)
          .style(vars.info_style)
          .text(vars.format("Loading..."))
          
      if (!vars.error && !vars.app_data) {
        vars.internal_error = vars.format("No Data Available","error")
      }
      else if (vars.type == "rings" && !vars.connections[vars.highlight]) {
        vars.app_data = null
        vars.internal_error = vars.format("No Connections Available","error")
      }
      else if (vars.error) {
        vars.app_data = null
        if (error === true) {
          vars.internal_error = vars.format("Error","error")
        }
        else {
          vars.internal_error = vars.format(error,"error")
        }
      }
      else {
        vars.internal_error = ""
      }
      
      // Finally, call the specific App to draw
      if (vars.dev) console.group("%c[d3plus]%c Drawing \"" + vars.type + "\"","font-weight:bold","font-weight: normal")
      d3plus.apps[vars.type](vars)
      if (vars.dev) console.groupEnd();
      
      d3plus.utils.error(vars)
      
    });
    
    return chart;
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Expose Public Variables
  //-------------------------------------------------------------------
  
  chart.csv = function(x) {
    
    if (x instanceof Array) vars.csv_columns = x
    
    var csv_to_return = [],
        column_init = vars.csv_columns,
        columns = [], titles = []

    if (column_init.indexOf(vars.id) < 0) column_init.unshift(vars.id)
    if (column_init.indexOf(vars.year_var) < 0) column_init.unshift(vars.year_var)
    if (column_init.indexOf(vars.text) < 0) column_init.unshift(vars.text)
    if (column_init.indexOf(vars.value) < 0) column_init.unshift(vars.value)
    
    // filter out the columns (if specified)
    column_init.forEach(function(c){
      if (vars.keys[c] || c == vars.text) {
        columns.push(c)
        titles.push(vars.format(c))
      }
    })
    
    csv_to_return.push(titles);
    
    if (vars.type == "tree_map") {
      
      var arr = []
      
      function flatted_children(c) {
        if (c.children) {
          c.children.forEach(function(c2){
            flatted_children(c2)
          })
        }
        else {
          arr.push(c)
        }
      }
      
      flatted_children(vars.app_data)
      
    }
    else if (vars.app_data instanceof Array) {
      var arr = vars.app_data
    }
    else {
      var arr = d3.values(vars.app_data)
    }
    
    arr.forEach(function(d){
      
      var ret = []
      columns.forEach(function(c){
        ret.push(d3plus.utils.variable(vars,d,c))
      })
      csv_to_return.push(ret)
    })
    return csv_to_return;
  };
  
  chart.coords = function(x) {
    if (!arguments.length) return vars.coords;
    vars.coord_change = true
    x.objects[Object.keys(x.objects)[0]].geometries.forEach(function(f){
      f.id = f[vars.id]
    });
    vars.coords = topojson.feature(x, x.objects[Object.keys(x.objects)[0]]).features
    
    function polygon(ring) {
      var polygon = [ring];
      ring.push(ring[0]); // add closing coordinate
      if (d3.geo.area({type: "Polygon", coordinates: polygon}) > 2 * Math.PI) ring.reverse(); // fix winding order
      return polygon;
    }
    
    var selectedStates = {type: "GeometryCollection", geometries: x.objects[Object.keys(x.objects)[0]].geometries},
        selectionBoundary = topojson.mesh(x, selectedStates, function(a, b) { return a === b; })
        
    vars.boundaries = {type: "MultiPolygon", coordinates: selectionBoundary.coordinates.map(polygon)};
    
    return chart;
  };
  
  chart.depth = function(x) {
    if (!arguments.length) return vars.depth;
    
    // Set appropriate depth and id
    if (x >= vars.nesting.length) vars.depth = vars.nesting.length-1
    else if (x < 0) vars.depth = 0
    else vars.depth = x;
    vars.id = vars.nesting[vars.depth]
    
    // Set appropriate name_array and text
    var n = vars.text_obj[vars.id]
    if (n) {
      vars.name_array = typeof n == "string" ? [n] : n
      vars.text = vars.name_array[0]
    }
    
    return chart;
  };

  chart.filter = function(x) {
    if (!arguments.length) return vars.filter;
    // if we're given an array then overwrite the current filter var
    if(x instanceof Array){
      vars.filter = x;
    }
    // otherwise add/remove it from array
    else {
      // if element is in the array remove it
      if(vars.filter.indexOf(x) > -1){
        vars.filter.splice(vars.filter.indexOf(x), 1)
      }
      // if element is in the solo array remove it and add to this one
      else if(vars.solo.indexOf(x) > -1){
        vars.solo.splice(vars.solo.indexOf(x), 1)
        vars.filter.push(x)
      }
      // element not in current filter so add it
      else {
        vars.filter.push(x)
      }
    }
    vars.check.push("filter")
    return chart;
  };
  
  chart.font = function(x) {
    if (!arguments.length) return vars.font;
    vars.font = x;
    return chart;
  };
  
  chart.font_weight = function(x) {
    if (!arguments.length) return vars.font_weight;
    vars.font_weight = x;
    return chart;
  };

  chart.height = function(x) {
    if (!arguments.length) return vars.svg_height;
    vars.svg_height = x;
    return chart;
  };
  
  chart.id = function(x) {
    if (!arguments.length) return vars.id;
    if (x instanceof Array) {
      vars.nesting = x
      if (vars.depth < x.length) vars.id = x[vars.depth]
      else {
        vars.id = x[0]
        vars.depth = 0
      }
    }
    else {
      vars.id = x
      vars.nesting = [x]
      vars.depth = 0
    }
    return chart;
  };
  
  chart.size_scale = function(x) {
    if (!arguments.length) return vars.size_scale_type;
    vars.size_scale_type = x;
    return chart;
  };
    
  chart.solo = function(x) {
    if (!arguments.length) return vars.solo;
    // if we're given an array then overwrite the current filter var
    if(x instanceof Array){
      vars.solo = x;
    }
    // otherwise add/remove it from array
    else {
      // if element is in the array remove it
      if(vars.solo.indexOf(x) > -1){
        vars.solo.splice(vars.solo.indexOf(x), 1)
      }
      // else, add it
      else {
        vars.solo.push(x)
      }
    }
    vars.check.push("solo")
    return chart;
  };
  
  chart.text = function(x) {
    if (!arguments.length) return vars.text;
    if (typeof x == "string") {
      vars.name_array = [x]
    }
    else if (x instanceof Array) {
      vars.name_array = x
    }
    else {
      vars.text_obj = x
      var n = x[vars.id] ? x[vars.id] : x[Object.keys(x)[0]]
      vars.name_array = typeof n == "string" ? [n] : n
    }
    vars.text = vars.name_array[0]
    return chart;
  };
  
  chart.title = function(x) {
    if (!arguments.length) return vars.title;
    vars.title = x;
    return chart;
  };
  
  chart.title_center = function(x) {
    if (!arguments.length) return vars.title_center;
    vars.title_center = x;
    return chart;
  };
  
  chart.title_height = function(x) {
    if (!arguments.length) return vars.title_height;
    vars.title_height = x;
    return chart;
  };
  
  chart.title_width = function(x) {
    if (!arguments.length) return vars.title_width;
    vars.title_width = x;
    return chart;
  };

  chart.width = function(x) {
    if (!arguments.length) return vars.svg_width;
    vars.svg_width = x;
    return chart;
  };
  
  chart.yaxis_domain = function(x) {
    if (!arguments.length) return vars.yaxis_range;
    vars.yaxis_range = x.reverse();
    return chart;
  };
  
  var simple_vars = [
    "active",
    "aggs",
    "attrs",
    "background",
    "click_function",
    "color",
    "descs",
    "dev",
    "donut",
    "else",
    "error",
    "footer",
    "group_bgs",
    "grouping",
    "heat_map",
    "highlight",
    "icon",
    "icon_style",
    "info_style",
    "labels",
    "layout",
    "links",
    "mirror_axis",
    "nodes",
    "number_format",
    "order",
    "scroll_zoom",
    "sort",
    "spotlight",
    "stack_type",
    "static_axes",
    "sub_title",
    "text_format",
    "tooltip",
    "total_bar",
    "total",
    "type",
    "unique_axis",
    "value",
    "xaxis",
    "xaxis_domain",
    "xaxis_val",
    "xaxis_scale",
    "yaxis",
    "yaxis_val",
    "yaxis_scale",
    "year",
    "year_var"
  ]
  
  simple_vars.forEach(function(v){
    chart[v] = function(x) {
      if (!arguments.length) return vars[v];
      vars[v] = x;
      if (vars.check_vars.indexOf(v) >= 0) vars.check.push(x)
      return chart;
    }
  })
  
  var deprecated = {
    "active_var": "active",
    "color_var": "color",
    "csv_data": "csv",
    "csv_columns": "csv",
    "else_var": "else",
    "id_var": "id",
    "nesting": "id",
    "nesting_aggs": "aggs",
    "text_var": "text",
    "tooltip_info": "tooltip",
    "total_var": "total",
    "value_var": "value",
    "xaxis_var": "xaxis",
    "yaxis_var": "yaxis"
  }
  
  for (d in deprecated) {
    chart[d] = (function(dep) {
      return function(x) {
        console.log("%c[d3plus]%c WARNING: \""+dep+"\" has been deprecated, please use \""+deprecated[dep]+"\"","font-weight:bold","color:red;font-weight:bold")
        chart[deprecated[dep]](x)
        return chart;
      }
    })(d)
  }
  
  //===================================================================
  
  zoom_controls = function() {
    d3.select("#zoom_controls").remove()
    if (!vars.small) {
      // Create Zoom Controls
      var zoom_enter = vars.parent.append("div")
        .attr("id","zoom_controls")
        .style("top",(vars.margin.top+5)+"px")
    
      zoom_enter.append("div")
        .attr("id","zoom_in")
        .attr("unselectable","on")
        .on(d3plus.evt.click,function(){ vars.zoom("in") })
        .text("+")
    
      zoom_enter.append("div")
        .attr("id","zoom_out")
        .attr("unselectable","on")
        .on(d3plus.evt.click,function(){ vars.zoom("out") })
        .text("-")
    
      zoom_enter.append("div")
        .attr("id","zoom_reset")
        .attr("unselectable","on")
        .on(d3plus.evt.click,function(){ 
          vars.zoom("reset") 
          vars.update()
        })
        .html("\&#8634;")
    }
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // X/Y Graph System
  //-------------------------------------------------------------------
  
  var tick_style = {
    "stroke": "#ccc",
    "stroke-width": 1,
    "shape-rendering": "crispEdges"
  }
  
  var axis_style = {
    "font-size": "12px",
    "fill": "#888"
  }
  
  var label_style = {
    "font-size": "14px",
    "fill": "#333",
    "text-anchor": "middle"
  }
  
  vars.x_axis = d3.svg.axis()
    .tickSize(0)
    .tickPadding(20)
    .orient('bottom')
    .tickFormat(function(d, i) {
      
      if ((vars.xaxis_scale == "log" && d.toString().charAt(0) == "1")
          || vars.xaxis_scale != "log") {
            
        if (vars.xaxis == vars.year_var) var text = d;
        else {
          var text = vars.format(d,vars.xaxis);
        }
      
        d3.select(this)
          .style(axis_style)
          .attr("transform","translate(-22,3)rotate(-65)")
          .attr("font-family",vars.font)
          .attr("font-weight",vars.font_weight)
          .text(text)
        
        var height = (Math.cos(25)*this.getBBox().width)
        if (height > vars.graph.yoffset && !vars.small) vars.graph.yoffset = height
        
        var tick_offset = 10
        var tick_opacity = 1
      }
      else {
        var text = null
        var tick_offset = 5
        var tick_opacity = 0.25
      }
      
      if (!(tick_offset == 5 && vars.xaxis == vars.year_var)) {
      
        var bgtick = d3.select(this.parentNode).selectAll("line.tick")
          .data([d])
          
        bgtick.enter().append("line")
          .attr("class","tick")
          .attr("x1", 0)
          .attr("x2", 0)
          .attr("y1", tick_offset)
          .attr("y2", -vars.graph.height)
          .attr(tick_style)
          .attr("opacity",tick_opacity)
        
        bgtick.transition().duration(d3plus.timing) 
          .attr("y1", tick_offset)
          .attr("y2", -vars.graph.height)
          .attr("opacity",tick_opacity)
        
      }
      
      return text;
      
    });
  
  vars.y_axis = d3.svg.axis()
    .tickSize(0)
    .tickPadding(15)
    .orient('left')
    .tickFormat(function(d, i) {
      
      if ((vars.yaxis_scale == "log" && d.toString().charAt(0) == "1")
          || vars.yaxis_scale != "log") {
            
        if (vars.yaxis == vars.year_var) var text = d;
        else if (vars.layout == "share" && vars.type == "stacked") {
          var text = d*100+"%"
        }
        else {
          var text = vars.format(d,vars.yaxis);
        }
      
        d3.select(this)
          .style(axis_style)
          .attr("font-family",vars.font)
          .attr("font-weight",vars.font_weight)
          .text(text)
        
        var width = this.getBBox().width
        if (width > vars.graph.offset && !vars.small) vars.graph.offset = width
        
        var tick_offset = -10
        var tick_opacity = 1
      }
      else {
        var text = null
        var tick_offset = -5
        var tick_opacity = 0.25
      }
      
      if (!(tick_offset == -5 && vars.yaxis == vars.year_var)) {
        
        var bgtick = d3.select(this.parentNode).selectAll("line.tick")
          .data([d])
        
        bgtick.enter().append("line")
          .attr("class","tick")
          .attr("x1", tick_offset)
          .attr("x2", vars.graph.width)
          .attr(tick_style)
          .attr("opacity",tick_opacity)
        
        bgtick.transition().duration(d3plus.timing) 
          .attr("x1", tick_offset)
          .attr("x2", vars.graph.width)
          .attr("opacity",tick_opacity)
        
      }
      
      return text;
      
    });
    
  graph_update = function() {

    // create label group
    var axes = vars.parent_enter.append("g")
      .attr("class","axes_labels")
    
    // Enter Graph
    vars.chart_enter = vars.parent_enter.append("g")
      .attr("class", "chart")
      .attr("transform", "translate(" + vars.graph.margin.left + "," + vars.graph.margin.top + ")")

    vars.chart_enter.append("rect")
      .style('fill','#fafafa')
      .attr("id","background")
      .attr('x',0)
      .attr('y',0)
      .attr('width', vars.graph.width)
      .attr('height', vars.graph.height)
      .attr("stroke-width",1)
      .attr("stroke","#ccc")
      .attr("shape-rendering","crispEdges")
      
    vars.chart_enter.append("path")
      .attr("id","mirror")
      .attr("fill","#000")
      .attr("fill-opacity",0.03)
      .attr("stroke-width",1)
      .attr("stroke","#ccc")
      .attr("stroke-dasharray","10,10")
      .attr("opacity",0)

    // Create X axis
    vars.chart_enter.append("g")
      .attr("transform", "translate(0," + vars.graph.height + ")")
      .attr("class", "xaxis")
      .call(vars.x_axis.scale(vars.x_scale))

    // Create Y axis
    vars.chart_enter.append("g")
      .attr("class", "yaxis")
      .call(vars.y_axis.scale(vars.y_scale))
      
    var labelx = vars.width/2
    if (!vars.title_center) labelx += vars.graph.margin.left
      
    // Create X axis label
    axes.append('text')
      .attr('class', 'x_axis_label')
      .attr('x', labelx)
      .attr('y', vars.height-10)
      .text(vars.format(vars.xaxis))
      .attr("font-family",vars.font)
      .attr("font-weight",vars.font_weight)
      .attr(label_style)
      
    // Create Y axis label
    axes.append('text')
      .attr('class', 'y_axis_label')
      .attr('y', 15)
      .attr('x', -(vars.graph.height/2+vars.graph.margin.top))
      .text(vars.format(vars.yaxis))
      .attr("transform","rotate(-90)")
      .attr("font-family",vars.font)
      .attr("font-weight",vars.font_weight)
      .attr(label_style)

    // Set Y axis
    vars.graph.offset = 0
    d3.select("g.yaxis")
      .call(vars.y_axis.scale(vars.y_scale))
      
    vars.graph.margin.left += vars.graph.offset
    vars.graph.width -= vars.graph.offset
    vars.x_scale.range([0,vars.graph.width])
    
    // Set X axis
    vars.graph.yoffset = 0
    d3.select("g.xaxis")
      .call(vars.x_axis.scale(vars.x_scale))
      
    vars.graph.height -= vars.graph.yoffset
    
    // Update Graph
    d3.select(".chart").transition().duration(vars.graph.timing)
      .attr("transform", "translate(" + vars.graph.margin.left + "," + vars.graph.margin.top + ")")
      .attr("opacity",function(){
        if (vars.app_data.length == 0) return 0
        else return 1
      })
      .select("rect#background")
        .attr('width', vars.graph.width)
        .attr('height', vars.graph.height)
        
    d3.select("#mirror").transition().duration(vars.graph.timing)
      .attr("opacity",function(){
        return vars.mirror_axis ? 1 : 0
      })
      .attr("d",function(){
        return "M "+vars.graph.width+" "+vars.graph.height+" L 0 "+vars.graph.height+" L "+vars.graph.width+" 0 Z"
      })

    // Update X axis
    if (vars.type == "stacked") {
      vars.y_scale.range([vars.graph.height,0]);
    }
    else {
      vars.y_scale.range([0, vars.graph.height]);
    }
    
    d3.select("g.yaxis")
      .call(vars.y_axis.scale(vars.y_scale))
    
    d3.select("g.xaxis")
      .attr("transform", "translate(0," + vars.graph.height + ")")
      .call(vars.x_axis.scale(vars.x_scale))
    
    d3.select("g.xaxis").selectAll("g.tick").select("text")
      .style("text-anchor","end")

    // Update X axis label
    d3.select(".x_axis_label")
      .attr('x', labelx)
      .attr('y', vars.height-10)
      .attr("opacity",function(){
        if (vars.app_data.length == 0) return 0
        else return 1
      })
      .text(vars.format(vars.xaxis))

    // Update Y axis label
    d3.select(".y_axis_label")
      .attr('y', 15)
      .attr('x', -(vars.graph.height/2+vars.graph.margin.top))
      .attr("opacity",function(){
        if (vars.app_data.length == 0) return 0
        else return 1
      })
      .text(vars.format(vars.yaxis))
      
    // Axis Dotted Lines
    vars.chart_enter.append("line")
      .attr("id","y_axis_val")
      .attr("x1",0)
      .attr("x2",vars.graph.width)
      .attr("stroke","#ccc")
      .attr("stroke-width",3)
      .attr("stroke-dasharray","10,10")
      
    vars.chart_enter.append("text")
      .attr("id","y_axis_val_text")
      .style(axis_style)
      .attr("text-align","start")
      .attr("x","10px")
      
    if (vars.yaxis_val && typeof vars.yaxis_val == "object") {
      var y_name = Object.keys(vars.yaxis_val)[0]
      var y_val = vars.yaxis_val[y_name]
    }
    else if (vars.yaxis_val) {
      var y_val = vars.yaxis_val, y_name = null
    }
    else {
      var y_val = null, y_name = null
    }
    
    if (typeof y_val == "string") y_val = parseFloat(y_val)
      
    d3.select("#y_axis_val").transition().duration(vars.graph.timing)
      .attr("y1",function(d){
        return y_val ? vars.y_scale(y_val) : 0
      })
      .attr("y2",function(d){
        return y_val ? vars.y_scale(y_val) : 0
      })
      .attr("opacity",function(d){
        var yes = y_val > vars.y_scale.domain()[1] && y_val < vars.y_scale.domain()[0]
        return y_val != null && yes ? 1 : 0
      })
      
    d3.select("#y_axis_val_text").transition().duration(vars.graph.timing)
      .text(function(){
        if (y_val != null) {
          var v = vars.format(y_val,y_name)
          return y_name ? vars.format(y_name) + ": " + v : v
        }
        else return null
      })
      .attr("y",(vars.y_scale(y_val)+20)+"px")
      

    vars.chart_enter.append("line")
      .attr("id","x_axis_val")
      .attr("y1",0)
      .attr("y2",vars.graph.height)
      .attr("stroke","#ccc")
      .attr("stroke-width",3)
      .attr("stroke-dasharray","10,10")
    
    vars.chart_enter.append("text")
      .attr("id","x_axis_val_text")
      .style(axis_style)
      .attr("text-align","start")
      .attr("y",(vars.graph.height-8)+"px")
    
    if (vars.xaxis_val && typeof vars.xaxis_val == "object") {
      var x_name = Object.keys(vars.xaxis_val)[0]
      var x_val = vars.xaxis_val[x_name]
    }
    else if (vars.xaxis_val) {
      var x_val = vars.xaxis_val, x_name = null
    }
    else {
      var x_val = null, x_name = null
    }
  
    if (typeof x_val == "string") x_val = parseFloat(x_val)
    
    d3.select("#x_axis_val").transition().duration(vars.graph.timing)
      .attr("x1",function(d){
        return x_val ? vars.x_scale(x_val) : 0
      })
      .attr("x2",function(d){
        return x_val ? vars.x_scale(x_val) : 0
      })
      .attr("opacity",function(d){
        var yes = x_val > vars.x_scale.domain()[0] && x_val < vars.x_scale.domain()[1]
        return x_val != null && yes ? 1 : 0
      })
    
    d3.select("#x_axis_val_text").transition().duration(vars.graph.timing)
      .text(function(){
        if (x_val != null) {
          var v = vars.format(x_val,x_name)
          return x_name ? vars.format(x_name) + ": " + v : v
        }
        else return null
      })
      .attr("x",(vars.x_scale(x_val)+10)+"px")
      
    // Move titles
    d3plus.utils.title_update(vars)
    
    vars.graph.timing = d3plus.timing
      
  }

  //===================================================================

  return chart;
};
d3plus.data.network = "object";
d3plus.vars.network = [];

d3plus.apps.network = function(vars) {
  
  if (!vars.app_data) var nodes = []
  else var nodes = vars.nodes_filtered || vars.nodes
    
  if (!vars.app_data) var links = []
  else var links = vars.links_filtered || vars.links
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Function that handles the zooming and panning of the visualization
  //-------------------------------------------------------------------
  
  vars.zoom = function(direction) {
    
    var zoom_extent = zoom_behavior.scaleExtent()
    // If d3 zoom event is detected, use it!
    if(!direction) {
      evt_scale = d3.event.scale
      translate = d3.event.translate
    } 
    else {
      if (direction == "in") {
        if (zoom_behavior.scale() > zoom_extent[1]/2) multiplier = zoom_extent[1]/zoom_behavior.scale()
        else multiplier = 2
      } 
      else if (direction == "out") {
        if (zoom_behavior.scale() < zoom_extent[0]*2) multiplier = zoom_extent[0]/zoom_behavior.scale()
        else multiplier = 0.5
      } 
      else if (direction == vars.highlight) {
        var x_bounds = [scale.x(highlight_extent.x[0]),scale.x(highlight_extent.x[1])],
            y_bounds = [scale.y(highlight_extent.y[0]),scale.y(highlight_extent.y[1])]
            
        if (x_bounds[1] > (vars.width-info_width-5)) var offset_left = info_width+32
        else var offset_left = 0
            
        var w_zoom = (vars.width-info_width-10)/(x_bounds[1]-x_bounds[0]),
            h_zoom = vars.height/(y_bounds[1]-y_bounds[0])
        
        if (w_zoom < h_zoom) {
          x_bounds = [x_bounds[0]-(max_size*4),x_bounds[1]+(max_size*4)]
          evt_scale = (vars.width-info_width-10)/(x_bounds[1]-x_bounds[0])
          if (evt_scale > zoom_extent[1]) evt_scale = zoom_extent[1]
          offset_x = -(x_bounds[0]*evt_scale)
          offset_y = -(y_bounds[0]*evt_scale)+((vars.height-((y_bounds[1]-y_bounds[0])*evt_scale))/2)
        } else {
          y_bounds = [y_bounds[0]-(max_size*2),y_bounds[1]+(max_size*2)]
          evt_scale = vars.height/(y_bounds[1]-y_bounds[0])
          if (evt_scale > zoom_extent[1]) evt_scale = zoom_extent[1]
          offset_x = -(x_bounds[0]*evt_scale)+(((vars.width-info_width-10)-((x_bounds[1]-x_bounds[0])*evt_scale))/2)
          offset_y = -(y_bounds[0]*evt_scale)
        }

        translate = [offset_x+offset_left,offset_y]
      } 
      else if (direction == "reset") {
        vars.highlight = null
        translate = [0,0]
        evt_scale = 1
      }
      
      if (direction == "in" || direction == "out") {
        var trans = d3.select("g.viz")[0][0].getAttribute('transform')
        if (trans) {
          trans = trans.split('(')
          var coords = trans[1].split(')')
          coords = coords[0].replace(' ',',')
          coords = coords.substring(0,trans[1].length-6).split(',')
          offset_x = parseFloat(coords[0])
          offset_y = coords.length == 2 ? parseFloat(coords[1]) : parseFloat(coords[0])
          zoom_var = parseFloat(trans[2].substring(0,trans[2].length-1))
        } else {
          offset_x = 0
          offset_y = 0
          zoom_var = 1
        }
        if ((multiplier > 0.5 && multiplier <= 1) && direction == "out") {
          offset_x = 0
          offset_y = 0
        } else {
          offset_x = (vars.width/2)-(((vars.width/2)-offset_x)*multiplier)
          offset_y = (vars.height/2)-(((vars.height/2)-offset_y)*multiplier)
        }
      
        translate = [offset_x,offset_y]
        evt_scale = zoom_var*multiplier
      }
    
    }
    
    zoom_behavior.translate(translate).scale(evt_scale)
    
    // Auto center visualization
    if (translate[0] > 0) translate[0] = 0
    else if (translate[0] < -((vars.width*evt_scale)-vars.width)) {
      translate[0] = -((vars.width*evt_scale)-vars.width)
    }
    if (translate[1] > 0) translate[1] = 0
    else if (translate[1] < -((vars.height*evt_scale)-vars.height)) translate[1] = -((vars.height*evt_scale)-vars.height)
    if (!direction) {
      if (d3.event.sourceEvent.type == "mousewheel" || d3.event.sourceEvent.type == "mousemove") {
        var viz_timing = d3.select(".viz")
      } else {
        var viz_timing = d3.select(".viz").transition().duration(d3plus.timing)
      }
    } else {
      var viz_timing = d3.select(".viz").transition().duration(d3plus.timing)
    }
    viz_timing.attr("transform","translate(" + translate + ")" + "scale(" + evt_scale + ")")
    
  }

  //===================================================================
  
  vars.update = function() {
    // If highlight variable has ACTUALLY changed, do this stuff
    if (last_highlight != vars.highlight) {
      
      // Remove all tooltips on page
      d3plus.ui.tooltip.remove(vars.type)
      d3.select("g.highlight").selectAll("*").remove()
      d3.select("g.hover").selectAll("*").remove()
      
      if (vars.highlight) {
                          
        create_nodes("highlight")
        
      }
      else {
        vars.zoom("reset");
      }
      
      node.call(node_color)
      
      last_highlight = vars.highlight
    }

    // If hover variable has ACTUALLY changed, do this stuff
    if (last_hover != hover) {

      d3.select("g.hover").selectAll("*").remove()
      
      // If a new hover element exists, create it
      if (hover && hover != vars.highlight) {
        create_nodes("hover")
      }
      
      // Set last_hover to the new hover ID
      last_hover = hover
    }
    
    function create_nodes(group) {
      
      if (group == "highlight") {
        var c = vars.highlight
      }
      else {
        var c = hover
      }
      
      var node_data = nodes.filter(function(x){return x[vars.id] == c})
      
      if (group == "highlight" || !vars.highlight) {

        var prim_nodes = [],
            prim_links = [];
            
        if (vars.connections[c]) {
          vars.connections[c].forEach(function(n){
            prim_nodes.push(nodes.filter(function(x){return x[vars.id] == n[vars.id]})[0])
          })
          prim_nodes.forEach(function(n){
            prim_links.push({"source": node_data[0], "target": n})
          })
        }
        
        var node_data = prim_nodes.concat(node_data)
        highlight_extent.x = d3.extent(d3.values(node_data),function(v){return v.x;}),
        highlight_extent.y = d3.extent(d3.values(node_data),function(v){return v.y;})

        if (group == "highlight") {
          vars.zoom(c);
          
          make_tooltip = function(html) {
        
            if (typeof html == "string") html = "<br>"+html

            if (scale.x(highlight_extent.x[1]) > (vars.width-info_width-10)) {
              var x_pos = 30
            }
            else {
              var x_pos = vars.width-info_width-5
            }
         
            var prod = nodes.filter(function(n){return n[vars.id] == vars.highlight})[0]
          
            var tooltip_data = d3plus.utils.tooltip(vars,vars.highlight)
          
            var tooltip_appends = "<div class='d3plus_tooltip_data_title'>"
            tooltip_appends += vars.format("Primary Connections")
            tooltip_appends += "</div>"
      
            prim_nodes.forEach(function(n){
            
              var parent = "d3.select(&quot;#"+vars.parent.node().id+"&quot;)"
            
              tooltip_appends += "<div class='d3plus_network_connection' onclick='"+parent+".call(chart.highlight(&quot;"+n[vars.id]+"&quot;))'>"
              tooltip_appends += "<div class='d3plus_network_connection_node'"
              tooltip_appends += " style='"
              tooltip_appends += "background-color:"+fill_color(n)+";"
              tooltip_appends += "border-color:"+stroke_color(n)+";"
              tooltip_appends += "'"
              tooltip_appends += "></div>"
              tooltip_appends += "<div class='d3plus_network_connection_name'>"
              tooltip_appends += d3plus.utils.variable(vars,n[vars.id],vars.text)
              tooltip_appends += "</div>"
              tooltip_appends += "</div>"
            })
            
            d3plus.ui.tooltip.remove(vars.type)
          
            d3plus.ui.tooltip.create({
              "data": tooltip_data,
              "title": d3plus.utils.variable(vars,vars.highlight,vars.text),
              "color": d3plus.utils.color(vars,vars.highlight),
              "icon": d3plus.utils.variable(vars,vars.highlight,"icon"),
              "style": vars.icon_style,
              "x": x_pos,
              "y": vars.margin.top+5,
              "width": info_width,
              "max_height": vars.height-10,
              "html": tooltip_appends+html,
              "fixed": true,
              "mouseevents": true,
              "parent": vars.parent,
              "background": vars.background,
              "id": vars.type
            })
            
          }
          
          var html = vars.click_function ? vars.click_function(vars.highlight) : ""
    
          if (typeof html == "string") make_tooltip(html)
          else {
            d3.json(html.url,function(data){
              html = html.callback(data)
              make_tooltip(html)
            })
          }
          
        }
        
        d3.select("g."+group).selectAll("line")
          .data(prim_links).enter().append("line")
            .attr("pointer-events","none")
            .attr("stroke",vars.highlight_color)
            .attr("stroke-width",2)
            .call(link_position)
      }
      
      var node_groups = d3.select("g."+group).selectAll("g")
        .data(node_data).enter().append("g")
          .attr("class","hover_node")
          .call(node_events)
    
      node_groups
        .append("circle")
          .attr("class","bg")
          .call(node_size)
          .call(node_position)
          .call(node_stroke)
          .attr("stroke",vars.highlight_color);
        
      node_groups
        .append("circle")
          .call(node_size)
          .call(node_position)
          .call(node_stroke)
          .call(node_color)
          .call(create_label);
    }
    
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Private Variables
  //-------------------------------------------------------------------
  
  var dragging = false,
      offset_top = 0,
      offset_left = 0,
      info_width = 300,
      zoom_behavior = d3.behavior.zoom().scaleExtent([1, 16]),
      scale = {},
      hover = null,
      last_hover = null,
      last_highlight = null,
      highlight_extent = {};

  //===================================================================
    
  d3plus.ui.tooltip.remove(vars.type)
  var x_range = d3.extent(d3.values(nodes), function(d){return d.x})
  var y_range = d3.extent(d3.values(nodes), function(d){return d.y})
  var aspect = (x_range[1]-x_range[0])/(y_range[1]-y_range[0])
    
  // Define Scale
  if (aspect > vars.width/vars.height) {
    var viz_height = vars.width/aspect, viz_width = vars.width
    offset_top = ((vars.height-viz_height)/2)
  } else {
    var viz_width = vars.height*aspect, viz_height = vars.height
    offset_left = ((vars.width-viz_width)/2)
  }
  
  // x scale
  scale.x = d3.scale.linear()
    .domain(x_range)
    .range([offset_left, vars.width-offset_left])
  // y scale
  scale.y = d3.scale.linear()
    .domain(y_range)
    .range([offset_top, vars.height-offset_top])
    
  var val_range = d3.extent(d3.values(vars.app_data), function(d){
    return d[vars.value] ? d[vars.value] : null
  });
  
  if (typeof val_range[0] == "undefined") val_range = [1,1]
  
  var distances = []
  nodes.forEach(function(n1){
    nodes.forEach(function(n2){
      if (n1 != n2) {
        var xx = Math.abs(scale.x(n1.x)-scale.x(n2.x));
        var yy = Math.abs(scale.y(n1.y)-scale.y(n2.y));
        distances.push(Math.sqrt((xx*xx)+(yy*yy)))
      }
    })
  })
  
  var max_size = d3.min(distances,function(d){return d*0.75})
  var min_size = 4;
  // return
  // x scale
  scale.x.range([offset_left+(max_size*1.5), vars.width-(max_size*1.5)-offset_left])
  // y scale
  scale.y.range([offset_top+(max_size*1.5), vars.height-(max_size*1.5)-offset_top])
  
  // size scale
  scale.size = d3.scale.log()
    .domain(val_range)
    .range([min_size, max_size])
    
  // Create viz group on vars.parent_enter
  var viz_enter = vars.parent_enter.append("g")
    .call(zoom_behavior.on("zoom",function(){ vars.zoom(); }))
    .on(d3plus.evt.down,function(d){
      dragging = true
    })
    .on(d3plus.evt.up,function(d){
      dragging = false
    })
    .append('g')
      .attr('class','viz')
    
  viz_enter.append('rect')
    .attr('class','overlay')
    .attr("fill","transparent");
    
  d3.select("rect.overlay")
    .attr("width", vars.width)
    .attr("height", vars.height)
    .on(d3plus.evt.over,function(d){
      if (!vars.highlight && hover) {
        hover = null;
        vars.update();
      }
    })
    .on(d3plus.evt.click,function(d){
      // vars.highlight = null;
      // vars.zoom("reset");
      // vars.update();
    })
    .on(d3plus.evt.move,function(d){
      if (zoom_behavior.scale() > 1) {
        d3.select(this).style("cursor","move")
        if (dragging && !d3plus.ie) {
          d3.select(this).style("cursor","-moz-grabbing")
          d3.select(this).style("cursor","-webkit-grabbing")
        }
        else if (!d3plus.ie) {
          d3.select(this).style("cursor","-moz-grab")
          d3.select(this).style("cursor","-webkit-grab")
        }
      }
      else {
        d3.select(this).style("cursor","default")
      }
    });
    
  if (!vars.scroll_zoom) {
    d3.select(d3.select("g.viz").node().parentNode)
      .on("mousewheel.zoom", null)
      .on("DOMMouseScroll.zoom", null)
      .on("wheel.zoom", null)
  }
    
  viz_enter.append('g')
    .attr('class','links')
    
  viz_enter.append('g')
    .attr('class','nodes')
    
  viz_enter.append('g')
    .attr('class','highlight')
    
  viz_enter.append('g')
    .attr('class','hover')
    
  zoom_controls();
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // New nodes and links enter, initialize them here
  //-------------------------------------------------------------------
  
  var node = d3.select("g.nodes").selectAll("circle.node")
    .data(nodes, function(d) { return d[vars.id]; })
  
  node.enter().append("circle")
    .attr("class","node")
    .attr("r",0)
    .call(node_position)
    .call(node_color)
    .call(node_stroke);
    
  var link = d3.select("g.links").selectAll("line.link")
    .data(links, function(d) { return d.source[vars.id] + "-" + d.target[vars.id]; })
    
  link.enter().append("line")
    .attr("class","link")
    .attr("pointer-events","none")
    .attr("stroke", "white")
    .attr("stroke-width", 1)
    .call(link_position);
  
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Update, for nodes and links that are already in existance
  //-------------------------------------------------------------------

  node
    .on(d3plus.evt.over, function(d){
      if (!dragging) {
        hover = d[vars.id];
        vars.update();
      }
    });

  node.transition().duration(d3plus.timing)
    .call(node_size)
    .call(node_stroke)
    .call(node_position)
    .call(node_color);
    
  link
    .call(link_events);
    
  link.transition().duration(d3plus.timing)
    .attr("stroke", "#dedede")
    .call(link_position);
      
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Exit, for nodes and links that are being removed
  //-------------------------------------------------------------------

  node.exit().transition().duration(d3plus.timing)
    .attr("r",0)
    .remove()
    
  link.exit().transition().duration(d3plus.timing)
    .attr("stroke", "white")
    .remove()

  //===================================================================
  
  if (vars.highlight) {
    var present = false;
    nodes.forEach(function(d){
      if (d[vars.id] == vars.highlight) present = true;
    })
    if (!present) {
      vars.highlight = null;
    }
  }
  vars.update();
      
  function link_position(l) {
    l
      .attr("x1", function(d) { return scale.x(d.source.x); })
      .attr("y1", function(d) { return scale.y(d.source.y); })
      .attr("x2", function(d) { return scale.x(d.target.x); })
      .attr("y2", function(d) { return scale.y(d.target.y); })
      .attr("vector-effect","non-scaling-stroke")
  }
  
  function link_events(l) {
    l
      .on(d3plus.evt.click,function(d){
        vars.highlight = null;
        vars.zoom("reset");
        vars.update();
      })
  }
  
  function node_position(n) {
    n
      .attr("cx", function(d) { return scale.x(d.x); })
      .attr("cy", function(d) { return scale.y(d.y); })
  }
  
  function node_size(n) {
    n
      .attr("r", function(d) { 
        var value = d3plus.utils.variable(vars,d[vars.id],vars.value)
        return value > 0 ? scale.size(value) : scale.size(val_range[0])
      })
  }
  
  function node_stroke(b) {
    b
      .attr("stroke-width", function(d){
        
        // Determine which type of node we're dealing with, based on "g" class
        var parent_group = this.parentNode.className.baseVal
        var class_name = this.className.baseVal
        // "True" if node is in the highlight or hover groups
        var highlighted = parent_group == "hover_node"
        var bg = class_name == "bg"
        
        if (bg) {
          if (vars.highlight == d[vars.id]) return 6;
          else return 4;
        }
        else if (highlighted) return 0;
        else return 1;
      })
      .attr("vector-effect","non-scaling-stroke")
  }
  
  function node_color(n) {
    n
      .attr("fill", function(d){
        
        // Determine which type of node we're dealing with, based on "g" class
        var parent_group = this.parentNode.className.baseVal
        
        // "True" if node is a background node and a node has been highlighted
        var background_node = vars.highlight && parent_group == "nodes"
        // "True" if node is in the highlight or hover groups
        var highlighted = parent_group == "hover_node"
        // "True" if vars.spotlight is true and node vars.active is false
        var active = vars.active ? d3plus.utils.variable(vars,d[vars.id],vars.active) : true
        var hidden = vars.spotlight && !active
        // Grey out nodes that are in the background or hidden by spotlight,
        // otherwise, use the active_color function
        if ((background_node || hidden) && !highlighted) {
          return "#efefef"
        }
        else {
          var active = d3plus.utils.variable(vars,d[vars.id],vars.active)
          if (active) this.parentNode.appendChild(this)
          return fill_color(d)
        }
        
      })
      .attr("stroke", function(d){
        
        // Determine which type of node we're dealing with, based on "g" class
        var parent_group = this.parentNode.className.baseVal;
        
        // "True" if node is a background node and a node has been highlighted
        var background_node = vars.highlight && parent_group == "nodes";
        // "True" if node is in the highlight or hover groups
        var highlighted = parent_group == "hover_node"
        // "True" if vars.spotlight is true and node vars.active is false
        var active = vars.active ? d3plus.utils.variable(vars,d[vars.id],vars.active) : true
        var hidden = vars.spotlight && !active
        
        if (highlighted) return fill_color(d);
        else if (background_node || hidden) return "#dedede";
        else return stroke_color(d);
        
      })
  }
  
  function fill_color(d) {
    
    // Get elements' color
    var color = d3plus.utils.color(vars,d)
    
    // If node is not active, lighten the color
    var active = vars.active ? d3plus.utils.variable(vars,d[vars.id],vars.active) : true
    if (!active) {
      var color = d3.hsl(color);
      color.l = 0.95;
    }
    
    // Return the color
    return color;
    
  }
  
  function stroke_color(d) {
    
    // Get elements' color
    var color = d3plus.utils.color(vars,d)
    
    // If node is active, return a darker color, else, return the normal color
    var active = vars.active ? d3plus.utils.variable(vars,d[vars.id],vars.active) : true
    return active ? "#333" : color;
    
  }
  
  function node_events(n) {
    n
      .on(d3plus.evt.over, function(d){
        
        d3.select(this).style("cursor","pointer")
        if (!d3plus.ie) {
          d3.select(this).style("cursor","-moz-zoom-in")
          d3.select(this).style("cursor","-webkit-zoom-in")
        }
          
        if (d[vars.id] == vars.highlight && !d3plus.ie) {
          d3.select(this).style("cursor","-moz-zoom-out")
          d3.select(this).style("cursor","-webkit-zoom-out")
        }
        
        if (d[vars.id] != hover) {
          hover = d[vars.id];
          vars.update();
        }
        
      })
      .on(d3plus.evt.out, function(d){
        
        // Returns false if the mouse has moved into a child element.
        // This is used to catch when the mouse moves onto label text.
        var target = d3.event.toElement || d3.event.relatedTarget
        if (target) {
          var id_check = target.__data__[vars.id] == d[vars.id]
          if (target.parentNode != this && !id_check) {
            hover = null;
            vars.update();
          }
        }
        else {
          hover = null;
          vars.update();
        }
        
      })
      .on(d3plus.evt.click, function(d){
        
        d3.select(this).style("cursor","auto")

        // If there is no highlighted node, 
        // or the hover node is not the highlighted node
        if (!vars.highlight || vars.highlight != d[vars.id]) {
          vars.highlight = d[vars.id];
        } 
        
        // Else, the user is clicking on the highlighted node.
        else {
          vars.highlight = null;
        }
        
        vars.update();
        
      })
  }
  
  function create_label(n) {
    if (vars.labels) {
      n.each(function(d){

        var font_size = Math.ceil(10/zoom_behavior.scale()),
            padding = font_size/4,
            corner = Math.ceil(3/zoom_behavior.scale())
            value = d3plus.utils.variable(vars,d[vars.id],vars.value),
            size = value > 0 ? scale.size(value) : scale.size(val_range[0])
        if (font_size < size || d[vars.id] == hover || d[vars.id] == vars.highlight) {
          d3.select(this.parentNode).append("text")
            .attr("pointer-events","none")
            .attr("x",scale.x(d.x))
            .attr("fill",d3plus.utils.text_color(fill_color(d)))
            .attr("font-size",font_size+"px")
            .attr("text-anchor","middle")
            .attr("font-family",vars.font)
            .attr("font-weight",vars.font_weight)
            .each(function(e){
              var th = size < font_size+padding*2 ? font_size+padding*2 : size,
                  tw = ((font_size*5)/th)*(font_size*5)
              var text = d3plus.utils.variable(vars,d[vars.id],vars.text)
              d3plus.utils.wordwrap({
                "text": text,
                "parent": this,
                "width": tw,
                "height": th,
                "padding": 0
              });
              if (!d3.select(this).select("tspan")[0][0]) {
                d3.select(this).remove();
              }
              else {
                finish_label(d3.select(this));
              }
            })
        }
              
        function finish_label(text) {
          
          var w = text.node().getBBox().width,
              h = text.node().getBBox().height
        
          text.attr("y",scale.y(d.y)-(h/2)-(padding/3))
          
          w = w+(padding*6)
          h = h+(padding*2)
          
          if (w > size*2) {
            d3.select(text.node().parentNode)
              .insert("rect","circle")
                .attr("class","bg")
                .attr("rx",corner)
                .attr("ry",corner)
                .attr("width",w)
                .attr("height",h)
                .attr("y",scale.y(d.y)-(h/2))
                .attr("x",scale.x(d.x)-(w/2))
                .call(node_stroke)
                .attr("stroke",vars.highlight_color);
            d3.select(text.node().parentNode)
              .insert("rect","text")
                .attr("rx",corner)
                .attr("ry",corner)
                .attr("stroke-width", 0)
                .attr("fill",fill_color(d))
                .attr("width",w)
                .attr("height",h)
                .attr("y",scale.y(d.y)-(h/2))
                .attr("x",scale.x(d.x)-(w/2));
          }
        }
        
      })
      
    }
  }
      
};
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
d3plus.data.tree_map = "nested";
d3plus.vars.tree_map = ["value"];

d3plus.apps.tree_map = function(vars) {
  
  var covered = false
  
  // Ok, to get started, lets run our heirarchically nested
  // data object through the d3 treemap function to get a
  // flat array of data with X, Y, width and height vars
  if (vars.app_data) {
    var tmap_data = d3.layout.treemap()
      .round(false)
      .size([vars.width, vars.height])
      .children(function(d) { return d.children; })
      .sort(function(a, b) { return a.value - b.value; })
      .value(function(d) { return d[vars.value]; })
      .nodes({"name":"root", "children": vars.app_data})
      .filter(function(d) {
        return !d.children;
      })
  }
  else {
    var tmap_data = []
  }
  
  var cell = d3.select("g.parent").selectAll("g")
    .data(tmap_data, function(d){ return d[vars.id]+d.depth; })
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // New cells enter, initialize them here
  //-------------------------------------------------------------------
  
  // cell aka container
  var cell_enter = cell.enter().append("g")
    .attr("id",function(d){
      return "cell_"+d[vars.id]
    })
    .attr("opacity", 0)
    .attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")"; 
    })
    
  // rectangle
  cell_enter.append("rect")
    .attr("stroke",vars.background)
    .attr("stroke-width",1)
    .attr("opacity",0.85)
    .attr('width', function(d) {
      return d.dx+'px'
    })
    .attr('height', function(d) { 
      return d.dy+'px'
    })
    .attr("fill", function(d){
      return d3plus.utils.color(vars,d);
    })
    .attr("shape-rendering","crispEdges")
    
  // text (name)
  cell_enter.append("text")
    .attr("opacity", 1)
    .attr("text-anchor","start")
    .style("font-weight",vars.font_weight)
    .attr("font-family",vars.font)
    .attr('class','name')
    .attr('x','0.2em')
    .attr('y','0em')
    .attr('dy','0em')
    .attr("fill", function(d){ 
      var color = d3plus.utils.color(vars,d)
      return d3plus.utils.text_color(color); 
    })
    .style("pointer-events","none")
    
  // text (share)
  cell_enter.append("text")
    .attr('class','share')
    .attr("text-anchor","middle")
    .style("font-weight",vars.font_weight)
    .attr("font-family",vars.font)
    .attr("fill", function(d){
      var color = d3plus.utils.color(vars,d)
      return d3plus.utils.text_color(color); 
    })
    .attr("fill-opacity",0.5)
    .style("pointer-events","none")
    .text(function(d) {
      var root = d;
      while(root.parent){ root = root.parent; } // find top most parent node
      d.share = vars.format((d.value/root.value)*100,"share")+"%";
      return d.share;
    })
    .attr('font-size',function(d){
      var size = (d.dx)/7
      if(d.dx < d.dy) var size = d.dx/7
      else var size = d.dy/7
      if (size < 10) size = 10;
      return size
    })
    .attr('x', function(d){
      return d.dx/2
    })
    .attr('y',function(d){
      return d.dy-(parseInt(d3.select(this).attr('font-size'),10)*0.25)
    })
    .each(function(d){
      var el = d3.select(this).node().getBBox()
      if (d.dx < el.width) d3.select(this).remove()
      else if (d.dy < el.height) d3.select(this).remove()
    })
    
    
  
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Update, for cells that are already in existance
  //-------------------------------------------------------------------
  
  small_tooltip = function(d) {

    d3plus.ui.tooltip.remove(vars.type)
    var ex = {}
    ex[vars.format("share")] = d.share
    var tooltip_data = d3plus.utils.tooltip(vars,d,"short",ex)
    var id = d3plus.utils.variable(vars,d,vars.id)
    
    d3plus.ui.tooltip.create({
      "title": d3plus.utils.variable(vars,d,vars.text),
      "color": d3plus.utils.color(vars,d),
      "icon": d3plus.utils.variable(vars,d,"icon"),
      "style": vars.icon_style,
      "id": vars.type,
      "x": d3.event.clientX,
      "y": d3.event.clientY,
      "offset": 3,
      "arrow": true,
      "mouseevents": d3.select("#cell_"+id).node(),
      "footer": vars.footer_text(),
      "data": tooltip_data
    })
    
  }
  
  cell
    .on(d3plus.evt.over,function(d){

      var id = d3plus.utils.variable(vars,d,vars.id),
          self = d3.select("#cell_"+id).node()
      
      d3.select("#cell_"+id).select("rect")
        .style("cursor","pointer")
        .attr("opacity",1)

      small_tooltip(d);
      
    })
    .on(d3plus.evt.out,function(d){
      
      var id = d3plus.utils.variable(vars,d,vars.id)
      
      d3.select("#cell_"+id).select("rect")
        .attr("opacity",0.85)
        
      if (!covered) {
        d3plus.ui.tooltip.remove(vars.type)
      }
      
    })
    .on(d3plus.evt.down,function(d){
      
      covered = true
        
      var id = d3plus.utils.variable(vars,d,vars.id),
          self = d3.select("#cell_"+id).node()
      
      make_tooltip = function(html) {
      
        d3.select("#cell_"+id).select("rect")
          .attr("opacity",0.85)
        
        d3plus.ui.tooltip.remove(vars.type)

        var ex = {}
        ex[vars.format("share")] = d.share
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
    .on(d3plus.evt.move,function(d){
      covered = false
      d3plus.ui.tooltip.move(d3.event.clientX,d3.event.clientY,vars.type)
    })
  
  cell.transition().duration(d3plus.timing)
    .attr("transform", function(d) { 
      return "translate(" + d.x + "," + d.y + ")"; 
    })
    .attr("opacity", 1)
    
  // update rectangles
  cell.select("rect").transition().duration(d3plus.timing)
    .attr('width', function(d) {
      return d.dx+'px'
    })
    .attr('height', function(d) { 
      return d.dy+'px'
    })
    .attr("fill", function(d){
      return d3plus.utils.color(vars,d);
    })

  // text (name)
  cell.select("text.name").transition()
    .duration(d3plus.timing/2)
    .attr("opacity", 0)
    .attr("fill", function(d){ 
      var color = d3plus.utils.color(vars,d)
      return d3plus.utils.text_color(color); 
    })
    .transition().duration(d3plus.timing/2)
    .each("end", function(d){
      d3.select(this).selectAll("tspan").remove();
      if(d.dx > 30 && d.dy > 30){
        var text = []
        var arr = vars.name_array ? vars.name_array : [vars.text,vars.id]
        arr.forEach(function(n){
          var name = d3plus.utils.variable(vars,d,n)
          text.push(vars.format(name))
        })
        var size = (d.dx)/7
        if(d.dx < d.dy) var size = d.dx/7
        else var size = d.dy/7
        if (size < 10) size = 10;
        
        d3plus.utils.wordwrap({
          "text": text,
          "parent": this,
          "width": d.dx,
          "height": d.dy-size,
          "resize": true
        })
      }
      
      d3.select(this).transition().duration(d3plus.timing/2)
        .attr("opacity", 1)
    })


  // text (share)
  cell.select("text.share").transition().duration(d3plus.timing/2)
    .attr("opacity", 0)
    .attr("fill", function(d){ 
      var color = d3plus.utils.color(vars,d)
      return d3plus.utils.text_color(color); 
    })
    .each("end",function(d){
      d3.select(this)
        .text(function(d){
          var root = d.parent;
          while(root.parent){ root = root.parent; } // find top most parent node
          d.share = vars.format((d.value/root.value)*100,"share")+"%";
          return d.share;
        })
        .attr('font-size',function(d){
          var size = (d.dx)/7
          if(d.dx < d.dy) var size = d.dx/7
          else var size = d.dy/7
          if (size < 10) size = 10;
          return size
        })
        .attr('x', function(d){
          return d.dx/2
        })
        .attr('y',function(d){
          return d.dy-(parseInt(d3.select(this).attr('font-size'),10)*0.25)
        })
        .each(function(d){
          var el = d3.select(this).node().getBBox()
          if (d.dx < el.width) d3.select(this).remove()
          else if (d.dy < el.height) d3.select(this).remove()
        })
      d3.select(this).transition().duration(d3plus.timing/2)
        .attr("opacity", 1)
    })
    

  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Exits, get rid of old cells
  //-------------------------------------------------------------------
  
  cell.exit().transition().duration(d3plus.timing)
    .attr("opacity", 0)
    .remove()

  //===================================================================
  
}
d3plus.data.geo_map = "object";
d3plus.vars.geo_map = [];

d3plus.apps.geo_map = function(vars) { 
  
  var default_opacity = 0.50,
      select_opacity = 0.75,
      stroke_width = 1,
      projection = null
      gmap_projection = null,
      path = null,
      hover = null,
      dragging = false,
      scale_height = 10,
      scale_padding = 20,
      scale_width = 250,
      info_width = vars.small ? 0 : 300,
      redraw = false
      
  vars.loading_text = vars.format("Loading Geography")
      
  /**********************/
  /* Define Color Scale */
  /**********************/
  vars.app_data_range = []
  vars.app_data_extent = [0,0]
  if (vars.app_data) {
    vars.app_data_extent = d3.extent(d3.values(vars.app_data),function(d){
      return d[vars.value] && d[vars.value] != 0 ? d[vars.value] : null
    })
    vars.app_data_range = d3plus.utils.buckets(vars.app_data_extent,vars.heat_map.length)
    vars.value_color = d3.scale.log()
      .domain(vars.app_data_range)
      .interpolate(d3.interpolateRgb)
      .range(vars.heat_map)
  }
  else {
    vars.app_data = []
  }
      
  /*******************/
  /* Create Init Map */
  /*******************/
  var map_div = vars.parent.selectAll("div#map").data([vars.app_data])
  
  map_div.enter().append("div")
    .attr("id","map")
    .style("width",vars.width+"px")
    .style("height",vars.height+"px")
    .style("margin-left",vars.margin.left+"px")
    .style("margin-top",vars.margin.top+"px")
    .each(function(){
      
      /************************/
      /* Initial Map Creation */
      /************************/
      google.maps.visualRefresh = true;
      vars.map = new google.maps.Map(this, {
        zoom: 5,
        center: new google.maps.LatLng(-13.544541, -52.734375),
        mapTypeControl: false,
        panControl: false,
        streetViewControl: false,
        zoomControl: false,
        scrollwheel: vars.scroll_zoom,
        mapTypeId: google.maps.MapTypeId.TERRAIN
      })
      
      google.maps.event.addListener(vars.map,"drag", function(e){
        dragging = true
      })

      // google.maps.event.addListener(vars.map,"dragend", function(){
      //   dragging = false
      // })
      
      var zoomControl = document.createElement('div')
      zoomControl.style.marginLeft = "5px"
      zoomControl.style.marginTop = "5px"
      
      var zoomIn = document.createElement('div')
      zoomIn.id = "zoom_in"
      zoomIn.innerHTML = "+"
      zoomControl.appendChild(zoomIn)
      
      var zoomOut = document.createElement('div')
      zoomOut.id = "zoom_out"
      zoomOut.innerHTML = "-"
      zoomControl.appendChild(zoomOut)
      
      vars.map.controls[google.maps.ControlPosition.LEFT_TOP].push(zoomControl)
      
      //zoom in control click event
      google.maps.event.addDomListener(zoomIn, 'click', function() {
        vars.loading_text = vars.format("Zooming In")
         var currentZoomLevel = vars.map.getZoom();
         if(currentZoomLevel != 21){
           vars.map.setZoom(currentZoomLevel + 1);
          }
       });

      //zoom out control click event
      google.maps.event.addDomListener(zoomOut, 'click', function() {
        vars.loading_text = vars.format("Zooming Out")
         var currentZoomLevel = vars.map.getZoom();
         if(currentZoomLevel != 0){
           vars.map.setZoom(currentZoomLevel - 1);
         }
       });
      
      var tileControl = document.createElement('div')
      tileControl.style.marginRight = "5px"
      
      var roadMap = document.createElement('div')
      roadMap.className = "tile_toggle"
      roadMap.innerHTML = vars.format("roads")
      tileControl.appendChild(roadMap)
      
      var terrain = document.createElement('div')
      terrain.className = "tile_toggle active"
      terrain.innerHTML = vars.format("terrain")
      tileControl.appendChild(terrain)
      
      var satellite = document.createElement('div')
      satellite.className = "tile_toggle"
      satellite.innerHTML = vars.format("satellite")
      tileControl.appendChild(satellite)
      
      var hybrid = document.createElement('div')
      hybrid.className = "tile_toggle"
      hybrid.innerHTML = vars.format("hybrid")
      tileControl.appendChild(hybrid)
      
      vars.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(tileControl)

      google.maps.event.addDomListener(roadMap, 'click', function() {
        d3.selectAll(".tile_toggle").attr("class","tile_toggle")
        this.className = "tile_toggle active"
        vars.map.setMapTypeId(google.maps.MapTypeId.ROADMAP)
      });
      
      google.maps.event.addDomListener(terrain, 'click', function() {
        d3.selectAll(".tile_toggle").attr("class","tile_toggle")
        this.className = "tile_toggle active"
        vars.map.setMapTypeId(google.maps.MapTypeId.TERRAIN)
      });
      
      google.maps.event.addDomListener(satellite, 'click', function() {
        d3.selectAll(".tile_toggle").attr("class","tile_toggle")
        this.className = "tile_toggle active"
        vars.map.setMapTypeId(google.maps.MapTypeId.SATELLITE)
      });
      
      google.maps.event.addDomListener(hybrid, 'click', function() {
        d3.selectAll(".tile_toggle").attr("class","tile_toggle")
        this.className = "tile_toggle active"
        vars.map.setMapTypeId(google.maps.MapTypeId.HYBRID)
      });
  
      scale()
  
      vars.overlay = new google.maps.OverlayView();
  
      // Add the container when the overlay is added to the map.
      vars.overlay.onAdd = function() {
        
        vars.zoom = vars.map.zoom
    
        var layer = d3.select(this.getPanes().overlayMouseTarget).append("div")

        path_group = layer.append("svg")
            .attr("id","gmap_overlay")
            .append("g")
            
        path_defs = path_group.append("defs")
        
        path_group.append("rect")
          .attr("class","overlay")
          .attr("width",20000)
          .attr("height",20000)
          .attr("fill","transparent")
          .on(d3plus.evt.move, function(d) {
            if (vars.highlight && !dragging && !d3plus.ie) {
              d3.select(this).style("cursor","-moz-zoom-out")
              d3.select(this).style("cursor","-webkit-zoom-out")
            }
          })
          .on(d3plus.evt.click, function(d) {
            if (vars.highlight && !dragging) zoom("reset")
          })

        vars.overlay.draw = function() {
          
          redraw = true
          
          vars.loader.select("div").text(vars.loading_text)
          vars.loader.style("display","block")
          
          var self = this
          
          setTimeout(function(){

            projection = self.getProjection()
            gmap_projection = function (coordinates) {
              var googleCoordinates = new google.maps.LatLng(coordinates[1], coordinates[0]);
              var pixelCoordinates = projection.fromLatLngToDivPixel(googleCoordinates);
              return [pixelCoordinates.x + 10000, pixelCoordinates.y + 10000];
            }
      
            path = d3.geo.path().projection(gmap_projection);

            var paths = path_group.selectAll("path")
              .data(vars.coords)
        
            paths.enter().append("path")
                .attr("id",function(d) { 
                  return "path"+d.id
                } )
                .attr("d", path)
                .attr("opacity",default_opacity)
                .call(color_paths)
                .attr("vector-effect","non-scaling-stroke")

            if (vars.map.zoom != vars.zoom) {
              paths.attr("d",path)
            }
            
            paths
              .attr("opacity",default_opacity)
              .call(color_paths)
              .on(d3plus.evt.over, function(d){
                hover = d.id
                if (vars.highlight != d.id) {
                  d3.select(this)
                    .style("cursor","pointer")
                    .attr("opacity",select_opacity)
                  if (!d3plus.ie) {
                    d3.select(this)
                      .style("cursor","-moz-zoom-in")
                      .style("cursor","-webkit-zoom-in")
                  }
                }
                if (!vars.highlight) {
                  update()
                }
              })
              .on(d3plus.evt.out, function(d){
                hover = null
                if (vars.highlight != d.id) {
                  d3.select(this).attr("opacity",default_opacity)
                }
                if (!vars.highlight) {
                  update()
                }
              })
              .on(d3plus.evt.click, function(d) {
                if (!dragging) {
                  vars.loading_text = vars.format("Calculating Coordinates")
                  if (vars.highlight == d.id) {
                    zoom("reset")
                  } 
                  else {
                    if (vars.highlight) {
                      var temp = vars.highlight
                      vars.highlight = null
                      d3.select("path#path"+temp).call(color_paths);
                    }
                    vars.highlight = d.id;
                    d3.select(this).call(color_paths);
                    zoom(d3.select(this).datum());
                  }
                  update();
                }
                dragging = false
              })
              
            vars.zoom = vars.map.zoom
            scale_update()
            update()
            
            if (vars.coord_change) {
              if (vars.highlight) var z = d3.select("path#path"+vars.highlight).datum()
              else var z = "reset"
              vars.loading_text = vars.format("Calculating Coordinates")
              zoom(z)
              vars.coord_change = false
            }
          
            vars.loader.style("display","none")

          },5)
        
        }
      }

      // Bind our overlay to the map…
      vars.overlay.setMap(vars.map)
  
    })
  
  map_div
    .style("width",vars.width+"px")
    .style("height",vars.height+"px")
    .style("margin-left",vars.margin.left+"px")
    .style("margin-top",vars.margin.top+"px")
  
  setTimeout(function(){
    var c = vars.map.getCenter()
    google.maps.event.trigger(vars.map, "resize")
    vars.map.panTo(c)
  },d3plus.timing)
  
  if (!redraw && vars.overlay.draw) vars.overlay.draw()
  
  function zoom(d) {
    
    if (d == "reset") {
      d = vars.boundaries
      if (vars.highlight) {
        var temp = vars.highlight;
        vars.highlight = null;
        d3.select("#path"+temp).call(color_paths);
        update()
      }
    }
    
    var bounds = d3.geo.bounds(d),
        gbounds = new google.maps.LatLngBounds()
    
    if (info_width > 0 && vars.highlight) {
      bounds[1][0] =  bounds[1][0]+(bounds[1][0]-bounds[0][0])
    }
        
    gbounds.extend(new google.maps.LatLng(bounds[0][1],bounds[0][0]))
    gbounds.extend(new google.maps.LatLng(bounds[1][1],bounds[1][0]))
    
    vars.map.fitBounds(gbounds)
  }
  
  function color_paths(p) {
    
    path_defs.selectAll("#stroke_clip").remove();
    
    p
      .attr("fill",function(d){ 
        if (d.id == vars.highlight) return "none";
        else if (!vars.app_data[d.id]) return "#888888";
        else return vars.app_data[d.id][vars.value] ? vars.value_color(vars.app_data[d.id][vars.value]) : "#888888"
      })
      .attr("stroke-width",function(d) {
        if (d.id == vars.highlight) return 10;
        else return stroke_width;
      })
      .attr("stroke",function(d) {
        if (d.id == vars.highlight) {
          if (!vars.app_data[d.id]) return "#888"
          return vars.app_data[d.id][vars.value] ? vars.value_color(vars.app_data[d.id][vars.value]) : "#888888";
        }
        else return "white";
      })
      .attr("opacity",function(d){
        if (d.id == vars.highlight) return select_opacity;
        else return default_opacity;
      })
      .each(function(d){
        if (d.id == vars.highlight) {
          path_defs.append("clipPath")
            .attr("id","stroke_clip")
            .append("use")
              .attr("xlink:href","#path"+vars.highlight)
          d3.select(this).attr("clip-path","url(#stroke_clip)")
        }
        else {
          d3.select(this).attr("clip-path","none")
        }
      })
  }
  
  function update() {
    
    d3plus.ui.tooltip.remove(vars.type);
    
    if (!vars.small && (hover || vars.highlight)) {
      
      var id = vars.highlight ? vars.highlight : hover
      
      var data = vars.app_data[id]
      
      if (data && data[vars.value]) {
        var color = vars.value_color(data[vars.value])
      }
      else {
        var color = "#888"
      }
      
      make_tooltip = function(html) {
    
        d3plus.ui.tooltip.remove(vars.type);
        
        if (typeof html == "string") html = "<br>"+html

        d3plus.ui.tooltip.create({
          "data": tooltip_data,
          "title": d3plus.utils.variable(vars,id,vars.text),
          "id": vars.type,
          "icon": d3plus.utils.variable(vars,id,"icon"),
          "style": vars.icon_style,
          "color": color,
          "footer": footer,
          "x": vars.width-info_width-5+vars.margin.left,
          "y": vars.margin.top+5,
          "fixed": true,
          "width": info_width,
          "html": html,
          "parent": vars.parent,
          "mouseevents": true,
          "background": vars.background,
          "max_height": vars.height-47
        })
        
      }
      
      if (!data || !data[vars.value]) {
        var footer = vars.format("No Data Available")
        make_tooltip(null)
      }
      else if (!vars.highlight) {
        var tooltip_data = d3plus.utils.tooltip(vars,id,"short"),
            footer = vars.footer_text()
        make_tooltip(null)
      }
      else {
        var tooltip_data = d3plus.utils.tooltip(vars,id,"long"),
            footer = vars.footer

        var html = vars.click_function ? vars.click_function(id) : null

        if (typeof html == "string") make_tooltip(html)
        else if (html.url && html.callback) {
          d3.json(html.url,function(data){
            html = html.callback(data)
            make_tooltip(html)
          })
        }
            
      }
      
    }
    
  }
  
  function scale() {
    
    var scale_svg = vars.parent.selectAll("svg#scale").data(["scale"])
    
    var scale_enter = scale_svg.enter().append("svg")
      .attr("id","scale")
      .style("left",(30+vars.margin.left)+"px")
      .style("top",(5+vars.margin.top)+"px")
      .attr("width", scale_width+"px")
      .attr("height", "45px")
      
    var scale_defs = scale_enter.append("defs")
    
    var gradient = scale_defs
      .append("linearGradient")
      .attr("id", "gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%")
      .attr("spreadMethod", "pad");
     
    vars.app_data_range.forEach(function(v,i){
      gradient.append("stop")
        .attr("offset",Math.round((i/(vars.app_data_range.length-1))*100)+"%")
        .attr("stop-color", vars.value_color(v))
        .attr("stop-opacity", 1)
    })
  
    var scale = scale_enter.append('g')
      .attr('class','scale')
      .style("opacity",0)
    
    var shadow = scale_defs.append("filter")
      .attr("id", "shadow")
      .attr("x", "-50%")
      .attr("y", "0")
      .attr("width", "200%")
      .attr("height", "200%");
    
    shadow.append("feGaussianBlur")
      .attr("in","SourceAlpha")
      .attr("result","blurOut")
      .attr("stdDeviation","3")
    
    shadow.append("feOffset")
      .attr("in","blurOut")
      .attr("result","the-shadow")
      .attr("dx","0")
      .attr("dy","1")
    
    shadow.append("feColorMatrix")
      .attr("in","the-shadow")
      .attr("result","colorOut")
      .attr("type","matrix")
      .attr("values","0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0")
    
    shadow.append("feBlend")
      .attr("in","SourceGraphic")
      .attr("in2","colorOut")
      .attr("mode","normal")
  
    scale.append("rect")
      .attr("id","scalebg")
      .attr("width", scale_width+"px")
      .attr("height", "45px")
      .attr("fill","#ffffff")
      .attr("opacity",0.75)
      .attr("filter","url(#shadow)")
      .attr("shape-rendering","crispEdges")
      
    scale.append("text")
      .attr("id","scale_title")
      .attr("x",(scale_width/2)+"px")
      .attr("y","0px")
      .attr("dy","1.25em")
      .attr("text-anchor","middle")
      .attr("fill","#333")
      .attr("font-size","10px")
      .attr("font-family",vars.font)
      .style("font-weight",vars.font_weight)
  
    scale.append("rect")
      .attr("id","scalecolor")
      .attr("x",scale_padding+"px")
      .attr("y",(scale_height*1.75)+"px")
      .attr("width", (scale_width-(scale_padding*2))+"px")
      .attr("height", scale_height*0.75+"px")
      .style("fill", "url(#gradient)")
     
    vars.app_data_range.forEach(function(v,i){
      if (i == vars.app_data_range.length-1) {
        var x = scale_padding+Math.round((i/(vars.app_data_range.length-1))*(scale_width-(scale_padding*2)))-1
      } else if (i != 0) {
        var x = scale_padding+Math.round((i/(vars.app_data_range.length-1))*(scale_width-(scale_padding*2)))-1
      } else {
        var x = scale_padding+Math.round((i/(vars.app_data_range.length-1))*(scale_width-(scale_padding*2)))
      }
      scale.append("rect")
        .attr("id","scaletick_"+i)
        .attr("x", x+"px")
        .attr("y", (scale_height*1.75)+"px")
        .attr("width", 1)
        .attr("height", ((scale_height*0.75)+3)+"px")
        .style("fill", "#333")
        .attr("opacity",0.25)
      
      scale.append("text")
        .attr("id","scale_"+i)
        .attr("x",x+"px")
        .attr("y", (scale_height*2.75)+"px")
        .attr("dy","1em")
        .attr("text-anchor","middle")
        .attr("fill","#333")
        .attr("font-family",vars.font)
        .style("font-weight",vars.font_weight)
        .attr("font-size","10px")
    })
    
  }
  
  function scale_update() {
    if (!vars.app_data_extent[0] || Object.keys(vars.app_data).length < 2 || vars.small) {
      d3.select("g.scale").transition().duration(d3plus.timing)
        .style("opacity",0)
    }
    else {
      var max = 0
      vars.app_data_range.forEach(function(v,i){
        var elem = d3.select("g.scale").select("text#scale_"+i)
        elem.text(vars.format(v,vars.value))
        var w = elem.node().getBBox().width
        if (w > max) max = w
      })
    
      max += 10
      
      d3.select("g.scale").transition().duration(d3plus.timing)
        .style("opacity",1)
      
      d3.select("svg#scale").transition().duration(d3plus.timing)
        .attr("width",max*vars.app_data_range.length+"px")
        .style("left",(30+vars.margin.left)+"px")
        .style("top",(5+vars.margin.top)+"px")
      
      d3.select("g.scale").select("rect#scalebg").transition().duration(d3plus.timing)
        .attr("width",max*vars.app_data_range.length+"px")
      
      d3.select("g.scale").select("rect#scalecolor").transition().duration(d3plus.timing)
        .attr("x",max/2+"px")
        .attr("width",max*(vars.app_data_range.length-1)+"px")
      
      d3.select("g.scale").select("text#scale_title").transition().duration(d3plus.timing)
        .attr("x",(max*vars.app_data_range.length)/2+"px")
        .text(vars.format(vars.value))
      
      vars.app_data_range.forEach(function(v,i){
      
        if (i == vars.app_data_range.length-1) {
          var x = (max/2)+Math.round((i/(vars.app_data_range.length-1))*(max*vars.app_data_range.length-(max)))-1
        } 
        else if (i != 0) {
          var x = (max/2)+Math.round((i/(vars.app_data_range.length-1))*(max*vars.app_data_range.length-(max)))-1
        } 
        else {
          var x = (max/2)+Math.round((i/(vars.app_data_range.length-1))*(max*vars.app_data_range.length-(max)))
        }
      
        d3.select("g.scale").select("rect#scaletick_"+i).transition().duration(d3plus.timing)
          .attr("x",x+"px")
      
        d3.select("g.scale").select("text#scale_"+i).transition().duration(d3plus.timing)
          .attr("x",x+"px")
      })
    
    }
    
  }
  
};
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
d3plus.data.bubbles = "array";
d3plus.vars.bubbles = ["value"];

d3plus.apps.bubbles = function(vars) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Private Variables
  //-------------------------------------------------------------------
  
  var covered = false
  
  var groups = {},
      donut_size = 0.35,
      title_height = vars.small ? 0 : 30,
      arc_offset = vars.donut ? donut_size : 0,
      sort_order = vars.sort == "value" ? vars.value : vars.sort;
      
  var arc = d3.svg.arc()
    .startAngle(0)
    .innerRadius(function(d) { return d.arc_inner })
    .outerRadius(function(d) { return d.arc_radius })
    .endAngle(function(d) { return d.arc_angle });
  
  var arc_else = d3.svg.arc()
    .startAngle(0)
    .innerRadius(function(d) { return d.arc_inner_else })
    .outerRadius(function(d) { return d.arc_radius_else })
    .endAngle(function(d) { return d.arc_angle_else });
  
  var arc_bg = d3.svg.arc()
    .startAngle(0)
    .innerRadius(function(d) { return d.arc_inner_bg })
    .outerRadius(function(d) { return d.arc_radius_bg })
    .endAngle(360);
  
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Define size scaling
  //-------------------------------------------------------------------
  if (!vars.app_data) vars.app_data = []
  var size_domain = d3.extent(vars.app_data, function(d){ 
    return d[vars.value] == 0 ? null : d[vars.value] 
  })
  
  if (!size_domain[1]) size_domain = [0,0]
  if (size_domain[1] == size_domain[0]) size_domain[0] = 0
  
  vars.size_scale = d3.scale[vars.size_scale_type]()
    .domain(size_domain)
    .range([1,4])
    
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Calculate positioning for each bubble
  //-------------------------------------------------------------------
  
  var data_nested = {}
  data_nested.key = "root";
  data_nested.values = d3.nest()
    .key(function(d){ return d3plus.utils.variable(vars,d[vars.id],vars.grouping) })
    .entries(vars.app_data)
    
  var pack = d3.layout.pack()
    .size([vars.width,vars.height])
    .children(function(d) { return d.values; })
    .value(function(d) { return d[vars.value] })
    .padding(0)
    .radius(function(d){ return vars.size_scale(d) })
    .sort(function(a,b) { 
      if (a.values && b.values) return a.values.length - b.values.length;
      else return a[vars.value] - b[vars.value];
    })
  
  var data_packed = pack.nodes(data_nested)
    .filter(function(d){
      if (d.depth == 1) {
        if (d.children.length == 1 ) {
          d[vars.text] = d3plus.utils.variable(vars,d.children[0][vars.id],vars.text);
          d.category = d.children[0].category;
        }
        else {
          d[vars.text] = d.key;
          d.category = d.key;
        }
        d[vars.value] = d.value;
      }
      return d.depth == 1;
    })
    .sort(function(a,b){
      var s = sort_order == vars.color ? "category" : sort_order
      var a_val = d3plus.utils.variable(vars,a,s)
      var b_val = d3plus.utils.variable(vars,b,s)
      if (typeof a_val == "number") {
        if(a[sort_order] < b[sort_order]) return 1;
        if(a[sort_order] > b[sort_order]) return -1;
      }
      else {
        if(a_val < b_val) return -1;
        if(a_val > b_val) return 1;
      }
      return 0;
    })
  
  if(data_packed.length == 1) {
    var columns = 1,
        rows = 1;
  }
  else if (data_packed.length < 4) {
    var columns = data_packed.length,
        rows = 1;
  } 
  else {
    var rows = Math.ceil(Math.sqrt(data_packed.length/(vars.width/vars.height))),
        columns = Math.ceil(Math.sqrt(data_packed.length*(vars.width/vars.height)));
  }

  if (vars.app_data.length > 0) {
    while ((rows-1)*columns >= data_packed.length) rows--
  }
  

  
  var max_size = d3.max(data_packed,function(d){return d.r;})*2,
      downscale = (d3.min([vars.width/columns,(vars.height/rows)-title_height])*0.90)/max_size;
      
  var r = 0, c = 0;
  data_packed.forEach(function(d){
    
    if (d.depth == 1) {
      
      if (vars.grouping != "active") {
        var color = d3plus.utils.color(vars,d.children[0]);
      }
      else {
        var color = "#cccccc";
      }
      
      color = d3.rgb(color).hsl()
      if (color.s > 0.9) color.s = 0.75
      while (color.l > 0.75) color = color.darker()
      color = color.rgb()
      
      groups[d.key] = {};
      groups[d.key][vars.color] = color;
      groups[d.key].children = d.children.length;
      groups[d.key].key = d.key;
      groups[d.key][vars.text] = d[vars.text];
      groups[d.key].x = ((vars.width/columns)*c)+((vars.width/columns)/2);
      groups[d.key].y = ((vars.height/rows)*r)+((vars.height/rows)/2)+(title_height/2);
      groups[d.key].width = (vars.width/columns);
      groups[d.key].height = (vars.height/rows);
      groups[d.key].r = d.r*downscale;

      if (c < columns-1) c++
      else {
        c = 0
        r++
      }
      
    }
    
  })
  
  vars.app_data.forEach(function(d){
    var parent = data_packed.filter(function(p){ 
      if (d3plus.utils.variable(vars,d[vars.id],vars.grouping) === false) var key = "false";
      else if (d3plus.utils.variable(vars,d[vars.id],vars.grouping) === true) var key = "true";
      else var key = d3plus.utils.variable(vars,d[vars.id],vars.grouping)
      return key == p.key 
    })[0]
    d.x = (downscale*(d.x-parent.x))+groups[parent.key].x;
    d.y = (downscale*(d.y-parent.y))+groups[parent.key].y;
    d.r = d.r*downscale;
  })
    
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Set up initial SVG groups
  //-------------------------------------------------------------------
    
  vars.parent_enter.append('g')
    .attr('class','groups');
    
  vars.parent_enter.append('g')
    .attr('class','bubbles');
    
  vars.parent_enter.append('g')
    .attr('class','labels');
    
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // New labels enter, initialize them here
  //-------------------------------------------------------------------

  if (vars.small) groups = {};

  var group = d3.select("g.groups").selectAll("g.group")
    .data(d3.values(groups),function(d){ return d.key })
    
  group.enter().append("g")
    .attr("class", "group")
    .attr("transform", function(d){ return "translate("+d.x+","+d.y+")"; })
    .each(function(d){
      
      if (vars.grouping == "active") {
        var t = d[vars.text] == "true" ? "Fully "+vars.active : "Not Fully "+vars.active
      } else {
        var t = d[vars.text]
      }
        
      d3.select(this).append("text")
        .attr("opacity",0)
        .attr("text-anchor","middle")
        .attr("font-weight",vars.font_weight)
        .attr("font-size","12px")
        .attr("font-family",vars.font)
        .attr("fill",d3plus.utils.darker_color(d[vars.color]))
        .attr('x',0)
        .attr('y',function(dd) {
          return -(d.height/2)-title_height/4;
        })
        .each(function(){
          d3plus.utils.wordwrap({
            "text": t,
            "parent": this,
            "width": d.width,
            "height": 30
          })
        })
      
    });
    
  group.transition().duration(d3plus.timing)
    .attr("transform", function(d){ return "translate("+d.x+","+d.y+")"; })
    .each(function(d){
      
      if (vars.group_bgs && d.children > 1) {
        
        var bg = d3.select(this).selectAll("circle")
          .data([d]);
        
        bg.enter().append("circle")
          .attr("fill", d[vars.color])
          .attr("stroke", d[vars.color])
          .attr("stroke-width",1)
          .style('fill-opacity', 0.1 )
          .attr("opacity",0)
          .attr("r",d.r)
        
        bg.transition().duration(d3plus.timing)
          .attr("opacity",1)
          .attr("r",d.r);
          
      } else {
        d3.select(this).select("circle").transition().duration(d3plus.timing)
          .attr("opacity",0)
          .remove();
      }
      
      d3.select(this).select("text").transition().duration(d3plus.timing)
        .attr("opacity",1)
        .attr('y',function(dd) {
          return -(d.height/2)-title_height/4;
        })
      
    });
    
  group.exit().transition().duration(d3plus.timing)
    .each(function(d){
      
      if (vars.group_bgs) {
        d3.select(this).select("circle").transition().duration(d3plus.timing)
          .attr("r",0)
          .attr("opacity",0);
      }
      
      d3.select(this).selectAll("text").transition().duration(d3plus.timing)
        .attr("opacity",0);
        
    }).remove();
    
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // New bubbles enter, initialize them here
  //-------------------------------------------------------------------

  var bubble = d3.select("g.bubbles").selectAll("g.bubble")
    .data(vars.app_data,function(d){ return d[vars.id] })
    
  update_function = function(obj,d) {
  
    
  
  }
  
  bubble.transition().duration(d3plus.timing)
    .attr("transform", function(d){ return "translate("+d.x+","+d.y+")"; })
    .each(function(d){
      
      if (vars.donut) d.arc_inner_bg = d.r*arc_offset;
      else d.arc_inner_bg = 0;
      d.arc_radius_bg = d.r;
  
      var color = d3plus.utils.color(vars,d)
  
      var bg_color = d3.hsl(color)
      bg_color.l = 0.95
      bg_color = bg_color.toString()

      d3.select(this).select("path.bg").transition().duration(d3plus.timing)
        .attr("fill", bg_color )
        .attr("stroke", color)
        .attrTween("d",arcTween_bg)
        .each("end", function() {
          vars.arc_sizes[d[vars.id]+"_bg"] = d.arc_radius_bg
          vars.arc_inners[d[vars.id]+"_bg"] = d.arc_inner_bg
        })
  
  
      var arc_start = d.r*arc_offset;

      d.arc_inner = arc_start;
      d.arc_radius = arc_start+(d.r-arc_start);
    
      if (d[vars.total]) d.arc_angle = (((d[vars.active]/d[vars.total])*360) * (Math.PI/180));
      else if (d.active) d.arc_angle = Math.PI; 

      d.arc_angle = d.arc_angle < Math.PI*2 ? d.arc_angle : Math.PI*2

      d3.select(this).select("path.available").transition().duration(d3plus.timing)
        .style('fill', color)
        .attrTween("d",arcTween)
        .each("end", function() {
          vars.arc_sizes[d[vars.id]] = d.arc_radius
          vars.arc_inners[d[vars.id]] = d.arc_inner
          vars.arc_angles[d[vars.id]] = d.arc_angle
        })

      if (d[vars.else_var]) {

        d.arc_inner_else = arc_start;
        d.arc_radius_else = d.r;
  
        d.arc_angle_else = d.arc_angle + (((d[vars.else_var] / d[vars.total])*360) * (Math.PI/180));
        d.arc_angle_else = d.arc_angle_else < Math.PI*2 ? d.arc_angle_else : Math.PI*2
    
        d3.select("pattern#hatch"+d[vars.id]).select("rect").transition().duration(d3plus.timing)
          .style("fill",color)
    
        d3.select("pattern#hatch"+d[vars.id]).select("path").transition().duration(d3plus.timing)
          .style("stroke",color)

        d3.select(this).select("path.elsewhere").transition().duration(d3plus.timing)
          .style("stroke",color)
          .attrTween("d",arcTween_else)
          .each("end", function() {
            vars.arc_sizes[d[vars.id]+"_else"] = d.arc_radius_else
            vars.arc_inners[d[vars.id]+"_else"] = d.arc_inner_else
            vars.arc_angles[d[vars.id]+"_else"] = d.arc_angle_else
          })
      }
      
    })
    
  bubble.enter().append("g")
    .attr("class", "bubble")
    .attr("transform", function(d){ return "translate("+d.x+","+d.y+")"; })
    .each(function(d){
      
      d3.select(this).append("rect")
        .attr("fill","transparent")
        .attr("opacity",0)
        .attr("x",-d.r)
        .attr("y",-d.r)
        .attr("width",d.r*2)
        .attr("height",d.r*2)
      
      vars.arc_sizes[d[vars.id]+"_bg"] = 0
      vars.arc_inners[d[vars.id]+"_bg"] = 0
      
      var color = d3plus.utils.color(vars,d)
      
      var bg_color = d3.hsl(color)
      bg_color.l = 0.95
      bg_color = bg_color.toString()
      
      d3.select(this).append("path")
        .attr("class","bg")
        .attr("fill", bg_color )
        .attr("stroke", color)
        .attr("stroke-width",1)
      
      d3.select(this).select("path.bg").transition().duration(d3plus.timing)
        .attrTween("d",arcTween_bg)
    
      if (d[vars.else_var]) {
    
        vars.arc_angles[d[vars.id]+"_else"] = 0
        vars.arc_sizes[d[vars.id]+"_else"] = 0
        vars.arc_inners[d[vars.id]+"_else"] = 0
        
        vars.defs.select("pattern#hatch"+d[vars.id]).remove()
        
        var pattern = vars.defs.append("pattern")
          .attr("id","hatch"+d[vars.id])
          .attr("patternUnits","userSpaceOnUse")
          .attr("x","0")
          .attr("y","0")
          .attr("width","10")
          .attr("height","10")
          .append("g")
            
        pattern.append("rect")
          .attr("x","0")
          .attr("y","0")
          .attr("width","10")
          .attr("height","10")
          .attr("fill",color)
          .attr("fill-opacity",0.25)
            
        pattern.append("line")
          .attr("x1","0")
          .attr("x2","10")
          .attr("y1","0")
          .attr("y2","10")
          .attr("stroke",color)
          .attr("stroke-width",1)
            
        pattern.append("line")
          .attr("x1","-1")
          .attr("x2","1")
          .attr("y1","9")
          .attr("y2","11")
          .attr("stroke",color)
          .attr("stroke-width",1)
            
        pattern.append("line")
          .attr("x1","9")
          .attr("x2","11")
          .attr("y1","-1")
          .attr("y2","1")
          .attr("stroke",color)
          .attr("stroke-width",1)
      
        d3.select(this).append("path")
          .attr("class","elsewhere")
          .attr("fill", "url(#hatch"+d[vars.id]+")")
          .attr("stroke",color)
          .attr("stroke-width",1)
      
        d3.select(this).select("path.elsewhere").transition().duration(d3plus.timing)
          .attrTween("d",arcTween_else)
      }
      
      vars.arc_angles[d[vars.id]] = 0
      vars.arc_sizes[d[vars.id]] = 0
      vars.arc_inners[d[vars.id]] = 0
      
      d3.select(this).append("path")
        .each(function(dd) { dd.arc_id = dd[vars.id]; })
        .attr("class","available")
        .attr('fill', color)
      
      d3.select(this).select("path.available").transition().duration(d3plus.timing)
        .attrTween("d",arcTween)
        
    })
    .each(function(d){
    
      if (vars.donut) d.arc_inner_bg = d.r*arc_offset;
      else d.arc_inner_bg = 0;
      d.arc_radius_bg = d.r;
      
      d3.select(this).select("path.bg").transition().duration(d3plus.timing)
        .attrTween("d",arcTween_bg)
        .each("end", function() {
          vars.arc_sizes[d[vars.id]+"_bg"] = d.arc_radius_bg
          vars.arc_inners[d[vars.id]+"_bg"] = d.arc_inner_bg
        })
        
        
      var arc_start = d.r*arc_offset;
      
      d.arc_inner = arc_start;
      d.arc_radius = arc_start+(d.r-arc_start);

      d3.select(this).select("path.available").transition().duration(d3plus.timing)
        .attrTween("d",arcTween)
        .each("end", function() {
          vars.arc_sizes[d[vars.id]] = d.arc_radius
          vars.arc_inners[d[vars.id]] = d.arc_inner
          
          if (d[vars.total]) d.arc_angle = (((d[vars.active] / d[vars.total])*360) * (Math.PI/180));
          else if (d.active) d.arc_angle = Math.PI; 
          
          d.arc_angle = d.arc_angle < Math.PI*2 ? d.arc_angle : Math.PI*2
          
          d3.select(this).transition().duration(d3plus.timing*(d.arc_angle/2))
            .attrTween("d",arcTween)
            .each("end", function() {
              vars.arc_angles[d[vars.id]] = d.arc_angle
            })
        })
    
      if (d[vars.else_var]) {
      
        d.arc_inner_else = arc_start;
        d.arc_radius_else = d.r;
      
        d3.select(this).select("path.elsewhere").transition().duration(d3plus.timing)
          .attrTween("d",arcTween_else)
          .each("end", function() {
            vars.arc_sizes[d[vars.id]+"_else"] = d.arc_radius_else
            vars.arc_inners[d[vars.id]+"_else"] = d.arc_inner_else
      
            d.arc_angle_else = d.arc_angle + (((d[vars.else_var] / d[vars.total])*360) * (Math.PI/180));

            d.arc_angle_else = d.arc_angle_else < Math.PI*2 ? d.arc_angle_else : Math.PI*2
            
            d3.select(this).transition().duration(d3plus.timing*(d.arc_angle_else/2))
              .attrTween("d",arcTween_else)
              .each("end", function() {
                vars.arc_angles[d[vars.id]+"_else"] = d.arc_angle_else
              })
          })
      }
      
    })
    
  
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Update, for things that are already in existance
  //-------------------------------------------------------------------
    
  bubble
    .on(d3plus.evt.over, function(d){
      
      covered = false
      d3.select(this).style("cursor","pointer")
      
      var tooltip_data = d3plus.utils.tooltip(vars,d,"short")

      d3plus.ui.tooltip.remove(vars.type)
      d3plus.ui.tooltip.create({
        "id": vars.type,
        "color": d3plus.utils.color(vars,d),
        "icon": d3plus.utils.variable(vars,d[vars.id],"icon"),
        "style": vars.icon_style,
        "data": tooltip_data,
        "title": d3plus.utils.variable(vars,d[vars.id],vars.text),
        "x": d.x+vars.margin.left+vars.parent.node().offsetLeft,
        "y": d.y+vars.margin.top+vars.parent.node().offsetTop,
        "offset": d.r-5,
        "arrow": true,
        "mouseevents": false,
        "footer": vars.footer_text()
      })
      
    })
    .on(d3plus.evt.out, function(d){
      if (!covered) d3plus.ui.tooltip.remove(vars.type)
    })
    .on(d3plus.evt.click, function(d){

      covered = true
      var id = d3plus.utils.variable(vars,d,vars.id)
      var self = this
      
      make_tooltip = function(html) {
        d3plus.ui.tooltip.remove(vars.type)
        d3.selectAll(".axis_hover").remove()
        
        var tooltip_data = d3plus.utils.tooltip(vars,d,"long")
        
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
      
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Exit, for nodes and links that are being removed
  //-------------------------------------------------------------------

  bubble.exit().transition().duration(d3plus.timing)
    .each(function(d){
    
      d.arc_radius_bg = 0;
      d.arc_inner_bg = 0;
      
      d3.select(this).select("path.bg").transition().duration(d3plus.timing)
        .attrTween("d",arcTween_bg)
        .each("end", function() {
          vars.arc_sizes[d[vars.id]+"_bg"] = d.arc_radius_bg
          vars.arc_inners[d[vars.id]+"_bg"] = d.arc_inner_bg
        })
    
      d.arc_radius = 0;
      d.arc_angle = 0; 
      d.arc_inner = 0;

      d3.select(this).select("path.available").transition().duration(d3plus.timing)
        .attrTween("d",arcTween)
        .each("end", function() {
          vars.arc_angles[d[vars.id]] = d.arc_angle
          vars.arc_sizes[d[vars.id]] = d.arc_radius
          vars.arc_inners[d[vars.id]] = d.arc_inner
        })
    
      if (d[vars.else_var]) {
      
        d.arc_angle_else = 0;
        d.arc_radius_else = 0;
        d.arc_inner_else = 0;
      
        d3.select(this).select("path.elsewhere").transition().duration(d3plus.timing)
          .attrTween("d",arcTween_else)
          .each("end", function(dd) {
            vars.arc_angles[d[vars.id]+"_else"] = d.arc_angle_else
            vars.arc_sizes[d[vars.id]+"_else"] = d.arc_radius_else
            vars.arc_inners[d[vars.id]+"_else"] = d.arc_inner_else
          })
      }

      d3.select(this).select("circle.hole").transition().duration(d3plus.timing)
        .attr("r", 0)
      
    })
    .remove();

  //===================================================================
  
  function arcTween(b) {
    var i = d3.interpolate({arc_angle: vars.arc_angles[b[vars.id]], arc_radius: vars.arc_sizes[b[vars.id]], arc_inner: vars.arc_inners[b[vars.id]]}, b);
    return function(t) {
      return arc(i(t));
    };
  }
  
  function arcTween_else(b) {
    var i = d3.interpolate({arc_angle_else: vars.arc_angles[b[vars.id]+"_else"], arc_radius_else: vars.arc_sizes[b[vars.id]+"_else"], arc_inner_else: vars.arc_inners[b[vars.id]+"_else"]}, b);
    return function(t) {
      return arc_else(i(t));
    };
  }
  
  function arcTween_bg(b) {
    var i = d3.interpolate({arc_radius_bg: vars.arc_sizes[b[vars.id]+"_bg"], arc_inner_bg: vars.arc_inners[b[vars.id]+"_bg"]}, b);
    return function(t) {
      return arc_bg(i(t));
    };
  }

  //===================================================================
};
d3plus.data.rings = "object";
d3plus.vars.rings = [];

d3plus.apps.rings = function(vars) {
      
  var tooltip_width = 300
      
  var width = vars.small ? vars.width : vars.width-tooltip_width
      
  var tree_radius = vars.height > width ? width/2 : vars.height/2,
      node_size = d3.scale.linear().domain([1,2]).range([8,4]),
      ring_width = vars.small ? tree_radius/2.25 : tree_radius/3,
      total_children,
      hover = null;
      
  // container for the visualization
  var viz_enter = vars.parent_enter.append("g").attr("class", "viz")
    .attr("transform", "translate(" + width / 2 + "," + vars.height / 2 + ")");
    
  viz_enter.append("g").attr("class","links")
  viz_enter.append("g").attr("class","nodes")
    
  d3.select("g.viz").transition().duration(d3plus.timing)
    .attr("transform", "translate(" + width / 2 + "," + vars.height / 2 + ")");
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // INIT vars & data munging
  //-------------------------------------------------------------------

  var tree = d3.layout.tree()
      .size([360, tree_radius - ring_width])
      .separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth; });

  var diagonal = d3.svg.diagonal.radial()
      .projection(function(d) { return [d.y, d.x / 180 * Math.PI]; });
      
  var line = d3.svg.line()
      .x(function(d) { return d.x; })
      .y(function(d) { return d.y; })
      .interpolate("basis");
      
  if (vars.app_data) {
    var root = get_root()
  }
  else {
    var root = {"links": [], "nodes": []}
  }
      
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // LINKS
  //-------------------------------------------------------------------
  
  var link = d3.select(".links").selectAll(".link")
    .data(root.links)
      
  link.enter().append("path")
    .attr("fill", "none")
    .attr("class", "link")
    .attr("opacity",0);
      
  if (!vars.last_highlight || vars.last_highlight != vars.highlight) {
    link.transition().duration(d3plus.timing/2)
      .attr("opacity",0)
      .transition().call(line_styles)
      .transition().duration(d3plus.timing/2)
      .attr("opacity",function(d) {
        if (hover && d3.select(this).attr("stroke") == "#ddd") {
           return 0.25
        } return 0.75;
      })
  }
  else {
    link.call(line_styles)
      .attr("opacity",function(d) {
        if (hover && d3.select(this).attr("stroke") == "#ddd") {
           return 0.25
        } return 0.75;
      })
  }
      
  link.exit().transition().duration(d3plus.timing)
    .attr("opacity",0)
    .remove();

  //===================================================================

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // NODES
  //-------------------------------------------------------------------
  
  var node = d3.select(".nodes").selectAll("g.node")
    .data(root.nodes,function(d){return d[vars.id]})
      
  var node_enter = node.enter().append("g")
      .attr("class", "node")
      .attr("opacity",0)
      .attr("transform", function(d) {
        if (d.depth == 0) return "none"
        else return "rotate(" + (d.ring_x - 90) + ")translate(" + d.ring_y + ")"; 
      })
      
  node_enter.append("circle")
    .attr("id",function(d) { return "node_"+d[vars.id]; })
    .call(circle_styles)
    .attr("r",0)
    
  node_enter.append("text")
    .attr("font-weight",vars.font_weight)
    .attr("x",0)
    .attr("font-family",vars.font)
    .attr("opacity",0)
    .call(text_styles);
      
  node
    .on(d3plus.evt.over,function(d){
      if (d.depth != 0) {
        d3.select(this).style("cursor","pointer")
        if (!d3plus.ie) {
          d3.select(this).style("cursor","-moz-zoom-in")
          d3.select(this).style("cursor","-webkit-zoom-in")
        }
        hover = d;
        if (!vars.small) {
          link.call(line_styles);
          d3.selectAll(".node circle").call(circle_styles);
          d3.selectAll(".node text").call(text_styles);
        }
      }
    })
    .on(d3plus.evt.out,function(d){
      if (d.depth != 0) {
        hover = null;
        if (!vars.small) {
          link.call(line_styles);
          d3.selectAll(".node circle").call(circle_styles);
          d3.selectAll(".node text").call(text_styles);
        }
      }
    })
    .on(d3plus.evt.click,function(d){
      if (d.depth != 0) vars.parent.call(chart.highlight(d[vars.id]));
    })
      
  node.transition().duration(d3plus.timing)
      .attr("opacity",1)
      .attr("transform", function(d) {
        if (d.depth == 0) return "none"
        else return "rotate(" + (d.ring_x - 90) + ")translate(" + d.ring_y + ")"; 
      })
  
  node.select("circle").transition().duration(d3plus.timing)
    .call(circle_styles)
    
  node.select("text").transition().duration(d3plus.timing)
    .attr("opacity",function(d){
      if (vars.small) return 0
      else return 1
    })
    .call(text_styles)
    .each(function(d) {
      if (d.depth == 0) {
        var s = Math.sqrt((ring_width*ring_width)/2), 
            w = s*1.4, 
            h = s/1.4, 
            resize = true
      }
      else {
        d3.select(this).attr("font-size","10px")
        var w = ring_width-d.radius*2, resize = false
        if (d.depth == 1) var h = (Math.PI*((tree_radius-(ring_width*2))*2))*(d.size/360);
        if (d.depth == 2) var h = (Math.PI*((tree_radius-ring_width)*2))/total_children;
      }

      if (h < 15) h = 15;
      
      d3plus.utils.wordwrap({
        "text": d3plus.utils.variable(vars,d,vars.text),
        "parent": this,
        "width": w,
        "height": h,
        "resize": resize,
        "font_min": 10
      })

      d3.select(this).attr("y",(-d3.select(this).node().getBBox().height/2)+"px")
      
    })
      
  node.exit().transition().duration(d3plus.timing)
      .attr("opacity",0)
      .remove()
      
  //===================================================================
  
  hover = null;
  
  vars.last_highlight = vars.highlight
  
  if (!vars.small && vars.app_data) {

    d3plus.ui.tooltip.remove(vars.type)
    
    make_tooltip = function(html) {
        
      if (typeof html == "string") html = "<br>"+html
    
      var tooltip_appends = "<div class='d3plus_tooltip_data_title'>"
      tooltip_appends += vars.format("Primary Connections")
      tooltip_appends += "</div>"

      vars.connections[vars.highlight].forEach(function(n){
      
        var parent = "d3.select(&quot;#"+vars.parent.node().id+"&quot;)"
      
        tooltip_appends += "<div class='d3plus_network_connection' onclick='"+parent+".call(chart.highlight(&quot;"+n[vars.id]+"&quot;))'>"
        tooltip_appends += "<div class='d3plus_network_connection_node'"
        tooltip_appends += " style='"
        tooltip_appends += "background-color:"+fill_color(n)+";"
        tooltip_appends += "border-color:"+stroke_color(n)+";"
        tooltip_appends += "'"
        tooltip_appends += "></div>"
        tooltip_appends += "<div class='d3plus_network_connection_name'>"
        tooltip_appends += d3plus.utils.variable(vars,n[vars.id],vars.text)
        tooltip_appends += "</div>"
        tooltip_appends += "</div>"
      })
    
      var tooltip_data = d3plus.utils.tooltip(vars,vars.highlight)

      d3plus.ui.tooltip.remove(vars.type)
      d3plus.ui.tooltip.create({
        "title": d3plus.utils.variable(vars,vars.highlight,vars.text),
        "color": d3plus.utils.color(vars,vars.highlight),
        "icon": d3plus.utils.variable(vars,vars.highlight,"icon"),
        "style": vars.icon_style,
        "id": vars.type,
        "html": tooltip_appends+html,
        "footer": vars.footer,
        "data": tooltip_data,
        "x": vars.width-tooltip_width-5,
        "y": vars.margin.top+5,
        "max_height": vars.height-10,
        "fixed": true,
        "width": tooltip_width,
        "mouseevents": true,
        "parent": vars.parent,
        "background": vars.background
      })
      
    }
    
    var html = vars.click_function ? vars.click_function(vars.highlight,root.nodes) : ""
    
    if (typeof html == "string") make_tooltip(html)
    else {
      d3.json(html.url,function(data){
        html = html.callback(data)
        make_tooltip(html)
      })
    }
    
  }
  
  function fill_color(d) {
    if(!vars.active || d3plus.utils.variable(vars,d[vars.id],vars.active)){
      return d[vars.color];
    } 
    else {
      var lighter_col = d3.hsl(d[vars.color]);
      lighter_col.l = 0.95;
      return lighter_col.toString()
    }
  }
  
  function stroke_color(d) {
    if(!vars.active || d3plus.utils.variable(vars,d[vars.id],vars.active)){
      return "#333";
    } else {
      return d3plus.utils.darker_color(d[vars.color])
    }
  }
  
  function line_styles(l) {
    l
      .attr("stroke", function(d) {
        if (hover) {
          if (d.source == hover || d.target == hover || 
          (hover.depth == 2 && (hover.parents.indexOf(d.target) >= 0))) {
            this.parentNode.appendChild(this);
            return vars.highlight_color;
          } else if (hover.depth == 1 && hover.children_total.indexOf(d.target) >= 0) {
            return vars.secondary_color;
          }
          else {
            return "transparent"
          }
        }
        if (d.source[vars.id] == vars.highlight) {
          this.parentNode.appendChild(this)
          return "#888"
        }
        else return "#ccc"
      })
      .attr("stroke-width", function(d){
        if (d.source[vars.id] == vars.highlight) return 2
        else return 1
      })
      .attr("d", function(d) {
        if (d.source[vars.id] == vars.highlight) {
          var x = d.target.ring_y * Math.cos((d.target.ring_x-90)*(Math.PI/180)),
              y = d.target.ring_y * Math.sin((d.target.ring_x-90)*(Math.PI/180))
          return line([{"x":0,"y":0},{"x":x,"y":y}]);
        } else {
          var x1 = d.source.ring_x,
              y1 = d.source.ring_y,
              x2 = d.target.ring_x,
              y2 = d.target.ring_y
          return diagonal({"source":{"x":x1,"y":y1},"target":{"x":x2,"y":y2}});
        }
      })
  }
  
  function circle_styles(c) {
    c
      .attr("fill", function(d){
        var color = fill_color(d)
        
        if (d.depth == 0) return color;
        else if (d.depth == 1 && (!hover || d == hover || d.children_total.indexOf(hover) >= 0)) return color;
        else if (d.depth == 2 && (!hover || d == hover || d.parents.indexOf(hover) >= 0)) return color;
        else return "lightgrey"
      
      })
      .attr("stroke", function(d){
        var color = stroke_color(d)
        
        if (d.depth == 0) return color;
        else if (d.depth == 1 && (!hover || d == hover || d.children_total.indexOf(hover) >= 0)) return color;
        else if (d.depth == 2 && (!hover || d == hover || d.parents.indexOf(hover) >= 0)) return color;
        else return "darkgrey"
      
      })
      .attr("stroke-width", "1")
      .attr("r", function(d){ 
        if (d.depth == 0) return ring_width/2;
        var s = node_size(d.depth); 
        if (d.depth == 1) var limit = (Math.PI*((tree_radius-(ring_width*2))*2))/total_children;
        if (d.depth == 2) var limit = (Math.PI*((tree_radius-ring_width)*2))/total_children;
        if (s > limit/2) s = limit/2;
        if (s < 2) s = 2;
        d.radius = s;
        return d.radius;
      })
  }
  
  function text_styles(t) {
    t
      .attr("fill",function(d){
        if (d.depth == 0) {
          var color = d3plus.utils.text_color(fill_color(d));
        } 
        else {
          var color = d3plus.utils.darker_color(d[vars.color]);
        }

        if (d.depth == 0) return color;
        else if (d.depth == 1 && (!hover || d == hover || d.children_total.indexOf(hover) >= 0)) return color;
        else if (d.depth == 2 && (!hover || d == hover || d.parents.indexOf(hover) >= 0)) return color;
        else return "lightgrey"
      })
      .attr("text-anchor", function(d) { 
        if (d.depth == 0) return "middle"
        else return d.ring_x%360 < 180 ? "start" : "end"; 
      })
      .attr("transform", function(d) { 
        if (d.depth == 0) return "none"
        else {
          var offset = d.radius*2
          return d.ring_x%360 < 180 ? "translate("+offset+")" : "rotate(180)translate(-"+offset+")";
        }
      })
  }
  
  function get_root(){
    
    var links = [], nodes = [], root = {}
      
    root.ring_x = 0;
    root.ring_y = 0;
    root.depth = 0;
    root[vars.text] = d3plus.utils.variable(vars,vars.highlight,vars.text)
    root[vars.id] = vars.highlight
    root.children = []
    root[vars.color] = d3plus.utils.color(vars,vars.highlight)
    root[vars.active] = d3plus.utils.variable(vars,vars.highlight,vars.active)
  
    nodes.push(root);
    
    // populate first level
    var prim_links = vars.connections[vars.highlight]
    if (prim_links) {
      prim_links.forEach(function(child){
  
        // give first level child the properties
        child.ring_x = 0;
        child.ring_y = ring_width;
        child.depth = 1;
        child[vars.text] = d3plus.utils.variable(vars,child[vars.id],vars.text)
        child.children = []
        child.children_total = []
        child[vars.color] = d3plus.utils.color(vars,child[vars.id])
        child[vars.active] = d3plus.utils.variable(vars,child[vars.id],vars.active)
  
        // push first level child into nodes
        nodes.push(child);
        root.children.push(child);
  
        // create link from center to first level child
        links.push({"source": nodes[nodes.indexOf(root)], "target": nodes[nodes.indexOf(child)]})
      
        vars.connections[child[vars.id]].forEach(function(grandchild){ 
          child.children_total.push(grandchild);
        })
      
      })
    
      // populate second level
      var len = nodes.length,
          len2 = nodes.length
        
      while(len--) {

        var sec_links = vars.connections[nodes[len][vars.id]]
        if (sec_links) {
          sec_links.forEach(function(grandchild){
    
            // if grandchild isn't already a first level child or the center node
            if (prim_links.indexOf(grandchild) < 0 && grandchild[vars.id] != vars.highlight) {
          
              grandchild.ring_x = 0;
              grandchild.ring_y = ring_width*2;
              grandchild.depth = 2;
              grandchild[vars.text] = d3plus.utils.variable(vars,grandchild[vars.id],vars.text)
              grandchild[vars.color] = d3plus.utils.color(vars,grandchild[vars.id])
              grandchild[vars.active] = d3plus.utils.variable(vars,grandchild[vars.id],vars.active)
              grandchild.parents = []

              var s = 10000, node_id = 0;
              prim_links.forEach(function(node){
                var temp_links = vars.connections[node[vars.id]]
                temp_links.forEach(function(node2){
                  if (node2[vars.id] == grandchild[vars.id]) {
                    grandchild.parents.push(node);
                    if (temp_links.length < s) {
                      s = temp_links.length
                      node_id = node[vars.id]
                    }
                  }
                })
              })
              var len3 = len2;
              while(len3--) {
                if (nodes[len3][vars.id] == node_id && nodes[len3].children.indexOf(grandchild) < 0) {
                  nodes[len3].children.push(grandchild);
                }
              }
      
              // if grandchild hasn't been added to the nodes list, add it
              if (nodes.indexOf(grandchild) < 0) {
                nodes.push(grandchild);
              }
      
              // create link from child to grandchild
              links.push({"source": nodes[len], "target": nodes[nodes.indexOf(grandchild)]})
      
            }
    
          })
        }
  
      }
    }
    
    var first_offset = 0
    
    total_children = d3.sum(nodes,function(dd){
        if (dd.depth == 1) {
          if (dd.children.length > 0) return dd.children.length;
          else return 1;
        } else return 0;
      })
    

    // sort first level vars.connections by color
    nodes[0].children.sort(function(a, b){
      var a_color = d3.rgb(a[vars.color]).hsl().h
      var b_color = d3.rgb(b[vars.color]).hsl().h
      if (d3.rgb(a[vars.color]).hsl().s == 0) a_color = 361
      if (d3.rgb(b[vars.color]).hsl().s == 0) b_color = 361
      if (a_color < b_color) return -1;
      if (a_color > b_color) return 1;
      return 0;
    })
    
    nodes[0].children.forEach(function(d){
      if (d.children.length > 1) var num = d.children.length;
      else var num = 1;
      d.ring_x = ((first_offset+(num/2))/total_children)*360
      d.size = (num/total_children)*360
      if (d.size > 180) d.size = 180
      
      var positions = (num)/2
      
      // sort children by color
      d.children.sort(function(a, b){
        var a_color = d3.rgb(a[vars.color]).hsl().h
        var b_color = d3.rgb(b[vars.color]).hsl().h
        if (d3.rgb(a[vars.color]).hsl().s == 0) a_color = 361
        if (d3.rgb(b[vars.color]).hsl().s == 0) b_color = 361
        if (a_color < b_color) return -1;
        if (a_color > b_color) return 1;
        return 0;
      })
      
      d.children.forEach(function(c,i){
        if (d.children.length <= 1) c.ring_x = d.ring_x
        else c.ring_x = d.ring_x+(((i+0.5)-positions)/positions)*(d.size/2)
      })
      first_offset += num
    })


    return {"nodes": nodes, "links": links};
  }
};
d3plus.ui.tooltip = {};

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Create a Tooltip
//-------------------------------------------------------------------

d3plus.ui.tooltip.create = function(params) {
  
  var default_width = params.fullscreen ? 250 : 200
  params.width = params.width || default_width
  params.max_width = params.max_width || 386
  params.id = params.id || "default"
  params.size = params.fullscreen || params.html ? "large" : "small"
  params.offset = params.offset || 0
  params.arrow_offset = params.arrow ? 8 : 0
  params.x = params.x || 0
  params.y = params.y || 0
  params.color = params.color || "#333"
  params.parent = params.parent || d3.select("body")
  params.background = params.background || "#ffffff"
  params.style = params.style || "default"
  
  d3plus.ui.tooltip.remove("d3plus_tooltip_id_"+params.id)
  
  params.anchor = {}
  if (params.fullscreen) {
    params.anchor.x = "center"
    params.anchor.y = "center"
    params.x = params.parent ? params.parent.node().offsetWidth/2 : window.innerWidth/2
    params.y = params.parent ? params.parent.node().offsetHeight/2 : window.innerHeight/2
  }
  else if (params.align) {
    var a = params.align.split(" ")
    params.anchor.y = a[0]
    if (a[1]) params.anchor.x = a[1]
    else params.anchor.x = "center"
  }
  else {
    params.anchor.x = "center"
    params.anchor.y = "top"
  }
  
  var title_width = params.width - 30
  
  if (params.fullscreen) {
    var curtain = params.parent.append("div")
      .attr("id","d3plus_tooltip_curtain_"+params.id)
      .attr("class","d3plus_tooltip_curtain")
      .style("background-color",params.background)
      .on(d3plus.evt.click,function(){
        d3plus.ui.tooltip.remove(params.id)
      })
  }
  
  var tooltip = params.parent.append("div")
    .datum(params)
    .attr("id","d3plus_tooltip_id_"+params.id)
    .attr("class","d3plus_tooltip d3plus_tooltip_"+params.size)
    .on(d3plus.evt.out,function(){
      d3plus.ui.tooltip.close()
    })
    
  if (params.max_height) {
    tooltip.style("max-height",params.max_height+"px")
  }
    
  if (params.fixed) {
    tooltip.style("z-index",500)
    params.mouseevents = true
  }
  else {
    tooltip.style("z-index",2000)
  }
  
  var container = tooltip.append("div")
    .datum(params)
    .attr("class","d3plus_tooltip_container")
  
  if (params.fullscreen && params.html) {
    
    w = params.parent ? params.parent.node().offsetWidth*0.75 : window.innerWidth*0.75
    h = params.parent ? params.parent.node().offsetHeight*0.75 : window.innerHeight*0.75
    
    container
      .style("width",w+"px")
      .style("height",h+"px")
      
    var body = container.append("div")
      .attr("class","d3plus_tooltip_body")
      .style("width",params.width+"px")
      
  }
  else {
    
    if (params.width == "auto") {
      var w = "auto"
      container.style("max-width",params.max_width+"px")
    }
    else var w = params.width-14+"px"

    var body = container
      .style("width",w)
      
  }
    
  if (params.title || params.icon) {
    var header = body.append("div")
      .attr("class","d3plus_tooltip_header")
  }
  
  if (params.fullscreen) {
    var close = tooltip.append("div")
      .attr("class","d3plus_tooltip_close")
      .style("background-color",d3plus.utils.darker_color(params.color))
      .html("\&times;")
      .on(d3plus.evt.click,function(){
        d3plus.ui.tooltip.remove(params.id)
      })
  }
  
  if (!params.mouseevents) {
    tooltip.style("pointer-events","none")
  }
  else if (params.mouseevents !== true) {
    
    var oldout = d3.select(params.mouseevents).on(d3plus.evt.out)
    
    var newout = function() {
      
      var target = d3.event.toElement || d3.event.relatedTarget
      if (target) {
        var c = typeof target.className == "string" ? target.className : target.className.baseVal
        var istooltip = c.indexOf("d3plus_tooltip") == 0
      }
      else {
        var istooltip = false
      }
      if (!target || (!ischild(tooltip.node(),target) && !ischild(params.mouseevents,target) && !istooltip)) {
        oldout(d3.select(params.mouseevents).datum())
        d3plus.ui.tooltip.close()
        d3.select(params.mouseevents).on(d3plus.evt.out,oldout)
      }
    }
    
    var ischild = function(parent, child) {
       var node = child.parentNode;
       while (node != null) {
         if (node == parent) {
           return true;
         }
         node = node.parentNode;
       }
       return false;
    }
    
    d3.select(params.mouseevents).on(d3plus.evt.out,newout)
    tooltip.on(d3plus.evt.out,newout)
    
    var move_event = d3.select(params.mouseevents).on(d3plus.evt.move)
    if (move_event) {
      tooltip.on(d3plus.evt.move,move_event)
    }
    
  }
    
  if (params.arrow) {
    var arrow = tooltip.append("div")
      .attr("class","d3plus_tooltip_arrow")
  }
  
  if (params.icon) {
    var title_icon = header.append("div")
      .attr("class","d3plus_tooltip_icon")
      .style("background-image","url("+params.icon+")")
      
    if (params.style == "knockout") {
      title_icon.style("background-color",params.color)
    }
    
    title_width -= title_icon.node().offsetWidth
  }
  
  if (params.title) {
    var title = header.append("div")
      .attr("class","d3plus_tooltip_title")
      .style("width",title_width+"px")
      .text(params.title)
  }
  
  if (params.description) {
    var description = body.append("div")
      .attr("class","d3plus_tooltip_description")
      .text(params.description)
  }
  
  if (params.data || params.html && !params.fullscreen) {

    var data_container = body.append("div")
      .attr("class","d3plus_tooltip_data_container")
  }
  
  if (params.data) {
      
    var val_width = 0, val_heights = {}
      
    var last_group = null
    params.data.forEach(function(d,i){
      
      if (d.group) {
        if (last_group != d.group) {
          last_group = d.group
          data_container.append("div")
            .attr("class","d3plus_tooltip_data_title")
            .text(d.group)
        }
      }
      
      var block = data_container.append("div")
        .attr("class","d3plus_tooltip_data_block")
        .datum(d)
        
      if (d.highlight) {
        block.style("color",d3plus.utils.darker_color(params.color))
      }
      
      var name = block.append("div")
          .attr("class","d3plus_tooltip_data_name")
          .html(d.name)
          .on(d3plus.evt.out,function(){
            d3.event.stopPropagation()
          })
      
      var val = block.append("div")
          .attr("class","d3plus_tooltip_data_value")
          .text(d.value)
          .on(d3plus.evt.out,function(){
            d3.event.stopPropagation()
          })
          
      if (params.mouseevents && d.desc) {
        var desc = block.append("div")
          .attr("class","d3plus_tooltip_data_desc")
          .text(d.desc)
          .on(d3plus.evt.out,function(){
            d3.event.stopPropagation()
          })
          
        var dh = desc.node().offsetHeight
        
        desc.style("height","0px")
          
        var help = name.append("div")
          .attr("class","d3plus_tooltip_data_help")
          .text("?")
          .on(d3plus.evt.over,function(){
            var c = d3.select(this.parentNode.parentNode).style("color")
            d3.select(this).style("background-color",c)
            desc.style("height",dh+"px")
          })
          .on(d3plus.evt.out,function(){
            d3.event.stopPropagation()
          })
          
        name
          .style("cursor","pointer")
          .on(d3plus.evt.over,function(){
            d3plus.ui.tooltip.close()
            var c = d3.select(this.parentNode).style("color")
            help.style("background-color",c)
            desc.style("height",dh+"px")
          })
          
        block.on(d3plus.evt.out,function(){
          d3.event.stopPropagation()
          d3plus.ui.tooltip.close()
        })
      }
          
      var w = parseFloat(val.style("width"),10)
      if (w > params.width/2) w = params.width/2
      if (w > val_width) val_width = w
          
      if (i != params.data.length-1) {
        if ((d.group && d.group == params.data[i+1].group) || !d.group && !params.data[i+1].group)
        data_container.append("div")
          .attr("class","d3plus_tooltip_data_seperator")
      }
          
    })
    
    data_container.selectAll(".d3plus_tooltip_data_name")
      .style("width",function(){
        var w = parseFloat(d3.select(this.parentNode).style("width"),10)
        return (w-val_width-30)+"px"
      })
    
    data_container.selectAll(".d3plus_tooltip_data_value")
      .style("width",val_width+"px")
      .each(function(d){
        var h = parseFloat(d3.select(this).style("height"),10)
        val_heights[d.name] = h
      })
    
    data_container.selectAll(".d3plus_tooltip_data_name")
      .style("min-height",function(d){
        return val_heights[d.name]+"px"
      })
    
  }
    
  if (params.html && !params.fullscreen) {
    data_container.append("div")
      .html(params.html)
  }
  
  var footer = body.append("div")
    .attr("class","d3plus_tooltip_footer")
  
  if (params.footer) {
    footer.html(params.footer)
  }
  
  params.height = tooltip.node().offsetHeight
  
  if (params.html && params.fullscreen) {
    var h = params.height-12
    var w = tooltip.node().offsetWidth-params.width-44
    container.append("div")
      .attr("class","d3plus_tooltip_html")
      .style("width",w+"px")
      .style("height",h+"px")
      .html(params.html)
  }
  
  params.width = tooltip.node().offsetWidth
  
  if (params.anchor.y != "center") params.height += params.arrow_offset
  else params.width += params.arrow_offset
  
  if (params.data || (!params.fullscreen && params.html)) {
    
    if (!params.fullscreen && params.html) {
      var parent_height = params.parent.node().offsetHeight
      var limit = params.fixed ? parent_height-params.y-10 : parent_height-10
      var h = params.height < limit ? params.height : limit
    }
    else {
      var h = params.height
    }
    h -= parseFloat(container.style("padding-top"),10)
    h -= parseFloat(container.style("padding-bottom"),10)
    if (header) {
      h -= header.node().offsetHeight
      h -= parseFloat(header.style("padding-top"),10)
      h -= parseFloat(header.style("padding-bottom"),10)
    }
    if (footer) {
      h -= footer.node().offsetHeight
      h -= parseFloat(footer.style("padding-top"),10)
      h -= parseFloat(footer.style("padding-bottom"),10)
    }
    data_container
      .style("max-height",h+"px")
  }
  
  params.height = tooltip.node().offsetHeight
  
  d3plus.ui.tooltip.move(params.x,params.y,params.id);
    
}

d3plus.ui.tooltip.arrow = function(arrow) {
  arrow
    .style("bottom", function(d){
      if (d.anchor.y != "center" && !d.flip) return "-5px"
      else return "auto"
    })
    .style("top", function(d){
      if (d.anchor.y != "center" && d.flip) return "-5px"
      else if (d.anchor.y == "center") return "50%"
      else return "auto"
    })
    .style("left", function(d){
      if (d.anchor.y == "center" && d.flip) return "-5px"
      else if (d.anchor.y != "center") return "50%"
      else return "auto"
    })
    .style("right", function(d){
      if (d.anchor.y == "center" && !d.flip) return "-5px"
      else return "auto"
    })
    .style("margin-left", function(d){
      if (d.anchor.y == "center") {
        return "auto"
      }
      else {
        if (d.anchor.x == "right") {
          var arrow_x = -d.width/2+d.arrow_offset/2
        }
        else if (d.anchor.x == "left") {
          var arrow_x = d.width/2-d.arrow_offset*2 - 5
        }
        else {
          var arrow_x = -5
        }
        if (d.cx-d.width/2-5 < arrow_x) {
          arrow_x = d.cx-d.width/2-5
          if (arrow_x < 2-d.width/2) arrow_x = 2-d.width/2
        }
        else if (-(window.innerWidth-d.cx-d.width/2+5) > arrow_x) {
          var arrow_x = -(window.innerWidth-d.cx-d.width/2+5)
          if (arrow_x > d.width/2-11) arrow_x = d.width/2-11
        }
        return arrow_x+"px"
      }
    })
    .style("margin-top", function(d){
      if (d.anchor.y != "center") {
        return "auto"
      }
      else {
        if (d.anchor.y == "bottom") {
          var arrow_y = -d.height/2+d.arrow_offset/2 - 1
        }
        else if (d.anchor.y == "top") {
          var arrow_y = d.height/2-d.arrow_offset*2 - 2
        }
        else {
          var arrow_y = -9
        }
        if (d.cy-d.height/2-d.arrow_offset < arrow_y) {
          arrow_y = d.cy-d.height/2-d.arrow_offset
          if (arrow_y < 4-d.height/2) arrow_y = 4-d.height/2
        }
        else if (-(window.innerHeight-d.cy-d.height/2+d.arrow_offset) > arrow_y) {
          var arrow_y = -(window.innerHeight-d.cy-d.height/2+d.arrow_offset)
          if (arrow_y > d.height/2-22) arrow_y = d.height/2-22
        }
        return arrow_y+"px"
      }
    })
}

//===================================================================

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Close ALL Descriptions
//-------------------------------------------------------------------

d3plus.ui.tooltip.close = function() {
  d3.selectAll("div.d3plus_tooltip_data_desc").style("height","0px")
  d3.selectAll("div.d3plus_tooltip_data_help").style("background-color","#ccc")
}

//===================================================================

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Destroy Tooltips
//-------------------------------------------------------------------

d3plus.ui.tooltip.remove = function(id) {

  d3.selectAll("div#d3plus_tooltip_curtain_"+id).remove()
  if (id) d3.select("div#d3plus_tooltip_id_"+id).remove()
  else d3.selectAll("div.d3plus_tooltip").remove()

}

//===================================================================

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Get X and Y position for Tooltip
//-------------------------------------------------------------------

d3plus.ui.tooltip.move = function(x,y,id) {
  
  if (!id) var tooltip = d3.select("div#d3plus_tooltip_id_default")
  else var tooltip = d3.select("div#d3plus_tooltip_id_"+id)
  
  if (tooltip.node()) {
    
    var d = tooltip.datum()
  
    d.cx = x
    d.cy = y
  
    if (!d.fixed) {

      // Set initial values, based off of anchor
      if (d.anchor.y != "center") {

        if (d.anchor.x == "right") {
          d.x = d.cx - d.arrow_offset - 4
        }
        else if (d.anchor.x == "center") {
          d.x = d.cx - d.width/2
        }
        else if (d.anchor.x == "left") {
          d.x = d.cx - d.width + d.arrow_offset + 2
        }

        // Determine whether or not to flip the tooltip
        if (d.anchor.y == "bottom") {
          d.flip = d.cy + d.height + d.offset <= window.innerHeight
        }
        else if (d.anchor.y == "top") {
          d.flip = d.cy - d.height - d.offset < 0
        }
        
        if (d.flip) {
          d.y = d.cy + d.offset + d.arrow_offset
        }
        else {
          d.y = d.cy - d.height - d.offset - d.arrow_offset
        }
    
      }
      else {

        d.y = d.cy - d.height/2
        
        // Determine whether or not to flip the tooltip
        if (d.anchor.x == "right") {
          d.flip = d.cx + d.width + d.offset <= window.innerWidth
        }
        else if (d.anchor.x == "left") {
          d.flip = d.cx - d.width - d.offset < 0
        }
    
        if (d.anchor.x == "center") {
          d.flip = false
          d.x = d.cx - d.width/2
        }
        else if (d.flip) {
          d.x = d.cx + d.offset + d.arrow_offset
        }
        else {
          d.x = d.cx - d.width - d.offset
        }
      }
  
      // Limit X to the bounds of the screen
      if (d.x < 0) {
        d.x = 0
      }
      else if (d.x + d.width > window.innerWidth) {
        d.x = window.innerWidth - d.width
      }
  
      // Limit Y to the bounds of the screen
      if (d.y < 0) {
        d.y = 0
      }
      else if (d.y + d.height > window.innerHeight) {
        d.y = window.innerHeight - d.height
      }
      
    }
    
    tooltip
      .style("top",d.y+"px")
      .style("left",d.x+"px")
  
    if (d.arrow) {
      tooltip.selectAll(".d3plus_tooltip_arrow")
        .call(d3plus.ui.tooltip.arrow)
    }
    
  }
    
}

//===================================================================
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Formats Raw Data
//-------------------------------------------------------------------

d3plus.utils.data = function(vars,datum) {
  
  // Initial data setup when the raw data has changed
  if (!vars.data || datum != vars.data.raw) {
    
    if (vars.dev) console.group("%c[d3plus]%c New Data Detected","font-weight:bold","font-weight: normal")
    
    vars.data = {}
    vars.data.raw = datum
    vars.data.filtered = null

    console.time("key analysis")
    vars.keys = {}
    datum.forEach(function(d){
      for (k in d) {
        if (!vars.keys[k] && d[k]) {
          vars.keys[k] = typeof d[k]
        }
      }
    })
    console.timeEnd("key analysis")
    
    if (vars.dev) console.groupEnd();
    
  }
  
  vars.data.type = d3plus.data[vars.type]
  
  // Filter data if it hasn't been filtered or variables have changed
  if (!vars.data.filtered || vars.check.length) {
    vars.data[vars.data.type] = null

    if (vars.check.indexOf(vars.unique_axis) >= 0) {
      vars.check.splice(vars.check.indexOf(vars.unique_axis),1)
    }
    
    d3plus.utils.data_filter(vars)
  }
  
  // create data for app type if it does not exist
  if (!vars.data[vars.data.type]) {
    
    vars.data[vars.data.type] = {}
    console.group("%c[d3plus]%c Formatting Data","font-weight:bold","font-weight: normal")
    
    vars.nesting.forEach(function(depth){
      
      console.time(depth)
      
      var level = vars.nesting.slice(0,vars.nesting.indexOf(depth)+1)
      
      vars.data[vars.data.type][depth] = {}
      
      var check_types = ["filtered","active","inactive"]
      
      check_types.forEach(function(b){

        if (b in vars.data) {

          vars.data[vars.data.type][depth][b] = {}
        
          for (y in vars.data[b]) {
            if (vars.data.type == "nested") {
              vars.data[vars.data.type][depth][b][y] = d3plus.utils.nesting(vars,vars.data[b][y],level)
            }
            else if (vars.data.type == "grouped") {
              vars.data[vars.data.type][depth][b][y] = d3plus.utils.nesting(vars,vars.data[b][y],level,true)
            }
            else if (vars.data.type == "object") {
              vars.data[vars.data.type][depth][b][y] = {}
              vars.data[b][y].forEach(function(d){
                vars.data[vars.data.type][depth][b][y][d[vars.id]] = d;
              })
            }
            else {
              vars.data[vars.data.type][depth][b][y] = vars.data[b][y]
            }
          }
          
        }
        
      })
      
      console.timeEnd(depth)
      
    })
    
    console.groupEnd()
    
  }
  
  // get correct data for app
  vars.app_data == null
  var dtype = vars.active && vars.spotlight ? "active" : "filtered"
  
  if (vars.year instanceof Array) {
    var temp_data = []
    vars.year.forEach(function(y){
      temp_data = temp_data.concat(vars.data[vars.data.type][vars.nesting[vars.depth]][dtype][y])
    })
    vars.app_data = temp_data
  }
  else {
    vars.app_data = vars.data[vars.data.type][vars.nesting[vars.depth]][dtype][vars.year]
  }
  
  if (vars.app_data.length == 0) {
    vars.app_data = null
  }
  
  // Get link connections if they have not been previously set
  if (!vars.connections && vars.links) {
    var links = vars.links_filtered || vars.links
    vars.connections = d3plus.utils.connections(vars,links)
  }
  
  // Set up axes
  if (["pie_scatter","stacked"].indexOf(vars.type) >= 0 && vars.app_data) {
    
    if (!vars.xaxis_range || !vars.static_axes) {
      if (vars.dev) console.log("%c[d3plus]%c Determining X Axis Domain","font-weight:bold","font-weight: normal")
      if (vars.xaxis_domain instanceof Array) {
        vars.xaxis_range = vars.xaxis_domain
        vars.app_data = vars.app_data.filter(function(d){
          var val = d3plus.utils.variable(vars,d,vars.xaxis)
          return val >= vars.xaxis_domain[0] && val <= vars.xaxis_domain[1]
        })
      }
      else if (!vars.static_axes) {
        vars.xaxis_range = d3.extent(vars.data[vars.data.type][vars.nesting[vars.depth]][dtype][vars.year],function(d){
          return d3plus.utils.variable(vars,d,vars.xaxis)
        })
      }
      else {
        vars.xaxis_range = d3.extent(vars.data[vars.data.type][vars.nesting[vars.depth]][dtype].all,function(d){
          return d3plus.utils.variable(vars,d,vars.xaxis)
        })
      }
    }
    
    if (!vars.yaxis_range || !vars.static_axes) {
      if (vars.dev) console.log("%c[d3plus]%c Determining Y Axis Domain","font-weight:bold","font-weight: normal")
      if (vars.yaxis_domain instanceof Array) {
        vars.yaxis_range = vars.yaxis_domain
      }
      else if (!vars.static_axes) {
        vars.yaxis_range = d3.extent(vars.data[vars.data.type][vars.nesting[vars.depth]][dtype][vars.year],function(d){
          return d3plus.utils.variable(vars,d,vars.yaxis)
        }).reverse()
      }
      else {
        vars.yaxis_range = d3.extent(vars.data[vars.data.type][vars.nesting[vars.depth]][dtype].all,function(d){
          return d3plus.utils.variable(vars,d,vars.yaxis)
        }).reverse()
      }
    }
    
    if (vars.mirror_axis) {
      var domains = vars.yaxis_range.concat(vars.xaxis_range)
      vars.xaxis_range = d3.extent(domains)
      vars.yaxis_range = d3.extent(domains).reverse()
    }
    
    if (vars.xaxis_range[0] == vars.xaxis_range[1]) {
      vars.xaxis_range[0] -= 1
      vars.xaxis_range[1] += 1
    }
    if (vars.yaxis_range[0] == vars.yaxis_range[1]) {
      vars.yaxis_range[0] -= 1
      vars.yaxis_range[1] += 1
    }
  }
  else {
    vars.xaxis_range = [0,0]
    vars.yaxis_range = [0,0]
  }
  
}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Filters the data based on vars.check
//-------------------------------------------------------------------

d3plus.utils.data_filter = function(vars) {
  
  if (vars.check.indexOf("filter") >= 0 && !vars.filter.length) {
    vars.check.splice(vars.check.indexOf("filter"),1)
  }
  if (vars.check.indexOf("solo") >= 0 && !vars.solo.length) {
    vars.check.splice(vars.check.indexOf("solo"),1)
  }
  
  // If both filter and solo exist, only check for solo
  if (vars.check.indexOf("filter") >= 0 && vars.check.indexOf("solo") >= 0) {
    vars.check.splice(vars.check.indexOf("filter"),1)
  }
  
  if (vars.check.indexOf("filter") >= 0 || vars.check.indexOf("solo") >= 0) {
    
    if (vars.nodes) {
      if (vars.dev) console.log("%c[d3plus]%c Filtering Nodes","font-weight:bold","font-weight: normal")
      vars.nodes_filtered = vars.nodes.filter(function(d){
        return d3plus.utils.deep_filter(vars,d[vars.id])
      })
    }
    
    if (vars.links) {
      if (vars.dev) console.log("%c[d3plus]%c Filtering Connections","font-weight:bold","font-weight: normal")
      vars.links_filtered = vars.links.filter(function(d){
        var first_match = d3plus.utils.deep_filter(vars,d.source),
            second_match = d3plus.utils.deep_filter(vars,d.target)
        return first_match && second_match
      })
      vars.connections = d3plus.utils.connections(vars,links)
    }
    
  }
  
  if (vars.check.indexOf(vars.year_var) >= 0) {
    vars.check.splice(vars.check.indexOf(vars.year_var),1)
    if (vars.data.filtered) vars.data.filtered = {"all": vars.data.filtered.all}
  }
  
  if (vars.check.indexOf(vars.active) >= 0) {
    vars.check.splice(vars.check.indexOf(vars.active),1)
    vars.data.active.all = null
    vars.data.inactive.all = null
  }
  
  d3plus.vars[vars.type].forEach(function(v){
    if (vars.check.indexOf(vars[v]) < 0) vars.check.unshift(vars[v])
  })
  
  if (vars.check.length) {
    if (vars.dev) console.group("%c[d3plus]%c Filtering Data","font-weight:bold","font-weight: normal");
    vars.data.filtered = {}
    var checking = vars.check.join(", ")
    if (vars.dev) console.time(checking)
    vars.data.filtered.all = vars.data.raw.filter(function(d){
      var ret = true
      vars.check.forEach(function(key){
        if (ret) {
          if (key == "filter" || key == "solo") {
            ret = d3plus.utils.deep_filter(vars,d)
          }
          else {
            if (key == vars["xaxis"]) vars.xaxis_range = null
            else if (key == vars["yaxis"]) vars.yaxis_range = null
            var value = d3plus.utils.variable(vars,d,key)
            if (value === null) ret = false
          }
        }
      })
      return ret
    
    })

    if (vars.dev) console.timeEnd(checking)
    vars.check = []
    if (vars.dev) console.groupEnd();
  }
  
  if (vars.active && !vars.data.active) {
    if (!vars.data.active) {
      vars.data.active = {}
      vars.data.inactive = {}
    }
    if (!vars.data.active.all) {
      vars.data.active.all = vars.data.filtered.all.filter(function(d){
        return d3plus.utils.variable(vars,d,vars.active)
      })
      vars.data.inactive.all = vars.data.filtered.all.filter(function(d){
        return d3plus.utils.variable(vars,d,vars.active)
      })
    }
  }
  
  if (vars.year_var && Object.keys(vars.data.filtered).length == 1) {
    
    if (vars.dev) console.log("%c[d3plus]%c Aggregating Years","font-weight:bold","font-weight: normal")

    // Find available years
    vars.data.years = d3plus.utils.uniques(vars.data.raw,vars.year_var)
    vars.data.years.sort()
    
    if (vars.data.years.length) {
      vars.data.years.forEach(function(y){
        vars.data.filtered[y] = vars.data.filtered.all.filter(function(d){
          return d3plus.utils.variable(vars,d,vars.year_var) == y;
        })
        if (vars.active) {
          vars.data.active[y] = vars.data.filtered[y].filter(function(d){
            return d3plus.utils.variable(vars,d,vars.active)
          })
          vars.data.inactive[y] = vars.data.filtered[y].filter(function(d){
            return d3plus.utils.variable(vars,d,vars.active)
          })
        }
      })
    }
    
  }
    
}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Performs a deep filter based on filter/solo and nesting levels
//-------------------------------------------------------------------

d3plus.utils.deep_filter = function(vars,d) {
  
  var id = d[vars.id],
      check = [id]
      
  if (vars.nesting.length) {
    vars.nesting.forEach(function(key){
      var obj = d3plus.utils.variable(vars,id,key)
      if (obj) {
        check.push(obj)
      }
    })
  }
  
  var match = true
  if (id != vars.highlight || vars.type != "rings") {
    if (vars.solo.length) {
      match = false
      check.forEach(function(c){
        if (vars.solo.indexOf(c) >= 0) match = true
      })
    }
    else if (vars.filter.length) {
      match = true
      check.forEach(function(c){
        if (vars.filter.indexOf(c) >= 0) match = false
      })
    }
  }
  return match
}
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates Error Message
//-------------------------------------------------------------------

d3plus.utils.error = function(vars) {
  
  var error = vars.parent.select("g.parent").selectAll("g.d3plus-error")
    .data([vars.internal_error])
    
  error.enter().append("g")
    .attr("class","d3plus-error")
    .attr("opacity",0)
    .append("text")
      .attr("x",vars.svg_width/2)
      .attr("font-size","30px")
      .attr("fill","#888")
      .attr("text-anchor", "middle")
      .attr("font-family", vars.font)
      .style("font-weight", vars.font_weight)
      .style(vars.info_style)
      .each(function(d){
        d3plus.utils.wordwrap({
          "text": d,
          "parent": this,
          "width": vars.svg_width-20,
          "height": vars.svg_height-20,
          "resize": false
        })
      })
      .attr("y",function(){
        var height = d3.select(this).node().getBBox().height
        return vars.svg_height/2-height/2
      })
      
  error.transition().duration(d3plus.timing)
    .attr("opacity",1)
      
  error.select("text").transition().duration(d3plus.timing)
    .attr("x",vars.svg_width/2)
    .each(function(d){
      d3plus.utils.wordwrap({
        "text": d,
        "parent": this,
        "width": vars.svg_width-20,
        "height": vars.svg_height-20,
        "resize": false
      })
    })
    .attr("y",function(){
      var height = d3.select(this).node().getBBox().height
      return vars.svg_height/2-height/2
    })
      
  error.exit().transition().duration(d3plus.timing)
    .attr("opacity",0)
    .remove()
  
}
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Nests data...
//-------------------------------------------------------------------

d3plus.utils.nesting = function(vars,flat_data,levels,grouped) {
  
  var nested_data = d3.nest(), group_data = [];
  
  levels.forEach(function(nest_key, i){
    
    nested_data
      .key(function(d){ 
        return d3plus.utils.variable(vars,d,nest_key)
      })
      
    if (vars.unique_axis) {
      nested_data
        .key(function(d){ 
          return d3plus.utils.variable(vars,d,vars[vars.unique_axis+"axis"])
        })
    }
    
    if (i == levels.length-1) {
      nested_data.rollup(function(leaves){
        
        to_return = {
          "num_children": leaves.length,
          "num_children_active": d3.sum(leaves, function(d){ return d[vars.active]; })
        }
        
        var nest_obj = d3plus.utils.variable(vars,leaves[0],nest_key)
        to_return[nest_key] = nest_obj
        
        if (nest_obj.display_id) to_return.display_id = nest_obj.display_id;
        
        for (key in vars.keys) {
          if (vars.aggs[key]) {
            to_return[key] = d3[vars.aggs[key]](leaves, function(d){ return d[key]; })
          }
          else {
            if ([vars.year_var,vars.icon].indexOf(key) >= 0 || (key == nest_key && !to_return[key])) {
              to_return[key] = leaves[0][key];
            }
            else if (vars.keys[key] === "number" && key != nest_key) {
              to_return[key] = d3.sum(leaves, function(d){ return d[key]; })
            }
            else if (key) {
              to_return[key] = leaves[0][key]
            }
          }
        }
        
        if (grouped) {
          levels.forEach(function(nk){
            to_return[nk] = leaves[0][nk]
          })
          group_data.push(to_return)
        }
        
        return to_return
        
      })
    }
  
  })
    
  rename_key_value = function(obj) { 
    if (obj.values && obj.values.length) { 
      var return_obj = {}
      return_obj.children = obj.values.map(function(obj) { 
        return rename_key_value(obj);
      })
      return return_obj
    } 
    else if(obj.values) { 
      return obj.values
    }
    else {
      return obj; 
    }
  }
  
  nested_data = nested_data
    .entries(flat_data)
    .map(rename_key_value)

  if (grouped) return group_data
  
  return nested_data;

}
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Formats Raw Data
//-------------------------------------------------------------------

d3plus.utils.titles = function(vars) {
  
  // Calculate total_bar value
  if (!vars.app_data || !vars.total_bar || vars.type == "stacked") {
    vars.data.total = null
  }
  else {
    if (vars.dev) console.group("%c[d3plus]%c Calculating Total Value","font-weight:bold","font-weight: normal")
    
    if (vars.dev) console.time(vars.value)
    
    if (vars.app_data instanceof Array) {
      vars.data.total = d3.sum(vars.app_data,function(d){
        return d.value || d[vars.value]
      })
    }
    else if (vars.type == "rings") {
      if (vars.app_data[vars.highlight])
        vars.data.total = vars.app_data[vars.highlight][vars.value]
      else {
        vars.data.total = null
      }
    }
    else {
      vars.data.total = d3.sum(d3.values(vars.app_data),function(d){
        return d[vars.value]
      })
    }
    
    if (vars.dev) console.timeEnd(vars.value)
    if (vars.dev) console.groupEnd()
    
  }
  
  vars.margin.top = 0
  var title_offset = 0
  if (vars.svg_width <= 400 || vars.svg_height <= 300) {
    vars.small = true;
    vars.graph.margin = {"top": 0, "right": 0, "bottom": 0, "left": 0}
    vars.graph.width = vars.width
    make_title(null,"title");
    make_title(null,"sub_title");
    make_title(null,"total_bar");
    update_footer(null)
  }
  else {
    if (vars.dev) console.log("%c[d3plus]%c Creating/Updating Titles","font-weight:bold","font-weight: normal")
    vars.small = false;
    vars.graph.margin = {"top": 5, "right": 10, "bottom": 40, "left": 40}
    vars.graph.width = vars.width-vars.graph.margin.left-vars.graph.margin.right
    make_title(vars.title,"title");
    make_title(vars.sub_title,"sub_title");
    if (vars.app_data && !vars.error && (vars.type != "rings" || (vars.type == "rings" && vars.connections[vars.highlight]))) {
      make_title(vars.data.total,"total_bar");
    }
    else {
      make_title(null,"total_bar");
    }
    if (vars.margin.top > 0) {
      vars.margin.top += 3
      if (vars.margin.top < vars.title_height) {
        title_offset = (vars.title_height-vars.margin.top)/2
        vars.margin.top = vars.title_height
      }
    }
    update_footer(vars.footer)
  }
  
  d3.select("g.titles").transition().duration(d3plus.timing)
    .attr("transform","translate(0,"+title_offset+")")
    
  function make_title(t,type){

    // Set the total value as data for element.
    var font_size = type == "title" ? 18 : 13,
        title_position = {
          "x": vars.svg_width/2,
          "y": vars.margin.top
        }
  
    if (type == "total_bar" && t) {
      title = vars.format(t,vars.value)
      vars.total_bar.prefix ? title = vars.total_bar.prefix + title : null;
      vars.total_bar.suffix ? title = title + vars.total_bar.suffix : null;
    
      if (vars.filter.length || vars.solo.length && vars.type != "rings") {
        var overall_total = d3.sum(vars.data.raw, function(d){ 
          if (vars.type == "stacked") return d[vars.value]
          else if (vars.year == d[vars.year_var]) return d[vars.value]
        })
        var pct = (t/overall_total)*100
        ot = vars.format(overall_total,vars.value)
        title += " ("+vars.format(pct,"share")+"% of "+ot+")"
      }
    
    }
    else {
      title = t
    }
  
    if (title) {
      var title_data = title_position
      title_data.title = title
      title_data = [title_data]
    }
    else {
      var title_data = []
    }
  
    var total = d3.select("g.titles").selectAll("g."+type).data(title_data)
  
    var offset = 0
    if (["pie_scatter","stacked"].indexOf(vars.type) >= 0 && !vars.title_center) {
      offset = vars.graph.margin.left
    }
  
    // Enter
    total.enter().append("g")
      .attr("class",type)
      .style("opacity",0)
      .append("text")
        .attr("x",function(d) { return d.x; })
        .attr("y",function(d) { return d.y+offset; })
        .attr("font-size",font_size)
        .attr("fill","#333")
        .attr("text-anchor", "middle")
        .attr("font-family", vars.font)
        .style("font-weight", vars.font_weight)
        .each(function(d){
          var width = vars.title_width ? vars.title_width : vars.svg_width
          width -= offset*2
          d3plus.utils.wordwrap({
            "text": d.title,
            "parent": this,
            "width": width,
            "height": vars.svg_height/8,
            "resize": false
          })
        })
  
    // Update
    total.transition().duration(d3plus.timing)
      .style("opacity",1)
    
    d3plus.utils.title_update(vars)
  
    // Exit
    total.exit().transition().duration(d3plus.timing)
      .style("opacity",0)
      .remove();

    if (total.node()) vars.margin.top += total.select("text").node().getBBox().height

  }

  function update_footer(footer_text) {
  
    if (footer_text) {
      if (footer_text.indexOf("<a href=") == 0) {
        var div = document.createElement("div")
        div.innerHTML = footer_text
        var t = footer_text.split("href=")[1]
        var link = t.split(t.charAt(0))[1]
        if (link.charAt(0) != "h" && link.charAt(0) != "/") {
          link = "http://"+link
        }
        var d = [div.getElementsByTagName("a")[0].innerHTML]
      }
      else {
        var d = [footer_text]
      }
    }
    else var d = []
  
    var source = d3.select("g.footer").selectAll("text.source").data(d)
    var padding = 3
  
    source.enter().append("text")
      .attr("class","source")
      .attr("opacity",0)
      .attr("x",vars.svg_width/2+"px")
      .attr("y",padding-1+"px")
      .attr("font-size","10px")
      .attr("fill","#333")
      .attr("text-anchor", "middle")
      .attr("font-family", vars.font)
      .style("font-weight", vars.font_weight)
      .each(function(d){
        d3plus.utils.wordwrap({
          "text": d,
          "parent": this,
          "width": vars.svg_width-20,
          "height": vars.svg_height/8,
          "resize": false
        })
      })
      .on(d3plus.evt.over,function(){
        if (link) {
          d3.select(this)
            .style("text-decoration","underline")
            .style("cursor","pointer")
            .style("fill","#000")
        }
      })
      .on(d3plus.evt.out,function(){
        if (link) {
          d3.select(this)
            .style("text-decoration","none")
            .style("cursor","auto")
            .style("fill","#333")
        }
      })
      .on(d3plus.evt.click,function(){
        if (link) {
          if (link.charAt(0) != "/") var target = "_blank"
          else var target = "_self"
          window.open(link,target)
        }
      })
    
    source
      .attr("opacity",1)
      .attr("x",(vars.svg_width/2)+"px")
      .attr("font-family", vars.font)
      .style("font-weight", vars.font_weight)
      .each(function(d){
        d3plus.utils.wordwrap({
          "text": d,
          "parent": this,
          "width": vars.svg_width-20,
          "height": vars.svg_height/8,
          "resize": false
        })
      })
    
    source.exit().transition().duration(d3plus.timing)
      .attr("opacity",0)
      .remove()
    
    if (d.length) {
      var height = source.node().getBBox().height
      vars.margin.bottom = height+padding*2
    }
    else {
      vars.margin.bottom = 0
    }
  
    d3.select("g.footer").transition().duration(d3plus.timing)
      .attr("transform","translate(0,"+(vars.svg_height-vars.margin.bottom)+")")
  
  }
}

d3plus.utils.title_update = function(vars) {
  
  var offset = 0
  if (["pie_scatter","stacked"].indexOf(vars.type) >= 0 && !vars.title_center) {
    offset = vars.graph.margin.left
  }

  d3.select("g.titles").selectAll("g").select("text")
    .transition().duration(d3plus.timing)
      .attr("x",function(d) { return d.x+offset; })
      .attr("y",function(d) { return d.y; })
      .each(function(d){
        var width = vars.title_width ? vars.title_width : vars.svg_width
        width -= offset*2
        d3plus.utils.wordwrap({
          "text": d.title,
          "parent": this,
          "width": width,
          "height": vars.svg_height/8,
          "resize": false
        })
      })
      .selectAll("tspan")
        .attr("x",function(d) { return d.x+offset; })
    
}
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates a data object for the UI tooltip
//-------------------------------------------------------------------

d3plus.utils.tooltip = function(vars,id,length,extras) {

  if (!length) var length = "long"
  
  var extra_data = {}
  if (extras && typeof extras == "string") extras = [extras]
  else if (extras && typeof extras == "object") {
    extra_data = d3plus.utils.merge(extra_data,extras)
    var extras = []
    for (k in extra_data) {
      extras.push(k)
    }
  }
  else if (!extras) var extras = []
  
  var tooltip_highlights = []
  extras.push(vars.value)
  if (["bubbles"].indexOf(vars.type) >= 0) {
    tooltip_highlights.push(vars.active)
    extras.push(vars.active)
    tooltip_highlights.push(vars.else_var)
    extras.push(vars.else_var)
    tooltip_highlights.push(vars.total)
    extras.push(vars.total)
  }
  else if (["stacked","pie_scatter"].indexOf(vars.type) >= 0) {
    tooltip_highlights.push(vars.xaxis)
    tooltip_highlights.push(vars.yaxis)
    extras.push(vars.xaxis)
    extras.push(vars.yaxis)
  }
  
  if (["stacked","pie_scatter","bubbles"].indexOf(vars.type) < 0) {
    tooltip_highlights.push(vars.value)
  }
  
  if (vars.tooltip instanceof Array) var a = vars.tooltip
  else if (vars.tooltip[length] && vars.tooltip[length] instanceof Array) var a = vars.tooltip[length]
  else if (vars.tooltip[length]) var a = d3plus.utils.merge({"":[]},vars.tooltip[length])
  else var a = vars.tooltip
  
  function format_key(key,group) {
    if (vars.attrs[group]) var id_var = group
    else var id_var = null
    
    if (group) group = vars.format(group)
    
    var value = extra_data[key] || d3plus.utils.variable(vars,id,key,id_var)
    
    if (value !== false) {
      var name = vars.format(key),
          h = tooltip_highlights.indexOf(key) >= 0
          
      var val = vars.format(value,key)
      
      var obj = {"name": name, "value": val, "highlight": h, "group": group}
      
      if (vars.descs[key]) obj.desc = vars.descs[key]
    
      if (val) tooltip_data.push(obj)
    }
    
  }
     
  var tooltip_data = []
  if (a instanceof Array) {
    
    extras.forEach(function(e){
      if (a.indexOf(e) < 0) a.push(e)
    })
       
    a.forEach(function(t){
      format_key(t)
    })
  
  }
  else {
    if (vars.nesting.length && vars.depth < vars.nesting.length-1) {
      var a = d3plus.utils.merge({},a)
      vars.nesting.forEach(function(n,i){
        if (i > vars.depth && a[n]) delete a[n]
      })
    }
    if (vars.tooltip.long && typeof vars.tooltip.long == "object") {
      var placed = []
      for (group in vars.tooltip.long) {
        extras.forEach(function(e){
          if (vars.tooltip.long[group].indexOf(e) >= 0 && ((a[group] && a[group].indexOf(e) < 0) || !a[group])) {
            if (!a[group]) a[group] = []
            a[group].push(e)
            placed.push(e)
          }
          else if (a[group] && a[group].indexOf(e) >= 0) {
            placed.push(e)
          }
        })
      }
      extras.forEach(function(e){
        if (placed.indexOf(e) < 0) {
          if (!a[""]) a[""] = []
          a[""].push(e)
        }
      })
    }
    else {
      var present = []
      for (group in a) {
        extras.forEach(function(e){
          if (a[group].indexOf(e) >= 0) {
            present.push(e)
          }
        })
      }
      if (present.length != extras.length) {
        if (!a[""]) a[""] = []
        extras.forEach(function(e){
          if (present.indexOf(e) < 0) {
            a[""].push(e)
          }
        })
      }
    }
    
    if (a[""]) {
      a[""].forEach(function(t){
        format_key(t,"")
      })
      delete a[""]
    }
    
    for (group in a) {
      if (a[group] instanceof Array) {
        a[group].forEach(function(t){
          format_key(t,group)
        })
      }
      else if (typeof a[group] == "string") {
        format_key(a[group],group)
      }
    }
    
  }
  
  return tooltip_data
  
}
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Random color generator (if no color is given)
//-------------------------------------------------------------------

d3plus.utils.color_scale = d3.scale.category20b()
d3plus.utils.rand_color = function(x) {
  var rand_int = x || Math.floor(Math.random()*20)
  return d3plus.utils.color_scale(rand_int);
}

//===================================================================

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Returns appropriate text color based off of a given color
//-------------------------------------------------------------------

d3plus.utils.text_color = function(color) {
  var hsl = d3.hsl(color),
      light = "#ffffff", 
      dark = "#333333";
  if (hsl.l > 0.65) return dark;
  else if (hsl.l < 0.48) return light;
  return hsl.h > 35 && hsl.s >= 0.3 && hsl.l >= 0.41 ? dark : light;
}

//===================================================================

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Darkens a color if it's too light to appear on white
//-------------------------------------------------------------------

d3plus.utils.darker_color = function(color) {
  var hsl = d3.hsl(color)
  if (hsl.s > .9) hsl.s = .9
  if (hsl.l > .4) hsl.l = .4
  return hsl.toString();
}

//===================================================================

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Returns list of unique values
//-------------------------------------------------------------------
        
d3plus.utils.uniques = function(data,value) {
  return d3.nest().key(function(d) { 
    return d[value]
  }).entries(data).reduce(function(a,b,i,arr){ 
    return a.concat(parseInt(b['key']))
  },[])
}

//===================================================================

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Merge two objects to create a new one with the properties of both
//-------------------------------------------------------------------

d3plus.utils.merge = function(obj1, obj2) {
  var obj3 = {};
  for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
  for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
  return obj3;
}

//===================================================================

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Expands a min/max into a certain number of buckets
//-------------------------------------------------------------------

d3plus.utils.buckets = function(arr, buckets) {
  var i = 0.0, return_arr = [], step = 1/(buckets-1)
  while(i <= 1) {
    return_arr.push((arr[0]*Math.pow((arr[1]/arr[0]),i)))
    i += step
  }
  if (return_arr[0] > arr[0]) return_arr[0] = arr[0]
  if (return_arr[1] < arr[1]) return_arr[1] = arr[1]
  return return_arr
}

//===================================================================

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Get connection dictionary for specified links
//-------------------------------------------------------------------

d3plus.utils.connections = function(vars,links) {
  var connections = {};
  links.forEach(function(d) {
    
    if (typeof d.source != "object") {
      d.source = vars.nodes.filter(function(n){return n[vars.id] == d.source})[0]
    }

    if (typeof d.target != "object") {
      d.target = vars.nodes.filter(function(n){return n[vars.id] == d.target})[0]
    }
    
    if (!connections[d.source[vars.id]]) {
      connections[d.source[vars.id]] = []
    }
    connections[d.source[vars.id]].push(d.target)
    if (!connections[d.target[vars.id]]) {
      connections[d.target[vars.id]] = []
    }
    connections[d.target[vars.id]].push(d.source)
  })
  return connections;
}

//===================================================================
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Finds a given variable by searching through the data and attrs
//-------------------------------------------------------------------

d3plus.utils.variable = function(vars,id,variable,id_var) {
  
  if (!id_var) var id_var = vars.id
  
  function filter_array(arr) {
    return arr.filter(function(d){
      return d[id_var] == id
    })[0]
  }
  
  if (typeof id == "object") {
    if (typeof id[variable] != "undefined") return id[variable]
    else if (id.values) {
      id.values.forEach(function(d){
        if (typeof d[variable] != "undefined") return d[variable]
      })
    }
    var dat = id
    id = dat[id_var]
  }
  else {
    if (vars.app_data instanceof Array) {
      var dat = filter_array(vars.app_data)
      if (dat && typeof dat[variable] != "undefined") return dat[variable]
    }
    else if (vars.app_data) {
      var dat = vars.app_data[id]
      if (dat && typeof dat[variable] != "undefined") return dat[variable]
    }
  }
  
  if (vars.attrs instanceof Array) {
    var attr = filter_array(vars.attrs)
  }
  else if (vars.attrs[id_var]) {
    if (vars.attrs[id_var] instanceof Array) {
      var attr = filter_array(vars.attrs[id_var])
    }
    else {
      var attr = vars.attrs[id_var][id]
    }
  }
  else {
    var attr = vars.attrs[id]
  }
  
  if (attr && typeof attr[variable] != "undefined") return attr[variable]

  return null
  
}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Finds an object's color and returns random if it cannot be found
//-------------------------------------------------------------------

d3plus.utils.color = function(vars,id) {
  
  function get_random(c) {
    if (typeof c == "object") {
      c = vars.color ? d3plus.utils.variable(vars,c,vars.color) : c[vars.id]
    }
    return d3plus.utils.rand_color(c)
  }
  
  function validate_color(c) {
    if (c.indexOf("#") == 0 && [4,7].indexOf(c.length) >= 0) return true
    else return false
  }
  
  if (!id) {
    
    if (vars.app_data && vars.color) {

      if (vars.dev) console.group("%c[d3plus]%c Calculating Color Range","font-weight:bold","font-weight: normal")
      
      var data_range = []
      vars.color_domain = null
      
      if (vars.dev) console.time("get data range")
      
      if (vars.app_data instanceof Array) {
        vars.app_data.forEach(function(d){
          data_range.push(d3plus.utils.variable(vars,d,vars.color))
        })
      }
      else {
        d3.values(vars.app_data).forEach(function(d){
          data_range.push(d3plus.utils.variable(vars,d,vars.color))
        })
      }
      
      data_range = data_range.filter(function(d){
        return d;
      })
      
      if (vars.dev) console.timeEnd("get data range")
      
      if (vars.dev) console.time("create color scale")
      
      if (typeof data_range[0] == "number") {
        data_range.sort(function(a,b) {return a-b})
        vars.color_domain = [d3.quantile(data_range,0.1),d3.quantile(data_range,0.9)]
        var new_range = vars.color_range.slice(0)
        if (vars.color_domain[0] < 0 && vars.color_domain[1] > 0) {
          vars.color_domain.push(vars.color_domain[1])
          vars.color_domain[1] = 0
        }
        else if (vars.color_domain[1] > 0 || vars.color_domain[0] < 0) {
          new_range = vars.heat_map
          vars.color_domain = d3plus.utils.buckets(d3.extent(data_range),new_range.length)
        }
        
        vars.color_scale
          .domain(vars.color_domain)
          .range(new_range)
      
        if (vars.dev) console.timeEnd("create color scale")
        
      }
      
      if (vars.dev) console.groupEnd();
      
    }
  }
  else if (!vars.color) return get_random(id)
  else {
    var color = d3plus.utils.variable(vars,id,vars.color)
    
    if (!color && vars.color_domain instanceof Array) color = 0
    else if (!color) return get_random(id)
    
    if (typeof color == "string") {
      var true_color = validate_color(color)
      return true_color ? color : get_random(color)
    }
    else return vars.color_scale(color)
  }
}//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// function that will wrap and resize SVG text
//-------------------------------------------------------------------

d3plus.utils.wordwrap = function(params) {
  
  var parent = params.parent,
      padding = params.padding ? params.padding : 10,
      width = params.width ? params.width-(padding*2) : 20000,
      height = params.height ? params.height : 20000,
      resize = params.resize,
      font_max = params.font_max ? params.font_max : 40,
      font_min = params.font_min ? params.font_min : 10;
      
  if (params.text instanceof Array) wrap(String(params.text.shift()).split(" "))
  else wrap(String(params.text).split(" "))
  
  function wrap(words) {
    
    if (resize) {
    
      // Start by trying the largest font size
      var size = font_max
      size = Math.floor(size)
      d3.select(parent).attr('font-size',size)
    
      // Add each word to it's own line (to test for longest word)
      d3.select(parent).selectAll('tspan').remove()
      for(var i=0; i<words.length; i++) {
        if (words.length == 1) var t = words[i]
        else var t = words[i]+"..."
        d3.select(parent).append('tspan').attr('x',0).text(t)
      }
    
      // If the longest word is too wide, make the text proportionately smaller
      if (parent.getBBox().width > width) size = size*(width/parent.getBBox().width)
  
      // If the new size is too small, return NOTHING
      if (size < font_min) {
        d3.select(parent).selectAll('tspan').remove();
        if (typeof params.text == "string" || params.text.length == 0) return;
        else wrap(String(params.text.shift()).split(/[\s-]/))
        return;
      }

      // Use new text size
      size = Math.floor(size)
      d3.select(parent).attr("font-size",size);
    
      // Flow text into box
      flow();
    
      // If text doesn't fit height-wise, shrink it!
      if (parent.childNodes.length*parent.getBBox().height > height) {
        var temp_size = size*(height/(parent.childNodes.length*parent.getBBox().height))
        if (temp_size < font_min) size = font_min
        else size = temp_size
        size = Math.floor(size)
        d3.select(parent).attr('font-size',size)
      } else finish();
    
    }
  
    flow();
    truncate();
    finish();
  
    function flow() {
    
      d3.select(parent).selectAll('tspan').remove()
      
      var x_pos = parent.getAttribute('x')
      
      var tspan = d3.select(parent).append('tspan')
        .attr('x',x_pos)
        .text(words[0])

      for (var i=1; i < words.length; i++) {
        
        tspan.text(tspan.text()+" "+words[i])
      
        if (tspan.node().getComputedTextLength() > width) {
            
          tspan.text(tspan.text().substr(0,tspan.text().lastIndexOf(" ")))
    
          tspan = d3.select(parent).append('tspan')
            .attr('x',x_pos)
            .text(words[i])
            
        }
      }
  
    }
  
    function truncate() {
      var cut = false
      while (parent.childNodes.length*parent.getBBox().height > height && parent.lastChild && !cut) {
        parent.removeChild(parent.lastChild)
        if (parent.childNodes.length*parent.getBBox().height < height && parent.lastChild) cut = true
      }
      if (cut) {
        tspan = parent.lastChild
        words = d3.select(tspan).text().split(/[\s-]/)
      
        var last_char = words[words.length-1].charAt(words[words.length-1].length-1)
        if (last_char == ',' || last_char == ';' || last_char == ':') words[words.length-1] = words[words.length-1].substr(0,words[words.length-1].length-1)
      
        d3.select(tspan).text(words.join(' ')+'...')
      
        if (tspan.getComputedTextLength() > width) {
          if (words.length > 1) words.pop(words.length-1)
          last_char = words[words.length-1].charAt(words[words.length-1].length-1)
          if (last_char == ',' || last_char == ';' || last_char == ':') words[words.length-1].substr(0,words[words.length-1].length-2)
          d3.select(tspan).text(words.join(' ')+'...')
        }
      }
    }
  }
  
  function finish() {
    d3.select(parent).selectAll('tspan').attr("dy", d3.select(parent).style('font-size'));
    return;
  }
  
}
})();
