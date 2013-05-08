vizwhiz.viz = function() {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Public Variables with Default Settings
  //-------------------------------------------------------------------
  
  var public_variables = {
    "active_var": "active",
    "arc_angles": {},
    "arc_inners": {},
    "arc_sizes": {},
    "boundries": null,
    "center": null,
    "clicked": false,
    "connections": null,
    "coords": null,
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
    "yaxis_var": null
  }
  
  //===================================================================

  chart = function(selection) {
    selection.each(function(data) {
      
      public_variables.parent = d3.select(this)
      
      public_variables.svg = public_variables.parent.selectAll("svg").data([data]);
      
      public_variables.svg_enter = public_variables.svg.enter().append("svg")
        .attr('width',public_variables.svg_width)
        .attr('height',public_variables.svg_height)
    
      public_variables.svg.transition().duration(vizwhiz.timing)
        .attr('width',public_variables.svg_width)
        .attr('height',public_variables.svg_height)
        
      if (data.children) {

        var filtered_data = {"name": "root", "children": []};

        filtered_data.children = data.children.filter(function(d){
          if (public_variables.filter.indexOf(d[public_variables.text_var]) >= 0) return false;
          if (!public_variables.solo.length) return true;
          if (public_variables.solo.indexOf(d[public_variables.text_var]) >= 0) return true;
          return false;
        })

        var total_val = d3.sum(filtered_data.children, function(d){ 
          return d[public_variables.value_var] 
        })
        
      }
      else if (data instanceof Array) {
        
        var filtered_data = data.filter(function(d){
          if (public_variables.filter.indexOf(d[public_variables.text_var]) >= 0) return false;
          if (!public_variables.solo.length) return true;
          if (public_variables.solo.indexOf(d[public_variables.text_var]) >= 0) return true;
          return false;
        })
        
        var total_val = d3.sum(data, function(d){ 
          return d[public_variables.value_var] 
        })
        
      }
      else {
        
        var filtered_data = {}
        for (d in data) {
          if (public_variables.filter.indexOf(d[public_variables.text_var]) < 0) filtered_data[d] = data[d];
          if (!public_variables.solo.length) filtered_data[d] = data[d];
          if (public_variables.solo.indexOf(d[public_variables.text_var]) >= 0) filtered_data[d] = data[d];
        }
        
        var total_val = d3.sum(d3.values(data), function(d){ 
          return d[public_variables.value_var] 
        })
        
      }
      
      if (public_variables.svg_width < 400 || public_variables.svg_height < 400) {
        public_variables.small = true;
      }
      else {
        public_variables.small = false;
      }
      
      if (public_variables.total_bar) {
        public_variables.margin.top = 20;
        make_total(total_val);
      }
      else {
        public_variables.margin.top = 0;
        public_variables.svg.selectAll("g.title")
          .transition().duration(vizwhiz.timing)
          .style("opacity",0)
          .remove();
      }
      public_variables.height = public_variables.svg_height - public_variables.margin.top;
      public_variables.width = public_variables.svg_width;
      
      vizwhiz[public_variables.type](filtered_data,public_variables);
      
    });
    
    return chart;
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Helper Functions
  //-------------------------------------------------------------------
  
  mouseover = function(d){
    
    var svg = d3.select("svg");
    var tooltip_data = {}
    public_variables.tooltip_info.forEach(function(t){
      if (d[t]) tooltip_data[t] = d[t]
    })
    tooltip_data["Share"] = d.share;
    vizwhiz.tooltip.create({
      "parent": svg,
      "id": d[public_variables.id_var],
      "data": tooltip_data,
      "title": d[public_variables.text_var],
      "x": d3.mouse(svg.node())[0],
      "y": d3.mouse(svg.node())[1],
      "offset": 10,
      "arrow": true
    })
  }

  make_total = function(total_val){
    
    // Set the total value as data for element.
    var total = public_variables.svg.selectAll("g.title").data([total_val]),
        total_position = {"x": function(d){ return public_variables.width/2 }, "y": 15}
    
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
        if (public_variables.total_bar.format) {
          text = d3.format(public_variables.total_bar.format)(text);
        }
        else {
          text = d3.format(format)(text);
        }
        public_variables.total_bar.prefix ? text = public_variables.total_bar.prefix + text : null;
        public_variables.total_bar.suffix ? text = text + public_variables.total_bar.suffix : null;
        return text;
      })
    
    // Exit
    total.exit().transition().duration(vizwhiz.timing)
      .style("opacity",0)
      .remove();

  }
  
  get_connections = function(links) {
    var connections = {};
    if (public_variables.type == "network") {
      links.forEach(function(d) {
        if (!connections[d.source[public_variables.id_var]]) {
          connections[d.source[public_variables.id_var]] = {}
          connections[d.source[public_variables.id_var]].center = d.source
          connections[d.source[public_variables.id_var]].primary = {"nodes": [], "links": []}
        }
        connections[d.source[public_variables.id_var]].primary.nodes.push(d.target)
        connections[d.source[public_variables.id_var]].primary.links.push({"source": d.source, "target": d.target})
        if (!connections[d.target[public_variables.id_var]]) {
          connections[d.target[public_variables.id_var]] = {}
          connections[d.target[public_variables.id_var]].center = d.target
          connections[d.target[public_variables.id_var]].primary = {"nodes": [], "links": []}
        }
        connections[d.target[public_variables.id_var]].primary.nodes.push(d.source)
        connections[d.target[public_variables.id_var]].primary.links.push({"source": d.target, "target": d.source})
      })
      for (var c in connections) {
        connections[c].secondary = {"nodes": [], "links": []}
        connections[c].primary.nodes.forEach(function(p){
          connections[p[public_variables.id_var]].primary.nodes.forEach(function(s){
            if (s[public_variables.id_var] != c) {
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
        if (!connections[d.source[public_variables.id_var]]) {
          connections[d.source[public_variables.id_var]] = []
        }
        connections[d.source[public_variables.id_var]].push(d.target)
        if (!connections[d.target[public_variables.id_var]]) {
          connections[d.target[public_variables.id_var]] = []
        }
        connections[d.target[public_variables.id_var]].push(d.source)
      })
    }
    return connections;
  }
  
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Expose Public Variables
  //-------------------------------------------------------------------
  
  chart.active_var = function(x) {
    if (!arguments.length) return public_variables.active_var;
    public_variables.active_var = x;
    return chart;
  };
  
  chart.center = function(x) {
    if (!arguments.length) return public_variables.center;
    public_variables.center = x;
    return chart;
  };
  
  chart.coords = function(x) {
    if (!arguments.length) return public_variables.coords;
    public_variables.coords = topojson.object(x, x.objects[Object.keys(x.objects)[0]]).geometries;
    public_variables.boundries = {"coordinates": [[]], "type": "Polygon"}
    public_variables.coords.forEach(function(v,i){
      v.coordinates.forEach(function(c){
        c.forEach(function(a){
          if (a.length == 2) public_variables.boundries.coordinates[0].push(a)
          else {
            a.forEach(function(aa){
              public_variables.boundries.coordinates[0].push(aa)
            })
          }
        })
      })
    })
    return chart;
  };

  chart.donut = function(x) {
    if (!arguments.length) return public_variables.donut;
    if (typeof x == "boolean")  public_variables.donut = x;
    else if (x === "false") public_variables.donut = false;
    else public_variables.donut = true;
    return chart;
  };

  chart.filter = function(x) {
    if (!arguments.length) return public_variables.filter;
    // if we're given an array then overwrite the current filter var
    if(x instanceof Array){
      public_variables.filter = x;
    }
    // otherwise add/remove it from array
    else {
      // if element is in the array remove it
      if(public_variables.filter.indexOf(x) > -1){
        public_variables.filter.splice(public_variables.filter.indexOf(x), 1)
      }
      // if element is in the solo array remove it and add to this one
      else if(public_variables.solo.indexOf(x) > -1){
        public_variables.solo.splice(public_variables.solo.indexOf(x), 1)
        public_variables.filter.push(x)
      }
      // element not in current filter so add it
      else {
        public_variables.filter.push(x)
      }
    }
    return chart;
  };

  chart.group_bgs = function(x) {
    if (!arguments.length) return public_variables.group_bgs;
    if (typeof x == "boolean")  public_variables.group_bgs = x;
    else if (x === "false") public_variables.group_bgs = false;
    else public_variables.group_bgs = true;
    return chart;
  };

  chart.grouping = function(x) {
    if (!arguments.length) return public_variables.grouping;
    public_variables.grouping = x;
    return chart;
  };

  chart.height = function(x) {
    if (!arguments.length) return public_variables.svg_height;
    public_variables.svg_height = x;
    return chart;
  };
  
  chart.highlight = function(value) {
    if (!arguments.length) return public_variables.highlight;
    public_variables.highlight = value;
    if (highlight) public_variables.clicked = true;
    else public_variables.clicked = false;
    return chart;
  };
  
  chart.id_var = function(x) {
    if (!arguments.length) return public_variables.id_var;
    public_variables.id_var = x;
    return chart;
  };

  chart.labels = function(x) {
    if (!arguments.length) return public_variables.labels;
    public_variables.labels = x;
    return chart;
  };
  
  chart.layout = function(x) {
    if (!arguments.length) return public_variables.layout;
    public_variables.layout = x;
    return chart;
  };
  
  chart.links = function(x) {
    if (!arguments.length) return public_variables.links;
    public_variables.links = x;
    public_variables.connections = get_connections(x);
    return chart;
  };
  
  chart.map = function(x,style) {
    if (!arguments.length) return public_variables.map;
    public_variables.map.coords = x;
    if (style) {
      public_variables.map.style.land = style.land ? style.land : map.style.land;
      public_variables.map.style.water = style.water ? style.water : map.style.water;
    }
    return chart;
  };
  
  chart.name_array = function(x) {
    if (!arguments.length) return public_variables.name_array;
    public_variables.name_array = x;
    return chart;
  };
  
  chart.nodes = function(x) {
    if (!arguments.length) return public_variables.nodes;
    public_variables.nodes = x;
    return chart;
  };
  
  chart.order = function(x) {
    if (!arguments.length) return public_variables.order;
    public_variables.order = x;
    return chart;
  };
    
  chart.solo = function(x) {
    if (!arguments.length) return public_variables.solo;
    // if we're given an array then overwrite the current filter var
    if(x instanceof Array){
      public_variables.solo = x;
    }
    // otherwise add/remove it from array
    else {
      // if element is in the array remove it
      if(public_variables.solo.indexOf(x) > -1){
        public_variables.solo.splice(public_variables.solo.indexOf(x), 1)
      }
      // if element is in the filter array remove it and add to this one
      else if(public_variables.filter.indexOf(x) > -1){
        public_variables.filter.splice(public_variables.filter.indexOf(x), 1)
        public_variables.solo.push(x)
      }
      // element not in current filter so add it
      else {
        public_variables.solo.push(x)
      }
    }
    return chart;
  };
  
  chart.sort = function(x) {
    if (!arguments.length) return public_variables.sort;
    public_variables.sort = x;
    return chart;
  };

  chart.spotlight = function(x) {
    if (!arguments.length) return public_variables.spotlight;
    if (typeof x == "boolean")  public_variables.spotlight = x;
    else if (x === "false") public_variables.spotlight = false;
    else public_variables.spotlight = true;
    return chart;
  };
  
  chart.text_var = function(x) {
    if (!arguments.length) return public_variables.text_var;
    public_variables.text_var = x;
    return chart;
  };
  
  chart.tiles = function(x) {
    if (!arguments.length) return public_variables.tiles;
    if (typeof x == "boolean")  public_variables.tiles = x;
    else if (x === "false") public_variables.tiles = false;
    else public_variables.tiles = true;
    return chart;
  };
  
  chart.tooltip_info = function(x) {
    if (!arguments.length) return public_variables.tooltip_info;
    public_variables.tooltip_info = x;
    return chart;
  };
  
  chart.total_bar = function(x) {
    if (!arguments.length) return public_variables.total_bar;
    public_variables.total_bar = x;
    return chart;
  };
  
  chart.type = function(x) {
    if (!arguments.length) return public_variables.type;
    public_variables.type = x;
    return chart;
  };
  
  chart.value_var = function(x) {
    if (!arguments.length) return public_variables.value_var;
    public_variables.value_var = x;
    return chart;
  };

  chart.width = function(x) {
    if (!arguments.length) return public_variables.svg_width;
    public_variables.svg_width = x;
    return chart;
  };
  
  chart.xaxis_domain = function(x) {
    if (!arguments.length) return public_variables.xaxis_domain;
    public_variables.xaxis_domain = x;
    return chart;
  };
  
  chart.xaxis_var = function(x) {
    if (!arguments.length) return public_variables.xaxis_var;
    public_variables.xaxis_var = x;
    return chart;
  };
  
  chart.yaxis_domain = function(x) {
    if (!arguments.length) return public_variables.yaxis_domain;
    public_variables.yaxis_domain = x;
    return chart;
  };
  
  chart.yaxis_var = function(x) {
    if (!arguments.length) return public_variables.yaxis_var;
    public_variables.yaxis_var = x;
    return chart;
  };

  //===================================================================

  return chart;
};
