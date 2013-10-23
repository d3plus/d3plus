d3plus.viz = function() {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Public Variables with Default Settings
  //-------------------------------------------------------------------
  
  var vars = {
    "active_var": "active",
    "arc_angles": {},
    "arc_inners": {},
    "arc_sizes": {},
    "attrs": {},
    "background": "#ffffff",
    "boundaries": null,
    "click_function": null,
    "color_var": "color",
    "color_domain": [],
    "color_range": ["#ff0000","#888888","#00ff00"],
    "color_scale": d3.scale.sqrt().interpolate(d3.interpolateRgb),
    "connections": null,
    "coords": null,
    "coord_change": false,
    "csv_columns": null,
    "data": null,
    "depth": null,
    "descs": {},
    "dev": false,
    "donut": true,
    "else_var": "elsewhere",
    "error": "",
    "filter": [],
    "filtered_data": null,
    "font": "sans-serif",
    "font_weight": "lighter",
    "footer": false,
    "format": function(value,name) {
      if (typeof value === "number") return vars.number_format(value,name)
      if (typeof value === "string") return vars.text_format(value,name)
      else return value
    },
    "graph": {"timing": 0},
    "group_bgs": true,
    "grouping": "name",
    "highlight": null,
    "highlight_color": "#cc0000",
    "icon_style": "default",
    "id_var": "id",
    "init": true,
    "keys": [],
    "labels": true,
    "layout": "value",
    "links": null,
    "margin": {"top": 0, "right": 0, "bottom": 0, "left": 0},
    "mirror_axis": false,
    "name_array": null,
    "nesting": null,
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
    "size_scale": null,
    "size_scale_type": "sqrt",
    "solo": [],
    "sort": "total",
    "spotlight": true,
    "stack_type": "linear",
    "sub_title": null,
    "svg_height": window.innerHeight,
    "svg_width": window.innerWidth,
    "text_format": function(text,name) {
      return text.charAt(0).toUpperCase() + text.substr(1).toLowerCase() 
    },
    "text_var": "name",
    "title": null,
    "title_center": true,
    "title_height": 0,
    "title_width": null,
    "tooltip_info": [],
    "total_bar": false,
    "total_var": "total",
    "type": "tree_map",
    "update_function": null,
    "value_var": "value",
    "xaxis_domain": null,
    "xaxis_val": null,
    "xaxis_var": null,
    "xscale": null,
    "xscale_type": "linear",
    "yaxis_domain": null,
    "yaxis_val": null,
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
      error = false,
      filter_change = false,
      solo_change = false,
      value_change = false,
      axis_change = false,
      nodes,
      links,
      static_axes = true,
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
      
      if (vars.dev) console.log("[d3plus] *** Start Chart ***")
      
      // Things to do ONLY when the data has changed
      if (data_passed != data_obj.raw) {
        
        if (vars.dev) console.log("[d3plus] New Data Detected")
        // Copy data to "raw_data" variable
        data_obj = {}
        vars.keys = {}
        data_obj.raw = data_passed
        
        data_passed.forEach(function(d){
          for (k in d) {
            if (!vars.keys[k] && d[k]) {
              vars.keys[k] = typeof d[k]
            }
          }
        })
        
        var changed = []
        if (filter_change) changed.push("filter")
        if (solo_change) changed.push("solo")
        if (value_change && vars.value_var) changed.push(vars.value_var)
        if (axis_change) {
          if (vars.yaxis_var) changed.push(vars.yaxis_var)
          if (vars.xaxis_var) changed.push(vars.xaxis_var)
        }
        
        data_obj.filtered = filter_check(data_obj.raw,changed)
        vars.parent = d3.select(this)
        
        filter_change = false
        solo_change = false
        value_change = false
        axis_change = false
        
        if (vars.dev) console.log("[d3plus] Establishing Year Range and Current Year")
        // Find available years
        vars.years = d3plus.utils.uniques(data_obj.raw,vars.year_var)
        vars.years.sort()
        // Set initial year if it doesn't exist
        if (!vars.year) {
          if (vars.years.length) vars.year = vars.years[vars.years.length-1]
          else vars.year = "all"
        }
        
        data_obj.year = {}
        if (vars.years.length) {
          vars.years.forEach(function(y){
            data_obj.year[y] = data_obj.filtered.filter(function(d){
              return d[vars.year_var] == y;
            })
          })
        }
        
      }
      
      if (vars.type == "stacked") {
        vars.yaxis_var = vars.value_var
      }
      
      var changed = []
      if (filter_change) changed.push("filter")
      if (solo_change) changed.push("solo")
      if (value_change && vars.value_var) changed.push(vars.value_var)
      if (axis_change) {
        if (vars.yaxis_var) changed.push(vars.yaxis_var)
        if (vars.xaxis_var) changed.push(vars.xaxis_var)
      }
      
      if (changed.length) {
        delete data_obj[data_type[vars.type]]
        data_obj.filtered = filter_check(data_obj.raw,changed)
        if (vars.years.length) {
          vars.years.forEach(function(y){
            data_obj.year[y] = data_obj.filtered.filter(function(d){
              return d[vars.year_var] == y;
            })
          })
        }
      }
      
      filter_change = false
      solo_change = false
      value_change = false
      axis_change = false

      if (!data_obj[data_type[vars.type]]) {
        
        data_obj[data_type[vars.type]] = {}
        
        if (nested_apps.indexOf(vars.type) >= 0) {
          
          if (vars.dev) console.log("[d3plus] Nesting Data")
          
          if (!vars.nesting) vars.nesting = [vars.id_var]
          if (!vars.depth || vars.nesting.indexOf(vars.depth) < 0) vars.depth = vars.nesting[0]
          
          vars.nesting.forEach(function(depth){
            
            var level = vars.nesting.slice(0,vars.nesting.indexOf(depth)+1)
            
            if (vars.type == "stacked") {
              var temp_data = []
              for (y in data_obj.year) {
                var yd = nest(data_obj.year[y],level)
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
                  if (spotlight) {
                    var filtered_data = data_obj.year[y].filter(function(d){
                      return d[vars.active_var] != spotlight
                    })
                  }
                  else {
                    var filtered_data = data_obj.year[y]
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
                data_obj[data_type[vars.type]][depth][y] = nest(data_obj.year[y],level)
                all_array = all_array.concat(data_obj[data_type[vars.type]][depth][y])
              }
              data_obj[data_type[vars.type]][depth].all = all_array
            }
            
          })
          
        }
        else if (data_type[vars.type] == "object") {
          for (y in data_obj.year) {
            data_obj[data_type[vars.type]][y] = {}
            data_obj.year[y].forEach(function(d){
              data_obj[data_type[vars.type]][y][d[vars.id_var]] = d;
            })
          }
        }
        else {
          for (y in data_obj.year) {
            data_obj[data_type[vars.type]][y] = data_obj.year[y]
          }
        }
        
      }
      
      vars.data == null
      if (nested_apps.indexOf(vars.type) >= 0 && vars.nesting) {
        
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
        else if (vars.type == "pie_scatter" && vars.year) {
          vars.data = data_obj[data_type[vars.type]][vars.depth][vars.spotlight][vars.year]
        }
        else if (vars.year) {
          vars.data = data_obj[data_type[vars.type]][vars.depth][vars.year]
        }
        
      }
      else if (vars.year) {
        vars.data = data_obj[data_type[vars.type]][vars.year];
      }
      
      if (vars.data && (vars.type == "tree_map" && !vars.data.children.length) || (vars.data && vars.data.length == 0)) {
        vars.data = null
      }

      d3plus.tooltip.remove(vars.type);
      
      vars.svg = vars.parent.selectAll("svg").data([vars.data]);
      
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
      
      if (["network","rings"].indexOf(vars.type) >= 0) {
        if (vars.solo.length || vars.filter.length) {
          if (vars.dev) console.log("[d3plus] Filtering Nodes and Edges")
          vars.nodes = nodes.filter(function(d){
            return true_filter(d)
          })
          vars.links = links.filter(function(d){
            var first_match = true_filter(d.source),
                second_match = true_filter(d.target)
            return first_match && second_match
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
        .style("overflow","hidden")
      
      vars.width = vars.svg_width;

      if (vars.type == "pie_scatter" && vars.data) {
        if (vars.dev) console.log("[d3plus] Setting Axes Domains")
        if (xaxis_domain instanceof Array) vars.xaxis_domain = xaxis_domain
        else if (!static_axes) {
          vars.xaxis_domain = d3.extent(data_obj[data_type[vars.type]][vars.depth][vars.spotlight][vars.year],function(d){
            return d[vars.xaxis_var]
          })
        }
        else {
          vars.xaxis_domain = d3.extent(data_obj[data_type[vars.type]][vars.depth][vars.spotlight].all,function(d){
            return d[vars.xaxis_var]
          })
        }
        if (yaxis_domain instanceof Array) vars.yaxis_domain = yaxis_domain
        else if (!static_axes) {
          vars.yaxis_domain = d3.extent(data_obj[data_type[vars.type]][vars.depth][vars.spotlight][vars.year],function(d){
            return d[vars.yaxis_var]
          }).reverse()
        }
        else {
          vars.yaxis_domain = d3.extent(data_obj[data_type[vars.type]][vars.depth][vars.spotlight].all,function(d){
            return d[vars.yaxis_var]
          }).reverse()
        }
        if (vars.mirror_axis) {
          var domains = vars.yaxis_domain.concat(vars.xaxis_domain)
          vars.xaxis_domain = d3.extent(domains)
          vars.yaxis_domain = d3.extent(domains).reverse()
        }
        if (vars.xaxis_domain[0] == vars.xaxis_domain[1]) {
          vars.xaxis_domain[0] -= 1
          vars.xaxis_domain[1] += 1
        }
        if (vars.yaxis_domain[0] == vars.yaxis_domain[1]) {
          vars.yaxis_domain[0] -= 1
          vars.yaxis_domain[1] += 1
        }
      }
      
      if (!vars.xaxis_domain) vars.xaxis_domain = [0,0]
      if (!vars.yaxis_domain) vars.yaxis_domain = [0,0]
      
      // Calculate total_bar value
      if (!vars.data || !vars.total_bar || vars.type == "stacked") {
        var total_val = null
      }
      else {
        if (vars.dev) console.log("[d3plus] Calculating Total Value")
        
        if (vars.type == "tree_map") {
          
          function check_child(c) {
            if (c[vars.value_var]) return c[vars.value_var]
            else if (c.children) {
              return d3.sum(c.children,function(c2){
                return check_child(c2)
              })
            }
          }
          
          var total_val = check_child(vars.data)
        }
        else if (vars.data instanceof Array) {
          var total_val = d3.sum(vars.data,function(d){
            return d[vars.value_var]
          })
        }
        else if (vars.type == "rings") {
          if (vars.data[vars.highlight])
            var total_val = vars.data[vars.highlight][vars.value_var]
          else {
            var total_val = null
          }
        }
        else {
          var total_val = d3.sum(d3.values(vars.data),function(d){
            return d[vars.value_var]
          })
        }
      }
      
      if (vars.data) {

        if (vars.dev) console.log("[d3plus] Calculating Color Range")
        
        var data_range = []
        vars.color_domain = null
        
        if (vars.type == "tree_map") {
          
          function check_child_colors(c) {
            if (c.children) {
              c.children.forEach(function(c2){
                check_child_colors(c2)
              })
            }
            else {
              data_range.push(find_variable(c,vars.color_var))
            }
          }
        
          check_child_colors(vars.data)
        
        }
        else if (vars.data instanceof Array) {
          vars.data.forEach(function(d){
            data_range.push(find_variable(d,vars.color_var))
          })
        }
        else {
          d3.values(vars.data).forEach(function(d){
            data_range.push(find_variable(d,vars.color_var))
          })
        }
        
        data_range = data_range.filter(function(d){
          return d;
        })
      
        if (typeof data_range[0] == "number") {
          data_range.sort(function(a,b) {return a-b})
          vars.color_domain = [d3.quantile(data_range,0.1),d3.quantile(data_range,0.9)]
          var new_range = vars.color_range.slice(0)
          if (vars.color_domain[0] < 0 && vars.color_domain[1] > 0) {
            vars.color_domain.push(vars.color_domain[1])
            vars.color_domain[1] = 0
          }
          else if (vars.color_domain[1] > 0) {
            vars.color_domain[0] = 0
            new_range.splice(0,1)
          }
          else if (vars.color_domain[0] < 0) {
            vars.color_domain[1] = 0
            new_range.pop()
          }
          vars.color_scale
            .domain(vars.color_domain)
            .range(new_range)
        }
        
      }
      
      vars.svg_enter.append("g")
        .attr("class","titles")
      
      vars.svg_enter.append("g")
        .attr("class","footer")
        .attr("transform","translate(0,"+vars.svg_height+")")

      // Create titles
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
        if (vars.dev) console.log("[d3plus] Creating/Updating Titles")
        vars.small = false;
        vars.graph.margin = {"top": 5, "right": 10, "bottom": 40, "left": 40}
        vars.graph.width = vars.width-vars.graph.margin.left-vars.graph.margin.right
        make_title(vars.title,"title");
        make_title(vars.sub_title,"sub_title");
        if (vars.data && !error && (vars.type != "rings" || (vars.type == "rings" && vars.connections[vars.highlight]))) {
          make_title(total_val,"total_bar");
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
      
      
      vars.loader = vars.parent.selectAll("div#d3plus_loader").data([vars.data]);
      
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
      
      // vars.loader.select("div#d3plus_loader_text").transition().duration(d3plus.timing)
      
      if (!error && !vars.data) {
        vars.error = vars.format("No Data Available","error")
      }
      else if (vars.type == "rings" && !vars.connections[vars.highlight]) {
        vars.data = null
        vars.error = vars.format("No Connections Available","error")
      }
      else if (error) {
        vars.data = null
        if (error === true) {
          vars.error = vars.format("Error","error")
        }
        else {
          vars.error = vars.format(error,"error")
        }
      }
      else {
        vars.error = ""
      }
      
      if (vars.dev) console.log("[d3plus] Building \"" + vars.type + "\"")
      d3plus[vars.type](vars)
      if (vars.dev) console.log("[d3plus] *** End Chart ***")
      
      d3plus.error(vars)
      
    });
    
    return chart;
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Helper Functions
  //-------------------------------------------------------------------

  filter_check = function(check_data,keys) {
    
    if (vars.dev) console.log("[d3plus] Filtering Data")
    
    return check_data.filter(function(d){
      
      var ret = true
      keys.forEach(function(key){
        if (ret) {
          if (key == "filter" || key == "solo") {
            ret = true_filter(d)
          }
          else if (key != vars.value_var || vars.type != "rings") {
            var value = find_variable(d,key)
            if (!value) ret = false
          }
        }
      })
      return ret
      
    })
      
  }
  
  true_filter = function(d) {
    
    var id = d[vars.id_var],
        check = [id]
        
    if (vars.nesting.length) {
      vars.nesting.forEach(function(key){
        if (vars.attrs[id][key] && vars.attrs[id][key][vars.id_var]) {
          check.push(vars.attrs[id][key][vars.id_var])
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

  nest = function(flat_data,levels) {
    
    var flattened = [];
    var nested_data = d3.nest();
    
    levels.forEach(function(nest_key, i){
      
      nested_data
        .key(function(d){ 
          var n = find_variable(d,nest_key)
          if (typeof n === "object") return n[vars.id_var]
          else return n
        })
      
      if (i == levels.length-1) {
        nested_data.rollup(function(leaves){
          
          to_return = {
            "num_children": leaves.length,
            "num_children_active": d3.sum(leaves, function(d){ return d[vars.active_var]; })
          }
          
          var nest_obj = find_variable(leaves[0],nest_key)
          if (typeof nest_obj === "object") to_return[vars.id_var] = nest_obj[vars.id_var]
          else to_return[vars.id_var] = nest_obj
          
          if (nest_obj.display_id) to_return.display_id = nest_obj.display_id;
          
          for (key in vars.keys) {
            if (vars.nesting_aggs[key]) {
              to_return[key] = d3[vars.nesting_aggs[key]](leaves, function(d){ return d[key]; })
            }
            else {
              if ([vars.year_var,"icon"].indexOf(key) >= 0 || (key == vars.id_var && !to_return[vars.id_var])) {
                to_return[key] = leaves[0][key];
              }
              else if (vars.keys[key] === "number" && key != vars.id_var) {
                to_return[key] = d3.sum(leaves, function(d){ return d[key]; })
              }
              else if (key == vars.color_var) {
                to_return[key] = leaves[0][key]
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
      title = vars.format(t,vars.value_var)
      vars.total_bar.prefix ? title = vars.total_bar.prefix + title : null;
      vars.total_bar.suffix ? title = title + vars.total_bar.suffix : null;
      
      if (vars.filter.length || vars.solo.length && vars.type != "rings") {
        var overall_total = d3.sum(data_obj.raw, function(d){ 
          if (vars.type == "stacked") return d[vars.value_var]
          else if (vars.year == d[vars.year_var]) return d[vars.value_var]
        })
        var pct = (t/overall_total)*100
        ot = vars.format(overall_total,vars.value_var)
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
      
    update_titles()
    
    // Exit
    total.exit().transition().duration(d3plus.timing)
      .style("opacity",0)
      .remove();

    if (total.node()) vars.margin.top += total.select("text").node().getBBox().height

  }
  
  update_footer = function(footer_text) {
    
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
  
  update_titles = function() {
    
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
  
  get_tooltip_data = function(id,length,extras) {

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
    extras.push(vars.value_var)
    if (["bubbles"].indexOf(vars.type) >= 0) {
      tooltip_highlights.push(vars.active_var)
      extras.push(vars.active_var)
      tooltip_highlights.push(vars.else_var)
      extras.push(vars.else_var)
      tooltip_highlights.push(vars.total_var)
      extras.push(vars.total_var)
    }
    else if (["stacked","pie_scatter"].indexOf(vars.type) >= 0) {
      tooltip_highlights.push(vars.xaxis_var)
      tooltip_highlights.push(vars.yaxis_var)
      extras.push(vars.xaxis_var)
      extras.push(vars.yaxis_var)
    }
    
    if (["stacked","pie_scatter","bubbles"].indexOf(vars.type) < 0) {
      tooltip_highlights.push(vars.value_var)
    }
    
    if (vars.tooltip_info instanceof Array) var a = vars.tooltip_info
    else if (vars.tooltip_info[length] && vars.tooltip_info[length] instanceof Array) var a = vars.tooltip_info[length]
    else if (vars.tooltip_info[length]) var a = d3plus.utils.merge({"":[]},vars.tooltip_info[length])
    else var a = vars.tooltip_info
    
    function format_key(key,group) {
      if (!group) var group = null
      else var group = vars.format(group)
      
      var value = extra_data[key] || find_variable(id,key)
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
      
      if (vars.tooltip_info.long && typeof vars.tooltip_info.long == "object") {
        var placed = []
        for (group in vars.tooltip_info.long) {
          extras.forEach(function(e){
            if (vars.tooltip_info.long[group].indexOf(e) >= 0 && ((a[group] && a[group].indexOf(e) < 0) || !a[group])) {
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
      else if (vars.data) {
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
      if (dat && typeof dat[variable] != "undefined") value = dat[variable]
      else if (attr && typeof attr[variable] != "undefined") value = attr[variable]
    }

    if (value === null) value = 0
    if (variable == vars.text_var && value) {
      return vars.format(value)
    }
    else return value
    
  }
  
  find_color = function(id) {
    var color = find_variable(id,vars.color_var)
    if (!color && vars.color_domain instanceof Array) color = 0
    else if (!color) color = d3plus.utils.rand_color()
    if (typeof color == "string") return color
    else return vars.color_scale(color)
  }
  
  footer_text = function() {

    var text = vars.click_function || vars.tooltip_info.long ? vars.format("Click for More Info") : null
    
    if (!text && vars.type == "geo_map") return vars.format("Click to Zoom")
    else return text
    
  }
  
  //===================================================================
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Expose Public Variables
  //-------------------------------------------------------------------
  
  chart.active_var = function(x) {
    if (!arguments.length) return vars.active_var
    vars.active_var = x
    return chart
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
  
  chart.color_var = function(x) {
    if (!arguments.length) return vars.color_var;
    vars.color_var = x;
    return chart;
  };
  
  chart.csv_data = function(x) {
    if (!arguments.length) {
      var csv_to_return = [],
          column_init = vars.csv_columns,
          columns = [], titles = []

      if (column_init.indexOf(vars.text_var) < 0) column_init.unshift(vars.text_var)
      if (column_init.indexOf(vars.id_var) < 0) column_init.unshift(vars.id_var)
      if (column_init.indexOf(vars.year_var) < 0) column_init.unshift(vars.year_var)
      
      // filter out the columns (if specified)
      column_init.forEach(function(c){
        if (vars.keys[c] || c == vars.text_var) {
          columns.push(c)
          titles.push(vars.format(c))
        }
      })
      
      csv_to_return.push(titles);
      
      if (vars.type == "tree_map") {
        
        var arr = []
        
        function flatted_children(c) {
          if (c.children && !vars.depth || (c.children && vars.depth && vars.nesting.indexOf(vars.depth)+1 != vars.depth)) {
            c.children.forEach(function(c2){
              flatted_children(c2)
            })
          }
          else {
            arr.push(c)
          }
        }
        
        flatted_children(vars.data)
        
      }
      else if (vars.data instanceof Array) {
        var arr = vars.data
      }
      else {
        var arr = d3.values(vars.data)
      }
      
      arr.forEach(function(d){
        
        var ret = []
        columns.forEach(function(c){
          ret.push(find_variable(d,c))
        })
        csv_to_return.push(ret)
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
    vars.coord_change = true
    x.objects[Object.keys(x.objects)[0]].geometries.forEach(function(f){
      f.id = f[vars.id_var]
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
    vars.depth = x;
    return chart;
  };
  
  chart.descs = function(x) {
    if (!arguments.length) return vars.descs;
    vars.descs = x;
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
  
  chart.else_var = function(x) {
    if (!arguments.length) return vars.else_var;
    vars.else_var = x;
    return chart;
  };

  chart.error = function(x) {
    if (!arguments.length) return error
    error = x
    return chart
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
  
  chart.footer = function(x) {
    if (!arguments.length) return vars.footer;
    vars.footer = x;
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
  
  chart.icon_style = function(x) {
    if (!arguments.length) return vars.icon_style;
    vars.icon_style = x;
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
  
  chart.info_style = function(x) {
    if (!arguments.length) return vars.info_style;
    vars.info_style = x;
    return chart;
  };

  chart.mirror_axis = function(x) {
    if (!arguments.length) return vars.mirror_axis;
    vars.mirror_axis = x;
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

  chart.scroll_zoom = function(x) {
    if (!arguments.length) return vars.scroll_zoom;
    vars.scroll_zoom = x;
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
    solo_change = true
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

  chart.stack_type = function(x) {
    if (!arguments.length) return vars.stack_type;
    vars.stack_type = x;
    return chart;
  };

  chart.static_axes = function(x) {
    if (!arguments.length) return static_axes;
    static_axes = x;
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
  
  chart.total_var = function(x) {
    if (!arguments.length) return vars.total_var;
    vars.total_var = x;
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
    value_change = true;
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
  
  chart.xaxis_val = function(x) {
    if (!arguments.length) return vars.xaxis_val;
    vars.xaxis_val = x;
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
  
  chart.yaxis_val = function(x) {
    if (!arguments.length) return vars.yaxis_val;
    vars.yaxis_val = x;
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
      
      if ((vars.xscale_type == "log" && d.toString().charAt(0) == "1")
          || vars.xscale_type != "log") {
            
        if (vars.xaxis_var == vars.year_var) var text = d;
        else {
          var text = vars.format(d,vars.xaxis_var);
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
      
      if (!(tick_offset == 5 && vars.xaxis_var == vars.year_var)) {
      
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
      
      if ((vars.yscale_type == "log" && d.toString().charAt(0) == "1")
          || vars.yscale_type != "log") {
            
        if (vars.yaxis_var == vars.year_var) var text = d;
        else if (vars.layout == "share" && vars.type == "stacked") {
          var text = d*100+"%"
        }
        else {
          var text = vars.format(d,vars.yaxis_var);
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
      
      if (!(tick_offset == -5 && vars.yaxis_var == vars.year_var)) {
        
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
      .text(vars.format(vars.xaxis_var))
      .attr("font-family",vars.font)
      .attr("font-weight",vars.font_weight)
      .attr(label_style)
      
    // Create Y axis label
    axes.append('text')
      .attr('class', 'y_axis_label')
      .attr('y', 15)
      .attr('x', -(vars.graph.height/2+vars.graph.margin.top))
      .text(vars.format(vars.yaxis_var))
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
        if (vars.data.length == 0) return 0
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
        if (vars.data.length == 0) return 0
        else return 1
      })
      .text(vars.format(vars.xaxis_var))

    // Update Y axis label
    d3.select(".y_axis_label")
      .attr('y', 15)
      .attr('x', -(vars.graph.height/2+vars.graph.margin.top))
      .attr("opacity",function(){
        if (vars.data.length == 0) return 0
        else return 1
      })
      .text(vars.format(vars.yaxis_var))
      
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
      .attr("y1",vars.y_scale(y_val))
      .attr("y2",vars.y_scale(y_val))
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
      .attr("x1",vars.x_scale(x_val))
      .attr("x2",vars.x_scale(x_val))
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
    update_titles()
    
    vars.graph.timing = d3plus.timing
      
  }

  //===================================================================

  return chart;
};
