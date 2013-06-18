vizwhiz.viz = function() {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Public Variables with Default Settings
  //-------------------------------------------------------------------
  
  var vars = {
    "active_var": "active",
    "arc_angles": {},
    "arc_inners": {},
    "arc_sizes": {},
    "attrs": null,
    "boundries": null,
    "click_function": function() { return null },
    "color_var": "color",
    "connections": null,
    "coords": null,
    "csv_columns": null,
    "data": null,
    "data_source": null,
    "depth": null,
    "donut": true,
    "filter": [],
    "filtered_data": null,
    "graph": {},
    "group_bgs": true,
    "grouping": "name",
    "highlight": null,
    "highlight_color": "#cc0000",
    "id_var": "id",
    "init": true,
    "keys": [],
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
    "nesting": [],
    "nesting_aggs": {},
    "nodes": null,
    "number_format": function(obj) { 
      if (typeof obj === "number") var value = obj
      else var value = obj.value
      
      if (value < 1) {
        return d3.round(value,2)
      }
      else if (value.toString().split(".")[0].length > 4) {
        var symbol = d3.formatPrefix(value).symbol
        symbol = symbol.replace("G", "B") // d3 uses G for giga
        
        // Format number to precision level using proper scale
        value = d3.formatPrefix(value).scale(value)
        value = parseFloat(d3.format(".3g")(value))
        value = value + symbol;
      }
      else {
        value = d3.format(",f")(value)
      }
      
      return value
    },
    "order": "asc",
    "projection": d3.geo.mercator(),
    "secondary_color": "#ffdddd",
    "size_scale": null,
    "size_scale_type": "log",
    "solo": [],
    "sort": "total",
    "source_text": null,
    "spotlight": true,
    "sub_title": null,
    "svg_height": window.innerHeight,
    "svg_width": window.innerWidth,
    "text_format": function(d) { return d },
    "text_var": "name",
    "tiles": true,
    "title": null,
    "tooltip_info": [],
    "total_bar": false,
    "type": "tree_map",
    "value_var": "value",
    "xaxis_domain": null,
    "xaxis_var": null,
    "xscale": null,
    "xscale_type": "linear",
    "yaxis_domain": null,
    "yaxis_var": null,
    "yscale": null,
    "yscale_type": "linear",
    "year": null,
    "years": null,
    "year_var": "year",
    "zoom_behavior": d3.behavior.zoom()
  }
  
  var data_obj = {"raw": null},
      filter_change = false,
      nodes,
      links,
      removed_ids = [],
      xaxis_domain = null,
      yaxis_domain = null;
      
  var data_type = {
    "bubbles": "array",
    "geo_map": "object",
    "network": "object",
    "pie_scatter": "pie_scatter",
    "rings": "object",
    "stacked": "stacked",
    "tree_map": "tree_map"
  }
  
  var nested_apps = ["pie_scatter","stacked","tree_map"]
  
  //===================================================================

  chart = function(selection) {
    selection.each(function(data_passed) {

      if (vizwhiz.dev) console.log("[viz-whiz] *** Start Chart ***")
      
      // Things to do ONLY when the data has changed
      if (data_passed != data_obj.raw) {
        
        if (vizwhiz.dev) console.log("[viz-whiz] New Data Detected")
        // Copy data to "raw_data" variable
        var data = {}
        data_obj.raw = data_passed
        vars.parent = d3.select(this)
        
        if (vizwhiz.dev) console.log("[viz-whiz] Establishing Year Range and Current Year")
        // Find available years
        vars.years = vizwhiz.utils.uniques(data_obj.raw,vars.year_var)
        // Set initial year if it doesn't exist
        if (!vars.year) {
          if (vars.years.length) vars.year = vars.years[vars.years.length-1]
          else vars.year = "all"
        }
        
        if (vizwhiz.dev) console.log("[viz-whiz] Cleaning Data")
        vars.keys = {}
        data_obj.clean = data_obj.raw.filter(function(d){
          for (k in d) {
            if (!vars.keys[k]) {
              vars.keys[k] = typeof d[k]
            }
          }
          if (vars.xaxis_var) {
            if (typeof d[vars.xaxis_var] == "undefined") return false
          }
          if (vars.yaxis_var) {
            if (typeof d[vars.yaxis_var] == "undefined") return false
          }
          return true;
        })
        
        data_obj.year = {}
        if (vars.years.length) {
          vars.years.forEach(function(y){
            data_obj.year[y] = data_obj.clean.filter(function(d){
              return d[vars.year_var] == y;
            })
          })
        }
        
      }
      
      if (filter_change) {
        delete data_obj[data_type[vars.type]]
      }
      
      if (!data_obj[data_type[vars.type]]) {
        
        data_obj[data_type[vars.type]] = {}
        
        if (nested_apps.indexOf(vars.type) >= 0) {
          
          if (vizwhiz.dev) console.log("[viz-whiz] Nesting Data")
          
          vars.nesting.forEach(function(depth){
            
            var level = vars.nesting.slice(0,vars.nesting.indexOf(depth)+1)
            
            if (vars.type == "stacked") {
              var temp_data = []
              for (y in data_obj.year) {
                var filtered_data = filter_check(data_obj.year[y])
                var yd = nest(filtered_data,level)
                temp_data = temp_data.concat(yd)
              }
              data_obj[data_type[vars.type]][depth] = temp_data
            }
            else if (vars.type == "pie_scatter") {

              data_obj[data_type[vars.type]][depth] = {"true": {}, "false": {}}
              for (b in data_obj[data_type[vars.type]][depth]) {
                var all_array = []
                if (b == "true") var spotlight = true
                else var spotlight = false
                for (y in data_obj.year) {
                  var filtered_data = filter_check(data_obj.year[y])
                  if (spotlight) {
                    filtered_data = filtered_data.filter(function(d){
                      return d[vars.active_var] == spotlight
                    })
                  }
                  data_obj[data_type[vars.type]][depth][b][y] = nest(filtered_data,level)
                  all_array = all_array.concat(data_obj[data_type[vars.type]][depth][b][y])
                }
                data_obj[data_type[vars.type]][depth][b].all = all_array
              }
              
            }
            else {
              data_obj[data_type[vars.type]][depth] = {}
              var all_array = []
              for (y in data_obj.year) {
                var filtered_data = filter_check(data_obj.year[y])
                data_obj[data_type[vars.type]][depth][y] = nest(filtered_data,level)
                all_array = all_array.concat(data_obj[data_type[vars.type]][depth][y])
              }
              data_obj[data_type[vars.type]][depth].all = all_array
            }
            
          })
          
        }
        else if (data_type[vars.type] == "object") {
          for (y in data_obj.year) {
            data_obj[data_type[vars.type]][y] = {}
            var filtered_data = filter_check(data_obj.year[y])
            filtered_data.forEach(function(d){
              data_obj[data_type[vars.type]][y][d[vars.id_var]] = d;
            })
          }
        }
        else {
          for (y in data_obj.year) {
            var filtered_data = filter_check(data_obj.year[y])
            data_obj[data_type[vars.type]][y] = filtered_data
          }
        }
        
        filter_change = false
        
      }

      vizwhiz.tooltip.remove();
      
      vars.svg = vars.parent.selectAll("svg").data([data]);
      
      vars.svg_enter = vars.svg.enter().append("svg")
        .attr('width',vars.svg_width)
        .attr('height',vars.svg_height)
        .style("z-index", 10)
        .style("position","absolute");
    
      vars.svg.transition().duration(vizwhiz.timing)
        .attr('width',vars.svg_width)
        .attr('height',vars.svg_height)
      
      if (["network","rings"].indexOf(vars.type) >= 0) {
        if (vars.solo.length || vars.filter.length) {
          vars.nodes = nodes.filter(function(n){
            if (removed_ids.indexOf(n[vars.id_var]) >= 0) {
              return false;
            }
            else {
              return true;
            }
          })
          vars.links = links.filter(function(l){
            if (removed_ids.indexOf(l.source[vars.id_var]) >= 0
             || removed_ids.indexOf(l.target[vars.id_var]) >= 0) {
              return false;
            }
            else {
              return true;
            }
          })
        }
        else {
          vars.nodes = nodes
          vars.links = links
        }
        vars.connections = get_connections(vars.links)
      }
      
      if (nested_apps.indexOf(vars.type) >= 0) {
        
        if (!vars.depth) vars.depth = vars.nesting[vars.nesting.length-1]
        
        if (vars.type == "stacked") {
          vars.data = data_obj[data_type[vars.type]][vars.depth]
        }
        else if (vars.type == "pie_scatter") {
          vars.data = data_obj[data_type[vars.type]][vars.depth][vars.spotlight][vars.year]
        }
        else {
          vars.data = data_obj[data_type[vars.type]][vars.depth][vars.year]
        }
        
      }
      else {
        vars.data = data_obj[data_type[vars.type]][vars.year];
      }
      
      vars.width = vars.svg_width;
      
      if (vars.type == "pie_scatter") {
        if (vizwhiz.dev) console.log("[viz-whiz] Setting Axes Domains")
        if (xaxis_domain) vars.xaxis_domain = xaxis_domain
        else {
          vars.xaxis_domain = d3.extent(data_obj[data_type[vars.type]][vars.depth][vars.spotlight].all,function(d){
            return d[vars.xaxis_var]
          })
        }
        if (yaxis_domain) vars.yaxis_domain = yaxis_domain
        else {
          vars.yaxis_domain = d3.extent(data_obj[data_type[vars.type]][vars.depth][vars.spotlight].all,function(d){
            return d[vars.yaxis_var]
          }).reverse()
        }
      }
      
      // Calculate total_bar value
      if (!vars.total_bar) {
        var total_val = null
      }
      else {
        if (vizwhiz.dev) console.log("[viz-whiz] Calculating Total Value")
        var total_val = d3.sum(data_obj.clean, function(d){ 
          return d[vars.value_var] 
        })
      }
      
      vars.svg_enter.append("g")
        .attr("class","titles")

      // Create titles
      vars.margin.top = 0;
      if (vars.svg_width < 300 || vars.svg_height < 200) {
        vars.small = true;
        vars.graph.margin = {"top": 0, "right": 0, "bottom": 0, "left": 0}
        make_title(null,"title");
        make_title(null,"sub_title");
        make_title(null,"total_bar");
      }
      else {
        if (vizwhiz.dev) console.log("[viz-whiz] Creating Titles")
        vars.small = false;
        vars.graph.margin = {"top": 5, "right": 10, "bottom": 55, "left": 45}
        vars.graph.width = vars.width-vars.graph.margin.left-vars.graph.margin.right
        make_title(vars.title,"title");
        make_title(vars.sub_title,"sub_title");
        make_title(total_val,"total_bar");
        if (vars.margin.top > 0) vars.margin.top += 3
      }
      
      vars.height = vars.svg_height - vars.margin.top;
      
      vars.graph.height = vars.height-vars.graph.margin.top-vars.graph.margin.bottom
      
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
        
      if (vizwhiz.dev) console.log("[viz-whiz] Building \"" + vars.type + "\"")
      vizwhiz[vars.type](vars);
      if (vizwhiz.dev) console.log("[viz-whiz] *** End Chart ***")
      
    });
    
    return chart;
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Helper Functions
  //-------------------------------------------------------------------

  filter_check = function(check_data) {
    
    if (filter_change) {
      
      if (vizwhiz.dev) console.log("[viz-whiz] Removing Solo/Filters")
      
      return check_data.filter(function(d){
        
        var check = [d[vars.id_var],d[vars.text_var]]
        vars.nesting.forEach(function(key){
          for (x in d[key]) {
            check.push(d[key][x])
          }
        })
        var match = false
        if (d[vars.id_var] != vars.highlight || vars.type != "rings") {
          if (vars.solo.length) {
            check.forEach(function(c){
              if (vars.solo.indexOf(c) >= 0) match = true;
            })
            if (match) return true
            removed_ids.push(d[vars.id_var])
            return false
          }
          else {
            check.forEach(function(c){
              if (vars.filter.indexOf(c) >= 0) match = true;
            })
            if (match) {
              removed_ids.push(d[vars.id_var])
              return false
            }
            return true
          }
        }
        else {
          return true
        }
      })
      
    }
    else {
      return check_data
    }
  }

  nest = function(flat_data,levels) {
  
    var flattened = [];
    var nested_data = d3.nest();
    
    levels.forEach(function(nest_key, i){
    
      nested_data
        .key(function(d){ return d[nest_key].id+"|"+d[nest_key].name; })
        
      if (i == levels.length-1) {
        nested_data.rollup(function(leaves){
          
          if(leaves.length == 1){
            flattened.push(leaves[0]);
            return leaves[0]
          }
          
          to_return = {
            "name": leaves[0][nest_key].name,
            "id": leaves[0][nest_key].id,
            "num_children": leaves.length,
            "num_children_active": d3.sum(leaves, function(d){ return d.active; })
          }
          
          if (leaves[0][nest_key].display_id) to_return.display_id = leaves[0][nest_key].display_id;
          
          for (key in vars.keys) {
            if (vars.nesting_aggs[key]) {
              to_return[key] = d3[vars.nesting_aggs[key]](leaves, function(d){ return d[key]; })
            }
            else {
              if (["color",vars.year_var].indexOf(key) >= 0) {
                to_return[key] = leaves[0][key];
              }
              else if (vars.keys[key] === "number") {
                to_return[key] = d3.sum(leaves, function(d){ return d[key]; })
              }
            }
          }
          
          if(vars.type != "tree_map"){
            levels.forEach(function(nk){
              to_return[nk] = leaves[0][nk]
            })
            flattened.push(to_return);
          }
        
          return to_return
        })
      }
    
    })
    
    nested_data = nested_data
      .entries(flat_data)
      .map(vizwhiz.utils.rename_key_value);

    if(vars.type != "tree_map"){
      return flattened;
    }

    return {"name":"root", "children": nested_data};

  }

  make_title = function(title,type){
    
    // Set the total value as data for element.
    var title_data = title ? [title] : [],
        font_size = type == "title" ? 18 : 13,
        title_position = {
          "x": vars.svg_width/2,
          "y": vars.margin.top
        }
    
    if (type == "total_bar" && title) {
      title_data = vars.number_format(title_data[0])
      vars.total_bar.prefix ? title_data = vars.total_bar.prefix + title_data : null;
      vars.total_bar.suffix ? title_data = title_data + vars.total_bar.suffix : null;
      title_data = [title_data]
    }
    
    var total = d3.select("g.titles").selectAll("g."+type).data(title_data)
    
    // Enter
    total.enter().append("g")
      .attr("class",type)
      .style("opacity",0)
      .append("text")
        .attr(title_position)
        .attr("font-size",font_size)
        .attr("fill","#333")
        .attr("text-anchor", "middle")
        .attr("font-family", "Helvetica")
        .style("font-weight", "normal")
        .each(function(d){
          vizwhiz.utils.wordwrap({
            "text": d,
            "parent": this,
            "width": vars.svg_width,
            "height": vars.svg_height/8,
            "resize": false
          })
        })
    
    // Update
    total.transition().duration(vizwhiz.timing)
      .style("opacity",1)
      
    update_titles()
    
    total.select("text").transition().duration(vizwhiz.timing)
      .attr("y",title_position.y)
    
    // Exit
    total.exit().transition().duration(vizwhiz.timing)
      .style("opacity",0)
      .remove();

    if (total.node()) vars.margin.top += total.select("text").node().getBBox().height

  }
  
  update_titles = function() {
    
    var xpos = vars.svg_width/2
    if (["pie_scatter","stacked"].indexOf(vars.type) >= 0) {
      xpos = vars.graph.width/2 + vars.graph.margin.left
    }

    d3.select("g.titles").selectAll("g").select("text")
      .transition().duration(vizwhiz.timing)
        .attr("x",xpos)
        .each(function(d){
          vizwhiz.utils.wordwrap({
            "text": d,
            "parent": this,
            "width": vars.svg_width,
            "height": vars.svg_height/8,
            "resize": false
          })
        })
        .selectAll("tspan")
          .attr("x",xpos)
        
  }
  
  get_connections = function(links) {
    var connections = {};
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
    return connections;
  }
  
  get_tooltip_data = function(id,length) {

    if (!length) var length = "long"
    
    if (["network","rings"].indexOf(vars.type) >= 0) {
      var tooltip_highlight = vars.active_var
    }
    else {
      var tooltip_highlight = vars.value_var
    }

    if (vars.tooltip_info instanceof Array) var a = vars.tooltip_info
    else var a = vars.tooltip_info[length]
    
    var tooltip_data = []
    a.forEach(function(t){
      var value = find_variable(id,t)
      var name = vars.text_format(t)
      if (value) {
        var h = t == tooltip_highlight
        tooltip_data.push({"name": name, "value": value, "highlight": h, "format": vars.number_format})
      }
    })
    
    return tooltip_data
    
  }
  
  find_variable = function(id,variable) {
    
    if (typeof id == "string") {
      
      if (vars.data instanceof Array) {
        var dat = vars.data.filter(function(d){
          return d[vars.id_var] == id
        })[0]
      }
      else {
        var dat = vars.data[id]
      }
    }
    else {
      var dat = id
    }
    
    
    var attr = vars.attrs[id]
    
    var value = false
    
    if (dat && dat[variable]) value = dat[variable]
    else if (attr && attr[variable]) value = attr[variable]
    else if (variable == "color") value = vizwhiz.utils.rand_color()
    
    if (variable == vars.text_var && value) {
      return vars.text_format(value)
    }
    else return value
    
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
  
  chart.attrs = function(x) {
    if (!arguments.length) return vars.attrs;
    vars.attrs = x;
    return chart;
  };
  
  chart.click_function = function(x) {
    if (!arguments.length) return vars.click_function;
    vars.click_function = x;
    return chart;
  };
  
  chart.csv_data = function(x) {
    if (!arguments.length) {
      var csv_to_return = []
      
      // filter out the columns (if specified)
      if(vars.csv_columns){
        vars.data.map(function(d){
          d3.keys(d).forEach(function(d_key){
            if(vars.csv_columns.indexOf(d_key) < 0){
              delete d[d_key]
            }
          })
        })
      }
      
      csv_to_return.push(vars.keys);
      vars.data.forEach(function(d){
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
  
  chart.color_var = function(x) {
    if (!arguments.length) return vars.color_var;
    vars.color_var = x;
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
  
  chart.data_source = function(x) {
    if (!arguments.length) return vars.data_source;
    vars.data_source = x;
    return chart;
  };
  
  chart.depth = function(x) {
    if (!arguments.length) return vars.depth;
    vars.depth = x;
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
    filter_change = true;
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
    links = x;
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
  
  chart.nesting = function(x) {
    if (!arguments.length) return vars.nesting;
    vars.nesting = x;
    return chart;
  };
  
  chart.nesting_aggs = function(x) {
    if (!arguments.length) return vars.nesting_aggs;
    vars.nesting_aggs = x;
    return chart;
  };
  
  chart.nodes = function(x) {
    if (!arguments.length) return vars.nodes;
    nodes = x;
    return chart;
  };
  
  chart.number_format = function(x) {
    if (!arguments.length) return vars.number_format;
    vars.number_format = x;
    return chart;
  };
  
  chart.order = function(x) {
    if (!arguments.length) return vars.order;
    vars.order = x;
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
    filter_change = true;
    return chart;
  };
  
  chart.sort = function(x) {
    if (!arguments.length) return vars.sort;
    vars.sort = x;
    return chart;
  };
  
  chart.source_text = function(x) {
    if (!arguments.length) return vars.source_text;
    vars.source_text = x;
    return chart;
  };

  chart.spotlight = function(x) {
    if (!arguments.length) return vars.spotlight;
    if (typeof x == "boolean")  vars.spotlight = x;
    else if (x === "false") vars.spotlight = false;
    else vars.spotlight = true;
    return chart;
  };
  
  chart.sub_title = function(x) {
    if (!arguments.length) return vars.sub_title;
    vars.sub_title = x;
    return chart;
  };
  
  chart.text_format = function(x) {
    if (!arguments.length) return vars.text_format;
    vars.text_format = x;
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
  
  chart.title = function(x) {
    if (!arguments.length) return vars.title;
    vars.title = x;
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
    xaxis_domain = x;
    return chart;
  };
  
  chart.xaxis_var = function(x) {
    if (!arguments.length) return vars.xaxis_var;
    vars.xaxis_var = x;
    return chart;
  };
  
  chart.xaxis_scale = function(x) {
    if (!arguments.length) return vars.xscale_type;
    vars.xscale_type = x;
    return chart;
  };
  
  chart.yaxis_domain = function(x) {
    if (!arguments.length) return vars.yaxis_domain;
    yaxis_domain = x.reverse();
    return chart;
  };
  
  chart.yaxis_var = function(x) {
    if (!arguments.length) return vars.yaxis_var;
    vars.yaxis_var = x;
    return chart;
  };
  
  chart.yaxis_scale = function(x) {
    if (!arguments.length) return vars.yscale_type;
    vars.yscale_type = x;
    return chart;
  };
  
  chart.year = function(x) {
    if (!arguments.length) return vars.year;
    vars.year = x;
    return chart;
  };
  
  chart.year_var = function(x) {
    if (!arguments.length) return vars.year_var;
    vars.year_var = x;
    return chart;
  };
  
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // X/Y Graph System
  //-------------------------------------------------------------------
  
  var tick_style = {
    "stroke": "#ccc",
    "stroke-width": 1
  }
  
  var axis_style = {
    "font-family": "Helvetica",
    "font-size": "12px",
    "font-weight": "normal",
    "fill": "#888"
  }
  
  var label_style = {
    "font-family": "Helvetica",
    "font-size": "14px",
    "font-weight": "normal",
    "fill": "#333",
    "text-anchor": "middle"
  }
  
  vars.x_axis = d3.svg.axis()
    .tickSize(0)
    .tickPadding(20)
    .orient('bottom')
    .tickFormat(function(d, i) {
      
      if (vars.xaxis_var == vars.year_var) var text = d;
      else var text = vars.number_format(d);
      
      d3.select(this)
        .style(axis_style)
        .attr("transform","translate(-22,8)rotate(-65)")
        .text(text)
        
      var height = (Math.cos(25)*this.getBBox().width)-10
      if (height > vars.graph.yoffset) vars.graph.yoffset = height
      
      var bgtick = d3.select(this.parentNode).selectAll("line.tick")
        .data([i])
        
      bgtick.enter().append("line")
        .attr("class","tick")
        .attr("x1", 0)
        .attr("x2", 0)
        .attr("y1", 15)
        .attr("y2", -vars.graph.height)
        .attr(tick_style)
        
      bgtick.transition().duration(vizwhiz.timing) 
        .attr("y2", -vars.graph.height)
        
      return text;
    });
  
  vars.y_axis = d3.svg.axis()
    .tickSize(0)
    .tickPadding(20)
    .orient('left')
    .tickFormat(function(d, i) {
      
      d3.select(this)
        .style(axis_style)
        .text(vars.number_format(d))
        
      var width = this.getBBox().width
      if (width > vars.graph.offset) vars.graph.offset = width
      
      var bgtick = d3.select(this.parentNode).selectAll("line.tick")
        .data([i])
        
      bgtick.enter().append("line")
        .attr("class","tick")
        .attr("x1", -15)
        .attr("x2", vars.graph.width)
        .attr("y1", 0)
        .attr("y2", 0)
        .attr(tick_style)
        
      bgtick.transition().duration(vizwhiz.timing) 
        .attr("x2", vars.graph.width)
        
      return vars.number_format(d);
    });
    
  graph_update = function() {
    
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
      
    vars.parent_enter.append("rect")
      .attr("id", "border")
      .attr("fill","none")
      .attr('x', vars.graph.margin.left)
      .attr('y', vars.graph.margin.top)
      .attr('width', vars.graph.width)
      .attr('height', vars.graph.height)
      .attr("stroke-width",1)
      .attr("stroke","#ccc")

    // Create X axis
    vars.chart_enter.append("g")
      .attr("transform", "translate(0," + vars.graph.height + ")")
      .attr("class", "xaxis")
      .call(vars.x_axis.scale(vars.x_scale))

    // Create Y axis
    vars.chart_enter.append("g")
      .attr("class", "yaxis")
      .call(vars.y_axis.scale(vars.y_scale))

    // create label group
    var axes = vars.parent_enter.append("g")
      .attr("class","axes_labels")
      
    // create X axis label
    axes.append('text')
      .attr('class', 'x_axis_label')
      .attr('x', vars.graph.width/2+vars.graph.margin.left)
      .attr('y', vars.height-10)
      .text(vars.text_format(vars.xaxis_var))
      .attr(label_style)
      
    // create Y axis label
    axes.append('text')
      .attr('class', 'y_axis_label')
      .attr('y', 15)
      .attr('x', -(vars.graph.height/2+vars.graph.margin.top))
      .text(vars.text_format(vars.yaxis_var))
      .attr("transform","rotate(-90)")
      .attr(label_style)

    // Update Y axis
    vars.graph.offset = 0
    d3.select("g.yaxis").transition().duration(vizwhiz.timing)
      .call(vars.y_axis.scale(vars.y_scale))
      
    vars.graph.margin.left += vars.graph.offset
    vars.graph.width -= vars.graph.offset
    
    vars.graph.yoffset = 0
    d3.select("g.xaxis").transition().duration(vizwhiz.timing)
      .call(vars.x_axis.scale(vars.x_scale))
      
    vars.graph.height -= vars.graph.yoffset
    
    // Update Graph
    d3.select(".chart").transition().duration(vizwhiz.timing)
      .attr("transform", "translate(" + vars.graph.margin.left + "," + vars.graph.margin.top + ")")
      .select("rect#background")
        .attr('width', vars.graph.width)
        .attr('height', vars.graph.height)
      
    d3.select("rect#border").transition().duration(vizwhiz.timing)
      .attr('x', vars.graph.margin.left)
      .attr('y', vars.graph.margin.top)
      .attr('width', vars.graph.width)
      .attr('height', vars.graph.height)

    // Update X axis
    vars.x_scale.range([0, vars.graph.width]);
    if (vars.type == "stacked") {
    vars.y_scale.range([vars.graph.height,0]);
    }
    else {
      vars.y_scale.range([0, vars.graph.height]);
    }

    
    d3.select("g.yaxis").transition().duration(vizwhiz.timing)
      .call(vars.y_axis.scale(vars.y_scale))
    
    d3.select("g.xaxis").transition().duration(vizwhiz.timing)
      .attr("transform", "translate(0," + vars.graph.height + ")")
      .call(vars.x_axis.scale(vars.x_scale))
    
    d3.select("g.xaxis").selectAll("g.tick").select("text")
      .style("text-anchor","end")

    // Update X axis label
    d3.select(".x_axis_label").transition().duration(vizwhiz.timing)
      .attr('x', vars.graph.width/2+vars.graph.margin.left)
      .attr('y', vars.height-10)
      .text(vars.text_format(vars.xaxis_var))

    // Update Y axis
    d3.select("g.yaxis").transition().duration(vizwhiz.timing)
      .call(vars.y_axis.scale(vars.y_scale))

    // Update Y axis label
    d3.select(".y_axis_label").transition().duration(vizwhiz.timing)
      .attr('y', 15)
      .attr('x', -(vars.graph.height/2+vars.graph.margin.top))
      .text(vars.text_format(vars.yaxis_var))
      
    // Move titles
    update_titles()
      
  }

  //===================================================================

  return chart;
};
