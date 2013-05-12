vizwhiz.viz = function() {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Public Variables with Default Settings
  //-------------------------------------------------------------------
  
  var vars = {
    "active_var": "active",
    "arc_angles": {},
    "arc_inners": {},
    "arc_sizes": {},
    "boundries": null,
    "center": null,
    "clicked": false,
    "connections": null,
    "coords": null,
    "csv_columns": null,
    "csv_data": [],
    "donut": true,
    "filter": [],
    "group_bgs": true,
    "grouping": "name",
    "highlight": null,
    "id_var": "id",
    "init": true,
    "labels": true,
    "layout": "value",
    "links": null,
    "map": {"coords": null, 
            "style": {"land": {"fill": "#f9f4e8"}, 
                      "water": {"fill": "#bfd1df"}
                     }
           },
    "margin": {"top": 0, "right": 0, "bottom": 0, "left": 0},
    "name_array": null,
    "nodes": null,
    "order": "asc",
    "projection": d3.geo.mercator(),
    "solo": [],
    "sort": "total",
    "spotlight": true,
    "svg_height": window.innerHeight,
    "svg_width": window.innerWidth,
    "text_var": "name",
    "tiles": true,
    "tooltip_info": [],
    "total_bar": false,
    "type": "tree_map",
    "value_var": "value",
    "xaxis_domain": null,
    "xaxis_var": null,
    "yaxis_domain": null,
    "yaxis_var": null,
    "zoom_behavior": d3.behavior.zoom()
  }
  
  //===================================================================

  chart = function(selection) {
    selection.each(function(data) {
      
      vars.parent = d3.select(this)
      
      vars.svg = vars.parent.selectAll("svg").data([data]);
      
      vars.svg_enter = vars.svg.enter().append("svg")
        .attr('width',vars.svg_width)
        .attr('height',vars.svg_height)
        .style("z-index", 10)
        .style("position","absolute");
    
      vars.svg.transition().duration(vizwhiz.timing)
        .attr('width',vars.svg_width)
        .attr('height',vars.svg_height)
        
      if (data.children) {

        var filtered_data = {"name": "root", "children": []};

        filtered_data.children = data.children.filter(function(d){
          if (vars.filter.indexOf(d[vars.text_var]) >= 0) return false;
          if (!vars.solo.length) return true;
          if (vars.solo.indexOf(d[vars.text_var]) >= 0) return true;
          return false;
        })
        
        // create CSV data
        var val = vars.value_var
        var csv_d = []
        find_deepest(filtered_data)
        vars.csv_data = csv_d;
        
        function find_deepest(d) {
          if (d[val]) {
            csv_d.push(d)
          }
          else if (d.children) {
            d.children.forEach(function(dd){
              find_deepest(dd);
            })
          }
        }

        var total_val = d3.sum(filtered_data.children,function(d) {
          return check_for_value(d);
        })
        
        function check_for_value(d) {
          if (d[val]) return d[val]
          else if (d.children) {
            return d3.sum(d.children,function(dd) {
              return check_for_value(dd);
            })
          }
        }
        
      }
      else if (data instanceof Array) {
        
        var filtered_data = data.filter(function(d){
          if (vars.filter.indexOf(d[vars.text_var]) >= 0) return false;
          if (!vars.solo.length) return true;
          if (vars.solo.indexOf(d[vars.text_var]) >= 0) return true;
          return false;
        })
        
        // create CSV data
        vars.csv_data = filtered_data;
        
        var total_val = d3.sum(data, function(d){ 
          return d[vars.value_var] 
        })
        
      }
      else {
        
        var filtered_data = {}
        for (d in data) {
          if (vars.filter.indexOf(d[vars.text_var]) < 0) filtered_data[d] = data[d];
          if (!vars.solo.length) filtered_data[d] = data[d];
          if (vars.solo.indexOf(d[vars.text_var]) >= 0) filtered_data[d] = data[d];
        }
        
        // create CSV data
        vars.csv_data = d3.values(filtered_data);
        
        var total_val = d3.sum(d3.values(data), function(d){ 
          return d[vars.value_var] 
        })
        
      }
      
      if (vars.svg_width < 400 || vars.svg_height < 400) {
        vars.small = true;
      }
      else {
        vars.small = false;
      }
      
      vars.width = vars.svg_width;
      
      if (vars.total_bar && !vars.small) {
        vars.margin.top = 20;
        vars.height = vars.svg_height - vars.margin.top;
        make_total(total_val);
      }
      else {
        vars.margin.top = 0;
        vars.height = vars.svg_height;
        vars.svg.selectAll("g.title")
          .transition().duration(vizwhiz.timing)
          .style("opacity",0)
          .remove();
      }
      
      vars.svg_enter.append("clipPath")
        .attr("id","clipping")
        .append("rect")
          .attr("width",vars.width)
          .attr("height",vars.height)
      
      vars.svg.select("#clipping rect").transition().duration(vizwhiz.timing)
        .attr("width",vars.width)
        .attr("height",vars.height)
    
      vars.parent_enter = vars.svg_enter.append("g")
        .attr("class","parent")
        .attr("width",vars.width)
        .attr("height",vars.height)
        .attr("clip-path","url(#clipping)")
        .attr("transform","translate("+vars.margin.left+","+vars.margin.top+")")
    
      vars.svg.select("g.parent").transition().duration(vizwhiz.timing)
        .attr("width",vars.width)
        .attr("height",vars.height)
        .attr("transform","translate("+vars.margin.left+","+vars.margin.top+")")
      
      vizwhiz[vars.type](filtered_data,vars);
      
    });
    
    return chart;
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Helper Functions
  //-------------------------------------------------------------------
  
  mouseover = function(d){
    
    var svg = d3.select("svg");
    var tooltip_data = {}
    vars.tooltip_info.forEach(function(t){
      if (d[t]) tooltip_data[t] = d[t]
    })
    tooltip_data["Share"] = d.share;
    vizwhiz.tooltip.create({
      "parent": svg,
      "id": d[vars.id_var],
      "data": tooltip_data,
      "title": d[vars.text_var],
      "x": d3.mouse(svg.node())[0],
      "y": d3.mouse(svg.node())[1],
      "offset": 10,
      "arrow": true
    })
  }

  make_total = function(total_val){
    
    // Set the total value as data for element.
    var total = vars.svg.selectAll("g.title").data([total_val]),
        total_position = {"x": function(d){ return vars.width/2 }, "y": 15}
    
    // Enter
    total.enter().append("g")
      .attr("class", "title")
      .style("opacity",0)
      .append("text")
        .attr(total_position)
        .attr("fill", "#333333")
        .attr("text-anchor", "middle")
        .attr("font-family", "'Helvetica Neue', Helvetica, Arial, sans-serif")
        .style("font-weight", "bold")
    
    // Update
    total.transition().duration(vizwhiz.timing)
      .style("opacity",1)
    total.select("text").transition().duration(vizwhiz.timing)
      .attr(total_position)
      .text(function(d){
        var text = d, format = ",f";
        if (vars.total_bar.format) {
          text = d3.format(vars.total_bar.format)(text);
        }
        else {
          text = d3.format(format)(text);
        }
        vars.total_bar.prefix ? text = vars.total_bar.prefix + text : null;
        vars.total_bar.suffix ? text = text + vars.total_bar.suffix : null;
        return text;
      })
    
    // Exit
    total.exit().transition().duration(vizwhiz.timing)
      .style("opacity",0)
      .remove();

  }
  
  get_connections = function(links) {
    var connections = {};
    if (vars.type == "network") {
      links.forEach(function(d) {
        if (!connections[d.source[vars.id_var]]) {
          connections[d.source[vars.id_var]] = {}
          connections[d.source[vars.id_var]].center = d.source
          connections[d.source[vars.id_var]].primary = {"nodes": [], "links": []}
        }
        connections[d.source[vars.id_var]].primary.nodes.push(d.target)
        connections[d.source[vars.id_var]].primary.links.push({"source": d.source, "target": d.target})
        if (!connections[d.target[vars.id_var]]) {
          connections[d.target[vars.id_var]] = {}
          connections[d.target[vars.id_var]].center = d.target
          connections[d.target[vars.id_var]].primary = {"nodes": [], "links": []}
        }
        connections[d.target[vars.id_var]].primary.nodes.push(d.source)
        connections[d.target[vars.id_var]].primary.links.push({"source": d.target, "target": d.source})
      })
      for (var c in connections) {
        connections[c].secondary = {"nodes": [], "links": []}
        connections[c].primary.nodes.forEach(function(p){
          connections[p[vars.id_var]].primary.nodes.forEach(function(s){
            if (s[vars.id_var] != c) {
              if (connections[c].primary.nodes.indexOf(s) < 0 && connections[c].secondary.nodes.indexOf(s) < 0) {
                connections[c].secondary.nodes.push(s)
              }
              var dupe = false
              connections[c].secondary.links.forEach(function(l){
                if (l.source == s && l.target == p) dupe = true
              })
              if (!dupe) {
                connections[c].secondary.links.push({"source": p, "target": s})
              }
            }
          })
        })
        var node_check = connections[c].primary.nodes.concat([connections[c].center])
        connections[c].extent = {}
        connections[c].extent.x = d3.extent(d3.values(node_check),function(v){return v.x;}),
        connections[c].extent.y = d3.extent(d3.values(node_check),function(v){return v.y;})
      }
    }
    else {
      links.forEach(function(d) {
        if (!connections[d.source[vars.id_var]]) {
          connections[d.source[vars.id_var]] = []
        }
        connections[d.source[vars.id_var]].push(d.target)
        if (!connections[d.target[vars.id_var]]) {
          connections[d.target[vars.id_var]] = []
        }
        connections[d.target[vars.id_var]].push(d.source)
      })
    }
    return connections;
  }
  
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Expose Public Variables
  //-------------------------------------------------------------------
  
  chart.active_var = function(x) {
    if (!arguments.length) return vars.active_var;
    vars.active_var = x;
    return chart;
  };
  
  chart.center = function(x) {
    if (!arguments.length) return vars.center;
    vars.center = x;
    return chart;
  };
  
  chart.csv_data = function(x) {
    if (!arguments.length) {
      var csv_to_return = []
      
      // filter out the columns (if specified)
      if(vars.csv_columns){
        vars.csv_data.map(function(d){
          d3.keys(d).forEach(function(d_key){
            if(vars.csv_columns.indexOf(d_key) < 0){
              delete d[d_key]
            }
          })
        })
      }
      
      csv_to_return.push(d3.keys(vars.csv_data[0]));
      vars.csv_data.forEach(function(d){
        csv_to_return.push(d3.values(d))
      })
      return csv_to_return;
    }
    return chart;
  };
  
  chart.csv_columns = function(x) {
    if (!arguments.length) return vars.csv_columns;
    vars.csv_columns = x;
    return chart;
  };
  
  chart.coords = function(x) {
    if (!arguments.length) return vars.coords;
    vars.coords = topojson.object(x, x.objects[Object.keys(x.objects)[0]]).geometries;
    vars.boundries = {"coordinates": [[]], "type": "Polygon"}
    vars.coords.forEach(function(v,i){
      v.coordinates.forEach(function(c){
        c.forEach(function(a){
          if (a.length == 2) vars.boundries.coordinates[0].push(a)
          else {
            a.forEach(function(aa){
              vars.boundries.coordinates[0].push(aa)
            })
          }
        })
      })
    })
    return chart;
  };

  chart.donut = function(x) {
    if (!arguments.length) return vars.donut;
    if (typeof x == "boolean")  vars.donut = x;
    else if (x === "false") vars.donut = false;
    else vars.donut = true;
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
    return chart;
  };

  chart.group_bgs = function(x) {
    if (!arguments.length) return vars.group_bgs;
    if (typeof x == "boolean")  vars.group_bgs = x;
    else if (x === "false") vars.group_bgs = false;
    else vars.group_bgs = true;
    return chart;
  };

  chart.grouping = function(x) {
    if (!arguments.length) return vars.grouping;
    vars.grouping = x;
    return chart;
  };

  chart.height = function(x) {
    if (!arguments.length) return vars.svg_height;
    vars.svg_height = x;
    return chart;
  };
  
  chart.highlight = function(value) {
    if (!arguments.length) return vars.highlight;
    vars.highlight = value;
    if (vars.highlight) vars.clicked = true;
    else vars.clicked = false;
    return chart;
  };
  
  chart.id_var = function(x) {
    if (!arguments.length) return vars.id_var;
    vars.id_var = x;
    return chart;
  };

  chart.labels = function(x) {
    if (!arguments.length) return vars.labels;
    vars.labels = x;
    return chart;
  };
  
  chart.layout = function(x) {
    if (!arguments.length) return vars.layout;
    vars.layout = x;
    return chart;
  };
  
  chart.links = function(x) {
    if (!arguments.length) return vars.links;
    vars.links = x;
    vars.connections = get_connections(x);
    return chart;
  };
  
  chart.map = function(x,style) {
    if (!arguments.length) return vars.map;
    vars.map.coords = x;
    if (style) {
      vars.map.style.land = style.land ? style.land : map.style.land;
      vars.map.style.water = style.water ? style.water : map.style.water;
    }
    return chart;
  };
  
  chart.name_array = function(x) {
    if (!arguments.length) return vars.name_array;
    vars.name_array = x;
    return chart;
  };
  
  chart.nodes = function(x) {
    if (!arguments.length) return vars.nodes;
    vars.nodes = x;
    return chart;
  };
  
  chart.order = function(x) {
    if (!arguments.length) return vars.order;
    vars.order = x;
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
      // if element is in the filter array remove it and add to this one
      else if(vars.filter.indexOf(x) > -1){
        vars.filter.splice(vars.filter.indexOf(x), 1)
        vars.solo.push(x)
      }
      // element not in current filter so add it
      else {
        vars.solo.push(x)
      }
    }
    return chart;
  };
  
  chart.sort = function(x) {
    if (!arguments.length) return vars.sort;
    vars.sort = x;
    return chart;
  };

  chart.spotlight = function(x) {
    if (!arguments.length) return vars.spotlight;
    if (typeof x == "boolean")  vars.spotlight = x;
    else if (x === "false") vars.spotlight = false;
    else vars.spotlight = true;
    return chart;
  };
  
  chart.text_var = function(x) {
    if (!arguments.length) return vars.text_var;
    vars.text_var = x;
    return chart;
  };
  
  chart.tiles = function(x) {
    if (!arguments.length) return vars.tiles;
    if (typeof x == "boolean")  vars.tiles = x;
    else if (x === "false") vars.tiles = false;
    else vars.tiles = true;
    return chart;
  };
  
  chart.tooltip_info = function(x) {
    if (!arguments.length) return vars.tooltip_info;
    vars.tooltip_info = x;
    return chart;
  };
  
  chart.total_bar = function(x) {
    if (!arguments.length) return vars.total_bar;
    vars.total_bar = x;
    return chart;
  };
  
  chart.type = function(x) {
    if (!arguments.length) return vars.type;
    vars.type = x;
    return chart;
  };
  
  chart.value_var = function(x) {
    if (!arguments.length) return vars.value_var;
    vars.value_var = x;
    return chart;
  };

  chart.width = function(x) {
    if (!arguments.length) return vars.svg_width;
    vars.svg_width = x;
    return chart;
  };
  
  chart.xaxis_domain = function(x) {
    if (!arguments.length) return vars.xaxis_domain;
    vars.xaxis_domain = x;
    return chart;
  };
  
  chart.xaxis_var = function(x) {
    if (!arguments.length) return vars.xaxis_var;
    vars.xaxis_var = x;
    return chart;
  };
  
  chart.yaxis_domain = function(x) {
    if (!arguments.length) return vars.yaxis_domain;
    vars.yaxis_domain = x;
    return chart;
  };
  
  chart.yaxis_var = function(x) {
    if (!arguments.length) return vars.yaxis_var;
    vars.yaxis_var = x;
    return chart;
  };

  //===================================================================

  return chart;
};
