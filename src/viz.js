d3plus.viz = function() {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Public Variables with Default Settings
  //-------------------------------------------------------------------
  
  var vars = {
    "autodraw": false,
    "filtered": false,
    "footer_text": function() {
      var text = vars.html.value || vars.tooltip.value.long ? "Click for More Info" : null
      return vars.text_format.value(text)
    },
    "format": function(value,key) {
      if (typeof value === "number") return vars.number_format.value(value,key,vars)
      if (typeof value === "string") return vars.text_format.value(value,key,vars)
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
  vars.viz = function(selection) {
    selection.each(function() {
      
      vars.frozen = true
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // If placing into a new container, remove it's contents
      // and check text direction.
      //-------------------------------------------------------------------
      if (vars.container.changed) {
        
        vars.parent = d3.select(vars.container.value)
        
        vars.parent
          .style("overflow","hidden")
          .style("position",function(){
            var current = d3.select(this).style("position"),
                remain = ["absolute","fixed"].indexOf(current) >= 0
            return remain ? current : "relative";
          })
          .html("")
          
        //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        // Get overall width and height, if not defined
        //----------------------------------------------------------------------
        var sizes = ["width","height"]
        sizes.forEach(function(s){
          if (!vars[s].value) {
            var p = parseFloat(vars.parent.style(s),10)
            vars[s].value = p ? p : window["inner"+s.charAt(0).toUpperCase()+s.slice(1)]
          }
        })

        vars.parent
          .style("width",vars.width.value+"px")
          .style("height",vars.height.value+"px")
          
      }

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Run setup function if app has it
      //-------------------------------------------------------------------
      if (d3plus.apps[vars.type.value].setup) {
        if (vars.dev.value) d3plus.console.group("Running setup function for \""+vars.type.value+"\"")
        d3plus.apps[vars.type.value].setup(vars)
        if (vars.dev.value) d3plus.console.groupEnd()
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
      if (vars.type.previous && vars.type.value != vars.type.previous) {
        d3plus.tooltip.remove(vars.type.previous);
      }
      d3plus.tooltip.remove(vars.type.value);

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Enter Elements
      //-------------------------------------------------------------------
      
      // Enter SVG
      vars.svg = vars.parent.selectAll("svg#d3plus").data(["d3plus"]);
      vars.svg.enter().append("svg")
        .attr("id","d3plus")
        .attr("width",vars.width.value)
        .attr("height",vars.height.value)
        .attr("xmlns","http://www.w3.org/2000/svg")
        .attr("xmlns:xmlns:xlink","http://www.w3.org/1999/xlink")

      // Enter BG Rectangle
      vars.g.bg = vars.svg.selectAll("rect#bg").data(["bg"]);
      vars.g.bg.enter().append("rect")
        .attr("id","bg")
        .attr("fill",vars.style.background)
        .attr("width",vars.width.value)
        .attr("height",vars.height.value)
    
      // Enter Title Group
      vars.g.titles = vars.svg.selectAll("g#titles").data(["titles"])
      vars.g.titles.enter().append("g")
        .attr("id","titles")
    
      // Enter Timeline Group
      vars.g.timeline = vars.svg.selectAll("g#timeline").data(["timeline"])
      vars.g.timeline.enter().append("g")
        .attr("id","timeline")
        .attr("transform","translate(0,"+vars.height.value+")")
    
      // Enter Key Group
      vars.g.key = vars.svg.selectAll("g#key").data(["key"])
      vars.g.key.enter().append("g")
        .attr("id","key")
        .attr("transform","translate(0,"+vars.height.value+")")
    
      // Enter Footer Group
      vars.g.footer = vars.svg.selectAll("g#footer").data(["footer"])
      vars.g.footer.enter().append("g")
        .attr("id","footer")
        .attr("transform","translate(0,"+vars.height.value+")")

      // Enter App Clipping Mask
      vars.g.clipping = vars.svg.selectAll("#clipping").data(["clipping"])
      vars.g.clipping.enter().append("clipPath")
        .attr("id","clipping")
        .append("rect")
          .attr("width",vars.app_width)
          .attr("height",vars.app_height)
    
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
      vars.g.apps[vars.type.value] = vars.g.app.selectAll("g#"+vars.type.value).data([vars.type.value])
      vars.g.apps[vars.type.value].enter().append("g")
        .attr("id",vars.type.value)
    
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
      vars.app_width = vars.width.value;
      d3plus.info.titles(vars);
      d3plus.info.legend(vars);
      d3plus.info.timeline(vars);
      vars.app_height = vars.height.value - vars.margin.top - vars.margin.bottom;
      vars.graph.height = vars.app_height-vars.graph.margin.top-vars.graph.margin.bottom;
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Update Elements
      //-------------------------------------------------------------------
      
      // Update Parent Element
      vars.parent.transition().duration(vars.style.timing.transitions)
        .style("width",vars.width.value+"px")
        .style("height",vars.height.value+"px")
        
      // Update SVG
      vars.svg.transition().duration(vars.style.timing.transitions)
          .attr("width",vars.width.value)
          .attr("height",vars.height.value)
    
      // Update Background Rectangle
      vars.g.bg.transition().duration(vars.style.timing.transitions)
          .attr("width",vars.width.value)
          .attr("height",vars.height.value)
          
      // Update App Clipping Rectangle
      vars.g.clipping.select("rect").transition().duration(vars.style.timing.transitions)
        .attr("width",vars.app_width)
        .attr("height",vars.app_height)
        
      // Update Container Groups
      vars.g.container.transition().duration(vars.style.timing.transitions)
        .attr("transform","translate("+vars.margin.left+","+vars.margin.top+")")
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Check to see if we have all required variables set
      //-------------------------------------------------------------------
      var reqs = ["id"]
      if (d3plus.apps[vars.type.value].requirements) {
        reqs = reqs.concat(d3plus.apps[vars.type.value].requirements)
      }
      var missing = []
      reqs.forEach(function(r){
        var key = "key" in vars[r] ? "key" : "value"
        if (!vars[r][key]) missing.push(r)
      })
      if (missing.length) {
        vars.internal_error = "The following variables need to be set: "+missing.join(", ")
      }
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Check to see if we have focus connections, if needed
      //-------------------------------------------------------------------
      if (!vars.internal_error && reqs.indexOf("links") >= 0 && reqs.indexOf("focus") >= 0 && !vars.connections[vars.focus.value]) {
        vars.internal_error = "No Connections Available for \""+d3plus.variable.text(vars,vars.focus.value,vars.depth.value)+"\""
      }

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Check to see if we have all required libraries
      //-------------------------------------------------------------------
      var reqs = ["d3"]
      if (d3plus.apps[vars.type.value].libs) {
        reqs = reqs.concat(d3plus.apps[vars.type.value].libs)
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
      if (!vars.shape.value) {
        vars.shape.value = d3plus.apps[vars.type.value].shapes[0]
      }
      else if (d3plus.apps[vars.type.value].shapes.indexOf(vars.shape.value) < 0) {
        d3plus.console.warning("\""+vars.shape.value+"\" is not an accepted shape for the \""+vars.type.value+"\" app, please use one of the following: \""+d3plus.apps[vars.type.value].shapes.join("\", \"")+"\"")
        vars.shape.previous = vars.shape.value
        vars.shape.value = d3plus.apps[vars.type.value].shapes[0]
        d3plus.console.log("Defaulting shape to \""+vars.shape.value+"\"")
      }
  
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Hide the previous app, if applicable
      //-------------------------------------------------------------------
      if (vars.type.previous && vars.type.value != vars.type.previous && vars.g.apps[vars.type.previous]) {
        if (vars.dev.value) d3plus.console.group("Hiding \"" + vars.type.previous + "\"")
        vars.g.apps[vars.type.previous].transition().duration(vars.style.timing.transitions)
          .attr("opacity",0)
        if (vars.dev.value) d3plus.console.groupEnd();
      }
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Draw the specified app
      //-------------------------------------------------------------------
      // Set vars.group to the app's specific group element
      vars.group = vars.g.apps[vars.type.value]
      // Make the group visible if there is data
      vars.group.transition().duration(vars.style.timing.transitions)
        .attr("opacity",function(){
          if (vars.data.app.length == 0 || vars.internal_error) return 0
          else return 1
        })
      // Reset mouse events for the app to use
      vars.mouse = {}
      // Call the app's draw function, returning formatted data
          
      if (!vars.internal_error) {
        if (vars.dev.value) d3plus.console.group("Calculating \"" + vars.type.value + "\"")
        var returned = d3plus.apps[vars.type.value].draw(vars)
        if (vars.dev.value) d3plus.console.groupEnd();
      }
      else {
        var returned = null
      }
      
      vars.returned = {
          "nodes": null,
          "links": null
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
        if (vars.dev.value) d3plus.console.log("No data returned by app.")
        vars.returned.nodes = [] 
      }
      
      // Draw links based on the data
      d3plus.shape.links(vars,vars.returned.links)
      
      // Draw nodes based on the data
      d3plus.shape.draw(vars,vars.returned.nodes)
      
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Check for Errors
      //-------------------------------------------------------------------
      if (!vars.internal_error) {
        if ((!vars.error.value && !vars.data.app) || !vars.returned.nodes.length) {
          vars.internal_error = "No Data Available"
        }
        else if (vars.error.value) {
          vars.data.app = null
          if (vars.error.value === true) {
            vars.internal_error = "Error"
          }
          else {
            vars.internal_error = vars.error.value
          }
        }
        else {
          vars.internal_error = null
        }
      }
      d3plus.info.error(vars)
      
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
      
      vars.internal_error = null
      
    });
    
    return vars.viz;
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Expose Public Variables
  //-------------------------------------------------------------------
  
  vars.viz.csv = function(x) {
    
    if (x instanceof Array) var columns = x
    
    var csv_to_return = [],
        titles = [],
        title = vars.title.value || "My D3plus App Data"
        
    title = d3plus.utils.strip(title)

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
  
  vars.viz.draw = function(x) {
    if (x) {
      if (typeof x == "boolean") {
        vars.autodraw = x
      }
      else {
        d3plus.console.warning(".draw() only accepts booleans to change the \"autodraw\" functionality.")
      }
    }
    if (!vars.container.value) {
      d3plus.console.warning("Please define a container div using .container()")
    }
    else if (d3.select(vars.container.value).empty()) {
      d3plus.console.warning("Cannot find <div> on page matching: \""+vars.container+"\"")
    }
    else {
      d3.select(vars.container.value).call(vars.viz)
    }
    return vars.viz;
  }

  vars.viz.style = function(x) {
    if (!arguments.length) return vars.style;
    
    function check_depth(object,property,depth) {
      if (typeof depth == "object" && !(depth instanceof Array)) {
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
    
    return vars.viz;
  };
  
  Object.keys(d3plus.public).forEach(function(p){
    
    // give default values to this .viz()
    vars[p] = d3plus.utils.copy(d3plus.public[p])
    
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
              vars.viz[d] = (function(dep,n) {
                return function(x) {
                  d3plus.console.warning("\."+dep+"() method has been deprecated, please use the new \."+n+"() method.")
                  return vars.viz;
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
    
    vars.viz[p] = (function(key) {
      return function(user) {

        if (!arguments.length) return vars[key];
        
        if (vars[key].reset) {
          vars[key].reset.forEach(function(r){
            vars[r] = null
          })
        }
        
        // determine default key type, if available
        if (vars[key].key !== undefined) var key_type = "key"
        else if (vars[key].value !== undefined) var key_type = "value"
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
              
              if (object[property].key !== undefined) var key_type = "key"
              else if (object[property].value !== undefined) var key_type = "value"
              else var key_type = null
              
              if (property == key_type) {
                set_value(object,key_type,depth)
              }
              else if (typeof object[property] == "object" && object[property] !== null && object[property].object === true) {
                set_value(object[property],key_type,depth)
              }
              else {

                for (d in depth) {
                  check_object(object[property],d,depth[d]);
                }
                
              }
            }
            else {
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
          
          if (vars.dev.value || key == "dev") {
            if (b == "value" || b == "key" || !b) {
              var text = "\."+key+"()"
            }
            else {
              var text = "\""+b+"\" of \."+key+"()"
            }
          }
          
          if (a.accepted && a.accepted.indexOf(c) < 0) {
            d3plus.console.warning(""+JSON.stringify(c)+" is not an accepted value for "+text+", please use one of the following: \""+a.accepted.join("\", \"")+"\"")
          }
          else if (!(a[b] instanceof Array) && a[b] == c || (a[b] && (a[b].key == c || a[b].value == c))) {
            if (vars.dev.value) d3plus.console.log(text+" was not updated because it did not change.")
          }
          else {
            if (b == "solo" || b == "mute") {
              
              a[b].value = update_array(a[b].value,c)
              a[b].changed = true
              var arr = a[b].value
                
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
                if (vars.depth.value < c.length) vars.id.key = c[vars.depth.value]
                else {
                  vars.id.key = c[0]
                  vars.depth.value = 0
                }
              }
              else {
                vars.id.key = c
                vars.id.nesting = [c]
                vars.depth.value = 0
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
              if (c >= vars.id.nesting.length) vars.depth.value = vars.id.nesting.length-1
              else if (c < 0) vars.depth.value = 0
              else vars.depth.value = c;
              vars.id.key = vars.id.nesting[vars.depth.value]
              
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
                  if (vars.dev.value) d3plus.console.log("Aggregation for \""+agg+"\" is already set to \""+c[agg]+"\"")
                }
                else {
                  a[b][agg] = c[agg]
                  a.changed = true
                }
              }
            }
            else {
              if (typeof a[b] == "object" && a[b] != null && (a[b].key !== undefined || a[b].value !== undefined)) {
                var k = a[b].key !== undefined ? "key" : "value";
                a = a[b]
                b = k
              }
              a.previous = a[b]
              a[b] = c
              a.changed = true
            }
            
            if ((vars.dev.value || key == "dev") && (a.changed || ["solo","mute"].indexOf(b) >= 0)) {
              if (typeof a[b] != "function" && JSON.stringify(a[b]).length < 260) {
                d3plus.console.log(text+" has been set to "+JSON.stringify(a[b])+".")
              }
              else {
                d3plus.console.log(text+" has been set.")
              }
            }
          }
          
        }
        
        if (vars.autodraw) {
          return vars.viz.draw()
        }
        else {
          return vars.viz
        }
        
      }
    })(p)
  })

  return vars.viz;
};
