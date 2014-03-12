d3plus.viz = function() {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Public Variables with Default Settings
  //-------------------------------------------------------------------

  var vars = {
    "back": function() {

      if (vars.history.states.length > 0) {

        var func = vars.history.states.pop()
        if (typeof func === "function") {
          func()
        }

      }

    },
    "connections": function(focus,objects) {

      var edges = vars.edges.restricted || vars.edges.value,
          targets = []

      if (!focus) {
        return edges
      }

      var connections = edges.filter(function(edge){

        var check = ["source","target"],
            match = false

        if (typeof edge.source != "object") {
          var obj = {}
          obj[vars.id.key] = edge.source
          edge.source = obj
        }

        if (typeof edge.target != "object") {
          var obj = {}
          obj[vars.id.key] = edge.target
          edge.target = obj
        }

        if (edge.source[vars.id.key] == focus) {
          match = true
          if (objects) {
            targets.push(edge.target)
          }
        }
        else if (edge.target[vars.id.key] == focus) {
          match = true
          if (objects) {
            targets.push(edge.source)
          }
        }

        return match

      })

      return objects ? targets : connections

    },
    "filtered": false,
    "footer_text": function() {

      var zoom = vars.zoom_direction()

      if (zoom === 1) {
        var text = vars.format("Click to Expand")
      }
      else if (zoom === -1) {
        var text = vars.format("Click to Collapse")
      }
      else if (vars.html.value || vars.tooltip.value.long) {
        var text = "Click for More Info"
      }
      else {
        var text = ""
      }

      return vars.format(text,"footer")
    },
    "format": function(value,key) {
      if (typeof value === "number") return vars.number_format.value(value,key,vars)
      if (typeof value === "string") return vars.text_format.value(value,key,vars)
      else return JSON.stringify(value)
    },
    "frozen": false,
    "g": {"apps":{}},
    "mute": [],
    "solo": [],
    "style": d3plus.styles.default,
    "zoom_behavior": d3.behavior.zoom().scaleExtent([1,8]),
    "zoom_direction": function() {

      var max_depth = vars.id.nesting.length-1,
          current_depth = vars.depth.value,
          restricted = d3plus.apps[vars.type.value].nesting === false

      if (restricted) {
        return 0
      }
      else if (current_depth < max_depth) {
        return 1
      }
      else if (current_depth == max_depth && (vars.small || !vars.html.value)) {
        return -1
      }

      return 0

    }
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Main drawing function
  //----------------------------------------------------------------------------
  vars.viz = function(selection) {
    selection.each(function() {

      vars.frozen = true
      d3plus.draw.container(vars)

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Reset all margins
      //------------------------------------------------------------------------
      vars.margin = {"top": 0, "right": 0, "bottom": 0, "left": 0}

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Determine if in "small" mode
      //------------------------------------------------------------------------
      var small_width = vars.width.value <= vars.width.small,
          small_height = vars.height.value <= vars.height.small
      vars.small = small_width || small_height

      if (vars.error.value) {
        vars.messages.style = "large"
        var message = vars.error.value === true ? "Error" : vars.error.value
        if (vars.dev.value) d3plus.console.warning(message)
        d3plus.ui.message(vars,message)
      }
      else {

        //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        // Run setup function if app has it
        //------------------------------------------------------------------------
        var steps = []
        if (d3plus.apps[vars.type.value].setup) {
          steps.push({
            "function": d3plus.apps[vars.type.value].setup,
            "message": "Running setup function for \""+vars.type.value+"\""
          })
        }

        steps = steps.concat([
          {"function": d3plus.draw.tooltips, "message": "Removing Tooltips"},
          {"function": d3plus.draw.enter, "message": "Creating DOM Elements"},
          {"function": d3plus.data.analyze, "message": "Analyzing Data"},
          {"function": d3plus.data.color, "message": "Analyzing Colors"},
          {"function": d3plus.ui.titles, "message": "Drawing Titles"},
          {"function": d3plus.ui.legend, "message": "Drawing Legend"},
          {"function": d3plus.ui.timeline, "message": "Drawing Timeline"},
          {"function": d3plus.ui.history, "message": "Checking History"},
          {"function": function(vars){
            vars.app_height -= (vars.margin.top+vars.margin.bottom);
          }, "message": "Calculating Visualization Height"},
          {"function": d3plus.ui.focus, "message": "Creating Side Tooltip"},
          {"function": d3plus.draw.update, "message": "Updating Elements"},
          {"function": d3plus.draw.errors, "message": "Checking for Errors"},
          {"function": d3plus.draw.app, "message": "Drawing Visualization"},
          {"function": d3plus.shape.edges, "message": "Drawing Edges"},
          {"function": d3plus.shape.draw, "message": "Drawing Shapes"},
          {"function": d3plus.draw.finish, "message": "Finishing"}
        ])

        var i = 0
        vars.parent.style("cursor","wait")
        vars.messages.style = vars.data.app ? "small" : "large"
        function run_steps() {

          var step = steps[i]

          if (vars.dev.value) d3plus.console.log(step.message)
          d3plus.ui.message(vars,step.message)

          setTimeout(function(){

            step.function(vars)

            if (i < steps.length-1) {
              i++
              run_steps()
            }
            else {
              vars.parent.style("cursor","auto")
            }

          },5)

        }
        run_steps()

      }

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

              if (typeof object[property] == "object" && object[property] !== null) {
                if (object[property].key !== undefined) var key_type = "key"
                else if (object[property].value !== undefined) var key_type = "value"
                else var key_type = null
              }
              else var key_type = null

              if (property == key_type) {
                set_value(object,key_type,depth)
              }
              else if (["key","value"].indexOf(property) >= 0) {
                set_value(object,property,depth)
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

          if ((b == "value" || b == "key") && a.accepted) {
            var accepted = a.accepted
          }
          else if (typeof a[b] == "object" && a[b] !== null && a[b].accepted) {
            var accepted = a[b].accepted
          }
          else {
            var accepted = false
          }

          if (accepted && accepted.indexOf(c) < 0) {
            d3plus.console.warning(""+JSON.stringify(c)+" is not an accepted value for "+text+", please use one of the following: \""+accepted.join("\", \"")+"\"")
          }
          else if (!(a[b] instanceof Array) && a[b] == c || (a[b] && (a[b].key === c || a[b].value === c))) {
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

        return vars.viz

      }
    })(p)
  })

  return vars.viz;
};
