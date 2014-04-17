d3plus.viz = function() {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Public Variables with Default Settings
  //-------------------------------------------------------------------

  var vars = {
    "connected": function(edge) {
      var focus = vars.focus.value
      if (focus) {
        var source = edge[vars.edges.source][vars.id.value],
            target = edge[vars.edges.target][vars.id.value]
        if (source == focus || target == focus) {
          return true
        }
      }
      return false
    },
    "connections": function(focus,objects) {

      if (!vars.edges.value) {
        return []
      }

      var edges = vars.edges.restricted || vars.edges.value,
          targets = []

      if (!focus) {
        return edges
      }

      var connections = edges.filter(function(edge){

        var match = false

        if (edge[vars.edges.source][vars.id.value] == focus) {
          match = true
          if (objects) {
            targets.push(edge[vars.edges.target])
          }
        }
        else if (edge[vars.edges.target][vars.id.value] == focus) {
          match = true
          if (objects) {
            targets.push(edge[vars.edges.source])
          }
        }

        return match

      })

      return objects ? targets : connections

    },
    "filtered": false,
    "fonts": {},
    "format": function(value,key) {

      if (typeof value === "number") {
        return vars.number_format.value(value,key,vars)
      }
      if (typeof value === "string") {
        return vars.text_format.value(value,key,vars)
      }
      else {
        return JSON.stringify(value)
      }

    },
    "frozen": false,
    "g": {"apps":{}},
    "init": false,
    "margin": {"top": 0, "right": 0, "bottom": 0, "left": 0},
    "mute": [],
    "solo": [],
    "style": d3plus.styles.default,
    "timing": d3plus.styles.default.timing.transitions,
    "touchEvent": function(){
      var zoomed = vars.zoom.scale > vars.zoom.behavior.scaleExtent()[0]
        , enabled = d3plus.visualization[vars.type.value].zoom
                  && vars.zoom.value && vars.zoom.scroll.value
        , zoomable = d3.event.touches.length > 1 && enabled
      if (!zoomable && !zoomed) {
        d3.event.stopPropagation()
      }
    },
    "update": true,
    "zoom_direction": function() {

      var max_depth = vars.id.nesting.length-1,
          current_depth = vars.depth.value,
          restricted = d3plus.visualization[vars.type.value].nesting === false

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

  function validate_fonts(obj) {
    for (key in obj) {
      if (obj[key] !== null && typeof obj[key] == "object" && !(obj[key] instanceof Array)) {

        if ("family" in obj[key]) {
          if (obj[key].family in vars.fonts) {
            obj[key].family = vars.fonts[obj[key].family]
          }
          else {
            var old = obj[key].family
            obj[key].family = d3plus.font.validate(obj[key].family)
            vars.fonts[old] = obj[key].family
          }
        }

        validate_fonts(obj[key])

      }
    }
  }
  validate_fonts(vars.style)

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Main drawing function
  //----------------------------------------------------------------------------
  vars.viz = function(selection) {
    selection.each(function() {

      vars.frozen = true
      vars.internal_error = null
      d3plus.draw.container(vars)

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

        var steps = d3plus.draw.steps(vars)

        vars.parent.style("cursor","wait")
        vars.messages.style = vars.data.app ? "small" : "large"
        function check_next() {

          if (steps.length) {
            run_steps()
          }
          else {
            if (vars.dev.value) d3plus.console.groupEnd()
            vars.parent.style("cursor","auto")
          }

        }

        function run_steps() {

          var step = steps.shift(),
              same = vars.g.message && vars.g.message.text() == step.message,
              run = "check" in step ? step.check(vars) : true

          if (run) {

            if (!same && vars.update && (!vars.timing || !vars.init)) {

              if (vars.dev.value) {
                d3plus.console.groupEnd()
                d3plus.console.group(step.message)
              }
              var message = typeof vars.messages.value == "string"
                          ? vars.messages.value : step.message

              d3plus.ui.message(vars,message)

              setTimeout(function(){

                if (step.function instanceof Array) {
                  step.function.forEach(function(f){
                    f(vars,check_next)
                  })
                }
                else if (typeof step.function == "function") {
                  step.function(vars,check_next)
                }

                if (!step.wait) {
                  check_next()
                }

              },10)

            }
            else {

              if (step.function instanceof Array) {
                step.function.forEach(function(f){
                  f(vars,check_next)
                })
              }
              else if (typeof step.function == "function") {
                step.function(vars,check_next)
              }

              if (!step.wait) {
                check_next()
              }

            }

          }
          else {

            if ("otherwise" in step) {
              step.otherwise(vars)
            }

            check_next()
          }

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

    title = d3plus.util.strip(title)

    if (!columns) {
      var columns = [vars.id.value]
      if (vars.time.value) columns.push(vars.time.value)
      if (vars.size.value) columns.push(vars.size.value)
      if (vars.text.value) columns.push(vars.text.value)
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
          if (property == "family") {
            if (depth in vars.fonts) {
              depth = vars.fonts[depth]
            }
            else {
              depth = d3plus.font.validate(depth)
            }
          }
          object[property] = depth;
        }
      }
    }

    if (typeof x == "object") {
      if ("font" in x) {
        var obj = d3plus.util.copy(x.font)
        obj = {"font": obj}
        function check_font(o,s) {
          for (s in o) {

            if (o[s] !== null && typeof o[s] == "object") {
              if ("font" in o[s]) {
                check_depth(o,s,obj)
              }
              check_font(o[s])
            }

          }
        }
        check_font(vars.style)
      }
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

  for (app in d3plus.visualization) {

    vars.viz[app] = d3plus.visualization[app]

  }

  Object.keys(d3plus.method).forEach(function(p){

    // give default values to this .viz()
    vars[p] = d3plus.util.copy(d3plus.method[p])

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
      return function(user,callback) {

        if (!arguments.length) return vars[key];

        if (vars[key].reset) {
          vars[key].reset.forEach(function(r){
            vars[r] = null
          })
        }

        if (callback) {
          vars[key].callback = callback
        }

        if ( ( typeof user == "object" && user !== null
                && !("value" in user) && !(Object.keys(user)[0] in vars[key]) )
             || typeof user != "object" || user === null) {
          set_value(vars[key],"value",user)
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

              if (property == "value") {
                set_value(object,property,depth)
              }
              else if (typeof object[property] == "object" && object[property] !== null && object[property].object === true) {
                set_value(object[property],"value",depth)
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

            if (a.accepted.indexOf(c) < 0) {
              for (app in d3plus.visualization) {
                if (d3plus.visualization[app].deprecates && d3plus.visualization[app].deprecates.indexOf(c) >= 0) {
                  d3plus.console.warning(JSON.stringify(c)+" has been deprecated by "+JSON.stringify(app)+", please update your code.")
                  c = app
                }
              }
            }

          }

          if (b == "value" || !b) {
            var text = "\."+key+"()"
          }
          else {
            var text = "\""+b+"\" of \."+key+"()"
          }

          if (b == "value" && a.accepted) {
            var accepted = a.accepted
          }
          else if (typeof a[b] == "object" && a[b] !== null && a[b].accepted) {
            var accepted = a[b].accepted
          }
          else {
            var accepted = false
          }

          var allowed = true
          if (accepted) {
            if (typeof accepted[0] == "string") {
              var allowed = accepted.indexOf(c) >= 0,
                  recs = accepted
            }
            else {
              var allowed = accepted.indexOf(c.constructor) >= 0
                , recs = []
              accepted.forEach(function(f){
                var n = f.toString().split("()")[0].substring(9)
                recs.push(n)
              })
            }
          }

          if (accepted && !allowed) {
            d3plus.console.warning(""+JSON.stringify(c)+" is not an accepted value for "+text+", please use one of the following: \""+recs.join("\", \"")+"\"")
          }
          else if (!(a[b] instanceof Array) && a[b] == c || (a[b] && (a[b].value === c || a[b].value === c))) {
            if (vars.dev.value) d3plus.console.log(text+" was not updated because it did not change.")
          }
          else {
            if (b == "solo" || b == "mute") {

              a[b].value = update_array(a[b].value,c)
              a[b].changed = true
              var arr = a[b].value

              if (["time","coords"].indexOf(key) < 0) {
                if (arr.length && vars[b].indexOf(key) < 0) {
                  vars[b].push(key)
                }
                else if (!arr.length && vars[b].indexOf(key) >= 0) {
                  vars[b].splice(vars[b].indexOf(key), 1)
                }
              }

            }
            else if (key == "id" && b == "value") {

              if (c instanceof Array) {
                vars.id.nesting = c
                if (vars.depth.value < c.length) vars.id.value = c[vars.depth.value]
                else {
                  vars.id.value = c[0]
                  vars.depth.value = 0
                }
              }
              else {
                vars.id.value = c
                vars.id.nesting = [c]
                vars.depth.value = 0
              }
              a.changed = true

            }
            else if (key == "text" && b == "value") {

              if (!vars.text.array) vars.text.array = {}
              if (typeof c == "string") {
                vars.text.array[vars.id.value] = [c]
              }
              else if (c instanceof Array) {
                vars.text.array[vars.id.value] = c
              }
              else {
                vars.text.array = c
                var n = c[vars.id.value] ? c[vars.id.value] : c[Object.keys(c)[0]]
                vars.text.array[vars.id.value] = typeof n == "string" ? [n] : n
              }
              vars.text.value = vars.text.array[vars.id.value][0]
              a.changed = true

            }
            else if (key == "depth") {
              // Set appropriate depth and id
              if (c >= vars.id.nesting.length) vars.depth.value = vars.id.nesting.length-1
              else if (c < 0) vars.depth.value = 0
              else vars.depth.value = c;
              vars.id.value = vars.id.nesting[vars.depth.value]

              if (vars.text.array) {

                // Set appropriate name_array and text
                var n = vars.text.array[vars.id.value]
                if (n) {
                  vars.text.array[vars.id.value] = typeof n == "string" ? [n] : n
                  vars.text.value = vars.text.array[vars.id.value][0]
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
              if (typeof a[b] == "object" && a[b] != null && a[b].value !== undefined) {
                a = a[b]
                b = "value"
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
