d3plus.viz = function() {

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
    "check_vars": ["filter","solo","value","xaxis","yaxis","year_var","active","unique_axis"],
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
    "xscale_type": "linear",
    "yscale_type": "linear",
    "year": "all",
    "zoom_behavior": d3.behavior.zoom()
  }
  
  var error = false;
  
  //===================================================================

  chart = function(selection) {
    selection.each(function(datum) {
      
      // Set vars.parent to the container <div> element
      if (!vars.parent) vars.parent = d3.select(this)
      
      // All of the data-munging
      d3plus.utils.data(vars,datum)
      
      
      
      
      
      
      
      
      
      // Get link connections if they have not been previously set
      if (!vars.connections && vars.links) {
        var links = vars.links_filtered || vars.links
        vars.connections = d3plus.utils.connections(vars,links)
      }
      
      
      
      
      
      // Calculate total_bar value
      if (!vars.app_data || !vars.total_bar || vars.type == "stacked") {
        vars.data.total = null
      }
      else {
        if (vars.dev) console.log("%c[d3plus]%c Calculating Total Value","font-weight:bold","font-weight: normal")
        
        if (vars.app_data instanceof Array) {
          vars.data.total = d3.sum(vars.app_data,function(d){
            return d[vars.value]
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
      }
      
      
      
      // Setting up color range
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
        if (vars.dev) console.log("%c[d3plus]%c Creating/Updating Titles","font-weight:bold","font-weight: normal")
        vars.small = false;
        vars.graph.margin = {"top": 5, "right": 10, "bottom": 40, "left": 40}
        vars.graph.width = vars.width-vars.graph.margin.left-vars.graph.margin.right
        make_title(vars.title,"title");
        make_title(vars.sub_title,"sub_title");
        if (vars.app_data && !error && (vars.type != "rings" || (vars.type == "rings" && vars.connections[vars.highlight]))) {
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
      
      if (!error && !vars.app_data) {
        vars.error = vars.format("No Data Available","error")
      }
      else if (vars.type == "rings" && !vars.connections[vars.highlight]) {
        vars.app_data = null
        vars.error = vars.format("No Connections Available","error")
      }
      else if (error) {
        vars.app_data = null
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
      
      // Finally, call the specific App to draw
      if (vars.dev) console.group("%c[d3plus]%c Building \"" + vars.type + "\"","font-weight:bold","font-weight: normal")
      d3plus.apps[vars.type](vars)
      if (vars.dev) console.groupEnd();
      
      d3plus.utils.error(vars)
      
    });
    
    return chart;
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Helper Functions
  //-------------------------------------------------------------------

  make_title = function(t,type){

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
  
  footer_text = function() {

    var text = vars.click_function || vars.tooltip.long ? vars.format("Click for More Info") : null
    
    if (!text && vars.type == "geo_map") return vars.format("Click to Zoom")
    else return text
    
  }
  
  //===================================================================
  
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

  chart.spotlight = function(x) {
    if (!arguments.length) return vars.spotlight;
    if (typeof x == "boolean")  vars.spotlight = x;
    else if (x === "false") vars.spotlight = false;
    else vars.spotlight = true;
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
      
      if ((vars.xscale_type == "log" && d.toString().charAt(0) == "1")
          || vars.xscale_type != "log") {
            
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
      
      if ((vars.yscale_type == "log" && d.toString().charAt(0) == "1")
          || vars.yscale_type != "log") {
            
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
