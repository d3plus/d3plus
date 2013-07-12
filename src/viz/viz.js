vizwhiz.viz = function() {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Public Variables with Default Settings
  //-------------------------------------------------------------------
  
  var vars = {
    "active_var": "active",
    "arc_angles": {},
    "arc_inners": {},
    "arc_sizes": {},
    "axis_change": true,
    "attrs": null,
    "background": "#ffffff",
    "boundries": null,
    "click_function": null,
    "color_var": "color",
    "connections": null,
    "coords": null,
    "csv_columns": null,
    "data": null,
    "data_source": null,
    "depth": null,
    "dev": false,
    "donut": true,
    "filter": [],
    "filtered_data": null,
    "graph": {"timing": 0},
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
    "number_format": function(value,name) { 
      if (["year",vars.id_var].indexOf(name) >= 0 || typeof value === "string") {
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
      else {
        return d3.format(",f")(value)
      }
      
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
    "text_format": function(text,name) { 
      return text 
    },
    "text_var": "name",
    "tiles": true,
    "title": null,
    "title_center": true,
    "title_width": null,
    "tooltip_info": [],
    "total_bar": false,
    "type": "tree_map",
    "update_function": null,
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
    "zoom_behavior": d3.behavior.zoom(),
    "zoom_function": null
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

      if (vars.dev) console.log("[viz-whiz] *** Start Chart ***")
      
      // Things to do ONLY when the data has changed
      if (data_passed != data_obj.raw) {
        
        if (vars.dev) console.log("[viz-whiz] New Data Detected")
        // Copy data to "raw_data" variable
        data_obj = {}
        data_obj.raw = data_passed
        vars.parent = d3.select(this)
        
        if (vars.dev) console.log("[viz-whiz] Establishing Year Range and Current Year")
        // Find available years
        vars.years = vizwhiz.utils.uniques(data_obj.raw,vars.year_var)
        vars.years.sort()
        // Set initial year if it doesn't exist
        if (!vars.year) {
          if (vars.years.length) vars.year = vars.years[vars.years.length-1]
          else vars.year = "all"
        }
        
        if (vars.dev) console.log("[viz-whiz] Cleaning Data")
        vars.keys = {}
        data_obj.clean = data_obj.raw.filter(function(d){
          for (k in d) {
            if (!vars.keys[k]) {
              vars.keys[k] = typeof d[k]
            }
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
      
      if (vars.type == "stacked") {
        vars.yaxis_var = vars.value_var
      }
      
      if (filter_change || 
          (["pie_scatter","stacked"].indexOf(vars.type) >= 0 && axis_change)) {
        delete data_obj[data_type[vars.type]]
      }
      
      if (!data_obj[data_type[vars.type]]) {
        
        data_obj[data_type[vars.type]] = {}
        
        if (nested_apps.indexOf(vars.type) >= 0) {
          
          if (vars.dev) console.log("[viz-whiz] Nesting Data")
          
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
                      return d[vars.active_var] != spotlight
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
        
      }
      
      if (nested_apps.indexOf(vars.type) >= 0) {
        
        if (!vars.depth) vars.depth = vars.nesting[vars.nesting.length-1]
        
        if (vars.type == "stacked") {
          vars.data = data_obj[data_type[vars.type]][vars.depth].filter(function(d){
            if (vars.year instanceof Array) {
              return d[vars.year_var] >= vars.year[0] && d[vars.year_var] <= vars.year[1]
            }
            else {
              return true
            }
          })
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

      vizwhiz.tooltip.remove();
      
      vars.svg = vars.parent.selectAll("svg").data([vars.data]);
      
      vars.svg_enter = vars.svg.enter().append("svg")
        .attr('width',vars.svg_width)
        .attr('height',vars.svg_height)
        .style("z-index", 10)
        .style("position","absolute")
        
      vars.svg_enter.append("rect")
        .attr("id","svgbg")
        .attr("fill",vars.background)
        .attr('width',vars.svg_width)
        .attr('height',vars.svg_height)
    
      vars.svg.transition().duration(vizwhiz.timing)
        .attr('width',vars.svg_width)
        .attr('height',vars.svg_height)
    
      vars.svg.select("rect#svgbg").transition().duration(vizwhiz.timing)
        .attr('width',vars.svg_width)
        .attr('height',vars.svg_height)
      
      if (["network","rings"].indexOf(vars.type) >= 0) {
        if (filter_change) {
          if (vars.dev) console.log("[viz-whiz] Filtering Nodes and Edges")
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
      
      vars.parent
        .style("width",vars.svg_width+"px")
        .style("height",vars.svg_height+"px")
      
      vars.width = vars.svg_width;
      
      if (vars.type == "pie_scatter") {
        if (vars.dev) console.log("[viz-whiz] Setting Axes Domains")
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
      if (!vars.total_bar || vars.type == "stacked") {
        var total_val = null
      }
      else {
        if (vars.dev) console.log("[viz-whiz] Calculating Total Value")
        
        if (vars.type == "tree_map") {
          var total_val = check_child(vars.data)
          
          function check_child(c) {
            if (c[vars.value_var]) return c[vars.value_var]
            else if (c.children) {
              return d3.sum(c.children,function(c2){
                return check_child(c2)
              })
          }
          }
        }
        else if (vars.data instanceof Array) {
          var total_val = d3.sum(vars.data,function(d){
            return d[vars.value_var]
          })
        }
        else if (vars.type == "rings") {
          var total_val = vars.data[vars.highlight][vars.value_var]
        }
        else {
          var total_val = d3.sum(d3.values(vars.data),function(d){
            return d[vars.value_var]
          })
        }
      }
      
      vars.svg_enter.append("g")
        .attr("class","titles")

      // Create titles
      vars.margin.top = 0;
      if (vars.svg_width < 300 || vars.svg_height < 200) {
        vars.small = true;
        vars.graph.margin = {"top": 0, "right": 0, "bottom": 0, "left": 0}
        vars.graph.width = vars.width
        make_title(null,"title");
        make_title(null,"sub_title");
        make_title(null,"total_bar");
      }
      else {
        if (vars.dev) console.log("[viz-whiz] Creating/Updating Titles")
        vars.small = false;
        vars.graph.margin = {"top": 5, "right": 10, "bottom": 40, "left": 40}
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
        
      filter_change = false
      axis_change = false
      if (vars.dev) console.log("[viz-whiz] Building \"" + vars.type + "\"")
      vizwhiz[vars.type](vars);
      if (vars.dev) console.log("[viz-whiz] *** End Chart ***")
      
    });
    
    return chart;
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Helper Functions
  //-------------------------------------------------------------------

  filter_check = function(check_data) {
    
    if (filter_change || 
        (["pie_scatter","stacked"].indexOf(vars.type) >= 0 && axis_change)) {
      
      if (vars.dev) console.log("[viz-whiz] Removing Solo/Filters")
      removed_ids = []
      return check_data.filter(function(d){
        
        if (vars.xaxis_var) {
          if (typeof d[vars.xaxis_var] == "undefined") return false
        }
        if (vars.yaxis_var) {
          if (typeof d[vars.yaxis_var] == "undefined") return false
        }
        
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
        .key(function(d){ return d[nest_key][vars.id_var]; })
      
      if (i == levels.length-1) {
        nested_data.rollup(function(leaves){
          
          to_return = {
            "num_children": leaves.length,
            "num_children_active": d3.sum(leaves, function(d){ return d.active; })
          }
          
          to_return[vars.id_var] = leaves[0][nest_key][vars.id_var]
          
          if (leaves[0][nest_key].display_id) to_return.display_id = leaves[0][nest_key].display_id;
          
          for (key in vars.keys) {
            if (vars.nesting_aggs[key]) {
              to_return[key] = d3[vars.nesting_aggs[key]](leaves, function(d){ return d[key]; })
            }
            else {
              if ([vars.color_var,vars.year_var,"icon"].indexOf(key) >= 0) {
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
      
    rename_key_value = function(obj) { 
      if (obj.values && obj.values.length) { 
        var return_obj = {}
        return_obj.children = obj.values.map(function(obj) { 
          return rename_key_value(obj);
        })
        return_obj[vars.id_var] = obj.key
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

    if(vars.type != "tree_map"){
      return flattened;
    }

    return {"name":"root", "children": nested_data};

  }

  make_title = function(t,type){

    // Set the total value as data for element.
    var font_size = type == "title" ? 18 : 13,
        title_position = {
          "x": vars.svg_width/2,
          "y": vars.margin.top
        }
    
    if (type == "total_bar" && t) {
      title = vars.number_format(t,vars.value_var)
      vars.total_bar.prefix ? title = vars.total_bar.prefix + title : null;
      vars.total_bar.suffix ? title = title + vars.total_bar.suffix : null;
      
      if (vars.filter.length || vars.solo.length && vars.type != "rings") {
        var overall_total = d3.sum(data_obj.clean, function(d){ 
          if (vars.type == "stacked") return d[vars.value_var]
          else if (vars.year == d[vars.year_var]) return d[vars.value_var]
        })
        var pct = (t/overall_total)*100
        ot = vars.number_format(overall_total,vars.value_var)
        title += " ("+vars.number_format(pct,"share")+"% of "+ot+")"
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
        .attr("font-family", "Helvetica")
        .style("font-weight", "normal")
        .each(function(d){
          var width = vars.title_width ? vars.title_width : vars.svg_width
          width -= offset*2
          vizwhiz.utils.wordwrap({
            "text": d.title,
            "parent": this,
            "width": width,
            "height": vars.svg_height/8,
            "resize": false
          })
        })
    
    // Update
    total.transition().duration(vizwhiz.timing)
      .style("opacity",1)
      
    update_titles()
    
    // Exit
    total.exit().transition().duration(vizwhiz.timing)
      .style("opacity",0)
      .remove();

    if (total.node()) vars.margin.top += total.select("text").node().getBBox().height

  }
  
  update_titles = function() {
    
    var offset = 0
    if (["pie_scatter","stacked"].indexOf(vars.type) >= 0 && !vars.title_center) {
      offset = vars.graph.margin.left
    }

    d3.select("g.titles").selectAll("g").select("text")
      .transition().duration(vizwhiz.timing)
        .attr("x",function(d) { return d.x+offset; })
        .attr("y",function(d) { return d.y; })
        .each(function(d){
          var width = vars.title_width ? vars.title_width : vars.svg_width
          width -= offset*2
          vizwhiz.utils.wordwrap({
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
    
    if (a.indexOf(vars.value_var) < 0) a.unshift(vars.value_var)
    if (["stacked","pie_scatter"].indexOf(vars.type) >= 0
         && a.indexOf(vars.xaxis_var) < 0) a.unshift(vars.xaxis_var)
    if (["stacked"].indexOf(vars.type) >= 0
         && a.indexOf(vars.yaxis_var) < 0) a.unshift(vars.yaxis_var)
    
    var tooltip_data = []
    a.forEach(function(t){
      var value = find_variable(id,t)
      if (value) {
        var name = vars.text_format(t),
            h = t == tooltip_highlight
            
        if (typeof value == "string") {
          var val = vars.text_format(value,t)
        }
        else if (typeof value == "number") {
          var val = vars.number_format(value,t)
        }
        
        if (val) tooltip_data.push({"name": name, "value": val, "highlight": h})
      }
    })
    
    return tooltip_data
    
  }
  
  find_variable = function(id,variable) {
    
    if (typeof id == "object") {
      var dat = id
      id = dat[vars.id_var]
    }
    else {
      if (vars.data instanceof Array) {
        var dat = vars.data.filter(function(d){
          return d[vars.id_var] == id
        })[0]
      }
      else {
        var dat = vars.data[id]
      }
    }
    
    var attr = vars.attrs[id]
    
    var value = false
    
    if (dat && dat.values) {
      dat.values.forEach(function(d){
        if (d[variable] && !value) value = d[variable]
      })
    }
    
    if (!value) {
      if (dat && dat[variable]) value = dat[variable]
      else if (attr && attr[variable]) value = attr[variable]
      else if (variable == "color") value = vizwhiz.utils.rand_color()
    }
    
    if (variable == vars.text_var && value) {
      return vars.text_format(value)
    }
    else return value
    
  }
  
  footer_text = function() {

    var text = vars.click_function || vars.tooltip_info.long ? vars.text_format("Click for More Info") : null
    
    if (!text && vars.type == "geo_map") return vars.text_format("Click to Zoom")
    else return text
    
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
  
  chart.background = function(x) {
    if (!arguments.length) return vars.background;
    vars.background = x;
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
  
  chart.dev = function(x) {
    if (!arguments.length) return vars.dev;
    vars.dev = x;
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
  
  chart.title_center = function(x) {
    if (!arguments.length) return vars.title_center;
    vars.title_center = x;
    return chart;
  };
  
  chart.title_width = function(x) {
    if (!arguments.length) return vars.title_width;
    vars.title_width = x;
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
    axis_change = true;
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
    axis_change = true;
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
        .on(vizwhiz.evt.click,function(){ vars.zoom("in") })
        .text("+")
    
      zoom_enter.append("div")
        .attr("id","zoom_out")
        .attr("unselectable","on")
        .on(vizwhiz.evt.click,function(){ vars.zoom("out") })
        .text("-")
    
      zoom_enter.append("div")
        .attr("id","zoom_reset")
        .attr("unselectable","on")
        .on(vizwhiz.evt.click,function(){ 
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
      
      if ((vars.xscale_type == "log" && d.toString().charAt(0) == "1")
          || (vars.xaxis_var == vars.year_var && d % 1 == 0)
          || (vars.xscale_type != "log" && vars.xaxis_var != vars.year_var)) {
      
        if (vars.xaxis_var == vars.year_var) var text = d;
        else {
          var text = vars.number_format(d,vars.xaxis_var);
        }
      
        d3.select(this)
          .style(axis_style)
          .attr("transform","translate(-22,3)rotate(-65)")
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
      
      if (!(tick_offset == 5 && vars.xaxis_var == vars.year_var)) {
      
        var bgtick = d3.select(this.parentNode).selectAll("line.tick")
          .data([i])
          
        bgtick.enter().append("line")
          .attr("class","tick")
          .attr("x1", 0)
          .attr("x2", 0)
          .attr("y1", tick_offset)
          .attr("y2", -vars.graph.height)
          .attr(tick_style)
          .attr("opacity",tick_opacity)
        
        bgtick.transition().duration(vizwhiz.timing) 
          .attr("y2", -vars.graph.height)
        
      }
      
      return text;
      
    });
  
  vars.y_axis = d3.svg.axis()
    .tickSize(0)
    .tickPadding(15)
    .orient('left')
    .tickFormat(function(d, i) {
      
      if ((vars.yscale_type == "log" && d.toString().charAt(0) == "1")
          || (vars.yaxis_var == vars.year_var && d % 1 == 0)
          || (vars.yscale_type != "log" && vars.yaxis_var != vars.year_var)) {
            
        if (vars.yaxis_var == vars.year_var) var text = d;
        else if (vars.layout == "share" && vars.type == "stacked") {
          var text = d*100+"%"
        }
        else {
          var text = vars.number_format(d,vars.yaxis_var);
        }
      
        d3.select(this)
          .style(axis_style)
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
      
      if (!(tick_offset == -5 && vars.yaxis_var == vars.year_var)) {
      
        var bgtick = d3.select(this.parentNode).selectAll("line.tick")
          .data([i])
        
        bgtick.enter().append("line")
          .attr("class","tick")
          .attr("x1", tick_offset)
          .attr("x2", vars.graph.width)
          .attr("y1", 0)
          .attr("y2", 0)
          .attr(tick_style)
          .attr("opacity",tick_opacity)
        
        bgtick.transition().duration(vizwhiz.timing) 
          .attr("x2", vars.graph.width)
        
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
      
    vars.parent_enter.append("rect")
      .attr("id", "border")
      .attr("fill","none")
      .attr('x', vars.graph.margin.left)
      .attr('y', vars.graph.margin.top)
      .attr('width', vars.graph.width)
      .attr('height', vars.graph.height)
      .attr("stroke-width",1)
      .attr("stroke","#ccc")
      .attr("shape-rendering","crispEdges")

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
      .text(vars.text_format(vars.xaxis_var))
      .attr(label_style)
      
    // Create Y axis label
    axes.append('text')
      .attr('class', 'y_axis_label')
      .attr('y', 15)
      .attr('x', -(vars.graph.height/2+vars.graph.margin.top))
      .text(vars.text_format(vars.yaxis_var))
      .attr("transform","rotate(-90)")
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
      .select("rect#background")
        .attr('width', vars.graph.width)
        .attr('height', vars.graph.height)
      
    d3.select("rect#border").transition().duration(vars.graph.timing)
      .attr('x', vars.graph.margin.left)
      .attr('y', vars.graph.margin.top)
      .attr('width', vars.graph.width)
      .attr('height', vars.graph.height)

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
      .text(vars.text_format(vars.xaxis_var))

    // Update Y axis label
    d3.select(".y_axis_label")
      .attr('y', 15)
      .attr('x', -(vars.graph.height/2+vars.graph.margin.top))
      .text(vars.text_format(vars.yaxis_var))
      
    // Move titles
    update_titles()
    
    vars.graph.timing = vizwhiz.timing
      
  }

  //===================================================================

  return chart;
};
