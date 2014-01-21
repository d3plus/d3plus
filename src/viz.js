d3plus.viz = function() {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Public Variables with Default Settings
  //-------------------------------------------------------------------
  
  var vars = {
    "autodraw": false,
    "footer_text": function() {
      var text = vars.tooltip.html || vars.tooltip.default.long ? "Click for More Info" : null
      return vars.text_format(text)
    },
    "format": function(value,key) {
      if (typeof value === "number") return vars.number_format(value,key,vars)
      if (typeof value === "string") return vars.text_format(value,key,vars)
      else return JSON.stringify(value)
    },
    "frozen": false,
    "g": {"apps":{}},
    "graph": {},
    "margin": {"top": 0, "right": 0, "bottom": 0, "left": 0},
    "mute": [],
    "solo": [],
    "style": d3plus.styles.default
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Main drawing function
  //-------------------------------------------------------------------
  chart = function(selection) {
    selection.each(function() {
      
      vars.frozen = true

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // If placing into a new container, remove it's contents
      // and check text direction.
      //-------------------------------------------------------------------
      if (vars.container.changed) {
        vars.parent = d3.select(vars.container.default)
        
        vars.parent
          .style("overflow","hidden")
          .html("")
          
        var dir = d3.select("html").attr("dir")
        if (dir) {
          vars.style.labels.dir = dir
        }
        else {
          vars.style.labels.dir = "ltr"
        }
      }

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Get overall width and height, if not defined
      //-------------------------------------------------------------------
      var sizes = ["width","height"]
      sizes.forEach(function(s){
        if (!vars[s].default) {
          var p = parseFloat(vars.parent.style(s),10)
          vars[s].default = p ? p : window["inner"+s.charAt(0).toUpperCase()+s.slice(1)]
        }
      })

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Run setup function if app has it
      //-------------------------------------------------------------------
      if (d3plus.apps[vars.type.default].setup) {
        d3plus.apps[vars.type.default].setup(vars)
      }

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Format Data as Necessary
      //-------------------------------------------------------------------
      d3plus.data.analyze(vars);
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Determine Color Range if Necessary
      //-------------------------------------------------------------------
      d3plus.data.color(vars);

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Remove All Tooltips associated with App (and previous app)
      //-------------------------------------------------------------------
      if (vars.type.previous && vars.type.default != vars.type.previous) {
        d3plus.tooltip.remove(vars.type.previous);
      }
      d3plus.tooltip.remove(vars.type.default);

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Enter Elements
      //-------------------------------------------------------------------
      
      // Enter SVG
      vars.svg = vars.parent.selectAll("svg#d3plus").data(["d3plus"]);
      vars.svg.enter().append("svg")
        .attr("id","d3plus")
        .attr('width',vars.width.default)
        .attr('height',vars.height.default)

      // Enter BG Rectangle
      vars.g.bg = vars.svg.selectAll("rect#bg").data(["bg"]);
      vars.g.bg.enter().append("rect")
        .attr("id","bg")
        .attr("fill",vars.style.background)
        .attr('width',vars.width.default)
        .attr('height',vars.height.default)
    
      // Enter Title Group
      vars.g.titles = vars.svg.selectAll("g#titles").data(["titles"])
      vars.g.titles.enter().append("g")
        .attr("id","titles")
    
      // Enter Key Group
      vars.g.key = vars.svg.selectAll("g#key").data(["key"])
      vars.g.key.enter().append("g")
        .attr("id","key")
        .attr("transform","translate(0,"+vars.height.default+")")
    
      // Enter Footer Group
      vars.g.footer = vars.svg.selectAll("g#footer").data(["footer"])
      vars.g.footer.enter().append("g")
        .attr("id","footer")
        .attr("transform","translate(0,"+vars.height.default+")")

      // Enter App Clipping Mask
      vars.g.clipping = vars.svg.selectAll("clippath#clipping").data(["clipping"])
      vars.g.clipping.enter().append("clippath")
        .attr("id","clipping")
        .append("rect")
          .attr("width",vars.app_width)
          .attr("height",vars.app_height)
          .attr("transform","translate("+vars.margin.left+","+vars.margin.top+")")
    
      // Enter Container Group
      vars.g.container = vars.svg.selectAll("g#container").data(["container"])
      vars.g.container.enter().append("g")
        .attr("id","container")
        .attr("clip-path","url(#clipping)")
        .attr("transform","translate("+vars.margin.left+","+vars.margin.top+")")
    
      // Enter Zoom Group
      vars.g.zoom = vars.g.container.selectAll("g#zoom").data(["zoom"])
      vars.g.zoom.enter().append("g")
        .attr("id","zoom")
        .attr("transform","translate("+vars.margin.left+","+vars.margin.top+")")
    
      // Enter App Background Group
      vars.g.app = vars.g.zoom.selectAll("g#app").data(["app"])
      vars.g.app.enter().append("g")
        .attr("id","app")
        
      // Enter App Group
      vars.g.apps[vars.type.default] = vars.g.app.selectAll("g#"+vars.type.default).data([vars.type.default])
      vars.g.apps[vars.type.default].enter().append("g")
        .attr("id",vars.type.default)
    
      // Enter Links Group
      vars.g.links = vars.g.zoom.selectAll("g#links").data(["links"])
      vars.g.links.enter().append("g")
        .attr("id","links")
    
      // Enter App Data Group
      vars.g.data = vars.g.zoom.selectAll("g#data").data(["data"])
      vars.g.data.enter().append("g")
        .attr("id","data")
        
      vars.defs = vars.svg.selectAll("defs").data(["defs"])
      vars.defs.enter().append("defs")
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Title and Size Calculations
      //-------------------------------------------------------------------
      vars.app_width = vars.width.default;
      d3plus.ui.titles(vars);
      d3plus.ui.key(vars);
      vars.app_height = vars.height.default - vars.margin.top - vars.margin.bottom;
      vars.graph.height = vars.app_height-vars.graph.margin.top-vars.graph.margin.bottom;

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Update Elements
      //-------------------------------------------------------------------
      
      // Update Parent Element
      vars.parent
        .style("width",vars.width.default+"px")
        .style("height",vars.height.default+"px")
        
      // Update SVG
      vars.svg.transition().duration(vars.style.timing.transitions)
          .attr('width',vars.width.default)
          .attr('height',vars.height.default)
    
      // Update Background Rectangle
      vars.g.bg.transition().duration(vars.style.timing.transitions)
          .attr('width',vars.width.default)
          .attr('height',vars.height.default)
          
      // Update App Clipping Rectangle
      vars.g.clipping.select("rect").transition().duration(vars.style.timing.transitions)
        .attr("width",vars.app_width)
        .attr("height",vars.app_height)
        .attr("transform","translate("+vars.margin.left+","+vars.margin.top+")")
        
      // Update Container Groups
      vars.g.container.transition().duration(vars.style.timing.transitions)
        .attr("transform","translate("+vars.margin.left+","+vars.margin.top+")")
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Check to see if we have all required variables set
      //-------------------------------------------------------------------
      var reqs = ["id"]
      if (d3plus.apps[vars.type.default].requirements) {
        reqs = reqs.concat(d3plus.apps[vars.type.default].requirements)
      }
      var missing = []
      reqs.forEach(function(r){
        var key = "key" in vars[r] ? "key" : "default"
        if (!vars[r][key]) missing.push(r)
      })
      if (missing.length) {
        vars.internal_error = "The following variables need to be set: "+missing.join(", ")
      }

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Check to see if we have all required libraries
      //-------------------------------------------------------------------
      var reqs = ["d3"]
      if (d3plus.apps[vars.type.default].libs) {
        reqs = reqs.concat(d3plus.apps[vars.type.default].libs)
      }
      var missing = []
      reqs.forEach(function(r){
        if (!window[r]) missing.push(r)
      })
      if (missing.length) {
        vars.internal_error = "The following libraries need to be loaded: "+missing.join(", ")
      }

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Check to see if the requested app supports the set shape
      //-------------------------------------------------------------------
      if (!vars.shape.default) {
        vars.shape.default = d3plus.apps[vars.type.default].shapes[0]
      }
      else if (d3plus.apps[vars.type.default].shapes.indexOf(vars.shape.default) < 0) {
        d3plus.console.warning("\""+vars.shape.default+"\" is not an accepted shape for the \""+vars.type.default+"\" app, please use one of the following: \""+d3plus.apps[vars.type.default].shapes.join("\", \"")+"\"")
        vars.shape.previous = vars.shape.default
        vars.shape.default = d3plus.apps[vars.type.default].shapes[0]
        d3plus.console.log("Defaulting shape to \""+vars.shape.default+"\"")
      }
  
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Hide the previous app, if applicable
      //-------------------------------------------------------------------
      if (vars.type.previous && vars.type.default != vars.type.previous && vars.g.apps[vars.type.previous]) {
        if (vars.dev.default) d3plus.console.group("Hiding \"" + vars.type.previous + "\"")
        vars.g.apps[vars.type.previous].transition().duration(vars.style.timing.transitions)
          .attr("opacity",0)
        if (vars.dev.default) d3plus.console.groupEnd();
      }
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Draw the specified app
      //-------------------------------------------------------------------
      if (vars.dev.default) d3plus.console.group("Drawing \"" + vars.type.default + "\"")
      // Set vars.group to the app's specific group element
      vars.group = vars.g.apps[vars.type.default]
      // Make the group visible if there is data
      vars.group.transition().duration(vars.style.timing.transitions)
        .attr("opacity",function(){
          if (vars.data.app.length == 0 || vars.internal_error) return 0
          else return 1
        })
      // Reset mouse events for the app to use
      vars.mouse = {}
      // Call the app's draw function, returning formatted data
      var returned = null
      
      vars.returned = {
          "nodes": null,
          "links": null
        }
          
      if (!vars.internal_error) {
        returned = d3plus.apps[vars.type.default].draw(vars)
      }
          
      if (returned instanceof Array) {
        vars.returned.nodes = returned
      }
      else if (returned) {
        if (returned.nodes) {
          vars.returned.nodes = returned.nodes
        }
        if (returned.links) {
          vars.returned.links = returned.links
        }
      }
      
      if (!vars.returned.nodes || !(vars.returned.nodes instanceof Array) || !vars.returned.nodes.length) {
        if (vars.dev.default) d3plus.console.log("No data returned by app.")
        vars.returned.nodes = [] 
      }
      
      // Draw links based on the data
      d3plus.shape.links(vars,vars.returned.links)
      
      // Draw nodes based on the data
      d3plus.shape.draw(vars,vars.returned.nodes)
        
      if (vars.dev.default) d3plus.console.groupEnd();
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Check for Errors
      //-------------------------------------------------------------------
      if (!vars.internal_error) {
        if ((!vars.error.default && !vars.data.app) || !vars.returned.nodes.length) {
          vars.internal_error = "No Data Available"
        }
        else if (vars.type.default == "rings" && !vars.connections[vars.focus.default]) {
          vars.data.app = null
          vars.internal_error = "No Connections Available"
        }
        else if (vars.error.default) {
          vars.data.app = null
          if (vars.error.default === true) {
            vars.internal_error = "Error"
          }
          else {
            vars.internal_error = vars.error.default
          }
        }
        else {
          vars.internal_error = null
        }
      }
      d3plus.ui.error(vars)
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Reset all "change" values to false
      //-------------------------------------------------------------------
      function reset_change(obj) {
        if (obj.changed) obj.changed = false
        else {
          for (o in obj) {
            if (Object.keys(d3plus.public).indexOf(o) >= 0) {
              if (o == "changed" && obj[o]) obj[o] = false
              else if (obj[o] != null && typeof obj[o] == "object") {
                reset_change(obj[o])
              }
            }
          }
        }
      }
      reset_change(vars)
      
      setTimeout(function(){
        vars.frozen = false
      },vars.style.timing.transitions)
      
    });
    
    return chart;
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Expose Public Variables
  //-------------------------------------------------------------------
  
  chart.csv = function(x) {
    
    if (x instanceof Array) var columns = x
    
    var csv_to_return = [],
        titles = [],
        title = vars.title.default || "My D3plus App Data"
        
    title = title.replace(/\ /g,'-')

    if (!columns) {
      var columns = [vars.id.key]
      if (vars.time.key) columns.push(vars.time.key)
      if (vars.size.key) columns.push(vars.size.key)
      if (vars.text.key) columns.push(vars.text.key)
    }
    
    columns.forEach(function(c){
      titles.push(vars.format(c))
    })
    
    csv_to_return.push(titles);
    
    vars.returned.nodes.forEach(function(n){
      var arr = []
      columns.forEach(function(c){
        arr.push(d3plus.variable.value(vars,n,c))
      })
      csv_to_return.push(arr)
    })
    
    var csv_data = "data:text/csv;charset=utf-8,"
    csv_to_return.forEach(function(c,i){
      dataString = c.join(",");
      csv_data += i < csv_to_return.length ? dataString + "\n" : dataString;
    })
    
    if (d3plus.ie) {
      var blob = new Blob([csv_data],{
        type: "text/csv;charset=utf-8;",
      })
      navigator.msSaveBlob(blob,title+".csv")
    }
    else {
      var encodedUri = encodeURI(csv_data);
      var link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download",title+".csv");
      link.click();
    }
    
    return csv_to_return;
    
  };
  
  chart.draw = function(x) {
    if (x) {
      if (typeof x == "boolean") {
        vars.autodraw = x
      }
      else {
        d3plus.console.warning(".draw() only accepts booleans to change the \"autodraw\" functionality.")
      }
    }
    if (!vars.container.default) {
      d3plus.console.warning("Please define a container div using .container()")
    }
    else if (d3.select(vars.container.default).empty()) {
      d3plus.console.warning("Cannot find <div> on page matching: \""+vars.container+"\"")
    }
    else {
      d3.select(vars.container.default).call(chart)
    }
    return chart;
  }

  chart.style = function(x) {
    if (!arguments.length) return vars.style;
    
    function check_depth(object,property,depth) {
      if (typeof depth == "object") {
        for (d in depth) {
          if (object[property] === undefined) {
            d3plus.console.warning("\""+property+"\" cannot be set");
          }
          else {
            check_depth(object[property],d,depth[d]);
          }
        }
      }
      else {
        if (object[property] === undefined) {
          d3plus.console.warning("\""+property+"\" cannot be set");
        }
        else {
          object[property] = depth;
        }
      }
    }
    
    if (typeof x == "object") {
      check_depth(vars,"style",x)
    }
    else if (typeof x == "string") {
      if (d3plus.styles[x]) {
        vars.style = plus.styles[x]
      }
      else {
        d3plus.console.warning("Style \""+x+"\" does not exist. Installed styles are: \""+Object.keys(d3plus.styles).join("\", \"")+"\"");
      }
    }
    else {
      d3plus.console.warning(".style() only accepts strings or keyed objects.");
    }
    
    return chart;
  };
  
  Object.keys(d3plus.public).forEach(function(p){
    
    // give default values to this .viz()
    vars[p] = d3plus.public[p]
    
    // detect available app types
    if (p == "type") {
      vars[p].accepted = Object.keys(d3plus.apps)
    }
    
    // create error messages for deprecated methods
    if (vars[p]) {
      function deprecate(obj) {
        for (o in obj) {
          if (o == "deprecates") {
            obj[o].forEach(function(d){
              chart[d] = (function(dep,n) {
                return function(x) {
                  d3plus.console.warning("\."+dep+"() method has been deprecated, please use the new \."+n+"() method.")
                  return chart;
                }
              })(d,p)
            })
          }
          else if (typeof obj[o] == "object") {
            deprecate(obj[o])
          }
        }
      }
      deprecate(vars[p])
    }
    
    // create method for variable
    
    chart[p] = (function(key) {
      return function(user) {

        if (!arguments.length) return vars[key];
        
        if (vars[key].reset) {
          vars[key].reset.forEach(function(r){
            vars[r] = null
          })
        }
        
        // determine default key type, if available
        if (vars[key].key !== undefined) var key_type = "key"
        else if (vars[key].default !== undefined) var key_type = "default"
        else var key_type = null
        
        if ((typeof user == "object" && key_type && !user[key_type] && !(Object.keys(user)[0] in vars[key]))
              || typeof user != "object") {
          set_value(vars[key],key_type,user)
        }
        else if (typeof user == "object") {
          check_object(vars,key,user)
        }
        else {
          d3plus.console.warning("Incompatible format for ."+key+"() method.")
        }
        
        function check_object(object,property,depth) {
          if (object[property] === undefined) {
            d3plus.console.warning("\""+property+"\" cannot be set.");
          }
          else {
            if (typeof depth == "object" && !(depth instanceof Array)) {
              if (object[property].object) {
                set_value(object[property],key_type,depth)
              }
              else {

                for (d in depth) {
                  check_object(object[property],d,depth[d]);
                }
                
              }
            }
            else {
              if (["solo","mute"].indexOf(property) >= 0) {
                object.changed = true
              }
              set_value(object,property,depth);
            }
          }
        }
        
        function update_array(arr,x) {
          // if the user has passed an array, use that
          if(x instanceof Array){
            arr = x;
          }
          // otherwise add/remove it from the array
          else if(arr.indexOf(x) >= 0){
            arr.splice(arr.indexOf(x), 1)
          }
          // element not in current filter so add it
          else {
            arr.push(x)
          }
          
          return arr
          
        }
        
        function set_value(a,b,c) {
          
          if (key == "type") {
            if (!a.accepted) {
              a.accepted = Object.keys(d3plus.apps)
            }
            
            if (a.accepted.indexOf(c) < 0) {
              for (app in d3plus.apps) {
                if (d3plus.apps[app].deprecates && d3plus.apps[app].deprecates.indexOf(c) >= 0) {
                  d3plus.console.warning(JSON.stringify(c)+" has been deprecated by "+JSON.stringify(app)+", please update your code.")
                  c = app
                }
              }
            }
            
          }
          
          if (vars.dev.default || key == "dev") {
            if (b == "default" || b == "key" || !b) {
              var text = "\."+key+"()"
            }
            else {
              var text = "\""+b+"\" of \."+key+"()"
            }
          }
          
          if (a.accepted && a.accepted.indexOf(c) < 0) {
            d3plus.console.warning(""+JSON.stringify(c)+" is not an accepted value for "+text+", please use one of the following: \""+a.accepted.join("\", \"")+"\"")
          }
          else if (!(a[b] instanceof Array) && a[b] == c || (a[b] && (a[b].key == c || a[b].default == c))) {
            if (vars.dev.default) d3plus.console.log(text+" was not updated because it did not change.")
          }
          else {
            if (b == "solo" || b == "mute") {
              if (a[b] instanceof Array) {
                a[b] = update_array(a[b],c)
                var arr = a[b]
              }
              else {
                a[b].default = update_array(a[b].default,c)
                var arr = a[b].default
              }
              if (key != "time") {
                if (arr.length && vars[b].indexOf(key) < 0) {
                  vars[b].push(key)
                }
                else if (!arr.length && vars[b].indexOf(key) >= 0) {
                  vars[b].splice(vars[b].indexOf(key), 1)
                }
              }
            }
            else if (key == "id" && b == "key") {

              if (c instanceof Array) {
                vars.id.nesting = c
                if (vars.depth.default < c.length) vars.id.key = c[vars.depth.default]
                else {
                  vars.id.key = c[0]
                  vars.depth.default = 0
                }
              }
              else {
                vars.id.key = c
                vars.id.nesting = [c]
                vars.depth.default = 0
              }
              a.changed = true
                
            }
            else if (key == "text" && b == "key") {

              if (!vars.text.array) vars.text.array = {}
              if (typeof c == "string") {
                vars.text.array[vars.id.key] = [c]
              }
              else if (c instanceof Array) {
                vars.text.array[vars.id.key] = c
              }
              else {
                vars.text.array = c
                var n = c[vars.id.key] ? c[vars.id.key] : c[Object.keys(c)[0]]
                vars.text.array[vars.id.key] = typeof n == "string" ? [n] : n
              }
              vars.text.key = vars.text.array[vars.id.key][0]
              a.changed = true
              
            }
            else if (key == "depth") {
              // Set appropriate depth and id
              if (c >= vars.id.nesting.length) vars.depth.default = vars.id.nesting.length-1
              else if (c < 0) vars.depth.default = 0
              else vars.depth.default = c;
              vars.id.key = vars.id.nesting[vars.depth.default]
              
              if (vars.text.array) {

                // Set appropriate name_array and text
                var n = vars.text.array[vars.id.key]
                if (n) {
                  vars.text.array[vars.id.key] = typeof n == "string" ? [n] : n
                  vars.text.key = vars.text.array[vars.id.key][0]
                }
                
              }
              
              a.changed = true
            }
            else if (key == "aggs") {
              for (agg in c) {
                if (a[b][agg] && a[b][agg] == c[agg]) {
                  if (vars.dev.default) d3plus.console.log("Aggregation for \""+agg+"\" is already set to \""+c[agg]+"\"")
                }
                else {
                  a[b][agg] = c[agg]
                  a.changed = true
                }
              }
            }
            else {
              if (typeof a[b] == "object" && a[b] != null && (a[b].key !== undefined || a[b].default !== undefined)) {
                var k = a[b].key !== undefined ? "key" : "default";
                a = a[b]
                b = k
              }
              a.previous = a[b]
              a[b] = c
              a.changed = true
            }
            
            if ((vars.dev.default || key == "dev") && (a.changed || ["solo","mute"].indexOf(b) >= 0)) {
              if (JSON.stringify(a[b]).length < 260) {
                d3plus.console.log(text+" has been set to "+JSON.stringify(a[b])+".")
              }
              else {
                d3plus.console.log(text+" has been set.")
              }
            }
          }
          
        }
        
        if (vars.autodraw) {
          return chart.draw()
        }
        else {
          return chart
        }
        
      }
    })(p)
  })

  return chart;
};
