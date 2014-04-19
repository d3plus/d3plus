d3plus.viz = function() {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Public Variables with Default Settings
  //-------------------------------------------------------------------

  var vars = {
    "filtered": false,
    "fonts": {},
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
    "wiki": {
      "methods" : "Visualization-Methods",
      "types"   : "Visualization-Types"
    },
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
  vars.self = function(selection) {
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

    return vars.self;
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Expose Public Variables
  //-------------------------------------------------------------------

  vars.self.csv = function(x) {

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
      titles.push(vars.format.value(c))
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

  vars.self.draw = function() {

    if (!vars.container.value) {
      var str = vars.format.locale.value.warning.setContainer
      d3plus.console.warning(str)
    }
    else if (d3.select(vars.container.value).empty()) {
      var str = vars.format.locale.value.warning.noContainer
      d3plus.console.warning(d3plus.util.format(str,vars.container))
    }
    else {
      d3.select(vars.container.value).call(vars.self)
    }

    return vars.self;
  }

  vars.self.style = function(x) {
    if (!arguments.length) return vars.style;

    function check_depth(object,property,depth) {
      if (typeof depth == "object" && !(depth instanceof Array)) {
        for (d in depth) {
          if (object[property] === undefined) {
            var str = vars.format.locale.value.warning.noSet
            d3plus.console.warning(d3plus.util.format(str,property));
          }
          else {
            check_depth(object[property],d,depth[d]);
          }
        }
      }
      else {
        if (object[property] === undefined) {
          var str = vars.format.locale.value.warning.noSet
          d3plus.console.warning(d3plus.util.format(str,property));
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

    return vars.self;
  };

  d3plus.method( vars )

  return vars.self;
};
