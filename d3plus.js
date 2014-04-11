(function(){

var d3plus = window.d3plus || {};
window.d3plus = d3plus;

d3plus.version = "1.2.3 - Royal";

d3plus.ie = /*@cc_on!@*/false;

d3plus.rtl = d3.select("html").attr("dir") == "rtl"

d3plus.prefix = function() {

  if ("-webkit-transform" in document.body.style) {
    var val = "-webkit-"
  }
  else if ("-moz-transform" in document.body.style) {
    var val = "-moz-"
  }
  else if ("-ms-transform" in document.body.style) {
    var val = "-ms-"
  }
  else if ("-o-transform" in document.body.style) {
    var val = "-o-"
  }
  else {
    var val = ""
  }

  d3plus.prefix = function(){
    return val
  }

  return val;

}

d3plus.scrollbar = function() {

  var inner = document.createElement("p");
  inner.style.width = "100%";
  inner.style.height = "200px";

  var outer = document.createElement("div");
  outer.style.position = "absolute";
  outer.style.top = "0px";
  outer.style.left = "0px";
  outer.style.visibility = "hidden";
  outer.style.width = "200px";
  outer.style.height = "150px";
  outer.style.overflow = "hidden";
  outer.appendChild(inner);

  document.body.appendChild(outer);
  var w1 = inner.offsetWidth;
  outer.style.overflow = "scroll";
  var w2 = inner.offsetWidth;
  if (w1 == w2) w2 = outer.clientWidth;

  document.body.removeChild(outer);

  var val = (w1 - w2)

  d3plus.scrollbar = function(){
    return val
  }

  return val;

}

d3.select(window).on("load.d3plus_scrollbar",function(){
  d3plus.prefix()
  d3plus.scrollbar()
})

d3plus.evt = {}; // stores all mouse events that could occur

// Modernizr touch events
d3plus.touch = window.Modernizr && Modernizr.touch
if (d3plus.touch) {
  d3plus.evt.click = "click"
  d3plus.evt.down = "touchstart"
  d3plus.evt.up = "touchend"
  d3plus.evt.over = "touchstart"
  d3plus.evt.out = "touchend"
  d3plus.evt.move = "touchmove"
} else {
  d3plus.evt.click = "click"
  d3plus.evt.down = "mousedown"
  d3plus.evt.up = "mouseup"
  if (d3plus.ie) {
    d3plus.evt.over = "mouseenter"
    d3plus.evt.out = "mouseleave"
  }
  else {
    d3plus.evt.over = "mouseover"
    d3plus.evt.out = "mouseout"
  }
  d3plus.evt.move = "mousemove"
}

d3plus.apps = {};
d3plus.color = {};
d3plus.data = {};
d3plus.draw = {};
d3plus.font = {};
d3plus.forms = {};
d3plus.ui = {};
d3plus.shape = {};
d3plus.styles = {};
d3plus.tooltip = {};
d3plus.util = {};
d3plus.variable = {};
d3plus.zoom = {};

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Custom styling and behavior for browser console statements.
//------------------------------------------------------------------------------
d3plus.console = {};

d3plus.console.print = function(type,message,style) {
  if (d3plus.ie) console.log("[d3plus] "+message)
  else console[type]("%c[d3plus]%c "+message,"font-weight:bold;",style)
}
d3plus.console.log = function(message,style) {
  if (!style) var style = "font-weight:bold;"
  d3plus.console.print("log",message,style)
}
d3plus.console.group = function(message,style) {
  if (!style) var style = "font-weight:bold;"
  d3plus.console.print("group",message,style)
}
d3plus.console.warning = function(message,style) {
  if (!style) var style = "font-weight:bold;color:red;"
  message = "WARNING: "+message
  d3plus.console.print("log",message,style)
}
d3plus.console.groupEnd = function() {
  if (!d3plus.ie) console.groupEnd()
}
d3plus.console.time = function(message) {
  if (!d3plus.ie) console.time(message)
}
d3plus.console.timeEnd = function(message) {
  if (!d3plus.ie) console.timeEnd(message)
}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Form Element shell
//------------------------------------------------------------------------------
d3plus.forms = function(passed) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Create global ui variable object
  //----------------------------------------------------------------------------
  var vars = {
    "before": null,
    "callback": false,
    "data": [],
    "dev": false,
    "enabled": false,
    "filter": "",
    "flipped": false,
    "format": d3plus.public.text_format.value,
    "highlight": false,
    "hover": false,
    "id": "default",
    "init": false,
    "large": 200,
    "max-height": 600,
    "max-width": 600,
    "parent": d3.select("body"),
    "previous": false,
    "propagation": true,
    "selected": false,
    "text": "text",
    "timing": 200,
    "update": true
  }

  var styles = {
    "align": "left",
    "border": "all",
    "color": "#ffffff",
    "corners": 0,
    "display": "inline-block",
    "drop": {},
    "font-family": "'Helvetica Neue', 'HelveticaNeue', 'Helvetica', 'Arial', 'sans-serif'",
    "font-size": 12,
    "font-spacing": 0,
    "font-weight": 200,
    "height": false,
    "margin": 0,
    "padding": 4,
    "secondary": d3plus.color.darker("#ffffff",0.05),
    "shadow": 5,
    "stroke": 1,
    "width": false
  }

  styles["font-align"] = d3plus.rtl ? "right" : "left"

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Set default icon based on whether or not font-awesome is present
  //----------------------------------------------------------------------------
  styles.icon = d3plus.font.awesome ? "fa-angle-down" : "&#x27A4;"

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Overwrite vars if vars have been passed
  //----------------------------------------------------------------------------
  if (passed) {
    styles = d3plus.util.merge(styles,passed)
  }
  vars.forms = function(selection,timing) {

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Set timing to 0 if it's the first time running this function or if the
    // data length is longer than the "large" limit
    //--------------------------------------------------------------------------
    var large = vars.data.array instanceof Array && vars.data.array.length > vars.large
    var timing = !vars.init || large || d3plus.ie ? 0 : vars.timing

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // If it data is an array, format it
    //--------------------------------------------------------------------------
    if (vars.data instanceof Array && typeof vars.data.select != "function") {
      vars.data = {
        "array": vars.data
      }
    }
    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // If it data is an object, format it
    //--------------------------------------------------------------------------
    else if (typeof vars.data == "object" && !vars.data.array && !(vars.data instanceof Array)) {

      if (!vars.data.array) {
        vars.data.array = []
      }

      if (vars.element) {
        d3plus.forms.element(vars)
      }

      d3plus.forms.data(vars)

      var focus = vars.data.array.filter(function(d){
        return d.value == vars.focus
      })[0]

      if (!focus) {
        vars.data.array[0].selected = true
        vars.focus = vars.data.array[0].value
      }

      vars.data.changed

    }
    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // If it data is not an object, extract data from the element associated with it
    //--------------------------------------------------------------------------
    else if (vars.data && !vars.data.array) {

      if (typeof vars.data == "string" && !d3.select(vars.data).empty()) {
        vars.element = d3.selectAll(vars.data)
        if (vars.data.charAt(0) == "#") {
          vars.before = vars.data
        }
      }
      else if (d3plus.util.d3selection(vars.data)) {
        vars.element = vars.data
        if (vars.data.node().id) {
          vars.before = "#"+vars.data.node().id
        }
      }

      vars.data = {
        "array": []
      }

    }

    if (vars.data.array.length == 0 && vars.element) {

      vars.parent = d3.select(vars.element.node().parentNode)
      d3plus.forms.element(vars)

    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // If there is no data, throw error message
    //--------------------------------------------------------------------------
    if (typeof vars.data.array == "string") {
      d3plus.console.warning("Cannot create UI element for \""+vars.data.array+"\", no data found.")
    }
    else if (!(vars.data.array instanceof Array)) {
      d3plus.console.warning("Cannot create UI element, no data found.")
    }
    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Else, create/update the UI element
    //--------------------------------------------------------------------------
    else {

      if (!vars.focus) {
        vars.data.array[0].selected = true
        vars.focus = vars.data.array[0].value
        if (vars.dev) d3plus.console.log("\"value\" set to \""+vars.focus+"\"")
      }

      if (vars.data.array.length > 10 && !("search" in vars)) {
        vars.search = true
        if (vars.dev) d3plus.console.log("search enabled")
      }

      if (vars.element) {

        vars.element
          .style("position","absolute")
          .style("overflow","hidden")
          .style("clip","rect(0 0 0 0)")
          .style("width","1px")
          .style("height","1px")
          .style("margin","-1px")
          .style("padding","0")
          .style("border","0")

        if (vars.data.changed && vars.type == "drop") {

          options = vars.element.selectAll("option")
            .data(vars.data.array,function(d){
              return d ? d.value : false
            })

          options.enter().append("option")
            .each(function(d){

              for (k in d) {
                if (["alt","value","text","selected"].indexOf(k) >= 0) {
                  d3.select(this).attr(k,d[k])
                }
                else {
                  d3.select(this).attr("data-"+k,d[k])
                }
              }

              if (d.value == vars.focus) {
                this.selected = true
              }
              else {
                this.selected = false
              }

            })

          options.exit().remove()

        }

      }

      if (!vars.init) {

        //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        // Select container DIV for UI element
        //----------------------------------------------------------------------
        vars.container = vars.parent.selectAll("div#d3plus_"+vars.type+"_"+vars.id)
          .data(["container"])

        //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        // Create container DIV for UI element
        //----------------------------------------------------------------------
        vars.container.enter()
          .insert("div",vars.before)
          .attr("id","d3plus_"+vars.type+"_"+vars.id)
          .style("display",styles.display)
          .style("position","relative")
          .style("overflow","visible")
          .style("vertical-align","top")

        vars.tester = d3plus.font.tester()

      }

      if (timing) {

        vars.container.transition().duration(timing)
          .each("start",function(){
            if (vars.type == "drop" && vars.enabled) {
              d3.select(this).style("z-index",9999)
            }
          })
          .style("margin",styles.margin+"px")
          .each("end",function(){
            if (vars.type == "drop" && !vars.enabled) {
              d3.select(this).style("z-index","auto")
            }
          })

      }
      else {

        vars.container
          .style("margin",styles.margin+"px")
          .style("z-index",function(){
            if (vars.type == "drop" && vars.enabled) {
              return 9999
            }
            else {
              return "auto"
            }
          })

      }

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Call specific UI element type
      //------------------------------------------------------------------------
      if (vars.dev) d3plus.console.group("drawing \""+vars.type+"\"")
      d3plus.forms[vars.type](vars,styles,timing)
      if (vars.dev) d3plus.console.groupEnd()

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Initialization complete
      //------------------------------------------------------------------------
      vars.init = true
      vars.update = true
      vars.data.changed = false

    }

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // List of simple set/retrieve methods
  //----------------------------------------------------------------------------
  var variables = [
    "callback",
    "data",
    "dev",
    "element",
    "highlight",
    "hover",
    "hover_previous",
    "id",
    "large",
    "parent",
    "previous",
    "propagation",
    "search",
    "selected",
    "timing",
    "text",
    "type",
    "update"
  ]

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Create simple set/retrieve methods
  //----------------------------------------------------------------------------
  variables.forEach(function(v){

    vars.forms[v] = (function(key) {

      return function(value) {

        if (vars.dev) {

          var text = value === undefined ? "" : value.toString()
          if (text.length > 50 || value === undefined) {
            var text = ""
          }
          else {
            var text = " to \""+text+"\""
          }

        }

        if (key == "hover") {
          vars.hover_previous = vars.hover
        }

        if (!arguments.length) return vars[key]

        if (["element","parent"].indexOf(key) >= 0) {
          if (typeof value == "string" && !d3.select(value).empty()) {
            if (vars.dev) d3plus.console.log("\""+key+"\" set"+text)
            vars[key] = d3.selectAll(value)
          }
          else if (d3plus.util.d3selection(value)) {
            if (vars.dev) d3plus.console.log("\""+key+"\" set"+text)
            vars[key] = value
          }
          else {
            d3plus.console.warning("Cannot set \""+key+"\" as \""+value.toString()+"\"")
          }

          if (vars[key] && key == "element") {
            if (vars[key].node().id) {
              vars.before = "#"+vars[key].node().id
            }
            vars.parent = d3.select(vars[key].node().parentNode)
          }

        }
        else {
          if (vars.dev) d3plus.console.log("\""+key+"\" set"+text)
          vars[key] = value
        }

        return vars.forms

      }

    })(v)

  })

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // List of simple style methods
  //----------------------------------------------------------------------------
  var style_variables = [
    "align",
    "icon",
    "border",
    "color",
    "corners",
    "display",
    "font",
    "margin",
    "padding",
    "shadows"
  ]

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Create simple style methods
  //----------------------------------------------------------------------------
  style_variables.forEach(function(v){

    vars.forms[v] = (function(key) {

      return function(value) {

        if (!arguments.length) {
          if (key == "font") return styles
          return styles[key]
        }

        if (vars.dev) {

          var text = value.toString()
          if (text.length > 50) {
            var text = ""
          }
          else {
            var text = " to \""+text+"\""
          }

        }

        if (key == "font") {

          function set_font(obj,thing) {

            if (typeof thing == "string") {
              if (vars.dev) d3plus.console.log("\"font-family\" set"+text)
              obj["font-family"] = thing
            }
            if (typeof thing == "number") {
              if (vars.dev) d3plus.console.log("\"font-size\" set"+text)
              obj["font-size"] = thing
            }
            else if (typeof thing == "object") {
              for (style in thing) {

                if (style == "drop") {
                  set_font(obj.drop,thing[style])
                }
                else {

                  if (style == "align" && d3plus.rtl) {
                    if (thing[style] == "left") {
                      thing[style] = "right"
                    }
                    else if (thing[style] == "right") {
                      thing[style] = "left"
                    }
                  }
                  if (vars.dev) {

                    var text = thing[style].toString()
                    if (text.length > 50) {
                      var text = ""
                    }
                    else {
                      var text = " to \""+text+"\""
                    }

                    d3plus.console.log("\"font-"+style+"\" set"+text)
                  }
                  obj["font-"+style] = thing[style]

                }
              }
            }

          }

          set_font(styles,value)

        }
        else {
          if (key == "color" && styles.secondary == d3plus.color.darker(styles.color,0.05)) {
            styles.secondary = d3plus.color.darker(value,0.05)
          }
          if (vars.dev) d3plus.console.log("\""+key+"\" set"+text)
          styles[key] = value
        }

        return vars.forms

      }

    })(v)

  })

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Disables the UI element
  //----------------------------------------------------------------------------
  vars.forms.disable = function() {
    if (vars.dev) d3plus.console.log("disable")
    vars.enabled = false
    if (vars.init) {
      vars.parent.call(vars.forms)
    }
    return vars.forms
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Enables the UI element
  //----------------------------------------------------------------------------
  vars.forms.enable = function() {
    if (vars.dev) d3plus.console.log("enable")
    vars.enabled = true

    if (vars.data.fetch && (!vars.data.loaded || vars.data.continuous)) {
      d3plus.forms.json(vars)
    }

    if (vars.init) {
      vars.parent.call(vars.forms)
    }
    return vars.forms
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Draws the UI element
  //----------------------------------------------------------------------------
  vars.forms.draw = function(timing) {
    vars.parent.call(vars.forms,timing)
    return vars.forms
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Returns UI element's current height
  //----------------------------------------------------------------------------
  vars.forms.height = function(value) {

    if (!arguments.length) return vars.container[0][0].offsetHeight

    if (vars.dev) d3plus.console.log("\"height\" set to \""+value+"\"")
    styles.height = value

    return vars.forms
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Destroys UI element
  //----------------------------------------------------------------------------
  vars.forms.remove = function(x) {
    vars.container.remove()
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Selects something inside of the container
  //----------------------------------------------------------------------------
  vars.forms.select = function(selection) {
    return vars.container.select(selection)
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Sets value of the UI element
  //----------------------------------------------------------------------------
  vars.forms.value = function(value) {

    if (!arguments.length) return vars.focus

    if (typeof value == "string") {
      value = vars.data.array.filter(function(d){
        return d.value == value
      })[0]
    }

    if (value.value != vars.focus) {

      if (vars.tag == "select") {

        vars.element.selectAll("option").each(function(d,i){
          if (this.value == value.value) {
            vars.element.node().selectedIndex = i
          }
        })

      }
      else if (vars.tag == "input" && vars.element.attr("type") == "radio") {
        vars.element
          .each(function(){
            if (this.value == value.value) {
              this.checked = true
            }
            else {
              this.checked = false
            }
          })
      }

      if (vars.callback) {
        vars.callback(value.value)
      }

      if (vars.dev) d3plus.console.log("\"value\" set to \""+value.value+"\"")

      vars.previous = vars.focus
      vars.focus = value.value

    }

    vars.enabled = false
    vars.highlight = false

    if (vars.init) {
      vars.parent.call(vars.forms)
    }

    return vars.forms
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Toggles the UI element menu open/close
  //----------------------------------------------------------------------------
  vars.forms.toggle = function() {

    if (vars.dev) d3plus.console.log("toggle")
    vars.update = false

    if (vars.enabled) {
      vars.forms.disable()
    }
    else {
      vars.forms.enable()
    }

    return vars.forms

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Returns UI element's current width
  //----------------------------------------------------------------------------
  vars.forms.width = function(value) {
    if (!arguments.length) {
      var vals = []
      vars.container.selectAll("div.d3plus_node").each(function(o){
        vals.push(this.offsetWidth)
      })
      if (vals.length > 1) {
        return vals.sort()
      }
      else if (vals.length == 1) {
        return vals[0]
      }
      else {
        return vars.container.node().offsetWidth
      }
    }
    if (vars.dev) d3plus.console.log("\"width\" set to \""+value+"\"")
    styles.width = value
    return vars.forms
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Finally, return the main UI function to the user
  //----------------------------------------------------------------------------
  return vars.forms

}

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
    "connected": function(edge) {
      var focus = vars.focus.value
      if (focus) {
        var source = edge[vars.edges.source][vars.id.key],
            target = edge[vars.edges.target][vars.id.key]
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

        if (edge[vars.edges.source][vars.id.key] == focus) {
          match = true
          if (objects) {
            targets.push(edge[vars.edges.target])
          }
        }
        else if (edge[vars.edges.target][vars.id.key] == focus) {
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
      if (typeof value === "number") return vars.number_format.value(value,key,vars)
      if (typeof value === "string") return vars.text_format.value(value,key,vars)
      else return JSON.stringify(value)
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
      var zoomed = vars.zoom.scale > vars.zoom_behavior.scaleExtent()[0]
        , enabled = d3plus.apps[vars.type.value].zoom
                  && vars.zoom.value && vars.zoom.scroll.value
        , zoomable = d3.event.touches.length > 1 && enabled
      if (!zoomable && !zoomed) {
        d3.event.stopPropagation()
      }
    },
    "update": true,
    "zoom_behavior": d3.behavior.zoom().scaleExtent([1,1]),
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

            if (!same && vars.update) {

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

  Object.keys(d3plus.public).forEach(function(p){

    // give default values to this .viz()
    vars[p] = d3plus.util.copy(d3plus.public[p])

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

        // determine default key type, if available
        if (vars[key].key !== undefined) var key_type = "key"
        else if (vars[key].value !== undefined) var key_type = "value"
        else var key_type = null

        if ((typeof user == "object" && user !== null && key_type && !user[key_type] && !(Object.keys(user)[0] in vars[key]))
              || typeof user != "object" || user === null) {
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

          if (b == "value" || b == "key" || !b) {
            var text = "\."+key+"()"
          }
          else {
            var text = "\""+b+"\" of \."+key+"()"
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
          else if (!(a[b] instanceof Array) && a[b] == c || (a[b] && (a[b].key === c || a[b].value === c))) {
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

d3plus.public = {}

d3plus.public.active = {
  "key": null,
  "mute": {
    "value": []
  },
  "solo": {
    "value": []
  },
  "spotlight": {
    "accepted": [Boolean],
    "value": false,
    "deprecates": ["spotlight"]
  }
}

d3plus.public.aggs = {
  "deprecated": ["nesting_aggs"],
  "value": {}
}

d3plus.public.axes = {
  "mirror": {
    "accepted": [Boolean],
    "deprecates": ["mirror_axis","mirror_axes"],
    "value": false
  },
  "values": ["x","y"]
}

d3plus.public.attrs = {
  "value": {}
}

d3plus.public.color = {
  "deprecates": ["color_var"],
  "key": null,
  "mute": {
    "value": []
  },
  "solo": {
    "value": []
  }
}

d3plus.public.container = {
  "value": null
}

d3plus.public.coords = {
  "center": [0,0],
  "fit": {
    "accepted": ["auto","height","width"],
    "value": "auto"
  },
  "mute": {
    "value": []
  },
  "padding": 20,
  "projection": {
    "accepted": ["mercator","equirectangular"],
    "value": "mercator"
  },
  "solo": {
    "value": []
  },
  "threshold": 0.1,
  "value": null
}

d3plus.public.data = {
  "large": 400,
  "value": []
}

d3plus.public.depth = {
  "value": 0
}

d3plus.public.descs = {
  "value": {}
}

d3plus.public.dev = {
  "accepted": [Boolean],
  "value": false
}

d3plus.public.edges = {
  "arrows": {
    "accepted": [Boolean],
    "direction": {
      "accepted": ["source","target"],
      "value": "target"
    },
    "value": false
  },
  "deprecates": ["edges"],
  "label": false,
  "large": 100,
  "limit": false,
  "size": false,
  "source": "source",
  "target": "target",
  "value": null
}

d3plus.public.error = {
  "value": false
}

d3plus.public.focus = {
  "deprecates": ["highlight"],
  "tooltip": {
    "accepted": [Boolean],
    "value": true
  },
  "value": null
}

d3plus.public.footer = {
  "link": null,
  "value": false
}

d3plus.public.height = {
  "small": 300,
  "value": null
}

d3plus.public.history = {
  "accepted": [Boolean],
  "states": [],
  "value": true
}

d3plus.public.html = {
  "deprecates": ["click_function"],
  "value": null
}

d3plus.public.icon = {
  "deprecates": ["icon_var"],
  "key": "icon",
  "style": {
    "deprecates": ["icon_style"],
    "object": true,
    "value": "default"
  }
}

d3plus.public.id = {
  "data_filter": true,
  "deprecates": ["id_var","nesting"],
  "key": "id",
  "mute": {
    "value": [],
    "deprecates": ["filter"]
  },
  "nesting": ["id"],
  "solo": {
    "value": [],
    "deprecates": ["solo"]
  }
}

d3plus.public.labels = {
  "accepted": [Boolean],
  "resize": {
    "accepted": [Boolean],
    "value": true
  },
  "value": true
}

d3plus.public.legend = {
  "accepted": [Boolean],
  "label": null,
  "order": {
    "accepted": ["alpha","color"],
    "sort": {
      "accepted": ["asc","desc"],
      "value": "asc"
    },
    "value": "color"
  },
  "value": true
}

d3plus.public.messages = {
  "accepted": [Boolean,String],
  "value": true
}

d3plus.public.nodes = {
  "value": null
}

d3plus.public.number_format = {
  "value": function(number,key,vars) {

    var time = vars && vars.time.key ? [vars.time.key] : ["year","date"]

    if (key && time.indexOf(key.toLowerCase()) >= 0) {
      return number
    }
    else if (number < 10 && number > -10) {
      return d3.round(number,2)
    }
    else if (number.toString().split(".")[0].length > 4) {
      var symbol = d3.formatPrefix(number).symbol
      symbol = symbol.replace("G", "B") // d3 uses G for giga

      // Format number to precision level using proper scale
      number = d3.formatPrefix(number).scale(number)
      number = parseFloat(d3.format(".3g")(number))
      return number + symbol;
    }
    else if (key == "share") {
      return d3.format(".2f")(number)
    }
    else {
      return d3.format(",f")(number)
    }

  }
}

d3plus.public.order = {
  "key": null,
  "sort": {
    "accepted": ["asc","desc"],
    "value": "asc",
    "deprecates": ["sort"]
  }
}

d3plus.public.shape = {
  "accepted": ["circle","donut","line","square","area","coordinates"],
  "interpolate": {
    "accepted": ["linear","step","step-before","step-after","basis","basis-open","cardinal","cardinal-open","monotone"],
    "value": "linear",
    "deprecates": ["stack_type"]
  },
  "value": null
}

d3plus.public.size = {
  "data_filter": true,
  "deprecates": ["value"],
  "key": null,
  "mute": {
    "value": []
  },
  "scale": {
    "accepted": ["sqrt","linear","log"],
    "deprecates": ["size_scale"],
    "value": "sqrt"
  },
  "solo": {
    "value": []
  },
  "threshold": true
}

d3plus.public.temp = {
  "deprecates": ["else_var","else"],
  "key": null,
  "mute": {
    "value": []
  },
  "solo": {
    "value": []
  }
}

d3plus.public.text = {
  "deprecates": ["name_array","text_var"],
  "key": null,
  "mute": {
    "value": []
  },
  "solo": {
    "value": []
  }
}

d3plus.public.text_format = {
  "value": function(text,key,vars) {
    if (!text) return "";
    var smalls = ["a","and","of","to"]
    return text.replace(/\w\S*/g, function(txt,i){
      if (smalls.indexOf(txt) >= 0 && i != 0) return txt
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }
}

d3plus.public.time = {
  "data_filter": true,
  "deprecates": ["year","year_var"],
  "fixed": {
    "accepted": [Boolean],
    "value": true,
    "deprecates": ["static_axis","static_axes"]
  },
  "key": null,
  "mute": {
    "value": []
  },
  "solo": {
    "value": []
  }
}

d3plus.public.timeline = {
  "accepted": [Boolean],
  "handles": {
    "accepted": [Boolean],
    "value": true
  },
  "label": null,
  "value": true
}

d3plus.public.title = {
  "link": null,
  "sub": {
    "link": null,
    "value": null,
    "deprecates": ["sub_title"]
  },
  "total": {
    "link": null,
    "value": false,
    "deprecates": ["total_bar"],
    "object": true
  },
  "value": null
}

d3plus.public.tooltip = {
  "deprecates": ["tooltip_info"],
  "object": true,
  "value": []
}

d3plus.public.total = {
  "deprecates": ["total_var"],
  "key": null,
  "mute": {
    "value": []
  },
  "solo": {
    "value": []
  }
}

d3plus.public.type = {
  "mode": {
    "accepted": ["squarify","slice","dice","slice-dice"],
    "value": "squarify"
  },
  "value": "tree_map"
}

d3plus.public.width = {
  "small": 400,
  "value": null
}

d3plus.public.x = {
  "data_filter": true,
  "deprecates": ["xaxis","xaxis_val","xaxis_var"],
  "domain": null,
  "key": null,
  "lines": [],
  "mute": {
    "value": []
  },
  "reset": ["x_range"],
  "scale": {
    "accepted": ["linear","log","continuous","share"],
    "value": "linear",
    "deprecates": ["layout","unique_axis","xaxis_scale"]
  },
  "solo": {
    "value": []
  },
  "stacked": {
    "accepted": [Boolean],
    "value": false
  },
  "zerofill": {
    "accepted": [Boolean],
    "value": false
  }
}

d3plus.public.y = {
  "data_filter": true,
  "deprecates": ["yaxis","yaxis_val","yaxis_var"],
  "domain": null,
  "key": null,
  "lines": [],
  "mute": {
    "value": []
  },
  "reset": ["y_range"],
  "scale": {
    "accepted": ["linear","log","continuous","share"],
    "value": "linear",
    "deprecates": ["layout","unique_axis","yaxis_scale"]
  },
  "solo": {
    "value": []
  },
  "stacked": {
    "accepted": [Boolean],
    "value": false
  },
  "zerofill": {
    "accepted": [Boolean],
    "value": false
  }
}

d3plus.public.zoom = {
  "accepted": [Boolean],
  "click": {
    "accepted": [Boolean],
    "value": true
  },
  "pan": {
    "accepted": [Boolean],
    "value": true
  },
  "scroll": {
    "accepted": [Boolean],
    "value": true,
    "deprecates": ["scroll_zoom"]
  },
  "value": true
}


})();

d3plus.apps.bubbles = {}
d3plus.apps.bubbles.fill = true;
d3plus.apps.bubbles.requirements = ["data"];
d3plus.apps.bubbles.tooltip = "static"
d3plus.apps.bubbles.shapes = ["circle","donut"];
d3plus.apps.bubbles.scale = 1.05

d3plus.apps.bubbles.draw = function(vars) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Test for labels
  //-------------------------------------------------------------------
  var label_height = vars.labels.value && !vars.small ? 50 : 0

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Sort Data
  //-------------------------------------------------------------------
  var order = vars.order.key || vars.size.key
  vars.data.app.sort(function(a,b){
    var a_value = d3plus.variable.value(vars,a,order)
    var b_value = d3plus.variable.value(vars,b,order)
    return vars.order.sort.value == "asc" ? a_value-b_value : b_value-a_value
  })

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Calculate rows and columns
  //-------------------------------------------------------------------
  if(vars.data.app.length == 1) {
    var columns = 1,
        rows = 1;
  }
  else if (vars.data.app.length < 4) {
    var columns = vars.data.app.length,
        rows = 1;
  }
  else {
    var rows = Math.ceil(Math.sqrt(vars.data.app.length/(vars.app_width/vars.app_height))),
        columns = Math.ceil(Math.sqrt(vars.data.app.length*(vars.app_width/vars.app_height)));
  }

  if (vars.data.app.length > 0) {
    while ((rows-1)*columns >= vars.data.app.length) rows--
  }

  var column_width = vars.app_width/columns,
      column_height = vars.app_height/rows

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Define size scale
  //-------------------------------------------------------------------
  if (!vars.data.app) vars.data.app = []

  var domain_min = d3.min(vars.data.app, function(d){
    if (!vars.size.key) return 0
    return d3plus.variable.value(vars,d,vars.size.key,null,"min")
  })

  var domain_max = d3.max(vars.data.app, function(d){
    if (!vars.size.key) return 0
    return d3plus.variable.value(vars,d,vars.size.key)
  })

  var padding = 5

  var size_min = 20
  var size_max = (d3.min([column_width,column_height])/2)-(padding*2)
  size_max -= label_height

  var size = d3.scale[vars.size.scale.value]()
    .domain([domain_min,domain_max])
    .range([size_min,size_max])

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Calculate bubble packing
  //-------------------------------------------------------------------
  var pack = d3.layout.pack()
    .size([column_width-padding*2,column_height-padding*2-label_height])
    .value(function(d) {
      if (!vars.size.key) return 0
      return d3plus.variable.value(vars,d,vars.size.key)
    })
    .padding(padding)
    .radius(function(d){
      return size(d)
    })

  var data = []

  var row = 0
  vars.data.app.forEach(function(d,i){

    var temp = pack.nodes(d)

    var xoffset = (column_width*i) % vars.app_width,
        yoffset = column_height*row

    temp.forEach(function(t){
      if (!t.d3plus) t.d3plus = {}
      if (!t.d3plus.depth) t.d3plus.depth = t.depth
      t.xoffset = xoffset
      t.yoffset = yoffset+label_height
      if (t.depth < vars.depth.value) {
        t.d3plus.static = true
      }
      else {
        t.d3plus.static = false
      }
      if (temp.length == 1) {
        t.d3plus.label = false
      }
      else {
        t.d3plus.label = true
      }
    })

    data = data.concat(temp)

    if ((i+1) % columns == 0) {
      row++
    }

  })

  var downscale = size_max/d3.max(data,function(d){ return d.r })

  data.forEach(function(d){
    d.x = ((d.x-column_width/2)*downscale)+column_width/2
    d.d3plus.x = d.x+d.xoffset
    d.y = ((d.y-column_height/2)*downscale)+column_height/2
    d.d3plus.y = d.y+d.yoffset
    d.r = d.r*downscale
    d.d3plus.r = d.r
  })

  data.sort(function(a,b){
    return a.depth-b.depth
  })

  var label_data = data.filter(function(d){
    return d.depth == 0
  })

  var labels = vars.group.selectAll("text.d3plus_bubble_label")
    .data(label_data,function(d){
      if (!d.d3plus.label_height) d.d3plus.label_height = 0
      return d[vars.id.nesting[d.depth]]
    })

  function label_style(l) {
    l
      .attr("x",function(d){
        return d.d3plus.x
      })
      .attr("y",function(d){
        return d.d3plus.y-d.r-d.d3plus.label_height-padding
      })
      .attr("text-anchor","middle")
      .attr("font-weight",vars.style.font.weight)
      .attr("font-family",vars.style.font.family)
      .attr("font-size","12px")
      .style("fill",function(d){
        var color = d3plus.variable.color(vars,d)
        return d3plus.color.legible(color)
      })
      .each(function(d){
        if (d.r > 10 && label_height > 10) {
          var names = d3plus.variable.text(vars,d,d.depth)
          d3plus.util.wordwrap({
            "text": names,
            "parent": this,
            "width": column_width-padding*2,
            "height": label_height
          })
        }
      })
      .attr("y",function(d){
        d.d3plus.label_height = d3.select(this).node().getBBox().height
        return d.d3plus.y-d.r-d.d3plus.label_height-padding
      })
      .selectAll("tspan")
        .attr("x",function(d){
          return d.d3plus.x
        })
  }

  labels.enter().append("text")
    .attr("class","d3plus_bubble_label")
    .call(label_style)
    .attr("opacity",0)

  labels.transition().duration(vars.style.timing.transitions)
    .call(label_style)
    .attr("opacity",1)

  labels.exit()
    .attr("opacity",0)
    .remove()

  return data

};

d3plus.apps.chart = {}
d3plus.apps.chart.fill = true;
d3plus.apps.chart.requirements = ["data","x","y"];
d3plus.apps.chart.tooltip = "static";
d3plus.apps.chart.shapes = ["circle","donut","line","square","area"];
d3plus.apps.chart.scale = {
    "circle": 1.1,
    "donut": 1.1,
    "square": 1.1
  };

d3plus.apps.chart.draw = function(vars) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Calculate size and position of graph
  //-------------------------------------------------------------------
  if (vars.small) {
    var graph = {"margin": {"top": 0, "right": 0, "bottom": 0, "left": 0}}
  }
  else {
    var graph = {"margin": {"top": 10, "right": 10, "bottom": 40, "left": 40}}
  }
  graph.width = vars.app_width-graph.margin.left-graph.margin.right
  graph.height = vars.app_height-graph.margin.top-graph.margin.bottom

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // If there is data, run the needed calculations
  //-------------------------------------------------------------------
  if (vars.data.app.length) {

    if (!vars.tickValues) vars.tickValues = {}

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Determine X and Y axis
    //-------------------------------------------------------------------
    vars.continuous_axis = null
    vars.opp_axis = null
    vars.stacked_axis = null

    vars.axes.values.forEach(function(axis){

      if (vars[axis].stacked.value) {
        vars.stacked_axis = axis
      }
      if (!vars.continuous_axis && vars[axis].scale.value == "continuous") {
        vars.continuous_axis = axis
        vars.opp_axis = axis == "x" ? "y" : "x"
      }

      if (vars.data.changed || vars.depth.changed || !vars[axis+"_range"] || vars.time.fixed.value) {

        if (vars.dev.value) d3plus.console.time("determining "+axis+"-axis")
        if (vars[axis].scale.value == "share") {
          vars[axis+"_range"] = [0,1]
          vars.tickValues[axis] = d3plus.util.buckets([0,1],11)
          vars.stacked_axis = axis
        }
        else if (vars[axis].stacked.value) {
          if (vars.time.fixed.value) {
            var range_data = vars.data.app
          }
          else {
            var range_data = vars.data.restricted.all
          }
          var xaxis_sums = d3.nest()
            .key(function(d){return d[vars.x.key] })
            .rollup(function(leaves){
              return d3.sum(leaves, function(d){
                return parseFloat(d3plus.variable.value(vars,d,vars[axis].key))
              })
            })
            .entries(range_data)

          vars[axis+"_range"] = [0,d3.max(xaxis_sums, function(d){ return d.values; })]
        }
        else if (vars[axis].domain instanceof Array) {
          vars[axis+"_range"] = vars[axis].domain
          vars.tickValues[axis] = d3plus.util.uniques(vars.data.app,vars[axis].key)
          vars.tickValues[axis] = vars.tickValues[axis].filter(function(t){
            return t >= vars[axis+"_range"][0] && t <= vars[axis+"_range"][1]
          })
        }
        else if (vars.time.fixed.value) {
          vars[axis+"_range"] = d3.extent(vars.data.app,function(d){
            return parseFloat(d3plus.variable.value(vars,d,vars[axis].key))
          })
          vars.tickValues[axis] = d3plus.util.uniques(vars.data.app,vars[axis].key)
        }
        else {
          var all_depths = []
          for (id in vars.id.nesting) {
            all_depths = all_depths.concat(vars.data.grouped[vars.id.nesting[id]].all)
          }
          vars[axis+"_range"] = d3.extent(all_depths,function(d){
            return parseFloat(d3plus.variable.value(vars,d,vars[axis].key))
          })
          vars.tickValues[axis] = d3plus.util.uniques(vars.data.restricted.all,vars[axis].key)
        }

        // add padding to axis if there is only 1 value
        if (vars[axis+"_range"][0] == vars[axis+"_range"][1]) {
          vars[axis+"_range"][0] -= 1
          vars[axis+"_range"][1] += 1
        }

        // reverse Y axis
        if (axis == "y") vars.y_range = vars.y_range.reverse()

        if (vars.dev.value) d3plus.console.timeEnd("determining "+axis+"-axis")
      }
      else if (!vars[axis+"_range"]) {
        vars[axis+"_range"] = [-1,1]
      }

    })

    //===================================================================

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Mirror axes, if applicable
    //-------------------------------------------------------------------
    if (vars.axes.mirror.value) {
      var domains = vars.y_range.concat(vars.x_range)
      vars.x_range = d3.extent(domains)
      vars.y_range = d3.extent(domains).reverse()
    }

    //===================================================================

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Filter data to only include values within the axes
    //-------------------------------------------------------------------
    if (vars.dev.value) d3plus.console.time("removing data outside of axes")
    var old_length = vars.data.app.length
    if (vars.y.scale.value == "share") {
      var data = vars.data.app
    }
    else {
      var data = vars.data.app.filter(function(d){
        var val = parseFloat(d3plus.variable.value(vars,d,vars.y.key))
        var y_include = val != null && val <= vars.y_range[0] && val >= vars.y_range[1]
        if (y_include) {
          var val = parseFloat(d3plus.variable.value(vars,d,vars.x.key))
          return val != null && val >= vars.x_range[0] && val <= vars.x_range[1]
        }
        else return false
      })
    }

    if (vars.dev.value) d3plus.console.timeEnd("removing data outside of axes")
    var removed = old_length - data.length
    if (removed && vars.dev.value) console.log("removed "+removed+" nodes")

    //===================================================================

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Determine size of nodes
    //-------------------------------------------------------------------

    if (data) {

      if (vars.dev.value) d3plus.console.time("determining size scale")
      if (vars.size.key) {
        if (vars.time.fixed.value) {
          var size_domain = d3.extent(vars.data.app,function(d){
            var val = d3plus.variable.value(vars,d,vars.size.key)
            return val == 0 ? null : val
          })
        }
        else {
          var all_depths = []
          for (id in vars.id.nesting) {
            all_depths = all_depths.concat(vars.data.grouped[vars.id.nesting[id]].all)
          }
          var size_domain = d3.extent(all_depths,function(d){
            var val = d3plus.variable.value(vars,d,vars.size.key)
            return val == 0 ? null : val
          })
        }
        if (!size_domain[0] || !size_domain[1]) size_domain = [0,0]
      }
      else {
        var size_domain = [0,0]
      }

      var max_size = Math.floor(d3.max([d3.min([graph.width,graph.height])/15,10])),
          min_size = 10

      if (size_domain[0] == size_domain[1]) var min_size = max_size

      var size_range = [min_size,max_size]

      var radius = d3.scale[vars.size.scale.value]()
        .domain(size_domain)
        .range(size_range)

      if (vars.dev.value) d3plus.console.timeEnd("determining size scale")

    }

    //===================================================================

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Create axis scales and add buffer if necessary
    //-------------------------------------------------------------------

    vars.axes.values.forEach(function(axis){

      // Create Axes
      var range_max = axis == "x" ? graph.width : graph.height

      if (["continuous","share"].indexOf(vars[axis].scale.value) >= 0) {
        var s = "linear"
      }
      else {
        var s = vars[axis].scale.value
      }

      vars[axis+"_scale"] = d3.scale[s]()
        .domain(vars[axis+"_range"])
        .range([0,range_max])

      // set buffer room (take into account largest size var)
      var continuous_buffer = ["continuous","share"].indexOf(vars[axis].scale.value) >= 0
      if (["square","circle","donut"].indexOf(vars.shape.value) >= 0 && !continuous_buffer) {

        if (vars[axis].scale.value != "log") {

          var scale = vars[axis+"_scale"]
          var inverse_scale = d3.scale[s]()
            .domain(scale.range())
            .range(scale.domain())

          var largest_size = radius.range()[1]*2

          // convert largest size to x scale domain
          largest_size = inverse_scale(largest_size)

          // get radius of largest in pixels by subtracting this value from the x scale minimum
          var buffer = largest_size - scale.domain()[0];
          buffer = vars.stacked_axis ? 0 : buffer
          // update x scale with new buffer offsets
          vars[axis+"_scale"]
            .domain([scale.domain()[0]-buffer,scale.domain()[1]+buffer])

        }

      }

      var orient = axis == "x" ? "bottom" : "left"

      vars[axis+"_axis"] = d3.svg.axis()
        .tickSize(vars.style.ticks.size)
        .tickPadding(5)
        .orient(orient)
        .scale(vars[axis+"_scale"])
        .tickFormat(function(d, i) {

          var visible = true
          if (vars[axis].key == vars.time.key && d % 1 != 0) {
            visible = false
          }

          if (((vars[axis].scale.value == "log" && d.toString().charAt(0) == "1")
              || vars[axis].scale.value != "log") && visible) {

            if (vars[axis].scale.value == "share") {
              var text = d*100+"%"
            }
            else {
              var text = vars.format(d,vars[axis].key);
            }

            d3.select(this)
              .style("font-size",vars.style.ticks.font.size)
              .style("fill",vars.style.ticks.font.color)
              .attr("font-family",vars.style.font.family)
              .attr("font-weight",vars.style.font.weight)
              .text(text)

            if (axis == "x") {
              var w = this.getBBox().width,
                  h = this.getBBox().height
              d3.select(this).attr("transform","translate(18,8)rotate(70)");
              var height = (Math.cos(25)*w)+5;
              if (height > graph.yoffset && !vars.small) {
                graph.yoffset = height;
              }
              var width = (Math.cos(25)*h)+5;
              if (width > graph.rightoffset && !vars.small) {
                graph.rightoffset = width;
              }
            }
            else {
              var width = this.getBBox().width;
              if (width > graph.offset && !vars.small) {
                graph.offset = width;
              }
            }

          }
          else {
            var text = null
          }

          return text;

        });

      if (vars[axis].scale.value == "continuous" && vars.tickValues[axis]) {
        vars[axis+"_axis"].tickValues(vars.tickValues[axis])
      }

    })

  }

  if (!data) {
    var data = []
  }

  // Function for Tick Styling
  function tick_style(t,axis) {
    t
      .attr("stroke",vars.style.ticks.color)
      .attr("stroke-width",vars.style.ticks.width)
      .attr("shape-rendering",vars.style.rendering)
      .style("opacity",function(d){
        var lighter = vars[axis].scale.value == "log" && d.toString().charAt(0) != "1"
        return lighter ? 0.25 : 1
      })
  }

  // Function for Tick Styling
  function tick_position(t,axis) {
    t
      .attr("x1",function(d){
        return axis == "x" ? vars.x_scale(d) : 0
      })
      .attr("x2",function(d){
        return axis == "x" ? vars.x_scale(d) : graph.width
      })
      .attr("y1",function(d){
        return axis == "y" ? vars.y_scale(d) : 0
      })
      .attr("y2",function(d){
        return axis == "y" ? vars.y_scale(d) : graph.height
      })
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Enter SVG Elements
  //-------------------------------------------------------------------

  // Enter Background Plane
  var plane = vars.group.selectAll("g#plane").data(["plane"])
  plane.enter().append("g")
    .attr("id","plane")
    .attr("transform", "translate(" + graph.margin.left + "," + graph.margin.top + ")")

  // Enter Background Rectangle
  var bg = plane.selectAll("rect#background").data(["background"])
  bg.enter().append("rect")
    .attr("id","background")
    .attr("x",0)
    .attr("y",0)
    .attr("width", graph.width)
    .attr("height", graph.height)
    .attr("stroke-width",1)
    .attr("stroke","#ccc")
      .attr("shape-rendering",vars.style.rendering)
    .style("fill","#fafafa")

  // Enter Background Mirror
  var mirror = plane.selectAll("path#mirror").data(["mirror"])
  mirror.enter().append("path")
    .attr("id","mirror")
    .attr("fill","#000")
    .attr("fill-opacity",0.03)
    .attr("stroke-width",1)
    .attr("stroke","#ccc")
    .attr("stroke-dasharray","10,10")
    .attr("opacity",0)

  // Enter Axes
  var axes = vars.group.selectAll("g#axes").data(["axes"])
  axes.enter().append("g")
    .attr("id","axes")

  // Enter X Axis Grid
  var xgrid = plane.selectAll("g#xgrid").data(["xgrid"])
  xgrid.enter().append("g")
    .attr("id","xgrid")

  // Enter Y Axis Grid
  var ygrid = plane.selectAll("g#ygrid").data(["ygrid"])
  ygrid.enter().append("g")
    .attr("id","ygrid")

  // Enter X Axis Scale
  var xaxis = plane.selectAll("g#xaxis").data(["xaxis"])
  xaxis.enter().append("g")
    .attr("id","xaxis")
    .attr("transform", "translate(0," + graph.height + ")")

  // Enter Y Axis Scale
  var yaxis = plane.selectAll("g#yaxis").data(["yaxis"])
  yaxis.enter().append("g")
    .attr("id","yaxis")

  // Enter X Axis Label
  var xlabel = axes.selectAll("text#xlabel").data(["xlabel"])
  xlabel.enter().append("text")
    .attr("id", "xlabel")
    .attr("x", vars.app_width/2)
    .attr("y", vars.app_height-10)
    .text(vars.format(vars.x.key))
    .attr("font-family",vars.style.font.family)
    .attr("font-weight",vars.style.font.weight)
    .attr("font-size",vars.style.labels.size)
    .attr("fill",vars.style.labels.color)
    .attr("text-anchor",vars.style.labels.align)

  // Enter Y Axis Label
  var ylabel = axes.selectAll("text#ylabel").data(["ylabel"])
  ylabel.enter().append("text")
    .attr("id", "ylabel")
    .attr("y", 15)
    .attr("x", -(graph.height/2+graph.margin.top))
    .text(vars.format(vars.y.key))
    .attr("transform","rotate(-90)")
    .attr("font-family",vars.style.font.family)
    .attr("font-weight",vars.style.font.weight)
    .attr("font-size",vars.style.labels.size)
    .attr("fill",vars.style.labels.color)
    .attr("text-anchor",vars.style.labels.align)

  // Enter Mouse Event Group
  var mouseevents = vars.group.selectAll("g#mouseevents").data(["mouseevents"])
  mouseevents.enter().append("g")
    .attr("id","mouseevents")

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Calculate Spacing Needed for Axes Labels
  //-------------------------------------------------------------------
  graph.offset = 0
  yaxis.call(vars.y_axis)
    .selectAll("line")
    .call(tick_style,"y")

  graph.margin.left += graph.offset
  graph.width -= graph.offset
  vars.x_scale.range([0,graph.width])

  graph.yoffset = 0
  graph.rightoffset = 0
  xaxis.call(vars.x_axis)
    .selectAll("line")
    .call(tick_style,"x")

  graph.height -= graph.yoffset
  graph.width -= graph.rightoffset
  vars.x_scale.range([0,graph.width])
  vars.y_scale.range([0,graph.height])
  yaxis.call(vars.y_axis)
  xaxis.call(vars.x_axis)

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Update SVG Elements
  //-------------------------------------------------------------------

  // Update Plane Group
  plane.transition().duration(vars.style.timing.transitions)
    .attr("transform", "translate(" + graph.margin.left + "," + graph.margin.top + ")")

  // Update Plane Background
  bg.attr("width", graph.width)
    .attr("height", graph.height)

  // Update Mirror Triangle
  mirror.transition().duration(vars.style.timing.transitions)
    .attr("opacity",function(){
      return vars.axes.mirror.value ? 1 : 0
    })
    .attr("d",function(){
      var w = graph.width, h = graph.height
      return "M "+w+" "+h+" L 0 "+h+" L "+w+" 0 Z"
    })

  // Update Y Axis
  yaxis.transition().duration(vars.style.timing.transitions)
    .call(vars.y_axis.scale(vars.y_scale))

  yaxis.selectAll("line").transition().duration(vars.style.timing.transitions)
      .call(tick_style,"y")

  yaxis.selectAll("path").style("fill","none")

  // Update X Axis
  xaxis.transition().duration(vars.style.timing.transitions)
    .attr("transform", "translate(0," + graph.height + ")")
    .call(vars.x_axis.scale(vars.x_scale))
    .selectAll("g.tick").select("text")
      .style("text-anchor","start")

  xaxis.selectAll("line").transition().duration(vars.style.timing.transitions)
      .call(tick_style,"x")

  xaxis.selectAll("path").style("fill","none")

  // Update Y Grid
  var ylines = ygrid.selectAll("line")
    .data(vars.y_scale.ticks())

  ylines.enter().append("line")
    .style("opacity",0)
    .call(tick_position,"y")
    .call(tick_style,"y")

  ylines.transition().duration(vars.style.timing.transitions)
    .style("opacity",1)
    .call(tick_position,"y")
    .call(tick_style,"y")

  ylines.exit().transition().duration(vars.style.timing.transitions)
    .style("opacity",0)
    .remove()

  // Update X Grid
  var xlines = xgrid.selectAll("line")
    .data(vars.x_scale.ticks())

  xlines.enter().append("line")
    .style("opacity",0)
    .call(tick_position,"x")
    .call(tick_style,"x")

  xlines.transition().duration(vars.style.timing.transitions)
    .style("opacity",1)
    .call(tick_position,"x")
    .call(tick_style,"x")

  xlines.exit().transition().duration(vars.style.timing.transitions)
    .style("opacity",0)
    .remove()

  // Update X Axis Label
  xlabel.text(vars.format(vars.x.key))
    .attr("x", vars.app_width/2)
    .attr("y", vars.app_height-10)
    .attr("opacity",function(){
      if (vars.data.app.length == 0) return 0
      else return 1
    })

  // Update Y Axis Label
  ylabel.text(vars.format(vars.y.key))
    .attr("y", 15)
    .attr("x", -(graph.height/2+graph.margin.top))
    .attr("opacity",function(){
      if (vars.data.app.length == 0) return 0
      else return 1
    })

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Enter/Update User-Defined Axis Lines
  //-------------------------------------------------------------------

  function get_name(d) {
    if (typeof d == "number" || typeof d == "string") {
      return null;
    }
    else {
      return Object.keys(d)[0]
    }
  }

  function get_val(d) {
    if (typeof d == "number") {
      return d;
    }
    else if (typeof d == "string") {
      return parseFloat(d);
    }
    else {
      var v = d[Object.keys(d)[0]]
      if (typeof v == "string") {
        return parseFloat(v);
      }
      else {
        return v;
      }
    }
  }

  vars.axes.values.forEach(function(axis){

    var lines = plane.selectAll("g.d3plus_"+axis+"line")
      .data(vars[axis].lines,function(l){
        if (typeof l == "number" || typeof l == "string") {
          return l
        }
        else {
          return Object.keys(l)[0]
        }
      })

    var enter = lines.enter().append("g")
      .attr("class","d3plus_"+axis+"line")

    var max = axis == "x" ? "height" : "width",
        pos = axis == "x" ? (graph.height-8)+"px" : "10px",
        padding = axis == "x" ? 10 : 20

    enter.append("line")
      .attr(axis+"1",0)
      .attr(axis+"2",graph[max])
      .attr("stroke","#ccc")
      .attr("stroke-width",3)
      .attr("stroke-dasharray","10,10")

    enter.append("text")
      .style("font-size",vars.style.ticks.font.size)
      .style("fill",vars.style.ticks.font.color)
      .attr("text-align","start")
      .attr(axis,pos)

    lines.selectAll("line").transition().duration(vars.style.timing.transitions)
      .attr(axis+"1",function(d){
        return get_val(d) ? vars[axis+"_scale"](get_val(d)) : 0
      })
      .attr(axis+"2",function(d){
        return get_val(d) ? vars[axis+"_scale"](get_val(d)) : 0
      })
      .attr("opacity",function(d){
        var yes = get_val(d) > vars[axis+"_scale"].domain()[1] && get_val(d) < vars[axis+"_scale"].domain()[0]
        return get_val(d) != null && yes ? 1 : 0
      })

    lines.selectAll("text").transition().duration(vars.style.timing.transitions)
      .text(function(){
        if (get_val(d) != null) {
          var v = vars.format(get_val(d),y_name)
          return get_name(d) ? vars.format(get_name(d)) + ": " + v : v
        }
        else return null
      })
      .attr(axis,function(d){
        return (vars[axis+"_scale"](get_val(d))+padding)+"px"
      })

  })

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Format Data for Plotting
  //-------------------------------------------------------------------

  if (["line","area"].indexOf(vars.shape.value) >= 0) {
    radius.range([2,2])
  }

  vars.axis_offset = {
    "x": graph.margin.left,
    "y": graph.margin.top
  }

  data.forEach(function(d){
    d.d3plus.x = vars.x_scale(d3plus.variable.value(vars,d,vars.x.key))
    d.d3plus.x += vars.axis_offset.x

    d.d3plus.r = radius(d3plus.variable.value(vars,d,vars.size.key))

    if (!vars.stacked_axis) {

      d.d3plus.y = vars.y_scale(d3plus.variable.value(vars,d,vars.y.key))
      d.d3plus.y += vars.axis_offset.y

      if (vars.shape.value == "area") {
        d.d3plus[vars.opp_axis+"0"] = vars[vars.opp_axis+"_scale"].range()[1]
        d.d3plus[vars.opp_axis+"0"] += vars.axis_offset[vars.opp_axis]
      }

    }

  })

  if (["line","area"].indexOf(vars.shape.value) >= 0) {

    data = d3.nest()
      .key(function(d){
        var id = d3plus.variable.value(vars,d,vars.id.key),
            depth = d.d3plus.depth ? d.d3plus.depth : 0
        return d3plus.util.strip(id)+"_"+depth+"_"+vars.shape.value
      })
      .rollup(function(leaves){

        var availables = d3plus.util.uniques(leaves,vars[vars.continuous_axis].key),
            previousMissing = false

        vars.tickValues[vars.continuous_axis].forEach(function(v,i,arr){

          if(availables.indexOf(v) < 0){
            var obj = {}
            obj[vars[vars.continuous_axis].key] = v
            obj[vars.id.key] = leaves[0][vars.id.key]
            obj[vars[vars.opp_axis].key] = vars[vars.opp_axis+"_scale"].domain()[1]
            obj.d3plus = {}
            obj.d3plus.r = radius(radius.domain()[0])
            obj.d3plus[vars.continuous_axis] += vars.axis_offset[vars.continuous_axis]

            if (!vars.stacked_axis) {
              obj.d3plus[vars.opp_axis] = vars[vars.opp_axis+"_scale"].range()[1]
              obj.d3plus[vars.opp_axis] += vars.axis_offset[vars.opp_axis]
              obj.d3plus[vars.opp_axis+"0"] = obj.d3plus[vars.opp_axis]
            }

            if (vars[vars.continuous_axis].zerofill.value || vars[vars.opp_axis].stacked.value) {
              var position = vars[vars.continuous_axis+"_scale"](v)
              position += vars.axis_offset[vars.continuous_axis]
              obj.d3plus[vars.continuous_axis] = position
              leaves.push(obj)
            }
            else if (vars.shape.value != "line") {
              if (!previousMissing && i > 0) {
                var position = vars[vars.continuous_axis+"_scale"](arr[i-1])
                position += vars.axis_offset[vars.continuous_axis]
                obj.d3plus[vars.continuous_axis] = position
                leaves.push(obj)
              }
              if (i < arr.length-1) {
                var position = vars[vars.continuous_axis+"_scale"](arr[i+1])
                position += vars.axis_offset[vars.continuous_axis]
                var obj2 = d3plus.util.copy(obj)
                obj2.d3plus[vars.continuous_axis] = position
                leaves.push(obj2)
              }
            }
            previousMissing = true

          }
          else {
            previousMissing = false
          }
        })

        leaves.sort(function(a,b){
          var xsort = a.d3plus[vars.continuous_axis] - b.d3plus[vars.continuous_axis]
          if (xsort) return xsort
          var ksort = a[vars[vars.continuous_axis].key] - b[vars[vars.continuous_axis].key]
          return ksort
        })

        return leaves
      })
      .entries(data)

    data.forEach(function(d,i){
      vars.id.nesting.forEach(function(n,i){
        if (i <= vars.depth.value && !d[n]) {
          d[n] = d3plus.util.uniques(d.values,n).filter(function(unique){
            return unique && unique != "undefined"
          })[0]
        }
      })
    })

  }

  var sort = null
  if (vars.order.key) {
    sort = vars.order.key
  }
  else if (vars.continuous_axis) {
    sort = vars[vars.opp_axis].key
  }
  else if (vars.size.key) {
    sort = vars.size.key
  }

  if (sort) {

    data.sort(function(a,b){

      if (a.values instanceof Array) {
        a_value = 0
        a.values.forEach(function(v){
          var val = d3plus.variable.value(vars,v,sort)
          if (val) {
            if (typeof val == "number") {
              a_value += val
            }
            else {
              a_value = val
            }
          }
        })
      }
      else {
        a_value = d3plus.variable.value(vars,a,sort)
      }

      if (b.values instanceof Array) {
        b_value = 0
        b.values.forEach(function(v){
          var val = d3plus.variable.value(vars,v,sort)
          if (val) {
            if (typeof val == "number") {
              b_value += val
            }
            else {
              b_value = val
            }
          }
        })
      }
      else {
        b_value = d3plus.variable.value(vars,b,sort)
      }

      if (vars.color.key && sort == vars.color.key) {

        a_value = d3plus.variable.color(vars,a)
        b_value = d3plus.variable.color(vars,b)

        a_value = d3.rgb(a_value).hsl()
        b_value = d3.rgb(b_value).hsl()

        if (a_value.s == 0) a_value = 361
        else a_value = a_value.h
        if (b_value.s == 0) b_value = 361
        else b_value = b_value.h

      }

      if(a_value<b_value) return vars.order.sort.value == "desc" ? -1 : 1;
      if(a_value>b_value) return vars.order.sort.value == "desc" ? 1 : -1;

      return 0;

    });
  }

  if (vars.stacked_axis) {

    var stack = d3.layout.stack()
      .values(function(d) { return d.values; })
      .x(function(d) { return d.d3plus.x; })
      .x(function(d) { return d.d3plus.y; })
      .y(function(d) {
        var flip = graph.height,
            val = d3plus.variable.value(vars,d,vars.y.key)
        return flip-vars.y_scale(val);
      })
      .out(function(d,y0,y){
        var flip = graph.height

        if (vars[vars.stacked_axis].scale.value == "share") {
          d.d3plus.y0 = (1-y0)*flip
          d.d3plus.y = d.d3plus.y0-(y*flip)
        }
        else {
          d.d3plus.y0 = flip-y0
          d.d3plus.y = d.d3plus.y0-y
        }
        d.d3plus.y += graph.margin.top
        d.d3plus.y0 += graph.margin.top
      })

    var offset = vars[vars.stacked_axis].scale.value == "share" ? "expand" : "zero";

    var data = stack.offset(offset)(data)

  }
  else if (["area","line"].indexOf(vars.shape.value) < 0) {

    function data_tick(l,axis) {
      l
        .attr("x1",function(d){
          return axis == "y" ? 0 : d.d3plus.x-graph.margin.left
        })
        .attr("x2",function(d){
          return axis == "y" ? -5 : d.d3plus.x-graph.margin.left
        })
        .attr("y1",function(d){
          return axis == "x" ? graph.height : d.d3plus.y-graph.margin.top
        })
        .attr("y2",function(d){
          return axis == "x" ? graph.height+5 : d.d3plus.y-graph.margin.top
        })
        .style("stroke",function(d){
          return d3plus.color.legible(d3plus.variable.color(vars,d));
        })
        .style("stroke-width",vars.style.data.stroke.width)
        .attr("shape-rendering",vars.style.rendering)
    }

    var data_ticks = plane.selectAll("g.d3plus_data_ticks")
      .data(data,function(d){
        return d[vars.id.key]+"_"+d.d3plus.depth
      })

    var tick_enter = data_ticks.enter().append("g")
      .attr("class","d3plus_data_ticks")
      .attr("opacity",0)

    tick_enter.append("line")
      .attr("class","d3plus_data_y")
      .call(data_tick,"y")

    data_ticks.selectAll("line.d3plus_data_y")
      .call(data_tick,"y")

    tick_enter.append("line")
      .attr("class","d3plus_data_x")
      .call(data_tick,"x")

    data_ticks.selectAll("line.d3plus_data_x")
      .call(data_tick,"x")

    data_ticks.transition().duration(vars.style.timing.transitions)
      .attr("opacity",1)

    data_ticks.exit().transition().duration(vars.style.timing.transitions)
      .attr("opacity",0)
      .remove()

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Plot data on chart!
  //-------------------------------------------------------------------

  function axis_lines(node) {

    var click_remove = d3.event.type == d3plus.evt.click && (vars.tooltip.value.long || vars.html.value),
        create = [d3plus.evt.over,d3plus.evt.move].indexOf(d3.event.type) >= 0

    if (!click_remove && create && vars.shape.value != "area") {

      if (node.data) var node = node.data

      var line_data = [
        d3plus.util.copy(node.d3plus),
        d3plus.util.copy(node.d3plus)
      ]
      line_data[0].axis = "x"
      line_data[1].axis = "y"

    }
    else {
      var line_data = []
    }

    function line_init(l) {
      l
        .attr("x2",function(d){
          var ret = d.axis == "x" ? d.x : d.x-d.r
          return ret
        })
        .attr("y2",function(d){
          var ret = d.axis == "y" ? d.y : d.y+d.r
          return ret
        })
        .style("stroke-width",0)
        .attr("opacity",0)
    }

    var lines = mouseevents.selectAll("line.d3plus_axis_label")
      .data(line_data,function(d){
        return d.axis+"_"+d.id
      })

    lines.enter().append("line")
      .attr("class","d3plus_axis_label")
      .call(line_init)
      .attr("x1",function(d){
        return d.axis == "x" ? d.x : d.x-d.r
      })
      .attr("y1",function(d){
        return d.axis == "y" ? d.y : d.y+d.r
      })
      .style("stroke",function(d){
        return d3plus.variable.color(vars,node)
      })
      .attr("shape-rendering",vars.style.rendering)

    lines.transition().duration(vars.style.timing.mouseevents)
      .attr("class","d3plus_axis_label")
      .attr("x2",function(d){
        return d.axis == "x" ? d.x : graph.margin.left-vars.style.ticks.size
      })
      .attr("y2",function(d){
        return d.axis == "y" ? d.y : graph.height+graph.margin.top+vars.style.ticks.size
      })
      .style("stroke",function(d){
        return d3plus.color.legible(d3plus.variable.color(vars,node));
      })
      .style("stroke-width",vars.style.data.stroke.width)
      .attr("opacity",1)

    lines.exit().transition().duration(vars.style.timing.mouseevents)
      .call(line_init)
      .remove()

    var texts = mouseevents.selectAll("text.d3plus_axis_label")
      .data(line_data,function(d){
        return d.axis+"_"+d.id
      })

    texts.enter().append("text")
      .attr("class","d3plus_axis_label")
      .attr("id",function(d){
        return d.axis+"_"+d.id
      })
      .text(function(d){
        var val = d3plus.variable.value(vars,node,vars[d.axis].key)
        return vars.format(val,vars[d.axis].key)
      })
      .attr("x",function(d){
        return d.axis == "x" ? d.x : graph.margin.left-5-vars.style.ticks.size
      })
      .attr("y",function(d){
        return d.axis == "y" ? d.y : graph.height+graph.margin.top+5+vars.style.ticks.size
      })
      .attr("dy",function(d){
        return d.axis == "y" ? (vars.style.ticks.font.size*.35) : vars.style.ticks.font.size
      })
      .attr("text-anchor",function(d){
        return d.axis == "y" ? "end": "middle"
      })
      .style("fill",function(d){
        return d3plus.color.legible(d3plus.variable.color(vars,node));
      })
      .style("font-size",vars.style.ticks.font.size)
      .attr("font-family",vars.style.font.family)
      .attr("font-weight",vars.style.font.weight)
      .attr("opacity",0)

    texts.transition().duration(vars.style.timing.mouseevents)
      .delay(vars.style.timing.mouseevents)
      .attr("opacity",1)

    texts.exit().transition().duration(vars.style.timing.mouseevents)
      .attr("opacity",0)
      .remove()

    var rects = mouseevents.selectAll("rect.d3plus_axis_label")
      .data(line_data,function(d){
        return d.axis+"_"+d.id
      })

    rects.enter().insert("rect","text")
      .attr("class","d3plus_axis_label")
      .attr("x",function(d){
        var width = d3.select("text#"+d.axis+"_"+d.id).node().getBBox().width
        var ret = d.axis == "x" ? d.x : graph.margin.left-vars.style.ticks.size
        return d.axis == "x" ? ret-width/2-5 : ret-width-10
      })
      .attr("y",function(d){
        var height = d3.select("text#"+d.axis+"_"+d.id).node().getBBox().height
        var ret = d.axis == "y" ? d.y : graph.height+graph.margin.top
        return d.axis == "x" ? ret+vars.style.ticks.size : ret-height/2-5
      })
      .attr("width",function(d){
        var text = d3.select("text#"+d.axis+"_"+d.id).node().getBBox()
        return text.width + 10
      })
      .attr("height",function(d){
        var text = d3.select("text#"+d.axis+"_"+d.id).node().getBBox()
        return text.height + 10
      })
      .style("stroke",function(d){
        return d3plus.color.legible(d3plus.variable.color(vars,node));
      })
      .style("fill","white")
      .style("stroke-width",vars.style.data.stroke.width)
      .attr("shape-rendering",vars.style.rendering)
      .attr("opacity",0)

    rects.transition().duration(vars.style.timing.mouseevents)
      .delay(vars.style.timing.mouseevents)
      .attr("opacity",1)

    rects.exit().transition().duration(vars.style.timing.mouseevents)
      .attr("opacity",0)
      .remove()

  }

  vars.mouse = axis_lines

  return data

};

d3plus.apps.geo_map = {}
d3plus.apps.geo_map.libs = ["topojson"];
d3plus.apps.geo_map.requirements = ["color","coords"];
d3plus.apps.geo_map.tooltip = "follow"
d3plus.apps.geo_map.shapes = ["coordinates"];
d3plus.apps.geo_map.scale = 1
d3plus.apps.geo_map.nesting = false
d3plus.apps.geo_map.zoom = true

d3plus.apps.geo_map.draw = function(vars) {

  topojson.presimplify(vars.coords.value)

  var coords = vars.coords.value,
      key = Object.keys(coords.objects)[0]
      topo = topojson.feature(coords, coords.objects[key]),
      features = topo.features

  var features = features.filter(function(f){
    f[vars.id.key] = f.id
    if (vars.coords.solo.value.length) {
      return vars.coords.solo.value.indexOf(f.id) >= 0
    }
    else if (vars.coords.mute.value.length) {
      return vars.coords.mute.value.indexOf(f.id) < 0
    }
    return true
  })

  return features

};

d3plus.apps.line = {}
d3plus.apps.line.requirements = ["data","x","y"];
d3plus.apps.line.tooltip = "static";
d3plus.apps.line.shapes = ["line"];

d3plus.apps.line.setup = function(vars) {

  vars.x.scale.value = "continuous"

}

d3plus.apps.line.draw = function(vars) {

  return d3plus.apps.chart.draw(vars)

}

d3plus.apps.network = {}
d3plus.apps.network.requirements = ["nodes","edges"];
d3plus.apps.network.tooltip = "static"
d3plus.apps.network.shapes = ["circle","square","donut"];
d3plus.apps.network.scale = 1.05
d3plus.apps.network.nesting = false
d3plus.apps.network.zoom = true

d3plus.apps.network.draw = function(vars) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Use filtered lists if they are available
  //-------------------------------------------------------------------
  var nodes = vars.nodes.restricted || vars.nodes.value,
      edges = vars.edges.restricted || vars.edges.value

  var x_range = d3.extent(nodes,function(n){return n.x}),
      y_range = d3.extent(nodes,function(n){return n.y})

  var val_range = d3.extent(nodes, function(d){
    var val = d3plus.variable.value(vars,d,vars.size.key)
    return val == 0 ? null : val
  });

  if (typeof val_range[0] == "undefined") val_range = [1,1]

  var max_size = d3.min(d3plus.util.distances(nodes))

  if (vars.edges.arrows.value) {
    max_size = max_size*0.45
  }
  else {
    max_size = max_size*0.6
  }

  if (val_range[0] == val_range[1]) {
    var min_size = max_size
  }
  else {

    var width = (x_range[1]+max_size*1.1)-(x_range[0]-max_size*1.1),
        height = (y_range[1]+max_size*1.1)-(y_range[0]-max_size*1.1)
        aspect = width/height,
        app = vars.app_width/vars.app_height

    if (app > aspect) {
      var scale = vars.app_height/height
    }
    else {
      var scale = vars.app_width/width
    }
    var min_size = max_size*0.25
    if (min_size*scale < 3) {
      min_size = 3/scale
    }

  }

  // Create size scale
  var radius = d3.scale[vars.size.scale.value]()
    .domain(val_range)
    .range([min_size, max_size])

  vars.zoom.bounds = [[x_range[0]-max_size*1.1,y_range[0]-max_size*1.1],[x_range[1]+max_size*1.1,y_range[1]+max_size*1.1]]

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Match nodes to data
  //-------------------------------------------------------------------
  var data = [], lookup = {}
  nodes.forEach(function(n){

    var d = vars.data.app.filter(function(a){
      return a[vars.id.key] == n[vars.id.key]
    })[0]

    if (d) {
      var obj = d3plus.util.merge(n,d)
    }
    else {
      var obj = d3plus.util.copy(n)
    }

    obj.d3plus = {}
    obj.d3plus.x = n.x
    obj.d3plus.y = n.y
    var val = d3plus.variable.value(vars,obj,vars.size.key)
    obj.d3plus.r = val ? radius(val) : radius.range()[0]
    lookup[obj[vars.id.key]] = {
      "x": obj.d3plus.x,
      "y": obj.d3plus.y,
      "r": obj.d3plus.r
    }
    data.push(obj)
  })

  data.sort(function(a,b){
    return b.d3plus.r - a.d3plus.r
  })

  edges.forEach(function(l,i){

    l[vars.edges.source] = d3plus.util.copy(l[vars.edges.source])
    l[vars.edges.source].d3plus = {}

    var source = lookup[l[vars.edges.source][vars.id.key]]
    l[vars.edges.source].d3plus.r = source.r
    l[vars.edges.source].d3plus.x = source.x
    l[vars.edges.source].d3plus.y = source.y

    l[vars.edges.target] = d3plus.util.copy(l[vars.edges.target])
    l[vars.edges.target].d3plus = {}

    var target = lookup[l[vars.edges.target][vars.id.key]]
    l[vars.edges.target].d3plus.r = target.r
    l[vars.edges.target].d3plus.x = target.x
    l[vars.edges.target].d3plus.y = target.y

  })

  return {"nodes": data, "edges": edges}

}

d3plus.apps.rings = {}
d3plus.apps.rings.requirements = ["edges","focus"];
d3plus.apps.rings.tooltip = "static"
d3plus.apps.rings.shapes = ["circle","square","donut"];
d3plus.apps.rings.scale = 1
d3plus.apps.rings.nesting = false
d3plus.apps.rings.filter = function(vars,data) {

  var primaries = vars.connections(vars.focus.value,true)
    , secondaries = []

  primaries.forEach(function(p){
    secondaries = secondaries.concat(vars.connections(p[vars.id.key],true))
  })

  var connections = primaries.concat(secondaries)
    , ids = d3plus.util.uniques(connections,vars.id.key)

  return data.filter(function(d){

    return ids.indexOf(d[vars.id.key]) >= 0

  })

}

d3plus.apps.rings.draw = function(vars) {

  var radius = d3.min([vars.app_height,vars.app_width])/2
    , ring_width = vars.small || !vars.labels.value
                 ? (radius-vars.style.labels.padding*2)/2 : radius/3
    , primaryRing = vars.small || !vars.labels.value
                  ? ring_width*1.4 : ring_width
    , secondaryRing = ring_width*2
    , edges = []
    , nodes = []

  var center = vars.data.app.filter(function(d){
    return d[vars.id.key] == vars.focus.value
  })[0]

  if (!center) {
    center = {"d3plus": {}}
    center[vars.id.key] = vars.focus.value
  }
  center.d3plus.x = vars.app_width/2
  center.d3plus.y = vars.app_height/2
  center.d3plus.r = primaryRing*.65

  var primaries = [], claimed = [vars.focus.value]
  vars.connections(vars.focus.value).forEach(function(edge){

    var c = edge[vars.edges.source][vars.id.key] == vars.focus.value ? edge[vars.edges.target] : edge[vars.edges.source]
    var n = vars.data.app.filter(function(d){
      return d[vars.id.key] == c[vars.id.key]
    })[0]
    if (!n) {
      n = {"d3plus": {}}
      n[vars.id.key] = c[vars.id.key]
    }
    n.d3plus.edges = vars.connections(n[vars.id.key]).filter(function(c){
      return c[vars.edges.source][vars.id.key] != vars.focus.value && c[vars.edges.target][vars.id.key] != vars.focus.value
    })
    n.d3plus.edge = edge
    claimed.push(n[vars.id.key])
    primaries.push(n)

  })

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Sort primary nodes by children (smallest to largest) and then by sort
  // order.
  //--------------------------------------------------------------------------
  var sort = null
  if (vars.order.key) {
    sort = vars.order.key
  }
  else if (vars.color.key) {
    sort = vars.color.key
  }
  else if (vars.size.key) {
    sort = vars.size.key
  }
  else {
    sort = vars.id.key
  }

  function sort_function(a,b){

    a_value = d3plus.variable.value(vars,a,sort)
    b_value = d3plus.variable.value(vars,b,sort)

    if (vars.color.key && sort == vars.color.key) {

      a_value = d3plus.variable.color(vars,a)
      b_value = d3plus.variable.color(vars,b)

      a_value = d3.rgb(a_value).hsl()
      b_value = d3.rgb(b_value).hsl()

      if (a_value.s == 0) a_value = 361
      else a_value = a_value.h
      if (b_value.s == 0) b_value = 361
      else b_value = b_value.h

    }
    else {
      a_value = d3plus.variable.value(vars,a,sort)
      b_value = d3plus.variable.value(vars,b,sort)
    }

    if(a_value<b_value) return vars.order.sort.value == "desc" ? -1 : 1;
    if(a_value>b_value) return vars.order.sort.value == "desc" ? 1 : -1;

  }

  primaries.sort(function(a,b){

    var lengthdiff = a.d3plus.edges.length - b.d3plus.edges.length

    if (lengthdiff) {

      return lengthdiff

    }
    else {

      return sort_function(a,b)

    }

  })

  if (typeof vars.edges.limit == "number") {
    primaries = primaries.slice(0,vars.edges.limit)
  }
  else if (typeof vars.edges.limit == "function") {
    primaries = vars.edges.limit(primaries)
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Check for similar children and give preference to nodes with less
  // overall children.
  //----------------------------------------------------------------------------
  var secondaries = [], total = 0
  primaries.forEach(function(p){

    var primaryId = p[vars.id.key]

    p.d3plus.edges = p.d3plus.edges.filter(function(c){

      var source = c[vars.edges.source][vars.id.key]
        , target = c[vars.edges.target][vars.id.key]
      return (claimed.indexOf(source) < 0 && target == primaryId)
          || (claimed.indexOf(target) < 0 && source == primaryId)

    })

    total += p.d3plus.edges.length || 1

    p.d3plus.edges.forEach(function(c){

      var source = c[vars.edges.source]
        , target = c[vars.edges.target]
      var claim = target[vars.id.key] == primaryId ? source : target
      claimed.push(claim[vars.id.key])

    })
  })

  primaries.sort(sort_function)

  var offset = 0,
      radian = Math.PI*2,
      start = 0

  primaries.forEach(function(p,i){

    var children = p.d3plus.edges.length || 1,
        space = (radian/total)*children

    if (i == 0) {
      start = angle
      offset -= space/2
    }

    var angle = offset+(space/2)
    angle -= radian/4

    p.d3plus.radians = angle
    p.d3plus.x = vars.app_width/2 + (primaryRing * Math.cos(angle))
    p.d3plus.y = vars.app_height/2 + (primaryRing * Math.sin(angle))

    offset += space
    p.d3plus.edges.sort(function(a,b){

      var a = a[vars.edges.source][vars.id.key] == p[vars.id.key]
            ? a[vars.edges.target] : a[vars.edges.source]
        , b = b[vars.edges.source][vars.id.key] == p[vars.id.key]
            ? b[vars.edges.target] : b[vars.edges.source]

      return sort_function(a,b)

    })

    p.d3plus.edges.forEach(function(edge,i){

      var c = edge[vars.edges.source][vars.id.key] == p[vars.id.key]
          ? edge[vars.edges.target] : edge[vars.edges.source]
        , s = radian/total

      var d = vars.data.app.filter(function(a){
        return a[vars.id.key] == c[vars.id.key]
      })[0]

      if (!d) {
        d = {"d3plus": {}}
        d[vars.id.key] = c[vars.id.key]
      }

      a = (angle-(s*children/2)+(s/2))+((s)*i)
      d.d3plus.radians = a
      d.d3plus.x = vars.app_width/2 + ((secondaryRing) * Math.cos(a))
      d.d3plus.y = vars.app_height/2 + ((secondaryRing) * Math.sin(a))
      secondaries.push(d)
    })

  })

  var primaryDistance = d3.min(d3plus.util.distances(primaries,function(n){
        return [n.d3plus.x,n.d3plus.y]
      }))
    , secondaryDistance = d3.min(d3plus.util.distances(secondaries,function(n){
        return [n.d3plus.x,n.d3plus.y]
      }))

  if (!primaryDistance) {
    primaryDistance = ring_width/2
  }

  if (!secondaryDistance) {
    secondaryDistance = ring_width/4
  }

  if (primaryDistance/2 - 4 < 8) {
    var primaryMax = d3.min([primaryDistance/2,8])
  }
  else {
    var primaryMax = primaryDistance/2 - 4
  }

  if (secondaryDistance/2 - 4 < 4) {
    var secondaryMax = d3.min([secondaryDistance/2,4])
  }
  else {
    var secondaryMax = secondaryDistance/2 - 4
  }

  if (secondaryMax > ring_width/10) {
    secondaryMax = ring_width/10
  }

  if (primaryMax > secondaryMax*1.5) {
    primaryMax = secondaryMax*1.5
  }

  var ids = d3plus.util.uniques(primaries,vars.id.key)
  ids = ids.concat(d3plus.util.uniques(secondaries,vars.id.key))
  ids.push(vars.focus.value)

  var data = vars.data.app.filter(function(d){
    return ids.indexOf(d[vars.id.key]) >= 0
  })

  if (vars.size.key) {

    var domain = d3.extent(data,function(d){
      return d3plus.variable.value(vars,d,vars.size.key)
    })

    if (domain[0] == domain[1]) {
      domain[0] = 0
    }

    var radius = d3.scale.linear()
      .domain(domain)
      .range([3,d3.min([primaryMax,secondaryMax])])

    var val = d3plus.variable.value(vars,center,vars.size.key)
    center.d3plus.r = radius(val)

  }
  else {
    var radius = d3.scale.linear()
      .domain([1,2])
      .range([primaryMax,secondaryMax])
  }

  secondaries.forEach(function(s){
    s.d3plus.ring = 2
    var val = vars.size.key ? d3plus.variable.value(vars,s,vars.size.key) : 2
    s.d3plus.r = radius(val)
  })

  primaries.forEach(function(p,i){

    p.d3plus.ring = 1
    var val = vars.size.key ? d3plus.variable.value(vars,p,vars.size.key) : 1
    p.d3plus.r = radius(val)

    var check = [vars.edges.source,vars.edges.target]

    check.forEach(function(node){
      if (p.d3plus.edge[node][vars.id.key] == center[vars.id.key]) {

        p.d3plus.edge[node].d3plus = {
          "x": center.d3plus.x,
          "y": center.d3plus.y,
          "r": center.d3plus.r
        }

      }
      else {

        p.d3plus.edge[node].d3plus = {
          "x": p.d3plus.x,
          "y": p.d3plus.y,
          "r": p.d3plus.r
        }

      }
    })

    delete p.d3plus.edge.d3plus
    edges.push(p.d3plus.edge)

    vars.connections(p[vars.id.key]).forEach(function(edge){

      var c = edge[vars.edges.source][vars.id.key] == p[vars.id.key]
            ? edge[vars.edges.target] : edge[vars.edges.source]

      if (c[vars.id.key] != center[vars.id.key]) {

        var target = secondaries.filter(function(s){
          return s[vars.id.key] == c[vars.id.key]
        })[0]

        if (!target) {
          var r = primaryRing
          target = primaries.filter(function(s){
            return s[vars.id.key] == c[vars.id.key]
          })[0]
        }
        else {
          var r = secondaryRing
        }

        if (target) {

          edge.d3plus = {
            "spline": true,
            "translate": {
              "x": vars.app_width/2,
              "y": vars.app_height/2
            }
          }

          var check = [vars.edges.source,vars.edges.target]

          check.forEach(function(node){
            if (edge[node][vars.id.key] == p[vars.id.key]) {

              edge[node].d3plus = {
                "a": p.d3plus.radians,
                "r": primaryRing+p.d3plus.r,
                "depth": 1
              }

            }
            else {

              edge[node].d3plus = {
                "a": target.d3plus.radians,
                "r": r-target.d3plus.r,
                "depth": 2
              }

            }
          })

          edges.push(edge)

        }

      }

    })

  })

  nodes = [center].concat(primaries).concat(secondaries)

  nodes.forEach(function(n) {

    if (!vars.small && vars.labels.value) {

      if (n[vars.id.key] != vars.focus.value) {

        n.d3plus.rotate = n.d3plus.radians*(180/Math.PI)

        var angle = n.d3plus.rotate,
            width = ring_width-(vars.style.labels.padding*3)-n.d3plus.r

        if (angle < -90 || angle > 90) {
          angle = angle-180
          var buffer = -(n.d3plus.r+width/2+vars.style.labels.padding),
              anchor = "end"
        }
        else {
          var buffer = n.d3plus.r+width/2+vars.style.labels.padding,
              anchor = "start"
        }

        var background = primaries.indexOf(n) >= 0 ? true : false

        var height = n.d3plus.ring == 1 ? primaryDistance : secondaryDistance
        height += vars.style.labels.padding*2

        n.d3plus.label = {
          "x": buffer,
          "y": 0,
          "w": width,
          "h": height,
          "angle": angle,
          "anchor": anchor,
          "valign": "center",
          "color": d3plus.color.legible(d3plus.variable.color(vars,n[vars.id.key])),
          "resize": [8,vars.style.labels.font.size],
          "background": background,
          "mouse": true
        }

      }
      else if (vars.size.key) {

        var height = primaryRing-n.d3plus.r-vars.style.labels.padding*2

        n.d3plus.label = {
          "x": 0,
          "y": n.d3plus.r+height/2,
          "w": primaryRing,
          "h": height,
          "color": d3plus.color.legible(d3plus.variable.color(vars,n[vars.id.key])),
          "resize": [10,40],
          "background": true,
          "mouse": true
        }

      }
      else {
        delete n.d3plus.rotate
        delete n.d3plus.label
      }

    }
    else {
      delete n.d3plus.rotate
      delete n.d3plus.label
    }

  })

  vars.mouse[d3plus.evt.click] = function(d) {
    if (d[vars.id.key] != vars.focus.value) {
      d3plus.tooltip.remove(vars.type.value)
      vars.viz.focus(d[vars.id.key]).draw()
    }
  }

  return {"edges": edges, "nodes": nodes, "data": data}

};

d3plus.apps.scatter = {}
d3plus.apps.chart.fill = true;
d3plus.apps.chart.deprecates = ["pie_scatter"];
d3plus.apps.scatter.requirements = ["data","x","y"];
d3plus.apps.scatter.tooltip = "static";
d3plus.apps.scatter.shapes = ["circle","square","donut"];
d3plus.apps.scatter.scale = d3plus.apps.chart.scale;

d3plus.apps.scatter.draw = function(vars) {

  return d3plus.apps.chart.draw(vars)

}

d3plus.apps.stacked = {}
d3plus.apps.stacked.requirements = ["data","x","y"];
d3plus.apps.stacked.tooltip = "static";
d3plus.apps.stacked.shapes = ["area"];
d3plus.apps.stacked.threshold = 0.03;

d3plus.apps.stacked.setup = function(vars) {

  if (vars.dev.value) d3plus.console.time("setting local variables")
  vars.x.scale.value = "continuous"
  if (vars.dev.value) console.log("\"x\" scale set to \"continuous\"")
  vars.x.zerofill.value = true
  if (vars.dev.value) console.log("\"x\" zerofill set to \"true\"")
  vars.y.stacked.value = true
  if ((!vars.y.key && vars.size.key) || (vars.size.changed && vars.size.previous == vars.y.key)) {
    vars.y.key = vars.size.key
    vars.y.changed = true
  }
  else if ((!vars.size.key && vars.y.key) || (vars.y.changed && vars.y.previous == vars.size.key)) {
    vars.size.key = vars.y.key
    vars.size.changed = true
  }
  if (vars.dev.value) console.log("\"y\" stacked set to \"true\"")
  if (vars.dev.value) d3plus.console.timeEnd("setting local variables")

}

d3plus.apps.stacked.draw = function(vars) {

  d3plus.data.threshold(vars,vars.x.key)

  return d3plus.apps.chart.draw(vars)

}

d3plus.apps.tree_map = {}
d3plus.apps.tree_map.modes = ["squarify","slice","dice","slice-dice"];
d3plus.apps.tree_map.requirements = ["data","size"];
d3plus.apps.tree_map.tooltip = "follow"
d3plus.apps.tree_map.shapes = ["square"];
d3plus.apps.tree_map.threshold = 0.0005;

d3plus.apps.tree_map.draw = function(vars) {

  d3plus.data.threshold(vars)

  var grouped_data = d3.nest()

  vars.id.nesting.forEach(function(n,i){
    if (i < vars.depth.value) {
      grouped_data.key(function(d){return d[n]})
    }
  })

  grouped_data = grouped_data.entries(vars.data.app)

  var data = d3.layout.treemap()
    .mode(vars.type.mode.value)
    .round(true)
    .size([vars.app_width, vars.app_height])
    .children(function(d) { return d.values; })
    .padding(1)
    .sort(function(a, b) { return a.value - b.value; })
    .value(function(d) { return d3plus.variable.value(vars,d,vars.size.key); })
    .nodes({"name":"root", "values": grouped_data})
    .filter(function(d) {
      return !d.values && d.area;
    })

  if (data.length) {

    var root = data[0]
    while (root.parent) {
      root = root.parent
    }

    data.forEach(function(d){
      d.d3plus.x = d.x+d.dx/2
      d.d3plus.y = d.y+d.dy/2
      d.d3plus.width = d.dx
      d.d3plus.height = d.dy
      d.d3plus.share = d.value/root.value
    })

  }

  return data

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Darkens a color
//------------------------------------------------------------------------------
d3plus.color.darker = function(color,increment) {
  var c = d3.hsl(color);

  if (!increment) {
    var increment = 0.2
  }

  c.l -= increment
  if (c.l < 0.1) {
    c.l = 0.1
  }

  return c.toString();
}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Darkens a color if it's too light to appear on white
//------------------------------------------------------------------------------
d3plus.color.legible = function(color) {
  var hsl = d3.hsl(color)
  if (hsl.s > .9) hsl.s = .9
  if (hsl.l > .4) hsl.l = .4
  return hsl.toString();
}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Lightens a color
//------------------------------------------------------------------------------
d3plus.color.lighter = function(color,increment) {
  var c = d3.hsl(color);

  if (!increment) {
    var increment = 0.1
  }

  c.l += increment
  c.s -= increment/2
  if (c.l > .95) {
    c.l = .95
  }
  if (c.s < .05) {
    c.s = .05
  }

  return c.toString();
}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Mixes 2 hexidecimal colors
//------------------------------------------------------------------------------
d3plus.color.mix = function(c1,c2,o1,o2) {

  if (!o1) var o1 = 1
  if (!o2) var o2 = 1

  c1 = d3.rgb(c1)
  c2 = d3.rgb(c2)

  var r = (o1*c1.r + o2*c2.r - o1*o2*c2.r)/(o1+o2-o1*o2),
      g = (o1*c1.g + o2*c2.g - o1*o2*c2.g)/(o1+o2-o1*o2),
      b = (o1*c1.b + o2*c2.b - o1*o2*c2.b)/(o1+o2-o1*o2)

  return d3.rgb(r,g,b).toString()

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Random color generator
//------------------------------------------------------------------------------
d3plus.color.random = function(x) {
  var rand_int = x || Math.floor(Math.random()*20)
  return d3plus.color.scale.default(rand_int)
}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Usable Color Scales
//------------------------------------------------------------------------------
d3plus.color.scale = {}
d3plus.color.scale.default = d3.scale.ordinal().range([
  "#b35c1e",
  "#C9853A",
  "#E4BA79",
  "#F5DD9E",
  "#F3D261",
  "#C4B346",
  "#94B153",
  "#254322",
  "#4F6456",
  "#759E80",
  "#9ED3E3",
  "#27366C",
  "#7B91D3",
  "#C6CBF7",
  "#D59DC2",
  "#E5B3BB",
  "#E06363",
  "#AF3500",
  "#D74B03",
  "#843012",
  "#9A4400",
])

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Returns appropriate text color based off of a given color
//------------------------------------------------------------------------------
d3plus.color.text = function(color) {

  var hsl = d3.hsl(color)
    , light = "#f7f7f7"
    , dark = "#444444"

  return hsl.l > 0.65 ? dark
       : hsl.l < 0.49 ? light
       : hsl.h > 35 && hsl.s >= 0.3 ? dark
       : light

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Analyzes, organizes, and filters data and attributes
//------------------------------------------------------------------------------
d3plus.data.analyze = function(vars) {

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Sets color range of data, if applicable
//-------------------------------------------------------------------
d3plus.data.color = function(vars) {

  if (vars.dev.value) d3plus.console.time("get data range")

  var data_range = []
  vars.data.pool.forEach(function(d){
    var val = parseFloat(d3plus.variable.value(vars,d,vars.color.key))
    if (typeof val == "number" && !isNaN(val) && data_range.indexOf(val) < 0) data_range.push(val)
  })

  if (vars.dev.value) d3plus.console.timeEnd("get data range")

  if (data_range.length > 1) {

    var data_domain = null

    if (vars.dev.value) d3plus.console.time("create color scale")

    data_range = d3.extent(data_range)

    if (data_range[0] < 0 && data_range[1] > 0) {
      var color_range = vars.style.color.range
      if (color_range.length == 3) {
        data_range.push(data_range[1])
        data_range[1] = 0
      }
    }
    else if (data_range[1] > 0 && data_range[0] > 0) {
      var color_range = vars.style.color.heatmap
      data_range = d3plus.util.buckets(data_range,color_range.length)
    }
    else {
      var color_range = vars.style.color.range.slice(0)
      if (data_range[0] < 0) {
        color_range.pop()
      }
      else {
        color_range.shift()
      }
    }

    vars.color.scale = d3.scale.sqrt()
      .domain(data_range)
      .range(color_range)
      .interpolate(d3.interpolateRgb)

    if (vars.dev.value) d3plus.console.timeEnd("create color scale")

  }
  else {
    vars.color.scale = null
  }

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Cleans edges list and populates nodes list if needed
//-------------------------------------------------------------------
d3plus.data.edges = function(vars) {

  var node_req = d3plus.apps[vars.type.value].requirements.indexOf("nodes") >= 0,
      node_create = node_req && !vars.nodes.value

  if (node_create) {
    vars.nodes.value = []
    var placed = []
    vars.nodes.changed = true
  }
  
  vars.edges.value.forEach(function(e){

    if (typeof e[vars.edges.source] != "object") {
      var obj = {}
      obj[vars.id.key] = e[vars.edges.source]
      e[vars.edges.source] = obj
    }
    if (typeof e[vars.edges.target] != "object") {
      var obj = {}
      obj[vars.id.key] = e[vars.edges.target]
      e[vars.edges.target] = obj
    }

    if (!("keys" in vars.data)) {
      vars.data.keys = {}
    }

    if (!(vars.id.key in vars.data.keys)) {
      vars.data.keys[vars.id.key] = typeof e[vars.edges.source][vars.id.key]
    }

    if (node_create) {
      if (placed.indexOf(e[vars.edges.source][vars.id.key]) < 0) {
        placed.push(e[vars.edges.source][vars.id.key])
        vars.nodes.value.push(e[vars.edges.source])
      }
      if (placed.indexOf(e[vars.edges.target][vars.id.key]) < 0) {
        placed.push(e[vars.edges.target][vars.id.key])
        vars.nodes.value.push(e[vars.edges.target])
      }
    }

  })

  vars.edges.linked = true

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Fetches specific years of data
//-------------------------------------------------------------------

d3plus.data.fetch = function(vars,format,years) {

  var return_data = [];

  if (vars.dev.value) d3plus.console.group("Fetching \""+format+"\" data")

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // If "years" have not been requested, determine the years using .time()
  // solo and mute
  //----------------------------------------------------------------------------
  if (!years) {

    if (vars.time.solo.value.length) {
      var years = []
      vars.time.solo.value.forEach(function(y){
        if (typeof y == "function") {
          vars.data.time.forEach(function(t){
            if (y(t)) {
              years.push(t)
            }
          })
        }
        else {
          years.push(y)
        }
      })
    }
    else if (vars.time.mute.value.length) {
      var muted = []
      vars.time.mute.value.forEach(function(y){
        if (typeof y == "function") {
          vars.data.time.forEach(function(t){
            if (y(t)) {
              muted.push(t)
            }
          })
        }
        else {
          muted.push(y)
        }
      })
      var years = vars.data.time.filter(function(t){
        return muted.indexOf(t) < 0
      })
    }
    else {
      var years = ["all"]
    }

  }

  if (vars.dev.value) console.log("years: "+years.join(","))

  if (format == "restricted") {
    var data = vars.data.restricted
  }
  else {
    var data = vars.data[format][vars.id.nesting[vars.depth.value]]
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // If there is only 1 year needed, just grab it!
  //----------------------------------------------------------------------------
  if (years.length == 1) {
    return_data = data[years[0]]
  }
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Otherwise, we need to grab each year individually
  //----------------------------------------------------------------------------
  else {

    var missing = []

    years.forEach(function(y){

      if (data[y]) {

        return_data = return_data.concat(data[y])

      }
      else {
        missing.push(y)
      }

    })

    if (return_data.length == 0 && missing.length && !vars.internal_error) {
      vars.internal_error = "No Data Available for "+missing.join(", ")
      d3plus.console.warning(vars.internal_error)
    }

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Finally, we need to determine if the data needs to be merged together
  //----------------------------------------------------------------------------
  if (years.length > 1) {

    var separated = false
    vars.axes.values.forEach(function(a){
      if (vars[a].key == vars.time.key && vars[a].scale.value == "continuous") {
        separated = true
      }
    })

    if (!separated) {

      var nested = vars.id.nesting.slice(0,vars.depth.value+1)

      return_data = d3plus.data.nest(vars,return_data,nested,format == "grouped")

    }

  }

  if (!return_data) {
    return_data = [];
  }

  if (vars.dev.value) d3plus.console.groupEnd()

  return return_data

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Filters the data based on vars.check
//-------------------------------------------------------------------
d3plus.data.filter = function(vars) {

  if (vars.check.indexOf("time") >= 0) {
    vars.check.splice(vars.check.indexOf("time"),1)
    if (vars.data.filtered) {
      vars.data.filtered = {"all": vars.data.filtered.all}
    }
  }

  if (!vars.filters) {
    vars.filters = vars.check.slice(0)
  }
  else {
    vars.check.forEach(function(k){
      var variable = vars[k].value ? vars[k].value : vars[k].key
      if (!variable && vars.filters.indexOf(k) >= 0) {
        vars.filters.splice(vars.filters.indexOf(k),1)
      }
    })
  }

  if (vars.check.length >= 1) {

    if (vars.dev.value) d3plus.console.group("Filtering Data by Required Variables");
    var checking = vars.filters.join(", ")
    if (vars.dev.value) d3plus.console.time(checking)

    var data = "value"
    vars.filters.forEach(function(key){

      if (key == "xaxis") vars.x_range = null
      else if (key == "yaxis") vars.y_range = null

      vars.data.filtered = vars.data[data].filter(function(d){
        var variable = vars[key].value ? vars[key].value : vars[key].key
        var val = d3plus.variable.value(vars,d,variable)
        if (key == "size") {
          return val > 0 ? true : false
        }
        else {
          return val != null
        }
      })
      data = "filtered"

    })

    vars.data.filtered = {"all": vars.data.filtered}

    if (vars.dev.value) d3plus.console.timeEnd(checking)
    if (vars.dev.value) d3plus.console.groupEnd();
  }
  else if (!vars.data.filtered) {
    vars.data.filtered = {"all": vars.data.value}
  }

  if (vars.time.key && Object.keys(vars.data.filtered).length == 1) {

    if (vars.dev.value) d3plus.console.group("Disaggregating by Year")

    // Find available years
    vars.data.time = d3plus.util.uniques(vars.data.filtered.all,vars.time.key)
    for (var i=0; i < vars.data.time.length; i++) {
      vars.data.time[i] = parseInt(vars.data.time[i])
    }
    vars.data.time = vars.data.time.filter(function(t){ return t; })
    vars.data.time.sort()

    if (vars.data.time.length) {
      if (vars.dev.value) d3plus.console.time(vars.data.time.length+" years")
      vars.data.time.forEach(function(y){
        vars.data.filtered[y] = vars.data.filtered.all.filter(function(d){
          return d3plus.variable.value(vars,d,vars.time.key) == y;
        })
      })
      if (vars.dev.value) d3plus.console.timeEnd(vars.data.time.length+" years")
    }

    if (vars.dev.value) d3plus.console.groupEnd()

  }

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Formats Raw Data
//-------------------------------------------------------------------
d3plus.data.format = function(vars,format) {

  if (!format) var format = "grouped"
  return_data = {}

  if (vars.dev.value) d3plus.console.group("Formatting \""+format+"\" Data")

  vars.id.nesting.forEach(function(depth){

    if (vars.dev.value) d3plus.console.time(depth)

    var level = vars.id.nesting.slice(0,vars.id.nesting.indexOf(depth)+1)

    return_data[depth] = {}
    
    for (y in vars.data.restricted) {

      if (format == "grouped") {
        return_data[depth][y] = d3plus.data.nest(vars,vars.data.restricted[y],level,true)
      }
      else {
        return_data[depth][y] = vars.data.restricted[y]
      }

    }

    if (vars.dev.value) d3plus.console.timeEnd(depth)

  })

  if (vars.dev.value) d3plus.console.groupEnd()

  return return_data

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Load Data using JSON
//------------------------------------------------------------------------------
d3plus.data.json = function(vars,key,next) {

  var url = vars[key].url || vars[key].value

  vars[key].url = url
  vars[key].value = []

  d3.json(url,function(error,data) {

    if (!error && data) {

      if (typeof vars[key].callback == "function") {
        var ret = vars[key].callback(data)
        if (ret) {
          if (typeof ret == "object" && !(ret instanceof Array) && key in ret) {
            for (k in ret) {
              if (k in vars) {
                vars[k].value = ret[k]
              }
            }
          }
          else {
            vars[key].value = ret
          }
        }
      }
      else {
        vars[key].value = data
      }

    }
    else {
      vars.internal_error = "Could not load data from: \""+url+"\""
    }

    next()

  })

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Get Key Types from Data
//-------------------------------------------------------------------
d3plus.data.keys = function(vars,type) {

  if (vars.dev.value) d3plus.console.time("key analysis")

  vars[type].keys = {}

  function get_keys(arr,add) {
    if (arr instanceof Array) {
      arr.forEach(function(d){
        get_keys(d)
      })
    }
    else if (typeof arr == "object") {
      for (var d in arr) {
        if (typeof arr[d] == "object") {
          get_keys(arr[d])
        }
        else if (!(d in vars[type].keys) && arr[d]) {
          vars[type].keys[d] = typeof arr[d]
        }
      }
      if (add) {
        arr.d3plus = {}
      }
    }
  }

  if (typeof vars[type].value == "object") {
    for (a in vars[type].value) {
      get_keys(vars[type].value[a],type == "data")
    }
  }
  else {
    get_keys(vars[type].value,type == "data")
  }

  if (vars.dev.value) d3plus.console.timeEnd("key analysis")

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Nests data...
//-------------------------------------------------------------------
d3plus.data.nest = function(vars,flat_data,levels,grouped) {

  var nested_data = d3.nest(), group_data = [];

  var checks = ["active","temp","total"]

  levels.forEach(function(nest_key, i){

    nested_data
      .key(function(d){
        return d3plus.variable.value(vars,d,nest_key)
      })

    vars.axes.values.forEach(function(axis){
      if (d3plus.apps[vars.type.value].requirements && d3plus.apps[vars.type.value].requirements.indexOf(axis) >= 0 && vars[axis].key && vars[axis].scale.value == "continuous") {
        nested_data
          .key(function(d){
            return d3plus.variable.value(vars,d,vars[axis].key)
          })
      }
    })

    if (i == levels.length-1) {

      nested_data.rollup(function(leaves){

        to_return = {
          "d3plus": {
            "depth": i
          }
        }

        checks.forEach(function(c){
          var key = vars[c].key ? vars[c].key : c
          to_return[key] = d3.sum(leaves, function(d){
            if (vars[c].key) {
              var a = d3plus.variable.value(vars,d,vars[c].key)
              if (typeof a != "number") {
                var a = a ? 1 : 0
              }
            }
            else if (c == "total") {
              var a = 1
            }
            else {
              var a = 0
            }
            return a
          })
          to_return.d3plus[key] = to_return[key]
        })

        var nest_obj = d3plus.variable.value(vars,leaves[0],nest_key)
        to_return[nest_key] = nest_obj

        for (key in vars.data.keys) {
          if (((levels.indexOf(nest_key) >= 0 && levels.indexOf(key) <= levels.indexOf(nest_key)) || (vars.id.nesting.indexOf(nest_key) >= 0 && vars.id.nesting.indexOf(key) <= vars.id.nesting.indexOf(nest_key)))
            && key in leaves[0]
            && (!vars.active.key || key != vars.active.key) && key != "d3plus") {
            if (typeof vars.aggs.value[key] == "function") {
              to_return[key] = vars.aggs.value[key](leaves)
            }
            else if (typeof vars.aggs.value[key] == "string") {
              to_return[key] = d3[vars.aggs.value[key]](leaves, function(d){ return d[key]; })
            }
            else if ([vars.time.key,vars.icon].indexOf(key) >= 0 || (key == nest_key && !to_return[key]) || (vars.x.key == key && vars.x.scale.value == "continuous") || (vars.y.key == key && vars.y.scale.value == "continuous")) {
              to_return[key] = leaves[0][key];
            }
            else if (vars.data.keys[key] === "number" && vars.id.nesting.indexOf(key) < 0) {
              to_return[key] = d3.sum(leaves, function(d){ return d[key]; })
            }
            else if (key) {
              to_return[key] = leaves[0][key]
            }
          }
        }

        if (grouped) {
          group_data.push(to_return)
        }

        return to_return

      })
    }

  })

  rename_key_value = function(obj) {
    if (obj.values && obj.values.length) {
      obj.children = obj.values.map(function(obj) {
        return rename_key_value(obj);
      })
      delete obj.values
      return obj
    }
    else if(obj.values) {
      return obj.values
    }
    else {
      return obj;
    }
  }

  find_keys = function(obj,depth,keys) {
    if (obj.children) {
      if (vars.data.keys[levels[depth]] == "number") {
        obj.key = parseFloat(obj.key)
      }
      keys[levels[depth]] = obj.key
      delete obj.key
      for (k in keys) {
        obj[k] = keys[k]
      }
      depth++
      obj.children.forEach(function(c){
        find_keys(c,depth,keys)
      })
    }
  }

  nested_data = nested_data
    .entries(flat_data)
    .map(rename_key_value)
    .map(function(obj){
      find_keys(obj,0,{})
      return obj
    })

  if (grouped) {
    return group_data
  }

  return nested_data;

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Calculates node positions, if needed for network
//-------------------------------------------------------------------
d3plus.data.nodes = function(vars) {

  var set = vars.nodes.value.filter(function(n){
    return typeof n.x == "number" && typeof n.y == "number"
  }).length

  if (set == vars.nodes.value.length) {
    vars.nodes.positions = true
  }
  else {

    var force = d3.layout.force()
      .size([vars.app_width,vars.app_height])
      .nodes(vars.nodes.value)
      .links(vars.edges.value)

    var iterations = 50,
        threshold = 0.01;

    force.start(); // Defaults to alpha = 0.1
    for (var i = iterations; i > 0; --i) {
      force.tick();
      if(force.alpha() < threshold) {
        break;
      }
    }
    force.stop();

    vars.nodes.positions = true

  }

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Restricts data based on Solo/Mute filters
//------------------------------------------------------------------------------
d3plus.data.restrict = function(vars) {

  vars.filtered = true

  // if "solo", only check against "solo" (disregard "mute")
  var key = vars.solo.length ? "solo" : "mute"

  vars.data.grouped = null
  vars.data.restricted = {}

  if (vars[key].length) {
    
    // start restricting based on "filtered" data
    var data = "filtered"

    vars[key].forEach(function(v){

      if (vars.dev.value) d3plus.console.time(v)

      function test_value(val) {

        if (!(vars[v][key] instanceof Array)) {
          var arr = vars[v][key].value
        }
        else {
          var arr = vars[v][key]
        }

        if (v == "id" && key == "solo" && vars.focus.value && arr.indexOf(vars.focus.value) < 0) {
          arr.push(vars.focus.value)
        }

        var match = false
        arr.forEach(function(f){
          if (typeof f == "function") {
            match = f(val)
          }
          else if (f == val) {
            match = true
          }

        })

        return match
      }

      function nest_check(d) {

        // if the variable has nesting, check all levels
        var match = false

        if (vars[v].nesting) {
          vars[v].nesting.forEach(function(n){
            if (!match) {
              match = test_value(d3plus.variable.value(vars,d,n))
            }
          })
        }
        else {
          var k = vars[v].value ? vars[v].value : vars[v].key
          match = test_value(d3plus.variable.value(vars,d,k))
        }

        if (key == "solo") {
          return match
        }
        else if (key == "mute") {
          return !match
        }

      }

      for (y in vars.data[data]) {
        vars.data.restricted[y] = vars.data[data][y].filter(nest_check)
      }

      if (v == "id") {

        if (vars.nodes.value) {
          if (vars.dev.value) d3plus.console.log("Filtering Nodes")
          vars.nodes.restricted = vars.nodes.value.filter(nest_check)
        }

        if (vars.edges.value) {
          if (vars.dev.value) d3plus.console.log("Filtering Connections")
          vars.edges.restricted = vars.edges.value.filter(function(d){
            var first_match = nest_check(d[vars.edges.source]),
                second_match = nest_check(d[vars.edges.target])
            return first_match && second_match
          })
        }

      }

      // continue restricting on already "restricted" data
      data = "restricted"

      if (vars.dev.value) d3plus.console.timeEnd(v)

    })

  }
  else {

    vars.data.restricted = vars.data.filtered

  }

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Merges data underneath the size threshold
//-------------------------------------------------------------------
d3plus.data.threshold = function(vars,split) {

  if (!vars.size.threshold) {
    var threshold = 0
  }
  else if (typeof vars.size.threshold === "number") {
    var threshold = vars.size.threshold
  }
  else if (typeof d3plus.apps[vars.type.value].threshold === "number") {
    var threshold = d3plus.apps[vars.type.value].threshold
  }
  else {
    var threshold = 0.02
  }

  if (typeof threshold == "number" && threshold > 0) {

    var allowed = [],
        cutoff = vars.depth.value == 0 ? 0 : {},
        removed = [],
        largest = {}

    var nest = d3.nest()

    if (split) {
      nest
        .key(function(d){
          return d3plus.variable.value(vars,d,split)
        })
    }

    nest
      .rollup(function(leaves){
        var total = leaves.length
        if (vars.aggs[vars.size.key]) {
          if (typeof vars.aggs[vars.size.key] == "function") {
            total = vars.aggs[vars.size.key](leaves)
          }
          else if (typeof vars.aggs[vars.size.key] == "string") {
            total = d3[vars.aggs[vars.size.key]](leaves,function(l){
              return d3plus.variable.value(vars,l,vars.size.key)
            })
          }
        }
        else {
          total = d3.sum(leaves,function(l){
            return d3plus.variable.value(vars,l,vars.size.key)
          })
        }
        var x = split ? d3plus.variable.value(vars,leaves[0],split) : "all"
        largest[x] = total
        return total
      })
      .entries(vars.data.app)

    vars.data.app = vars.data.app.filter(function(d){

      var id = d3plus.variable.value(vars,d,vars.id.key),
          val = d3plus.variable.value(vars,d,vars.size.key),
          x = split ? d3plus.variable.value(vars,d,split) : "all"

      if (allowed.indexOf(id) < 0) {
        if (val/largest[x] >= threshold) {
          allowed.push(id)
        }

      }

      if (allowed.indexOf(id) < 0) {
        if (vars.depth.value == 0) {
          if (val > cutoff) cutoff = val
        }
        else {
          var parent = d[vars.id.nesting[vars.depth.value-1]]
          if (!(parent in cutoff)) cutoff[parent] = 0
          if (val > cutoff[parent]) cutoff[parent] = val
        }
        removed.push(d)
        return false
      }
      else {
        return true
      }

    })

    var levels = vars.id.nesting.slice(0,vars.depth.value)
    var nesting = levels.concat([vars.x.key])
    var merged = d3plus.data.nest(vars,removed,nesting,true).filter(function(d){
      return d3plus.variable.value(vars,d,vars.size.key) > 0
    })

    merged.forEach(function(m){

      var parent = vars.id.nesting[vars.depth.value-1]

      m.d3plus = {}

      vars.id.nesting.forEach(function(d,i){

        if (vars.depth.value == i) {
          var prev = m[vars.id.nesting[i-1]]
          if (prev) {
            m[d] = "d3plus_other_"+prev
          }
          else {
            m[d] = "d3plus_other"
          }
        }
        else if (i > vars.depth.value) {
          delete m[d]
        }
      })

      if (vars.color.key && vars.color.type == "string") {
        if (vars.depth.value == 0) {
          m[vars.color.key] = vars.style.color.missing
        }
        else {
          m[vars.color.key] = d3plus.variable.color(vars,m[parent],parent)
        }
      }

      if (vars.icon.key && vars.depth.value != 0) {
        m[vars.icon.key] = d3plus.variable.value(vars,m[parent],vars.icon.key,parent)
        m.d3plus.depth = vars.id.nesting.indexOf(parent)
      }

      if (vars.text.key) {
        if (vars.depth.value == 0) {
          m[vars.text.key] = vars.format("Values")
          m[vars.text.key] += " < "+vars.format(cutoff)
        }
        else {
          var name = d3plus.variable.value(vars,m,vars.text.key,parent)
          m[vars.text.key] = name
          m[vars.text.key] += " < "+vars.format(cutoff[m[parent]],vars.size.key)
        }
        m[vars.text.key] += " ("+vars.format(threshold*100)+"%)"

        m.d3plus.threshold = cutoff
        if (parent) {
          m.d3plus.merged = []
          removed.forEach(function(r){
            if (m[parent] == r[parent]) {
              m.d3plus.merged.push(r[vars.id.key])
            }
          })
        }
        else {
          m.d3plus.merged = d3plus.util.uniques(removed,vars.id.key)
        }

      }

    })

    vars.data.app = vars.data.app.concat(merged)

  }

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Miscellaneous Error Checks
//------------------------------------------------------------------------------
d3plus.draw.app = function(vars) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Draw the specified app
  //-------------------------------------------------------------------
  // Set vars.group to the app's specific group element
  vars.group = vars.g.apps[vars.type.value]
  // Reset mouse events for the app to use
  vars.mouse = {}

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
      "edges": null
    }

  if (returned instanceof Array) {
    vars.returned.nodes = returned
  }
  else if (returned) {
    if (returned.nodes) {
      vars.returned.nodes = returned.nodes
    }
    if (returned.edges) {
      vars.returned.edges = returned.edges
    }
  }

  var nodes = vars.returned.nodes
  if (!nodes || !(nodes instanceof Array) || !nodes.length) {
    if (vars.dev.value) d3plus.console.log("No data returned by app.")
    vars.returned.nodes = []
  }

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// If placing into a new container, remove it's contents
// and check text direction.
//
// Also initialized app width and height.
//------------------------------------------------------------------------------
d3plus.draw.container = function(vars) {

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

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Get overall width and height, if not defined
    //--------------------------------------------------------------------------
    var sizes = ["width","height"]
    sizes.forEach(function(s){
      if (!vars[s].value) {
        function check_parent(element) {

          if (element.tagName == "BODY") {
            var val = window["inner"+s.charAt(0).toUpperCase()+s.slice(1)]
            if (s == "width") {
              val -= parseFloat(d3.select(element).style("margin-left"),10)
              val -= parseFloat(d3.select(element).style("margin-right"),10)
              val -= parseFloat(d3.select(element).style("padding-left"),10)
              val -= parseFloat(d3.select(element).style("padding-right"),10)
            }
            else if (s == "height") {
              val -= parseFloat(d3.select(element).style("margin-top"),10)
              val -= parseFloat(d3.select(element).style("margin-bottom"),10)
              val -= parseFloat(d3.select(element).style("padding-top"),10)
              val -= parseFloat(d3.select(element).style("padding-bottom"),10)
            }
            if (d3.selectAll("body > *:not(script)").size() == 1) {
              d3.select("body").style("overflow","hidden")
            }
            vars[s].value = val
          }
          else {

            var val = parseFloat(d3.select(element).style(s),10)
            if (typeof val == "number" && val > 0) {
              vars[s].value = val
            }
            else if (element.tagName != "BODY") {
              check_parent(element.parentNode)
            }

          }

        }
        check_parent(vars.parent.node())
      }
    })

    vars.parent
      .style("width",vars.width.value+"px")
      .style("height",vars.height.value+"px")

  }

  vars.app_width = vars.width.value;
  vars.app_height = vars.height.value;

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Enter Elements
//------------------------------------------------------------------------------
d3plus.draw.enter = function(vars) {

  // Enter SVG
  vars.svg = vars.parent.selectAll("svg#d3plus").data([0]);
  vars.svg.enter().insert("svg","#d3plus_message")
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

  // Enter Timeline Group
  vars.g.timeline = vars.svg.selectAll("g#timeline").data(["timeline"])
  vars.g.timeline.enter().append("g")
    .attr("id","timeline")
    .attr("transform","translate(0,"+vars.height.value+")")

  // Enter Key Group
  vars.g.legend = vars.svg.selectAll("g#key").data(["key"])
  vars.g.legend.enter().append("g")
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

  // Enter App Background Group
  vars.g.viz = vars.g.zoom.selectAll("g#d3plus_viz").data(["d3plus_viz"])
  vars.g.viz.enter().append("g")
    .attr("id","d3plus_viz")

  // Enter App Overlay Rect
  vars.g.overlay = vars.g.viz.selectAll("rect#d3plus_overlay").data([{"id":"d3plus_overlay"}])
  vars.g.overlay.enter().append("rect")
    .attr("id","d3plus_overlay")
    .attr("width",vars.width.value)
    .attr("height",vars.height.value)
    .attr("opacity",0)

  if (!d3plus.touch) {

    vars.g.overlay
      .on(d3plus.evt.move,function(d){

        if (d.dragging) {

        }
        else if (d3plus.apps[vars.type.value].zoom && vars.zoom.pan.value &&
          vars.zoom_behavior.scaleExtent()[0] < vars.zoom.scale) {
          d3.select(this).style("cursor",d3plus.prefix()+"grab")
        }
        else {
          d3.select(this).style("cursor","auto")
        }

      })
      .on(d3plus.evt.up,function(d){

        if (d3plus.apps[vars.type.value].zoom && vars.zoom.pan.value &&
          vars.zoom_behavior.scaleExtent()[0] < vars.zoom.scale) {
          d.dragging = false
          d3.select(this).style("cursor",d3plus.prefix()+"grab")
        }
        else {
          d3.select(this).style("cursor","auto")
        }

      })
      .on(d3plus.evt.down,function(d){

        if (d3plus.apps[vars.type.value].zoom && vars.zoom.pan.value &&
          vars.zoom_behavior.scaleExtent()[0] < vars.zoom.scale) {
          d.dragging = true
          d3.select(this).style("cursor",d3plus.prefix()+"grabbing")
        }
        else {
          d3.select(this).style("cursor","auto")
        }

      })

  }
  else {

    vars.g.overlay
      .on(d3plus.evt.over,vars.touchEvent)
      .on(d3plus.evt.move,vars.touchEvent)
      .on(d3plus.evt.out,vars.touchEvent)

  }

  // Enter App Background Group
  vars.g.app = vars.g.viz.selectAll("g#app").data(["app"])
  vars.g.app.enter().append("g")
    .attr("id","app")

  // Enter Edges Group
  vars.g.edges = vars.g.viz.selectAll("g#edges").data(["edges"])
  vars.g.edges.enter().append("g")
    .attr("id","edges")
    .attr("opacity",0)

  // Enter Edge Focus Group
  vars.g.edge_focus = vars.g.viz.selectAll("g#focus").data(["focus"])
  vars.g.edge_focus.enter().append("g")
    .attr("id","focus")

  // Enter Edge Hover Group
  vars.g.edge_hover = vars.g.viz.selectAll("g#edge_hover").data(["edge_hover"])
  vars.g.edge_hover.enter().append("g")
    .attr("id","edge_hover")
    .attr("opacity",0)

  // Enter App Data Group
  vars.g.data = vars.g.viz.selectAll("g#data").data(["data"])
  vars.g.data.enter().append("g")
    .attr("id","data")
    .attr("opacity",0)

  // Enter Data Focus Group
  vars.g.data_focus = vars.g.viz.selectAll("g#data_focus").data(["data_focus"])
  vars.g.data_focus.enter().append("g")
    .attr("id","data_focus")

  // Enter Top Label Group
  vars.g.labels = vars.g.viz.selectAll("g#d3plus_labels").data(["d3plus_labels"])
  vars.g.labels.enter().append("g")
    .attr("id","d3plus_labels")

  vars.defs = vars.svg.selectAll("defs").data(["defs"])
  vars.defs.enter().append("defs")

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Miscellaneous Error Checks
//------------------------------------------------------------------------------
d3plus.draw.errors = function(vars) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Check to see if we have all required variables set
  //----------------------------------------------------------------------------
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

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Check to see if we have focus connections, if needed
  //----------------------------------------------------------------------------
  if (!vars.internal_error && reqs.indexOf("edges") >= 0 && reqs.indexOf("focus") >= 0) {
    var connections = vars.connections(vars.focus.value)
    if (connections.length == 0) {
      var name = d3plus.variable.text(vars,vars.focus.value,vars.depth.value)
      vars.internal_error = "No Connections Available for \""+name+"\""
    }
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Check to see if we have all required libraries
  //----------------------------------------------------------------------------
  var reqs = ["d3"]
  if (d3plus.apps[vars.type.value].libs) {
    reqs = reqs.concat(d3plus.apps[vars.type.value].libs)
  }
  var missing = []
  reqs.forEach(function(r){
    if (!window[r]) missing.push(r)
  })
  if (missing.length) {
    var libs = missing.join(", ")
    vars.internal_error = "The following libraries need to be loaded: "+libs
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Check to see if the requested app supports the set shape
  //----------------------------------------------------------------------------
  if (!vars.shape.value) {
    vars.shape.value = d3plus.apps[vars.type.value].shapes[0]
  }
  else if (d3plus.apps[vars.type.value].shapes.indexOf(vars.shape.value) < 0) {
    var shapes = d3plus.apps[vars.type.value].shapes.join("\", \"")
    d3plus.console.warning("\""+vars.shape.value+"\" is not an accepted shape for the \""+vars.type.value+"\" app, please use one of the following: \""+shapes+"\"")
    vars.shape.previous = vars.shape.value
    vars.shape.value = d3plus.apps[vars.type.value].shapes[0]
    d3plus.console.log("Defaulting shape to \""+vars.shape.value+"\"")
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Check to see if the requested app supports the set "mode"
  //----------------------------------------------------------------------------
  if ("modes" in d3plus.apps[vars.type.value]) {
    if (!vars.type.mode.value) {
      vars.type.mode.value = d3plus.apps[vars.type.value].modes[0]
    }
    else if (d3plus.apps[vars.type.value].modes.indexOf(vars.type.mode.value) < 0) {
      var modes = d3plus.apps[vars.type.value].modes.join("\", \"")
      d3plus.console.warning("\""+vars.type.mode.value+"\" is not an accepted mode for the \""+vars.type.value+"\" app, please use one of the following: \""+modes+"\"")
      vars.type.mode.previous = vars.type.mode.value
      vars.type.mode.value = d3plus.apps[vars.type.value].modes[0]
      d3plus.console.log("Defaulting mode to \""+vars.type.mode.value+"\"")
    }
  }

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Finalize Visualization
//------------------------------------------------------------------------------
d3plus.draw.finish = function(vars) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Zoom to fit bounds, if applicable
  //----------------------------------------------------------------------------
  if (d3plus.apps[vars.type.value].zoom && vars.zoom.value) {

    if (vars.dev.value) d3plus.console.time("calculating zoom")

    if (!vars.init && vars.zoom.bounds) {
      d3plus.zoom.bounds(vars,vars.zoom.bounds,0)
    }

    if (vars.focus.changed || vars.height.changed || vars.width.changed) {
      if (!vars.zoom.viewport) {
        d3plus.zoom.bounds(vars,vars.zoom.bounds)
      }
      else {
        d3plus.zoom.bounds(vars,vars.zoom.viewport)
      }
    }

    if (vars.dev.value) d3plus.console.timeEnd("calculating zoom")

  }
  else {
    vars.zoom.scale = 1
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Resize/Reposition Overlay Rect for Mouse events
  //----------------------------------------------------------------------------
  var w = vars.zoom.size ? vars.zoom.size.width : vars.app_width,
      h = vars.zoom.size ? vars.zoom.size.height : vars.app_height,
      x = vars.zoom.bounds ? vars.zoom.bounds[0][0] : 0,
      y = vars.zoom.bounds ? vars.zoom.bounds[0][1] : 0

  vars.g.overlay
    .attr("width",w)
    .attr("height",h)
    .attr("x",x)
    .attr("y",y)

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Create labels
  //----------------------------------------------------------------------------
  if (vars.update) {
    d3plus.shape.edges(vars)
    if (vars.timing || (!d3plus.apps[vars.type.value].zoom && !vars.timing)) {
      if (vars.dev.value) d3plus.console.time("data labels")
      d3plus.shape.labels(vars,vars.g.data.selectAll("g"))
      if (vars.dev.value) d3plus.console.timeEnd("data labels")
      if (vars.edges.label) {

        setTimeout(function(){
          if (vars.dev.value) d3plus.console.time("edge labels")
          d3plus.shape.labels(vars,vars.g.edges.selectAll("g"))
          if (vars.dev.value) d3plus.console.timeEnd("edge labels")
        },vars.timing)

      }
    }
  }
  else if (d3plus.apps[vars.type.value].zoom && vars.zoom.value && vars.timing) {
    setTimeout(function(){
      d3plus.zoom.labels(vars)
    },vars.timing)
  }

  if (d3plus.apps[vars.type.value].zoom && vars.zoom.value && vars.focus.value && !vars.timing) {
    if (vars.dev.value) d3plus.console.time("focus labels")
    d3plus.shape.labels(vars,vars.g.data_focus.selectAll("g"))
    if (vars.edges.label) {

      setTimeout(function(){
        d3plus.shape.labels(vars,vars.g.edge_focus.selectAll("g"))
      },vars.timing)

    }
    if (vars.dev.value) d3plus.console.timeEnd("focus labels")
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Check for Errors
  //----------------------------------------------------------------------------
  if (!vars.internal_error) {
    var data_req = d3plus.apps[vars.type.value].requirements.indexOf("data") >= 0
    if ((!vars.data.app || !vars.returned.nodes.length) && data_req) {
      vars.internal_error = "No Data Available"
    }
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Hide the previous app, if applicable
  //----------------------------------------------------------------------------
  var prev = vars.type.previous
  if (prev && vars.type.value != prev && vars.g.apps[prev]) {
    if (vars.dev.value) d3plus.console.group("Hiding \"" + prev + "\"")
    if (vars.timing) {
      vars.g.apps[prev].transition().duration(vars.timing)
        .attr("opacity",0)
    }
    else {
      vars.g.apps[prev].attr("opacity",0)
    }
    if (vars.dev.value) d3plus.console.groupEnd();
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Show the current app, data, and edges groups
  //----------------------------------------------------------------------------
  var data_req = d3plus.apps[vars.type.value].requirements.indexOf("data") >= 0,
      new_opacity = (data_req && vars.data.app.length == 0) || vars.internal_error
        ? 0 : vars.focus.value && d3plus.apps[vars.type.value].zoom && vars.zoom.value ? 0.4 : 1,
      old_opacity = vars.group.attr("opacity")

  if (new_opacity != old_opacity) {

    var timing = vars.style.timing.transitions

    vars.group.transition().duration(timing)
      .attr("opacity",new_opacity)
    vars.g.data.transition().duration(timing)
      .attr("opacity",new_opacity)
    vars.g.edges.transition().duration(timing)
      .attr("opacity",new_opacity)

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Reset all "changed" values to false
  //----------------------------------------------------------------------------
  function reset_change(obj) {

    if (obj.changed) obj.changed = false

    for (o in obj) {
      if (obj[o] != null && typeof obj[o] == "object" && !(obj[o] instanceof Array)) {
        reset_change(obj[o])
      }
    }

  }
  reset_change(vars)

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Display and reset internal_error, if applicable
  //----------------------------------------------------------------------------
  if (vars.internal_error) {
    d3plus.ui.message(vars,vars.internal_error)
    vars.internal_error = null
  }
  else {
    d3plus.ui.message(vars)
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Unfreeze controls and apply zoom behavior, if applicable
  //----------------------------------------------------------------------------
  setTimeout(function(){

    vars.frozen = false
    vars.update = true
    vars.init = true

    if (d3plus.apps[vars.type.value].zoom && vars.zoom.value) {
      vars.g.zoom
        .datum(vars)
        .call(vars.zoom_behavior.on("zoom",d3plus.zoom.mouse))
      if (!vars.zoom.scroll.value) {
        vars.g.zoom.on("wheel.zoom",null)
      }
      if (!vars.zoom.click.value) {
        vars.g.zoom.on("dblclick.zoom",null)
      }
      if (!vars.zoom.pan.value) {
        vars.g.zoom.on("mousemove.zoom",null)
        vars.g.zoom.on("mousedown.zoom",null)
      }
    }
    else {
      vars.g.zoom
        .call(vars.zoom_behavior.on("zoom",null))
    }

  },vars.timing)

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates focus elements, if available
//------------------------------------------------------------------------------
d3plus.draw.focus = function(vars) {

  vars.g.edge_focus
    .selectAll("g")
    .remove()

  vars.g.data_focus
    .selectAll("g")
    .remove()

  if (vars.focus.value && d3plus.apps[vars.type.value].zoom && vars.zoom.value) {

    if (vars.dev.value) d3plus.console.time("drawing focus elements")

    var edges = vars.g.edges.selectAll("g")

    if (edges.size() > 0) {

      edges.each(function(l){

          var source = l[vars.edges.source][vars.id.key],
              target = l[vars.edges.target][vars.id.key]

          if (source == vars.focus.value || target == vars.focus.value) {
            var elem = vars.g.edge_focus.node().appendChild(this.cloneNode(true))
            d3.select(elem).datum(l).attr("opacity",1)
              .selectAll("line, path").datum(l)
          }

        })


      var marker = vars.edges.arrows.value

      vars.g.edge_focus.selectAll("line, path")
        .attr("vector-effect","non-scaling-stroke")
        .style("stroke",vars.style.highlight.focus)
        .style("stroke-width",function(){
          return vars.edges.size ? d3.select(this).style("stroke-width")
               : vars.style.data.stroke.width*2
        })
        .attr("marker-start",function(e){

          var direction = vars.edges.arrows.direction.value

          if ("bucket" in e.d3plus) {
            var d = "_"+e.d3plus.bucket
          }
          else {
            var d = ""
          }
          // console.log(e.d3plus,d)
          return direction == "source" && marker
               ? "url(#d3plus_edge_marker_focus"+d+")" : "none"

        })
        .attr("marker-end",function(e){

          var direction = vars.edges.arrows.direction.value

          if ("bucket" in e.d3plus) {
            var d = "_"+e.d3plus.bucket
          }
          else {
            var d = ""
          }

          return direction == "target" && marker
               ? "url(#d3plus_edge_marker_focus"+d+")" : "none"

        })

      vars.g.edge_focus.selectAll("text")
        .style("fill",vars.style.highlight.focus)

    }

    var focii = d3plus.util.uniques(vars.connections(vars.focus.value,true),vars.id.key)
    focii.push(vars.focus.value)

    var x_bounds = [], y_bounds = [], x_buffer = [0], y_buffer = [0]

    var groups = vars.g.data.selectAll("g")
      .each(function(d){
        if (focii.indexOf(d[vars.id.key]) >= 0) {
          var elem = vars.g.data_focus.node().appendChild(this.cloneNode(true))
          var elem = d3.select(elem).datum(d).attr("opacity",1)

          if (vars.shape.value == "coordinates") {

            vars.zoom.viewport = vars.path.bounds(vars.zoom.coords[d.d3plus.id])

          }
          else if ("d3plus" in d) {
            if ("x" in d.d3plus) {
              x_bounds.push(d.d3plus.x)
            }
            if ("y" in d.d3plus) {
              y_bounds.push(d.d3plus.y)
            }
            if ("r" in d.d3plus) {
              x_buffer.push(d.d3plus.r)
              y_buffer.push(d.d3plus.r)
            }
            else {
              if ("width" in d.d3plus) {
                x_buffer.push(d.d3plus.width/2)
              }
              if ("height" in d.d3plus) {
                y_buffer.push(d.d3plus.height/2)
              }
            }
          }

          for (e in d3plus.evt) {
            var evt = d3.select(this).on(d3plus.evt[e])
            if (evt) {
              elem.on(d3plus.evt[e],evt)
            }
          }

        }
      })

    if (x_bounds.length && y_bounds.length) {

      var xcoords = d3.extent(x_bounds),
          ycoords = d3.extent(y_bounds),
          xmax = d3.max(x_buffer),
          ymax = d3.max(y_buffer)

      vars.zoom.viewport = [
        [xcoords[0]-xmax,ycoords[0]-ymax],
        [xcoords[1]+xmax,ycoords[1]+ymax]
      ]

    }

    vars.g.data_focus.selectAll("path")
      .style("stroke-width",vars.style.data.stroke.width*2)

    if (vars.dev.value) d3plus.console.timeEnd("drawing focus elements")

  }
  else {
    vars.zoom.viewport = null
  }

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Calculate steps needed to redraw the visualization
//------------------------------------------------------------------------------
d3plus.draw.steps = function(vars) {

  var steps = []

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Check to see if any data needs to be loaded with JSON
  //----------------------------------------------------------------------------
  var urlLoads = ["data","attrs","coords","nodes","edges"]
  urlLoads.forEach(function(u){
    if (typeof vars[u].value == "string" || (!vars[u].value && vars[u].url)) {

      steps.push({
        "function": function(vars,next){
          d3plus.data.json(vars,u,next)
        },
        "message": "Loading Data",
        "wait": true
      })

    }
  })

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // If it has one, run the current app's setup function.
  //----------------------------------------------------------------------------
  steps.push({
    "check": function(vars) {
      return vars.update && typeof d3plus.apps[vars.type.value].setup == "function"
    },
    "function": d3plus.apps[vars.type.value].setup,
    "message": "Initializing \""+vars.type.value+"\""
  })

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Remove any lingering tooltips.
  //----------------------------------------------------------------------------
  steps.push({
    "function": function(vars) {
      if (vars.type.previous && vars.type.value != vars.type.previous) {
        d3plus.tooltip.remove(vars.type.previous);
      }
      d3plus.tooltip.remove(vars.type.value);
    },
    "message": "Resetting Tooltips"
  })

  if (vars.update) {

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Create SVG group elements if the container is new or has changed
    //--------------------------------------------------------------------------
    steps.push({
      "check": function(vars) {
        return vars.container.changed
      },
      "function": d3plus.draw.enter,
      "message": "Creating SVG Elements"
    })

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Create group for current app, if it doesn't exist.
    //--------------------------------------------------------------------------
    steps.push({
      "check": function(vars) {
        return !(vars.type.value in vars.g.apps)
      },
      "function": function(vars) {

        vars.g.apps[vars.type.value] = vars.g.app
          .selectAll("g#"+vars.type.value)
          .data([vars.type.value])

        vars.g.apps[vars.type.value].enter().append("g")
          .attr("id",vars.type.value)
          .attr("opacity",0)

      },
      "message": "Creating \""+vars.type.value+"\" Group"
    })

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // If new data is detected, analyze and reset it.
    //--------------------------------------------------------------------------
    steps.push({
      "check": function(vars) {
        return vars.data.changed
      },
      "function": function(vars) {

        vars.data.filtered = null
        vars.data.grouped = null
        vars.data.app = null
        vars.data.restricted = null
        vars.nodes.restricted = null
        vars.edges.restricted = null

        d3plus.data.keys(vars,"data")

      },
      "message": "Analyzing New Data"
    })

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // If new attributes are detected, analyze them.
    //--------------------------------------------------------------------------
    steps.push({
      "check": function(vars) {
        return vars.attrs.changed
      },
      "function": function(vars) {

        d3plus.data.keys(vars,"attrs")

      },
      "message": "Analyzing New Attributes"
    })

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Format nodes/edges if needed
    //--------------------------------------------------------------------------
    steps.push({
      "check": function(vars) {
        var edge_req = d3plus.apps[vars.type.value].requirements.indexOf("edges") >= 0
        return (!vars.edges.linked || vars.edges.changed)
          && edge_req && vars.edges.value
      },
      "function": d3plus.data.edges,
      "message": "Analyzing Network"
    })
    steps.push({
      "check": function(vars) {
        var node_req = d3plus.apps[vars.type.value].requirements.indexOf("nodes") >= 0
        return node_req && (!vars.nodes.positions || vars.nodes.changed)
          && vars.nodes.value && vars.edges.value
      },
      "function": d3plus.data.nodes,
      "message": "Analyzing Network"
    })

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Filter Data if variables with "data_filter" have been changed
    //--------------------------------------------------------------------------
    steps.push({
      "check": function(vars) {

        vars.check = []
        for (k in vars) {
          if (vars[k] && vars[k]["data_filter"] && vars[k].changed) {
            vars.check.push(k)
          }
        }

        return !vars.data.filtered || vars.check.length || vars.active.changed ||
          vars.temp.changed || vars.total.changed
      },
      "function": function(vars) {

        vars.data.grouped = null
        vars.data.app = null;

        d3plus.data.filter(vars)

      },
      "message": "Filtering Data"
    })

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Restricts Filtered Data if objects have "Solo" or "Mute"
    //--------------------------------------------------------------------------
    steps.push({
      "check": function(vars) {
        return vars.mute.length > 0 || vars.solo.length > 0
      },
      "function": d3plus.data.restrict,
      "message": "Filtering Data",
      "otherwise": function(vars) {

        if (vars.filtered || !vars.data.restricted || vars.check.length) {

          vars.data.restricted = d3plus.util.copy(vars.data.filtered)
          vars.data.grouped = null
          vars.data.app = null
          vars.nodes.restricted = null
          vars.edges.restricted = null
          vars.filtered = false

        }

      }
    })

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Formats Data to type "group", if it does not exist.
    //--------------------------------------------------------------------------
    steps.push({
      "check": function(vars) {
        return !vars.data.grouped
      },
      "function": function(vars) {
        vars.data.grouped = d3plus.data.format(vars,"grouped")
      },
      "message": "Formatting Data"
    })

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Fetches data "pool" to use for scales and overall values
    //--------------------------------------------------------------------------
    steps.push({
      "check": function(vars) {
        var year = !vars.time.fixed.value ? ["all"] : null
        return (year === null && (vars.time.solo.changed || vars.time.mute.changed || vars.depth.changed)) || !vars.data.pool
          || typeof d3plus.apps[vars.type.value].filter == "function"
      },
      "function": function(vars) {
        var year = !vars.time.fixed.value ? ["all"] : null
        vars.data.pool = d3plus.data.fetch(vars,"grouped",year)
        if (typeof d3plus.apps[vars.type.value].filter == "function") {
          vars.data.pool = d3plus.apps[vars.type.value].filter(vars,vars.data.pool)
        }
      },
      "message": "Formatting Data"
    })

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Fetch the correct Data for the App
    //--------------------------------------------------------------------------
    steps.push({
      "check": function(vars) {
        return !vars.data.app || vars.depth.changed ||
            vars.time.solo.changed || vars.time.mute.changed ||
            vars.solo.length || vars.mute.length
            || typeof d3plus.apps[vars.type.value].filter == "function"
      },
      "function": function(vars) {
        vars.data.app = d3plus.data.fetch(vars,"grouped")
        if (typeof d3plus.apps[vars.type.value].filter == "function") {
          vars.data.app = d3plus.apps[vars.type.value].filter(vars,vars.data.app)
        }
      },
      "message": "Formatting Data"
    })

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Calculate color scale if type is number
    //--------------------------------------------------------------------------
    steps.push({
      "check": function(vars) {

        if (vars.color.changed && vars.color.key) {

          if (typeof vars.color.key == "object") {
            if (vars.color.key[vars.id.key]) {
              var color_id = vars.color.key[vars.id.key]
            }
            else {
              var color_id = vars.color.key[Object.keys(vars.color.key)[0]]
            }
          }
          else {
            var color_id = vars.color.key
          }

          if (vars.data.keys && color_id in vars.data.keys) {
            vars.color.type = vars.data.keys[color_id]
          }
          else if (vars.attrs.keys && color_id in vars.attrs.keys) {
            vars.color.type = vars.attrs.keys[color_id]
          }
          else {
            vars.color.type = undefined
          }

        }
        else if (!vars.color.key) {
          vars.color.type = vars.data.keys[vars.id.key]
        }

        return vars.color.key && vars.color.type == "number" &&
              vars.data.value && vars.color.key != vars.id.key &&
                (vars.color.changed || vars.data.changed || vars.depth.changed ||
                  (vars.time.fixed.value &&
                    (vars.time.solo.changed || vars.time.mute.changed)
                  )
                )

      },
      "function": d3plus.data.color,
      "message": "Calculating Colors",
      "otherwise": function(vars) {
        if (vars.color.type != "number") {
          vars.color.scale = null
        }
      }
    })

  }

  steps.push({
    "function": function(vars) {
      vars.margin = {"top": 0, "right": 0, "bottom": 0, "left": 0}
      d3plus.ui.titles(vars)

      if (vars.update) {

        d3plus.ui.timeline(vars)
        d3plus.ui.legend(vars)

      }
      else {

        var timeline = vars.g.timeline.node().getBBox()
        timeline = timeline.height+timeline.y

        var legend = vars.g.legend.node().getBBox()
        legend = legend.height+legend.y

        if (legend && timeline) {
          var padding = vars.style.ui.padding*3
        }
        else if (legend || timeline) {
          var padding = vars.style.ui.padding*2
        }
        else {
          var padding = 0
        }

        vars.margin.bottom += timeline+legend+padding

      }

      d3plus.ui.history(vars)
      vars.app_height -= (vars.margin.top+vars.margin.bottom)
    },
    "message": "Updating UI"
  })

  steps.push({
    "function": [
      d3plus.ui.focus,
      d3plus.draw.update
    ],
    "message": "Updating UI"
  })

  steps.push({
    "function": function(vars) {
      if (vars.update) {
        d3plus.draw.errors(vars)
        d3plus.draw.app(vars)
        d3plus.shape.draw(vars)
      }
      d3plus.draw.focus(vars)
      d3plus.draw.finish(vars)
    },
    "message": "Drawing Visualization"
  })

  return steps

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Updating Elements
//------------------------------------------------------------------------------
d3plus.draw.update = function(vars) {

  if (vars.timing) {

    // Update Parent Element
    vars.parent.transition().duration(vars.timing)
      .style("width",vars.width.value+"px")
      .style("height",vars.height.value+"px")

    // Update SVG
    vars.svg.transition().duration(vars.timing)
        .attr("width",vars.width.value)
        .attr("height",vars.height.value)

    // Update Background Rectangle
    vars.g.bg.transition().duration(vars.timing)
        .attr("width",vars.width.value)
        .attr("height",vars.height.value)

    // Update App Clipping Rectangle
    vars.g.clipping.select("rect").transition().duration(vars.timing)
      .attr("width",vars.app_width)
      .attr("height",vars.app_height)

    // Update Container Groups
    vars.g.container.transition().duration(vars.timing)
      .attr("transform","translate("+vars.margin.left+","+vars.margin.top+")")

  }
  else {

    // Update Parent Element
    vars.parent
      .style("width",vars.width.value+"px")
      .style("height",vars.height.value+"px")

    // Update SVG
    vars.svg
      .attr("width",vars.width.value)
      .attr("height",vars.height.value)

    // Update Background Rectangle
    vars.g.bg
      .attr("width",vars.width.value)
      .attr("height",vars.height.value)

    // Update App Clipping Rectangle
    vars.g.clipping.select("rect")
      .attr("width",vars.app_width)
      .attr("height",vars.app_height)

    // Update Container Groups
    vars.g.container
      .attr("transform","translate("+vars.margin.left+","+vars.margin.top+")")

  }

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Detects if FontAwesome is loaded on the page
//------------------------------------------------------------------------------
d3plus.font.awesome = false
for (var s = 0; s < document.styleSheets.length; s++) {
  var sheet = document.styleSheets[s]
  if (sheet.href && sheet.href.indexOf("font-awesome") >= 0) {
    d3plus.font.awesome = true
    break;
  }
}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates test div to populate with test DIVs
//------------------------------------------------------------------------------
d3plus.font.tester = function() {

  var tester = d3.select("body").selectAll("div.d3plus_tester")
    .data(["d3plus_tester"])

  tester.enter().append("div")
    .attr("class","d3plus_tester")
    .style("position","absolute")
    .style("left","-9999px")
    .style("top","-9999px")
    .style("visibility","hidden")
    .style("display","block")

  return tester

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Given a single font or a list of font, determines which can be rendered
//------------------------------------------------------------------------------
d3plus.font.validate = function(test_fonts) {

  if (!(test_fonts instanceof Array)) {
    test_fonts = test_fonts.split(",")
  }

  var tester = d3plus.font.tester()

  function create_element(font) {

    return tester.append("span")
      .style("font-family",font)
      .style("font-size","32px")
      .style("padding","0px")
      .style("margin","0px")
      .text("abcdefghiABCDEFGHI_!@#$%^&*()_+1234567890")

  }

  function different(elem1,elem2) {

    var width1 = elem1.node().offsetWidth,
        width2 = elem2.node().offsetWidth

    return width1 !== width2

  }

  var monospace = create_element("monospace"),
      proportional = create_element("sans-serif")

  for (font in test_fonts) {

    var family = test_fonts[font].trim()

    var test = create_element(family+",monospace")

    var valid = different(test,monospace)
    test.remove()

    if (!valid) {
      var test = create_element(family+",sans-serif")
      valid = different(test,proportional)
      test.remove()
    }

    if (valid) {
      valid = family
      break;
    }

  }

  if (!valid) {
    valid = "sans-serif"
  }

  monospace.remove()
  proportional.remove()

  return valid

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates a Button
//------------------------------------------------------------------------------
d3plus.forms.button = function(vars,styles,timing) {

  if (vars.dev) d3plus.console.time("calculating borders and padding")
  if (styles.border == "all") {
    var border_width = styles.stroke+"px",
        padding = styles.padding+"px"
  }
  else {
    var sides = ["top","right","bottom","left"]
    var border_width = "", padding = ""
    sides.forEach(function(s,i){
      if (styles.border.indexOf(s) >= 0) {
        border_width += styles.stroke+"px"
        padding += styles.padding+"px"
      }
      else {
        border_width += "0px"
        padding += (styles.padding+styles.stroke)+"px"
      }
      if (i < sides.length-1) {
        border_width += " "
        padding += " "
      }
    })
  }

  var reversed = (styles["font-align"] == "right" && !d3plus.rtl) || (d3plus.rtl && styles["font-align"] == "right")
  if (vars.dev) d3plus.console.timeEnd("calculating borders and padding")

  var color = function(elem) {

    elem
      .style("background-color",function(d){

        if (vars.highlight != d.value) {
          if (vars.hover == d.value) {
            if (vars.highlight) {
              d.bg = d3plus.color.darker(styles.secondary,.05)
            }
            else {
              d.bg = d3plus.color.darker(styles.secondary,.05)
            }
          }
          else {
            d.bg = styles.secondary
          }
        }
        else {
          if (vars.hover == d.value && vars.enabled) {
            d.bg = d3plus.color.darker(styles.color,.025)
          }
          else {
            d.bg = styles.color
          }
        }

        return d.bg
      })
      .style("color",function(d){

        var text_color = d3plus.color.text(d.bg),
            image = d.image && button.size() < vars.large

        if (text_color != "#f7f7f7" && vars.selected == d.value && d.color && !image) {
          return d3plus.color.legible(d.color)
        }

        return text_color

      })
      .style("border-color",styles.secondary)
      .style("opacity",function(d){
        if ([vars.selected,vars.highlight].indexOf(d.value) < 0) {
          return 0.75
        }
        return 1
      })

  }

  var style = function(elem) {

    elem
      .style("position","relative")
      .style("margin",styles.margin+"px")
      .style("display",styles.display)
      .style("border-style","solid")
      .style("border-width",border_width)
      .style("font-family",styles["font-family"])
      .style("font-size",styles["font-size"]+"px")
      .style("font-weight",styles["font-weight"])
      .style("text-align",styles["font-align"])
      .style("letter-spacing",styles["font-spacing"]+"px")

  }

  var icons = function(elem) {

    elem
      .text(function(d){
        return d[vars.text]
      })
      .each(function(d,i){

        var children = []

        if (d.image && button.size() < vars.large) {
          children.push("image")
        }

        if (styles.icon) {
          d.icon = d3plus.util.copy(styles.icon)
          children.push("icon")
        }
        else if (d.value === vars.selected) {
          if (d3plus.font.awesome) {
            d.icon = {
              "class": "fa fa-check",
              "content": ""
            }
          }
          else {
            d.icon = {
              "class": "",
              "content": "&#x2713;"
            }
          }
          children.push("icon")
        }

        var buffer = 0

        var items = d3.select(this).selectAll("div.d3plus_button_element")
          .data(children,function(c,i){
            return c
          })

        items.enter().append("div")
          .style("display","absolute")
          .attr("id",function(c){
            return "d3plus_button_element_"+vars.id+"_"+c
          })
          .attr("class",function(c){
            var extra = ""
            if (c == "icon" && d.icon.class) {
              extra = " "+d[c].class
            }
            return "d3plus_button_element" + extra
          })

        items.order()
          .html(function(c){
            if (c == "icon") {
              return d.icon.content
            }
            else {
              return ""
            }
          })
          .style("background-image",function(c){
            if (c == "image") {
              return "url('"+d.image+"')"
            }
            return "none"
          })
          .style("background-color",function(c){
            if (c == "image" && d.style == "knockout") {
              return d.color || vars.color
            }
            return "transparent"
          })
          .style("background-size","100%")
          .style("text-align","center")
          .style("position",function(c){
            return c == "text" ? "static" : "absolute"
          })
          .style("width",function(c){

            if (styles.height) {
              buffer = (styles.height-(styles.padding*2)-(styles.stroke*2))
            }
            else {
              buffer = styles["font-size"]+styles.padding+styles.stroke
            }
            return buffer+"px"
          })
          .style("height",function(c){
            if (c == "image") {
              return buffer+"px"
            }
            return "auto"
          })
          .style("margin-top",function(c){
            if (this.offsetHeight) {
              var h = this.offsetHeight
            }
            else {
              var h = buffer
              if (c == "icon") h -= 3
            }
            return -h/2+"px"
          })
          .style("top","50%")
          .style("left",function(c){
            if ((c == "image" && !reversed) || (c == "icon" && reversed)) {
              return styles.padding+"px"
            }
            return "auto"
          })
          .style("right",function(c){
            if ((c == "image" && reversed) || (c == "icon" && !reversed)) {
              return styles.padding+"px"
            }
            return "auto"
          })

        items.exit().remove()

        if (buffer > 0) {

          buffer += styles.padding*2

          var p = styles.padding

          if (children.length == 2) {
            var padding = p+"px "+buffer+"px"
          }
          else if ((children[0] == "image" && !d3plus.rtl) || (children[0] == "icon" && d3plus.rtl)) {
            var padding = p+"px "+p+"px "+p+"px "+buffer+"px"
          }
          else {
            var padding = p+"px "+buffer+"px "+p+"px "+p+"px"
          }

          d3.select(this).style("padding",padding)

        }
        else {
          d3.select(this).style("padding",styles.padding+"px")
        }

        if (typeof styles.width == "number") {
          var width = styles.width
          width -= parseFloat(d3.select(this).style("padding-left"),10)
          width -= parseFloat(d3.select(this).style("padding-right"),10)
          width -= styles.stroke*2
          width += "px"
        }
        else {
          var width = "auto"
        }

        d3.select(this).style("width",width)

      })

  }

  function mouseevents(elem) {

    elem
      .on(d3plus.evt.over,function(d,i){

        vars.hover = d.value

        if (vars.data.array.length == 1 || d.value != vars.highlight) {

          if (d3plus.ie || vars.timing == 0) {

            d3.select(this).style("cursor","pointer")
              .call(color)

          }
          else {

            d3.select(this).style("cursor","pointer")
              .transition().duration(100)
              .call(color)
          }

        }
        else {
          d3.select(this).style("cursor","auto")
        }

      })
      .on(d3plus.evt.out,function(d){

        vars.hover = false

        if (d3plus.ie || button.size() >= vars.large) {
          d3.select(this).style("cursor","auto")
            .call(color)
        }
        else {
          d3.select(this).style("cursor","auto")
            .transition().duration(100)
            .call(color)
        }

      })
      .on("click",function(d){

        if (!vars.propagation) {
          d3.event.stopPropagation()
        }

        if (vars.callback && d.value) {

          vars.callback(d)

        }

      })

  }

  var button = vars.container.selectAll("div.d3plus_node")
    .data(vars.data.array,function(d){
      return d.id || d.value
    })

  if (vars.dev) d3plus.console.time("enter")
  button.enter().append("div")
    .attr("id","d3plus_button_"+vars.id)
    .attr("class","d3plus_node")
    .call(color)
    .call(style)
    .call(icons)
    .call(mouseevents)
  if (vars.dev) d3plus.console.timeEnd("enter")

  if (vars.update || button.size() < vars.large) {

    if (vars.dev) d3plus.console.time("ordering")
    button.order()
    if (vars.dev) d3plus.console.timeEnd("ordering")

    var updates = button

  }
  else {

    var checks = [
      vars.previous,
      vars.selected,
      vars.highlight,
      vars.hover,
      vars.hover_previous
    ].filter(function(c){
        return c
      })

    var updates = button.filter(function(b){
      return checks.indexOf(b.value) >= 0
    })

  }

  if (vars.dev) d3plus.console.time("update")
  if (vars.timing) {
    updates
      .transition().duration(vars.timing)
      .call(color)
      .call(style)
  }
  else {
    updates
      .call(color)
      .call(style)
  }
  updates.call(icons).call(mouseevents)
  if (vars.dev) d3plus.console.timeEnd("update")

  button.exit().remove()

}

d3plus.forms.data = function(vars) {

  if (vars.data.data) {

    if (!vars.data.array || (("replace" in vars.data && vars.data.replace === true) || !("replace" in vars.data))) {
      vars.data.array = []
    }

    var defaults = ["value","alt","keywords","image","style","color","selected","text"],
        vals = vars.data.map || {}

    defaults.forEach(function(d){
      if (!(d in vals)) {
        vals[d] = d
      }
    })

    vars.data.data.forEach(function(d){
      var obj = {}
      for (key in vals) {
        if (vals[key] in d) {
          obj[key] = d[vals[key]]
        }
      }
      vars.data.array.push(obj)
    })

    var sort = "sort" in vars.data ? vars.data.sort : "text"
    if (sort) {

      vars.data.array.sort(function(a,b){

        a = a[sort]
        b = b[sort]

        if (sort == "color") {

          a = d3.rgb(a_value).hsl()
          b = d3.rgb(b_value).hsl()

          if (a.s == 0) a = 361
          else a = a.h
          if (b.s == 0) b = 361
          else b = b.h

        }

        if(a < b) return -1;
        if(a > b) return 1;

      })

    }

  }

  vars.data.changed = true
  vars.loading = false

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates Dropdown Menu
//------------------------------------------------------------------------------
d3plus.forms.drop = function(vars,styles,timing) {

  if (vars.element) {
    vars.element.on("focus."+vars.id,function(){
      vars.forms.update(false).hover(true).draw()
    })
    vars.element.on("blur."+vars.id,function(){
      var search = vars.search ? d3.event.relatedTarget != vars.container.select("input").node() : true
      if (search) {
        vars.forms.update(false).hover(false).draw()
      }
    })
    vars.element.on("change."+vars.id,function(){
      vars.forms.value(vars.data.array[this.selectedIndex])
    })
    vars.element.on("keydown.cancel_"+vars.id,function(){
      // Only let TAB work
      var key = d3.event.keyCode
      if (key != 9) {
        d3.event.preventDefault()
      }
    })
  }

  d3.select(document).on("keydown."+vars.id,function(){

    if (vars.enabled || vars.hover === true) {

      var key = d3.event.keyCode,
          options = list.select("div").selectAll("div.d3plus_node"),
          index = 0

      if (typeof vars.hover == "boolean") {
        options.each(function(d,i){
          if (d.value == vars.focus) {
            index = i
          }
        })
      }
      else {
        options.each(function(d,i){
          if (d.value == vars.hover) {
            index = i
          }
        })
      }

      // Tab
      if ([9].indexOf(key) >= 0 && (!vars.search || (vars.search && !d3.event.shiftKey))) {
        vars.forms.update(false).disable()
      }
      // Down Arrow
      else if ([40].indexOf(key) >= 0) {
        if (vars.enabled) {
          if (index >= options.size()-1) {
            index = 0
          }
          else {
            index += 1
          }
        }

        if (typeof vars.hover != "boolean") {
          var hover = options.data()[index].value
        }
        else {
          var hover = vars.focus
        }

        if (vars.enabled) {
          vars.forms.update(false).hover(hover).draw(60)
        }
        else {
          vars.forms.update(false).hover(hover).enable()
        }

      }
      // Up Arrow
      else if ([38].indexOf(key) >= 0) {
        if (vars.enabled) {
          if (index <= 0) {
            index = options.size()-1
          }
          else {
            index -= 1
          }
        }

        if (typeof vars.hover != "boolean") {
          var hover = options.data()[index].value
        }
        else {
          var hover = vars.focus
        }

        if (vars.enabled) {
          vars.forms.update(false).hover(hover).draw(60)
        }
        else {
          vars.forms.update(false).hover(hover).enable()
        }

      }
      // Enter/Return
      else if ([13].indexOf(key) >= 0) {
        if (typeof vars.hover != "boolean") {
          vars.forms.value(vars.hover).hover(true).draw()
        }
        else {
          vars.forms.hover(vars.focus).toggle()
        }
      }
      // Esc
      else if ([27].indexOf(key) >= 0) {
        if (vars.enabled) {
          vars.forms.hover(true).disable()
        }
        else if (vars.hover === true) {
          vars.forms.hover(false).draw()
        }
      }

    }

  })

  function parent_click(elem) {

    d3.select(elem).on("click."+vars.id,function(){

      var element = d3.event.target || d3.event.toElement
      element = element.id
      var child = "_"+vars.id

      if (element.indexOf(child) < 0 && vars.enabled) {
        vars.forms.disable()
      }

    })

    try {
      var same_origin = window.parent.location.host == window.location.host;
    }
    catch (e) {
      var same_origin = false
    }

    if (same_origin) {
      if (elem.self !== window.top) {
        parent_click(elem.parent)
      }
    }

  }

  parent_click(window)

  if (styles.icon) {

    if (styles.icon.indexOf("fa-") == 0) {
      var icon = {
        "class": "d3plus_drop_icon fa "+styles.icon,
        "content": ""
      }
    }
    else {
      var icon = {
        "class": "d3plus_drop_icon",
        "content": styles.icon
      }
    }

  }
  else {
    var icon = false
  }

  var drop_width = d3plus.forms.value(styles.width,["drop","button"])
  if (!drop_width || typeof drop_width != "number") {

    if (vars.dev) d3plus.console.time("calculating width")

    var data = d3plus.util.copy(styles)

    if (!icon) {

      if (d3plus.font.awesome) {
        data.icon = {
          "class": "fa fa-check",
          "content": ""
        }
      }
      else {
        data.icon = {
          "class": "",
          "content": "&#x2713;"
        }
      }

    }
    else {
      data.icon = icon
    }

    data.display = "inline-block"
    data.border = "none"
    data.width = false
    data.margin = 0

    var text = d3plus.forms.value(vars.text,["drop","button"])
    if (!text) {
     text = "text"
    }

    var button = d3plus.forms(data)
      .type("button")
      .text(text)
      .data(vars.data.array)
      .parent(vars.tester)
      .id(vars.id)
      .timing(0)
      .large(9999)
      .draw()

    var w = button.width()
    drop_width = d3.max(w)
    drop_width += styles.stroke*2
    button.remove()

    if (vars.dev) d3plus.console.timeEnd("calculating width")

  }

  if (typeof styles.width != "object") {
    styles.width = {}
  }

  styles.width.drop = drop_width

  var button_width = d3plus.forms.value(styles.width,["button","drop"])
  if (!button_width || typeof button_width != "number") {
    button_width = drop_width
  }

  styles.width.button = button_width

  if (vars.dev) d3plus.console.time("creating main button")

  var style = d3plus.util.copy(styles)
  style.icon = icon
  style.width = button_width
  style.margin = 0
  if (vars.enabled) {
    style.shadow = 0
  }
  var text = d3plus.forms.value(vars.text,["button","drop"])
  if (!text) {
   text = "text"
  }
  var data = d3plus.util.copy(vars.data.array.filter(function(d){
    return d.value == vars.focus
  })[0])
  data.id = "drop_button"
  var test_data = d3plus.util.copy(data)
  test_data.text = "Test"
  var hover = vars.hover === true ? vars.focus : false

  if (vars.dev) d3plus.console.group("main button")
  var button = d3plus.forms(style)
    // .dev(vars.dev)
    .type("button")
    .text(text)
    .parent(vars.container)
    .id(vars.id)
    .timing(timing)
    .hover(hover)
    .data([test_data])
    .callback(vars.forms.toggle)
    .highlight(vars.focus)
    .update(vars.update)
    .enable()
    .draw()

  var line_height = button.height()

  button.data([data]).height(line_height).draw()

  if (vars.dev) d3plus.console.groupEnd()

  if (vars.dev) d3plus.console.timeEnd("creating main button")


  if (vars.dev) d3plus.console.time("creating dropdown")

  var selector = vars.container.selectAll("div.d3plus_drop_selector")
    .data(["selector"])

  selector.enter().append("div")
    .attr("class","d3plus_drop_selector")
    .style("position","absolute")
    .style("top","0px")
    .style("padding",styles.stroke+"px")
    .style("z-index","-1")
    .style("overflow","hidden")

  if (vars.dev) d3plus.console.timeEnd("creating dropdown")
  if (vars.dev && vars.search) d3plus.console.time("creating search")

  var search_style = d3plus.util.merge(styles,styles.drop)
  var search_data = vars.search ? ["search"] : []

  var search = selector.selectAll("div.d3plus_drop_search")
    .data(search_data)

  var search_width = styles.width.drop
  search_width -= styles.padding*4
  search_width -= styles.stroke*2

  if (timing) {
    search.transition().duration(timing)
      .style("padding",search_style.padding+"px")
      .style("display","block")
      .style("background-color",search_style.secondary)
  }
  else {
    search
      .style("padding",search_style.padding+"px")
      .style("display","block")
      .style("background-color",search_style.secondary)
  }

  function input_style(elem) {
    elem
      .style("padding",search_style.padding+"px")
      .style("width",search_width+"px")
      .style("border-style","solid")
      .style("border-width","0px")
      .style("font-family",search_style["font-family"])
      .style("font-size",search_style["font-size"]+"px")
      .style("font-weight",search_style["font-weight"])
      .style("text-align",search_style["font-align"])
      .attr("placeholder",vars.format("Search"))
      .style("outline","none")
      .style(d3plus.prefix()+"border-radius","0")
  }

  if (timing) {
    search.select("input").transition().duration(timing)
      .call(input_style)
  }
  else {
    search.select("input")
      .call(input_style)
  }

  search.enter().insert("div","#d3plus_drop_list_"+vars.id)
    .attr("class","d3plus_drop_search")
    .attr("id","d3plus_drop_search_"+vars.id)
    .style("padding",search_style.padding+"px")
    .style("display","block")
    .style("background-color",search_style.secondary)
    .append("input")
      .attr("id","d3plus_drop_input_"+vars.id)
      .style("-webkit-appearance","none")
      .call(input_style)

  search.select("input").on("keyup."+vars.id,function(d){
    if (vars.filter != this.value) {
      vars.filter = this.value
      vars.forms.draw()
    }
  })

  search.exit().remove()

  if (vars.dev && vars.search) d3plus.console.timeEnd("creating search")
  if (vars.dev) d3plus.console.time("populating list")

  var list = selector.selectAll("div.d3plus_drop_list")
    .data(["list"])

  list.enter().append("div")
    .attr("class","d3plus_drop_list")
    .attr("id","d3plus_drop_list_"+vars.id)
    .style("overflow-y","auto")
    .style("overflow-x","hidden")

  if (vars.loading) {
    var data = [
      {
        "text": vars.format("Loading...")
      }
    ]
  }
  else if (vars.enabled) {

    var search_text = d3plus.util.strip(vars.filter.toLowerCase()).split("_"),
        tests = ["value","text","alt","keywords"],
        search_text = search_text.filter(function(t){ return t != ""; })

    if (vars.filter == "") {
      var data = vars.data.array
    }
    else {

      var data = vars.data.array.filter(function(d){

        var match = false

        for (key in tests) {
          if (tests[key] in d && d[tests[key]]) {
            var text = d3plus.util.strip(d[tests[key]].toLowerCase()).split("_")

            for (t in text) {
              for (s in search_text) {
                if (text[t].indexOf(search_text[s]) == 0) {
                  match = true
                  break
                }
              }
            }
          }
        }
        return match
      })

    }

    if (data.length == 0) {
      data = [
        {
          "text": vars.format("No results match")+" \""+vars.filter+"\""
        }
      ]
    }

  }

  if (vars.dev) d3plus.console.timeEnd("populating list")

  var position = vars.container.node().getBoundingClientRect()

  var max = window.innerHeight-position.top

  max -= button.height()
  max -= 10
  if (max < button.height()*2) {
    max = position.top-10
    vars.flipped = true
  }
  var scrolling = false
  if (max > vars["max-height"]) {
    max = vars["max-height"]
  }

  if (vars.enabled) {

    if (vars.dev) d3plus.console.time("updating list items")

    if (vars.dev) d3plus.console.group("list buttons")

    var style = d3plus.util.merge(styles,styles.drop)
    style.icon = false
    style.display = "block"
    style.border = "none"
    style.width = "auto"
    style.margin = 0
    var text = d3plus.forms.value(vars.text,["drop","button"])
    if (!text) {
     text = "text"
    }

    var large = vars.data.array.length < vars.large ? vars.large : 0

    var buttons = d3plus.forms(style)
      .dev(vars.dev)
      .type("button")
      .text(text)
      .data(data)
      // .height(line_height)
      .parent(list)
      .id(vars.id+"_option")
      .timing(timing)
      .callback(vars.forms.value)
      .previous(vars.previous)
      .selected(vars.focus)
      .hover(vars.hover)
      .hover_previous(vars.hover_previous)
      .update(vars.update)
      .large(large)
      .draw()

    if (vars.dev) d3plus.console.groupEnd()

    if (vars.dev) d3plus.console.timeEnd("updating list items")
    if (vars.dev) d3plus.console.time("calculating height")

    var hidden = false
    if (selector.style("display") == "none") {
      var hidden = true
    }

    if (hidden) selector.style("display","block")

    var search_height = vars.search ? search[0][0].offsetHeight : 0

    var old_height = selector.style("height"),
        old_scroll = selector.property("scrollTop"),
        list_height = list.style("max-height"),
        list_scroll = list.property("scrollTop")

    selector.style("height","auto")
    list.style("max-height","200000px")

    var height = parseFloat(selector.style("height"),10)

    list
      .style("max-height",list_height)
      .property("scrollTop",list_scroll)
    selector
      .style("height",old_height)
      .property("scrollTop",old_scroll)

    if (height > max) {
      height = max
      scrolling = true
    }

    if (hidden) selector.style("display","none")

    if (vars.dev) d3plus.console.timeEnd("calculating height")

    if (scrolling) {

      if (vars.dev) d3plus.console.time("calculating scroll position")

      var index = 0
      var options = list.select("div").selectAll("div.d3plus_node")
      if (typeof vars.hover == "boolean") {
        options.each(function(d,i){
          if (d.value == vars.focus) {
            index = i
          }
        })
      }
      else {
        options.each(function(d,i){
          if (d.value == vars.hover) {
            index = i
          }
        })
      }

      var hidden = false
      if (selector.style("display") == "none") {
        hidden = true
      }
      var option = options[0][index]
      if (hidden) selector.style("display","block")
      var button_top = option.offsetTop,
          button_height = option.offsetHeight,
          list_top = list.property("scrollTop")

      if (hidden) selector.style("display","none")
      if (hidden || vars.data.changed) {

        var scroll = button_top

      }
      else {

        var scroll = list_top

        if (button_top < list_top) {
          var scroll = button_top
        }
        else if (button_top+button_height > list_top+max-search_height) {
          var scroll = button_top - (max-button_height-search_height)
        }

      }

      if (vars.dev) d3plus.console.timeEnd("calculating scroll position")

    }
    else {
      var scroll = 0
    }

  }
  else {
    var scroll = list.property("scrollTop"),
        height = 0,
        search_height = 0
  }

  if (vars.dev) d3plus.console.time("rotating arrow")

  var offset = icon.content == "&#x27A4;" ? 90 : 0
  if (vars.enabled != vars.flipped) {
    var rotate = "rotate(-"+(180-offset)+"deg)"
  }
  else {
    var rotate = "rotate("+offset+"deg)"
  }

  button.select("div#d3plus_button_element_"+vars.id+"_icon")
    .data(["icon"])
    .style(d3plus.prefix()+"transition",(timing/1000)+"s")
    .style(d3plus.prefix()+"transform",rotate)
    .style("opacity",function(){
      return vars.enabled ? 0.5 : 1
    })

  if (vars.dev) d3plus.console.timeEnd("rotating arrow")

  if (vars.dev) d3plus.console.time("drawing list")

  function update(elem) {

    elem
      .style("left",function(){
        if (styles.align == "left") {
          return "0px"
        }
        else if (styles.align == "center") {
          return -((drop_width-button_width)/2)+"px"
        }
        else {
          return "auto"
        }
      })
      .style("right",function(){
        return styles.align == "right" ? "0px" : "auto"
      })
      .style("height",height+"px")
      .style("padding",styles.stroke+"px")
      .style("background-color",styles.secondary)
      .style("z-index",function(){
        return vars.enabled ? "9999" : "-1";
      })
      .style("width",(drop_width-(styles.stroke*2))+"px")
      .style("top",function(){
        return vars.flipped ? "auto" : button.height()+"px"
      })
      .style("bottom",function(){
        return vars.flipped ? button.height()+"px" : "auto"
      })
      .style("opacity",vars.enabled ? 1 : 0)

  }

  function finish(elem) {

    elem
      .style("top",function(){
        return vars.flipped ? "auto" : button.height()+"px"
      })
      .style("bottom",function(){
        return vars.flipped ? button.height()+"px" : "auto"
      })
      .style("display",!vars.enabled ? "none" : null)

    if (vars.search && vars.enabled) {
      selector.select("div.d3plus_drop_search input").node().focus()
    }

  }

  var max_height = vars.enabled ? max-search_height : 0

  if (!timing) {

    selector.call(update).call(finish)

    list
      .style("width",drop_width-styles.stroke*2+"px")
      .style("max-height",max_height+"px")
      .property("scrollTop",scroll)

  }
  else {
    selector.transition().duration(timing)
      .each("start",function(){
        d3.select(this)
          .style("display",vars.enabled ? "block" : null)
      })
      .call(update)
      .each("end",function(){

        d3.select(this).transition().duration(timing)
          .call(finish)

      })

    function scrollTopTween(scrollTop) {
        return function() {
            var i = d3.interpolateNumber(this.scrollTop, scrollTop);
            return function(t) { this.scrollTop = i(t); };
        };
    }

    list.transition().duration(timing)
      .style("width",drop_width-styles.stroke*2+"px")
      .style("max-height",max_height+"px")
      .tween("scroll",scrollTopTween(scroll))
  }

  if (vars.dev) d3plus.console.timeEnd("drawing list")

}

d3plus.forms.element = function(vars) {

  function get_attributes(obj,elem) {

    var attributes = ["value","alt","keywords","image","style","color"];

    [].forEach.call(elem.attributes, function(attr) {
        if (/^data-/.test(attr.name)) {
            var camelCaseName = attr.name.substr(5).replace(/-(.)/g, function ($0, $1) {
                return $1.toUpperCase();
            });
            obj[camelCaseName] = attr.value;
        }
    });
    
    attributes.forEach(function(a){

      if (elem.getAttribute(a) !== null) {
        obj[a] = elem.getAttribute(a)
      }

    })

  }

  vars.tag = vars.element.node().tagName.toLowerCase()

  if (vars.tag == "select") {

    if (vars.element.attr("id") && vars.id == "default") {
      vars.id = vars.element.attr("id")
    }

    vars.element.selectAll("option")
      .each(function(o,i){
        var data_obj = {
          "selected": this.selected,
          "text": this.innerHTML
        }

        get_attributes(data_obj,this)

        if (this.selected) {
          vars.focus = this.value
        }
        vars.data.array.push(data_obj)
      })

  }
  else if (vars.tag == "input" && vars.element.attr("type") == "radio") {

    vars.element
      .each(function(o,i){
        var data_obj = {
          "selected": this.checked
        }

        get_attributes(data_obj,this)

        if (this.id) {
          var label = d3.select("label[for="+this.id+"]")
          if (!label.empty()) {
            data_obj.text = label.style("display","none").html()
          }
        }

        if (this.checked) {
          vars.focus = this.value
        }
        vars.data.array.push(data_obj)
      })
  }

  if (!vars.focus && vars.data.array.length) {
    vars.element.node().selectedIndex = 0
    vars.focus = vars.data.array[0].value
  }

  if (!vars.type) {
    if (vars.data.array.length > 4) {
      vars.type = "drop"
    }
    else {
      vars.type = "radio"
    }
  }

}

d3plus.forms.json = function(vars) {
  
  if (vars.dev) d3plus.console.time("loading data from \""+vars.data.fetch+"\"")
  vars.loading = true
  
  d3.json(vars.data.fetch,function(d){
    
    if (d && Object.keys(d).length == 1) {
      vars.data.data = d[Object.keys(d)[0]]
    }
    else if (d && vars.data.key && d[key]) {
      vars.data.data = d[key]
    }
    else {
      vars.data.data = []
    }
    
    if (typeof vars.data.callback == "function") {
      vars.data.data = vars.data.callback(vars.data.data)
    }
    
    vars.data.loaded = true
    vars.data.changed = true
    if (vars.dev) d3plus.console.timeEnd("loading data from \""+vars.data.fetch+"\"")
    
    d3plus.forms.data(vars)
    
    setTimeout(function(){
      vars.forms.draw()
    },vars.timing*1.5)
    
  })
  
}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates a set of Radio Buttons
//------------------------------------------------------------------------------
d3plus.forms.radio = function(vars,styles,timing) {

  vars.container.transition().duration(timing)
    .style("background-color",styles.secondary)
    .style("padding",styles.stroke+"px")
    .style("margin",styles.margin+"px")

  var button_style = d3plus.util.copy(styles)
  button_style.icon = false
  button_style.display = "inline-block"
  button_style.border = "none"
  button_style.width = false
  button_style.margin = 0
  button_style.stroke = 0

  var text = d3plus.forms.value(vars.text,["button"])
  if (!text) {
   text = "text"
  }

  var button = d3plus.forms(button_style)
    .type("button")
    .text(text)
    .data(vars.data.array)
    .parent(vars.container)
    .id(vars.id+"_radios")
    .callback(vars.forms.value)
    .highlight(vars.focus)
    .enable()
    .draw()

}

d3plus.forms.value = function(obj,arr) {
  
  if (typeof obj == "object" && arr) {
    var ret = false
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] in obj) {
        ret = obj[arr[i]]
        break;
      }
    }
    if (ret) {
      return ret
    }
  }
  else if (typeof obj != "object") {
    return obj
  }
  else {
    return false
  }
  
}
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Draws "square" and "circle" shapes using svg:rect
//------------------------------------------------------------------------------
d3plus.shape.area = function(vars,selection,enter,exit) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // D3 area definition
  //----------------------------------------------------------------------------
  var area = d3.svg.area()
    .x(function(d) { return d.d3plus.x; })
    .y0(function(d) { return d.d3plus.y0; })
    .y1(function(d) { return d.d3plus.y; })
    .interpolate(vars.shape.interpolate.value)

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // "paths" Enter
  //----------------------------------------------------------------------------
  enter.append("path").attr("class","d3plus_data")
    .attr("d",function(d){ return area(d.values) })
    .call(d3plus.shape.style,vars)

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // "paths" Update
  //----------------------------------------------------------------------------
  selection.selectAll("path.d3plus_data")
    .data(function(d) {

      if (vars.labels.value) {

        var areas = [],
            obj = null,
            obj2 = null,
            label = {
              "w": 0,
              "h": 0,
              "x": 0,
              "y": 0
            }

        function check_area(area) {

          obj.y = d3.max([obj.y,area.y])
          obj.y0 = d3.min([obj.y0,area.y0])
          obj.x0 = area.x

          obj.h = (obj.y0 - obj.y)
          obj.w = (obj.x0 - obj.x)

          var toosmall = obj.h-(vars.style.labels.padding*2) < 15 || obj.w-(vars.style.labels.padding*2) < 20,
              aspect_old = label.w/label.h,
              size_old = label.w*label.h,
              aspect_new = obj.w/obj.h,
              size_new = obj.w*obj.h

          if ((!toosmall && size_old < size_new) || !label.w) {
            label = {
              "w": obj.w,
              "h": obj.h,
              "x": obj.x+(obj.w/2),
              "y": obj.y+(obj.h/2)
            }
          }
          if (obj.h < 10) {
            obj = d3plus.util.copy(area)
          }

        }

        d.values.forEach(function(v,i){

          if (!obj) {
            obj = d3plus.util.copy(v.d3plus)
          }
          else {
            var arr = d3plus.util.buckets([0,1],vars.style.labels.segments+1)
            arr.shift()
            arr.pop()
            arr.forEach(function(n){

              var test = d3plus.util.copy(v.d3plus),
                  last = d.values[i-1].d3plus

              test.x = last.x + (test.x-last.x) * n
              test.y = last.y + (test.y-last.y) * n
              test.y0 = last.y0 + (test.y0-last.y0) * n

              check_area(test)

            })
            check_area(d3plus.util.copy(v.d3plus))
          }
        })

        if (label.w >= 10 && label.h >= 10) {
          d.d3plus_label = label
        }

      }

      return [d];
    })

  if (vars.timing) {
    selection.selectAll("path.d3plus_data")
      .transition().duration(vars.timing)
        .attr("d",function(d){ return area(d.values) })
        .call(d3plus.shape.style,vars)
  }
  else {
    selection.selectAll("path.d3plus_data")
      .attr("d",function(d){ return area(d.values) })
      .call(d3plus.shape.style,vars)
  }

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Returns the correct fill color for a node
//-------------------------------------------------------------------
d3plus.shape.color = function(d,vars) {

  var shape = d.d3plus ? d.d3plus.shapeType : vars.shape.value

  if (vars.shape.value == "line") {
    if (shape == "circle") {
      return d3plus.variable.color(vars,d)
    }
    else {
      return "none"
    }
  }
  else if (vars.shape.value == "area" || shape == "active") {
    return d3plus.variable.color(vars,d)
  }
  else if (shape == "temp") {
    return "url(#d3plus_hatch_"+d.d3plus.id+")"
  }
  else if (shape == "active") {
    return d3plus.variable.color(vars,d)
  }

  if (d.d3plus.static) {
    return d3plus.color.lighter(d3plus.variable.color(vars,d));
  }

  var active = vars.active.key ? d3plus.variable.value(vars,d,vars.active.key) : d.d3plus.active,
      temp = vars.temp.key ? d3plus.variable.value(vars,d,vars.temp.key) : d.d3plus.temp,
      total = vars.total.key ? d3plus.variable.value(vars,d,vars.total.key) : d.d3plus.total

  if ((!vars.active.key && !vars.temp.key) || active === true || (active && total && active == total && !temp) || (active && !total)) {
    return d3plus.variable.color(vars,d)
  }
  else if (vars.active.spotlight.value) {
    return "#eee"
  }
  else {
    return d3plus.color.lighter(d3plus.variable.color(vars,d),.4);
  }

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Draws "square" and "circle" shapes using svg:rect
//------------------------------------------------------------------------------
d3plus.shape.coordinates = function(vars,selection,enter,exit) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Define the geographical projection
  //----------------------------------------------------------------------------
  var projection = d3.geo[vars.coords.projection.value]()
    .center(vars.coords.center)
    // .translate([-vars.app_width/2,-vars.app_height/2])

  // var clip = d3.geo.clipExtent()
  //     .extent([[0, 0], [vars.app_width, vars.app_height]]);

  if (!vars.zoom.scale) {
    vars.zoom.scale = 1
  }

  vars.zoom.area = 1/vars.zoom.scale/vars.zoom.scale

  // console.log(vars.zoom)

  // var simplify = d3.geo.transform({
  //   point: function(x, y, z) {
  //     if (z >= vars.zoom.area) this.stream.point(x,y);
  //   }
  // });

  vars.path = d3.geo.path()
    .projection(projection)
    // .projection(simplify)
    // .projection({stream: function(s) { return simplify.stream(clip.stream(s)); }})

  enter.append("path")
    .attr("id",function(d){
      return d.id
    })
    .attr("class","d3plus_data")
    .attr("d",vars.path)
    .call(d3plus.shape.style,vars)

  if (vars.timing) {
    selection.selectAll("path.d3plus_data")
      .transition().duration(vars.timing)
        .call(d3plus.shape.style,vars)
  }
  else {
    selection.selectAll("path.d3plus_data")
      .call(d3plus.shape.style,vars)
  }

  var size_change = vars.old_height != vars.app_height || vars.height.changed
    || vars.old_width != vars.app_width || vars.width.changed

  vars.old_height = vars.app_height
  vars.old_width = vars.app_width

  if (vars.coords.changed || size_change || vars.coords.mute.changed || vars.coords.solo.changed) {

    vars.zoom.bounds = null
    vars.zoom.coords = {}
    vars.zoom.labels = {}

    selection.each(function(d){

      var b = vars.path.bounds(d)

      var areas = []
      d.geometry.coordinates = d.geometry.coordinates.filter(function(c,i){

        var test = d3plus.util.copy(d)
        test.geometry.coordinates = [test.geometry.coordinates[i]]
        var a = vars.path.area(test)
        if (a >= vars.coords.threshold) {
          areas.push(a)
          return true
        }
        return false

      })
      areas.sort(function(a,b){
        return a-b
      })

      var reduced = d3plus.util.copy(d),
          largest = d3plus.util.copy(d)
      reduced.geometry.coordinates = reduced.geometry.coordinates.filter(function(c,i){

        var test = d3plus.util.copy(d)
        test.geometry.coordinates = [test.geometry.coordinates[i]]
        var a = vars.path.area(test)
        if (a == areas[areas.length-1]) {
          largest.geometry.coordinates = test.geometry.coordinates
        }
        return a >= d3.quantile(areas,.9)

      })
      vars.zoom.coords[d.d3plus.id] = reduced

      var center = vars.path.centroid(largest),
          lb = vars.path.bounds(largest)

      vars.zoom.labels[d.d3plus.id] = {
        "anchor": "middle",
        "group": vars.g.labels,
        "h": (lb[1][1]-lb[0][1])*.35,
        "w": (lb[1][0]-lb[0][0])*.35,
        "valign": "center",
        "x": center[0],
        "y": center[1]
      }

      if (!vars.zoom.bounds) {
        vars.zoom.bounds =  b
      }
      else {
        if (vars.zoom.bounds[0][0] > b[0][0]) {
          vars.zoom.bounds[0][0] = b[0][0]
        }
        if (vars.zoom.bounds[0][1] > b[0][1]) {
          vars.zoom.bounds[0][1] = b[0][1]
        }
        if (vars.zoom.bounds[1][0] < b[1][0]) {
          vars.zoom.bounds[1][0] = b[1][0]
        }
        if (vars.zoom.bounds[1][1] < b[1][1]) {
          vars.zoom.bounds[1][1] = b[1][1]
        }
      }

    })

  }
  else if (!vars.focus.value) {
    vars.zoom.viewport = false
  }

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Draws "donut" shapes using svg:path with arcs
//------------------------------------------------------------------------------
d3plus.shape.donut = function(vars,selection,enter,exit) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // In order to correctly animate each donut's size and arcs, we need to store
  // it's previous values in a lookup object that does not get destroyed when
  // redrawing the visualization.
  //----------------------------------------------------------------------------
  if (!vars.arcs) {
    vars.arcs = {
      "donut": {},
      "active": {},
      "temp": {}
    }
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // This is the main arc function that determines what values to use for each
  // arc angle and radius.
  //----------------------------------------------------------------------------
  var arc = d3.svg.arc()
    .startAngle(0)
    .endAngle(function(d){
      var a = vars.arcs[d.d3plus.shapeType][d.d3plus.id].a
      return a > Math.PI*2 ? Math.PI*2 : a;
    })
    .innerRadius(function(d){
      if (shape == "donut" && !d.d3plus.static) {
        var r = vars.arcs[d.d3plus.shapeType][d.d3plus.id].r
        return r * vars.style.data.donut.size
      }
      else {
        return 0
      }
    })
    .outerRadius(function(d){
      var r = vars.arcs[d.d3plus.shapeType][d.d3plus.id].r
      if (d.d3plus.shapeType != "donut") return r*2
      else return r
    })

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // This is the main "arcTween" function where all of the animation happens
  // for each arc.
  //----------------------------------------------------------------------------
  function size(path,mod,rad,ang) {
    if (!mod) var mod = 0
    if (typeof rad != "number") var rad = undefined
    if (typeof ang != "number") var ang = undefined
    path.attrTween("d", function(d){
      if (rad == undefined) var r = d.d3plus.r ? d.d3plus.r : d3.max([d.d3plus.width,d.d3plus.height])
      else var r = rad
      if (ang == undefined) var a = d.d3plus.a[d.d3plus.shapeType]
      else var a = ang
      if (!vars.arcs[d.d3plus.shapeType][d.d3plus.id]) {
        vars.arcs[d.d3plus.shapeType][d.d3plus.id] = {"r": 0}
        vars.arcs[d.d3plus.shapeType][d.d3plus.id].a = d.d3plus.shapeType == "donut" ? Math.PI * 2 : 0
      }
      var radius = d3.interpolate(vars.arcs[d.d3plus.shapeType][d.d3plus.id].r,r+mod),
          angle = d3.interpolate(vars.arcs[d.d3plus.shapeType][d.d3plus.id].a,a)
      return function(t) {
        vars.arcs[d.d3plus.shapeType][d.d3plus.id].r = radius(t)
        vars.arcs[d.d3plus.shapeType][d.d3plus.id].a = angle(t)
        return arc(d)
      }
    })
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // "paths" Exit
  //----------------------------------------------------------------------------
  exit.selectAll("path.d3plus_data")
  .transition().duration(vars.timing)
    .call(size,0,0)
    .each("end",function(d){
      delete vars.arcs[d.d3plus.shapeType][d.d3plus.id]
    })

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // "paths" Update
  //----------------------------------------------------------------------------
  selection.selectAll("path.d3plus_data")
    .data(function(d) { return [d]; })
    .transition().duration(vars.timing)
      .call(size)
      .call(d3plus.shape.style,vars)

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // "paths" Enter
  //----------------------------------------------------------------------------
  enter.append("path")
    .attr("class","d3plus_data")
    .transition().duration(0)
      .call(size,0,0)
      .call(d3plus.shape.style,vars)

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Draws the appropriate shape based on the data
//------------------------------------------------------------------------------
d3plus.shape.draw = function(vars) {

  var data = vars.returned.nodes || [],
      edges = vars.returned.edges || []

  vars.timing = data.length < vars.data.large && edges.length < vars.edges.large ? vars.style.timing.transitions : 0

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Match vars.shape types to their respective d3plus.shape functions. For
  // example, both "square", and "circle" shapes use "rect" as their drawing
  // class.
  //----------------------------------------------------------------------------
  var shape_lookup = {
    "area": "area",
    "circle": "rect",
    "donut": "donut",
    "line": "line",
    "square": "rect",
    "coordinates": "coordinates"
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Split the data by each shape type in the data.
  //----------------------------------------------------------------------------
  var shapes = {}
  data.forEach(function(d){
    if (!d.d3plus) {
      var s = shape_lookup[vars.shape.value]
    }
    else if (!d.d3plus.shape) {
      var s = shape_lookup[vars.shape.value]
      d.d3plus.shapeType = s
    }
    else {
      var s = d.d3plus.shape
      d.d3plus.shapeType = s
    }
    if (!shapes[s]) {
      shapes[s] = []
    }
    shapes[s].push(d)
  })

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Resets the "id" of each data point to use with matching.
  //----------------------------------------------------------------------------
  function id(d) {

    var depth = d.d3plus.depth ? d.d3plus.depth : vars.depth.value

    d.d3plus.id = d3plus.variable.value(vars,d,vars.id.nesting[depth])
    d.d3plus.id += "_"+depth+"_"+shape

    vars.axes.values.forEach(function(axis){
      if (vars[axis].scale.value == "continuous") {
        d.d3plus.id += "_"+d3plus.variable.value(vars,d,vars[axis].key)
      }
    })

    d.d3plus.id = d3plus.util.strip(d.d3plus.id)

    return d
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Transforms the positions and scale of each group.
  //----------------------------------------------------------------------------
  function transform(g,grow) {

    var scales = d3plus.apps[vars.type.value].scale
    if (grow && scales && scales[vars.shape.value]) {
       var scale = scales[vars.shape.value]
    }
    else if (grow && scales && typeof scales == "number") {
      var scale = scales
    }
    else {
      var scale = 1
    }

    g
      .attr("transform",function(d){
        if (["line","area","coordinates"].indexOf(shape) < 0) {
          return "translate("+d.d3plus.x+","+d.d3plus.y+")scale("+scale+")"
        }
        else {
          return "scale("+scale+")"
        }
      })

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Remove old groups
  //----------------------------------------------------------------------------
  for (shape in shape_lookup) {
    if (!(shape_lookup[shape] in shapes) || Object.keys(shapes).length === 0) {
      if (vars.timing) {
        vars.g.data.selectAll("g.d3plus_"+shape_lookup[shape])
          .transition().duration(vars.timing)
          .attr("opacity",0)
          .remove()
      }
      else {
        vars.g.data.selectAll("g.d3plus_"+shape_lookup[shape])
          .remove()
      }
    }
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Initialize arrays for labels and sizes
  //----------------------------------------------------------------------------
  var labels = [],
      shares = []

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Create groups by shape, apply data, and call specific shape drawing class.
  //----------------------------------------------------------------------------
  for (shape in shapes) {

    if (vars.dev.value) d3plus.console.group("Drawing \"" + shape + "\" groups")

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Filter out too small shapes
    //--------------------------------------------------------------------------
    if (vars.dev.value) d3plus.console.time("filtering out small shapes")
    var filtered_shapes = shapes[shape].filter(function(s){
      if (s.d3plus) {
        if ("width" in s.d3plus && s.d3plus.width < 1) {
          return false
        }
        if ("height" in s.d3plus && s.d3plus.height < 1) {
          return false
        }
        if ("r" in s.d3plus && s.d3plus.r < 0.5) {
          return false
        }
      }
      else if (s.values) {
        var small = true
        s.values.forEach(function(v){
          if (!("y0" in v.d3plus)) {
            small = false
          }
          else if (small && "y0" in v.d3plus && v.d3plus.y0-v.d3plus.y >= 1) {
            small = false
          }
        })
        if (small) {
          return false
        }
      }
      return true
    })

    if (vars.dev.value) {
      d3plus.console.timeEnd("filtering out small shapes")
      var removed = shapes[shape].length-filtered_shapes.length,
          percent = d3.round(removed/shapes[shape].length,2)
      console.log("removed "+removed+" out of "+shapes[shape].length+" shapes ("+percent*100+"% reduction)")
    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Bind Data to Groups
    //--------------------------------------------------------------------------
    var selection = vars.g.data.selectAll("g.d3plus_"+shape)
      .data(filtered_shapes,function(d){

        if (!d.d3plus) {
          d.d3plus = {}
        }

        if (shape == "coordinates") {
          d.d3plus.id = d.id
          return d.id
        }

        if (!d.d3plus.id) {

          if (d.values) {

            d.values.forEach(function(v){
              v = id(v)
              v.d3plus.shapeType = "circle"
            })
            d.d3plus.id = d.key

          }
          else {

            d = id(d)

            if (!d.d3plus.a) {

              d.d3plus.a = {"donut": Math.PI*2}
              var active = vars.active.key ? d.d3plus[vars.active.key] : d.d3plus.active,
                  temp = vars.temp.key ? d.d3plus[vars.temp.key] : d.d3plus.temp,
                  total = vars.total.key ? d.d3plus[vars.total.key] : d.d3plus.total

              if (total) {
                if (active) {
                  d.d3plus.a.active = (active/total) * (Math.PI * 2)
                }
                else {
                  d.d3plus.a.active = 0
                }
                if (temp) {
                  d.d3plus.a.temp = ((temp/total) * (Math.PI * 2)) + d.d3plus.a.active
                }
                else {
                  d.d3plus.a.temp = 0
                }
              }

            }

          }

        }

        return d.d3plus ? d.d3plus.id : false;

      })

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Groups Exit
    //--------------------------------------------------------------------------
    if (vars.timing) {
      var exit = selection.exit()
        .transition().duration(vars.timing)
        .attr("opacity",0)
        .remove()
    }
    else {
      var exit = selection.exit()
        .remove()
    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Existing Groups Update
    //--------------------------------------------------------------------------
    if (vars.timing) {
      selection
        .transition().duration(vars.timing)
        .call(transform)
    }
    else {
      selection.call(transform)
    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Groups Enter
    //--------------------------------------------------------------------------
    var opacity = vars.timing ? 0 : 1
    var enter = selection.enter().append("g")
      .attr("class","d3plus_"+shape)
      .attr("opacity",opacity)
      .call(transform)

    if (vars.timing) {
      enter.transition().duration(vars.timing)
        .attr("opacity",1)
    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // All Groups Sort Order
    //--------------------------------------------------------------------------
    selection.order()

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Draw appropriate graphics inside of each group
    //--------------------------------------------------------------------------
    if (vars.dev.value) d3plus.console.time("shapes")
    d3plus.shape[shape](vars,selection,enter,exit,transform)
    if (vars.dev.value) d3plus.console.timeEnd("shapes")

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Check for active and temp fills for rects and donuts
    //--------------------------------------------------------------------------
    if (["rect","donut"].indexOf(shape) >= 0 && d3plus.apps[vars.type.value].fill) {
      d3plus.shape.fill(vars,selection,enter,exit,transform)
    }

    if (vars.dev.value) d3plus.console.groupEnd()

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Function to Update Edges
  //----------------------------------------------------------------------------
  function edge_update(d) {

    if (d && vars.g.edges.selectAll("g").size() > 0) {

      vars.g.edges.selectAll("g")
        .each(function(l){

          var id = d[vars.id.key],
              source = l[vars.edges.source][vars.id.key],
              target = l[vars.edges.target][vars.id.key]

          if (source == id || target == id) {
            var elem = vars.g.edge_hover.node().appendChild(this.cloneNode(true))
            d3.select(elem).datum(l).attr("opacity",1)
              .selectAll("line, path").datum(l)
          }

        })


      var marker = vars.edges.arrows.value

      vars.g.edge_hover
        .attr("opacity",0)
        .selectAll("line, path")
          .style("stroke",vars.style.highlight.primary)
          .style("stroke-width",function(){
            return vars.edges.size ? d3.select(this).style("stroke-width")
                 : vars.style.data.stroke.width*2
          })
          .attr("marker-start",function(e){

            var direction = vars.edges.arrows.direction.value

            if ("bucket" in e.d3plus) {
              var d = "_"+e.d3plus.bucket
            }
            else {
              var d = ""
            }

            return direction == "source" && marker
                 ? "url(#d3plus_edge_marker_highlight"+d+")" : "none"

          })
          .attr("marker-end",function(e){

            var direction = vars.edges.arrows.direction.value

            if ("bucket" in e.d3plus) {
              var d = "_"+e.d3plus.bucket
            }
            else {
              var d = ""
            }

            return direction == "target" && marker
                 ? "url(#d3plus_edge_marker_highlight"+d+")" : "none"

          })


      vars.g.edge_hover.selectAll("text")
        .style("fill",vars.style.highlight.primary)

      if (vars.timing) {

        vars.g.edge_hover
          .transition().duration(vars.style.timing.mouseevents)
          .attr("opacity",1)

        vars.g.edges
          .transition().duration(vars.style.timing.mouseevents)
          .attr("opacity",0.5)

      }
      else {

        vars.g.edge_hover
          .attr("opacity",1)

      }

    }
    else {

      if (vars.timing) {

        vars.g.edge_hover
          .transition().duration(vars.style.timing.mouseevents)
          .attr("opacity",0)
          .transition()
          .selectAll("*")
          .remove()

        vars.g.edges
          .transition().duration(vars.style.timing.mouseevents)
          .attr("opacity",1)

      }
      else {

        vars.g.edge_hover
          .selectAll("*")
          .remove()

      }

    }

  }

  edge_update()

  if (!d3plus.touch) {

    vars.g.data.selectAll("g")
      .on(d3plus.evt.over,function(d){

        if (!vars.frozen && (!d.d3plus || !d.d3plus.static)) {

          d3.select(this).style("cursor","pointer")
            .transition().duration(vars.style.timing.mouseevents)
            .call(transform,true)

          d3.select(this).selectAll(".d3plus_data")
            .transition().duration(vars.style.timing.mouseevents)
            .attr("opacity",1)

          vars.covered = false

          if ((vars.focus.value != d[vars.id.key]) || !vars.focus.tooltip.value) {

            if (vars.continuous_axis) {

              var mouse = d3.event[vars.continuous_axis]
                  positions = d3plus.util.uniques(d.values,function(x){return x.d3plus[vars.continuous_axis]}),
                  closest = d3plus.util.closest(positions,mouse)

              d.data = d.values[positions.indexOf(closest)]
              d.d3plus = d.values[positions.indexOf(closest)].d3plus

            }

            var tooltip_data = d.data ? d.data : d
            d3plus.tooltip.app({
              "vars": vars,
              "data": tooltip_data
            })

          }

          if (typeof vars.mouse == "function") {
            vars.mouse(d)
          }
          else if (vars.mouse[d3plus.evt.over]) {
            vars.mouse[d3plus.evt.over](d)
          }

          edge_update(d)

        }

      })
      .on(d3plus.evt.move,function(d){

        if (!vars.frozen && (!d.d3plus || !d.d3plus.static)) {

          vars.covered = false

          if (["area","line"].indexOf(vars.shape.value) >= 0
            || (d3plus.apps[vars.type.value].tooltip == "follow" &&
            (vars.focus.value != d[vars.id.key]) || !vars.focus.tooltip.value)) {

            if (vars.continuous_axis) {

              var mouse = d3.event[vars.continuous_axis]
                  positions = d3plus.util.uniques(d.values,function(x){return x.d3plus[vars.continuous_axis]}),
                  closest = d3plus.util.closest(positions,mouse)

              d.data = d.values[positions.indexOf(closest)]
              d.d3plus = d.values[positions.indexOf(closest)].d3plus

            }

            var tooltip_data = d.data ? d.data : d
            d3plus.tooltip.app({
              "vars": vars,
              "data": tooltip_data
            })

          }

          if (typeof vars.mouse == "function") {
            vars.mouse(d)
          }
          else if (vars.mouse[d3plus.evt.move]) {
            vars.mouse[d3plus.evt.move](d)
          }

        }

      })
      .on(d3plus.evt.out,function(d){

        var child = d3plus.util.child(this,d3.event.toElement)

        if (!child && !vars.frozen && (!d.d3plus || !d.d3plus.static)) {

          d3.select(this)
            .transition().duration(vars.style.timing.mouseevents)
            .call(transform)

          d3.select(this).selectAll(".d3plus_data")
            .transition().duration(vars.style.timing.mouseevents)
            .attr("opacity",vars.style.data.opacity)


          if (!vars.covered) {
            d3plus.tooltip.remove(vars.type.value)
          }

          if (typeof vars.mouse == "function") {
            vars.mouse(d)
          }
          else if (vars.mouse[d3plus.evt.out]) {
            vars.mouse[d3plus.evt.out](d)
          }

          edge_update()

        }

      })

  }
  else {

    vars.g.data.selectAll("g")
      .on(d3plus.evt.over,vars.touchEvent)
      .on(d3plus.evt.move,vars.touchEvent)
      .on(d3plus.evt.out,vars.touchEvent)

  }

  vars.g.data.selectAll("g")
    .on(d3plus.evt.click,function(d){

      if (!vars.frozen && (!d.d3plus || !d.d3plus.static)) {

        if (typeof vars.mouse == "function") {
          vars.mouse(d)
        }
        else if (vars.mouse[d3plus.evt.out]) {
          vars.mouse[d3plus.evt.out](d)
        }
        else if (vars.mouse[d3plus.evt.click]) {
          vars.mouse[d3plus.evt.click](d)
        }

        var depth_delta = vars.zoom_direction(),
            previous = vars.id.solo.value,
            title = d3plus.variable.text(vars,d)[0],
            color = d3plus.color.legible(d3plus.variable.color(vars,d)),
            prev_sub = vars.title.sub.value || false,
            prev_color = vars.style.title.sub.font.color,
            prev_total = vars.style.title.total.font.color

        if (d.d3plus.threshold && d.d3plus.merged && vars.zoom.value) {

          vars.history.states.push(function(){

            vars.viz
              .id({"solo": previous})
              .title({"sub": prev_sub})
              .style({"title": {"sub": {"font": {"color": prev_color}}, "total": {"font": {"color": prev_total}}}})
              .draw()

          })

          vars.viz
            .id({"solo": d.d3plus.merged})
            .title({"sub": title})
            .style({"title": {"sub": {"font": {"color": color}}, "total": {"font": {"color": color}}}})
            .draw()

        }
        else if (depth_delta === 1 && vars.zoom.value) {

          var id = d3plus.variable.value(vars,d,vars.id.key)

          vars.history.states.push(function(){

            vars.viz
              .depth(vars.depth.value-1)
              .id({"solo": previous})
              .title({"sub": prev_sub})
              .style({"title": {"sub": {"font": {"color": prev_color}}, "total": {"font": {"color": prev_total}}}})
              .draw()

          })

          vars.viz
            .depth(vars.depth.value+1)
            .id({"solo": [id]})
            .title({"sub": title})
            .style({"title": {"sub": {"font": {"color": color}}, "total": {"font": {"color": color}}}})
            .draw()

        }
        else if (depth_delta === -1 && vars.zoom.value) {

          vars.back()

        }
        else if (d3plus.apps[vars.type.value].zoom && vars.zoom.value) {

          edge_update()
          
          d3.select(this)
            .transition().duration(vars.style.timing.mouseevents)
            .call(transform)

          d3.select(this).selectAll(".d3plus_data")
            .transition().duration(vars.style.timing.mouseevents)
            .attr("opacity",vars.style.data.opacity)

          d3plus.tooltip.remove(vars.type.value)
          vars.update = false

          if (!d || d[vars.id.key] == vars.focus.value) {
            vars.viz.focus(null).draw()
          }
          else {
            vars.viz.focus(d[vars.id.key]).draw()
          }

        }
        else if (d[vars.id.key] != vars.focus.value) {

          edge_update()

          var tooltip_data = d.data ? d.data : d

          d3plus.tooltip.app({
            "vars": vars,
            "data": tooltip_data
          })

        }

      }

    })

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Draws "square" and "circle" shapes using svg:rect
//------------------------------------------------------------------------------
d3plus.shape.edges = function(vars) {

  var edges = vars.returned.edges || [],
      scale = vars.zoom_behavior.scaleExtent()[0]

  if (typeof vars.edges.size === "string") {

    var strokeDomain = d3.extent(edges, function(e){
                         return e[vars.edges.size]
                       })
      , maxSize = d3.min(vars.returned.nodes || [], function(n){
                        return n.d3plus.r
                      })*.6

    vars.edges.scale = d3.scale.sqrt()
                        .domain(strokeDomain)
                        .range([vars.style.edges.width,maxSize*scale])

  }
  else {

    var defaultWidth = typeof vars.edges.size == "number"
                     ? vars.edges.size : vars.style.edges.width

    vars.edges.scale = function(){
      return defaultWidth
    }

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Initialization of Lines
  //----------------------------------------------------------------------------
  function init(l) {

    var opacity = vars.style.edges.opacity == 1 ? vars.style.edges.opacity : 0

    l
      .attr("opacity",opacity)
      .style("stroke-width",0)
      .style("stroke",vars.style.background)
      .style("fill","none")
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Styling of Lines
  //----------------------------------------------------------------------------
  function style(edges) {

    var marker = vars.edges.arrows.value

    edges
      .style("stroke-width",function(e){
        return vars.edges.scale(e[vars.edges.size])
      })
      .style("stroke",vars.style.edges.color)
      .attr("opacity",vars.style.edges.opacity)
      .attr("marker-start",function(e){

        var direction = vars.edges.arrows.direction.value

        if ("bucket" in e.d3plus) {
          var d = "_"+e.d3plus.bucket
        }
        else {
          var d = ""
        }

        return direction == "source" && marker
             ? "url(#d3plus_edge_marker_default"+d+")" : "none"

      })
      .attr("marker-end",function(e){

        var direction = vars.edges.arrows.direction.value

        if ("bucket" in e.d3plus) {
          var d = "_"+e.d3plus.bucket
        }
        else {
          var d = ""
        }

        return direction == "target" && marker
             ? "url(#d3plus_edge_marker_default"+d+")" : "none"

      })
      .attr("vector-effect","non-scaling-stroke")
      .attr("pointer-events","none")
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Positioning of Lines
  //----------------------------------------------------------------------------
  function line(l) {
    l
      .attr("x1",function(d){
        return d[vars.edges.source].d3plus.dx
      })
      .attr("y1",function(d){
        return d[vars.edges.source].d3plus.dy
      })
      .attr("x2",function(d){
        return d[vars.edges.target].d3plus.dx
      })
      .attr("y2",function(d){
        return d[vars.edges.target].d3plus.dy
      })
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Positioning of Splines
  //----------------------------------------------------------------------------
  var diagonal = d3.svg.diagonal(),
      radial = d3.svg.diagonal()
        .projection(function(d){
          var r = d.y, a = d.x;
          return [r * Math.cos(a), r * Math.sin(a)];
        })

  function spline(l) {
    l
      .attr("d", function(d) {
        if (d[vars.edges.source].d3plus.dr) {
          var x1 = d[vars.edges.source].d3plus.a,
              y1 = d[vars.edges.source].d3plus.dr,
              x2 = d[vars.edges.target].d3plus.a,
              y2 = d[vars.edges.target].d3plus.dr
          var obj = {}
          obj[vars.edges.source] = {"x":x1,"y":y1}
          obj[vars.edges.target] = {"x":x2,"y":y2}
          return radial(obj);

        }
        else {
          var x1 = d[vars.edges.source].d3plus.dx,
              y1 = d[vars.edges.source].d3plus.dy,
              x2 = d[vars.edges.target].d3plus.dx,
              y2 = d[vars.edges.target].d3plus.dy
          var obj = {}
          obj[vars.edges.source] = {"x":x1,"y":y1}
          obj[vars.edges.target] = {"x":x2,"y":y2}
          return diagonal(obj);
        }
      })
      .attr("transform",function(d){
        if (d.d3plus && d.d3plus.translate) {
          var x = d.d3plus.translate.x || 0
          var y = d.d3plus.translate.y || 0
          return "translate("+x+","+y+")"
        }
        else {
          "translate(0,0)"
        }
      })
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Calculates and Draws Label for edge
  //----------------------------------------------------------------------------
  function label(d) {

    delete d.d3plus_label

    if (vars.g.edges.selectAll("line, path").size() < vars.edges.large && vars.edges.label && d[vars.edges.label]) {

      if ("spline" in d.d3plus) {

        var length = this.getTotalLength(),
            center = this.getPointAtLength(length/2),
            prev = this.getPointAtLength((length/2)-(length*.1)),
            next = this.getPointAtLength((length/2)+(length*.1)),
            radians = Math.atan2(next.y-prev.y,next.x-prev.x),
            angle = radians*(180/Math.PI),
            bounding = this.parentNode.getBBox(),
            width = length*.8,
            x = d.d3plus.translate.x+center.x,
            y = d.d3plus.translate.y+center.y,
            translate = {
              "x": d.d3plus.translate.x+center.x,
              "y": d.d3plus.translate.y+center.y
            }

      }
      else {

        var bounds = this.getBBox()
            start = {"x": d[vars.edges.source].d3plus.dx, "y": d[vars.edges.source].d3plus.dy},
            end = {"x": d[vars.edges.target].d3plus.dx, "y": d[vars.edges.target].d3plus.dy},
            xdiff = end.x-start.x,
            ydiff = end.y-start.y,
            center = {"x": end.x-(xdiff)/2, "y": end.y-(ydiff)/2},
            radians = Math.atan2(ydiff,xdiff),
            angle = radians*(180/Math.PI),
            length = Math.sqrt((xdiff*xdiff)+(ydiff*ydiff)),
            width = length,
            x = center.x,
            y = center.y,
            translate = {
              "x": center.x,
              "y": center.y
            }

      }

      width += vars.style.labels.padding*2

      var m = 0
      if (vars.edges.arrows.value) {
        m = vars.style.edges.arrows
        m = m/vars.zoom_behavior.scaleExtent()[1]
        width -= m*2
      }

      if (angle < -90 || angle > 90) {
        angle -= 180
      }

      if ((length*vars.zoom_behavior.scaleExtent()[0])-m*2 > width) {

        d.d3plus_label = {
          "x": x,
          "y": y,
          "translate": translate,
          "w": width,
          "h": 15+vars.style.labels.padding*2,
          "angle": angle,
          "anchor": "middle",
          "valign": "center",
          "color": vars.style.edges.color,
          "resize": false,
          "names": [vars.format(d[vars.edges.label])],
          "background": 1
        }

      }

    }

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Enter/update/exit the Arrow Marker
  //----------------------------------------------------------------------------
  var markerData = vars.edges.arrows.value ? typeof vars.edges.size == "string"
                  ? [ "default_0", "default_1", "default_2",
                      "highlight_0", "highlight_1", "highlight_2",
                      "focus_0", "focus_1", "focus_2" ]
                  : [ "default", "highlight", "focus" ] : []

  if (typeof vars.edges.size == "string") {
    var buckets = d3plus.util.buckets(vars.edges.scale.range(),4)
      , markerSize = []
    for (var i = 0; i < 3; i++) {
      markerSize.push(buckets[i+1]+(buckets[1]-buckets[0])*(i+2))
    }
  }
  else {
    var markerSize = typeof vars.edges.size == "number"
                    ? vars.edges.size/vars.style.edges.arrows
                    : vars.style.edges.arrows
  }

  var marker = vars.defs.selectAll(".d3plus_edge_marker")
    .data(markerData, String)

  var marker_style = function(path) {
    path
      .attr("d",function(id){

        var depth = id.split("_")

        if (depth.length == 2 && vars.edges.scale) {
          depth = parseInt(depth[1])
          var m = markerSize[depth]
        }
        else {
          var m = markerSize
        }

        if (vars.edges.arrows.direction.value == "target") {
          return "M 0,-"+m/2+" L "+m*.85+",0 L 0,"+m/2+" L 0,-"+m/2
        }
        else {
          return "M 0,-"+m/2+" L -"+m*.85+",0 L 0,"+m/2+" L 0,-"+m/2
        }
      })
      .attr("fill",function(d){

        var type = d.split("_")[0]

        if (type == "default") {
          return vars.style.edges.color
        }
        else if (type == "focus") {
          return vars.style.highlight.focus
        }
        else {
          return vars.style.highlight.primary
        }
      })
      .attr("transform","scale("+1/scale+")")
  }

  if (vars.timing) {
    marker.exit().transition().duration(vars.timing)
      .attr("opacity",0)
      .remove()

    marker.select("path").transition().duration(vars.timing)
      .attr("opacity",1)
      .call(marker_style)
  }
  else {
    marker.exit().remove()

    marker.select("path")
      .attr("opacity",1)
      .call(marker_style)
  }

  var opacity = vars.timing ? 0 : 1
  var enter = marker.enter().append("marker")
    .attr("id",function(d){
      return "d3plus_edge_marker_"+d
    })
    .attr("class","d3plus_edge_marker")
    .attr("orient","auto")
    .attr("markerUnits","userSpaceOnUse")
    .style("overflow","visible")
    .append("path")
    .attr("opacity",opacity)
    .attr("vector-effect","non-scaling-stroke")
    .call(marker_style)

  if (vars.timing) {
    enter.transition().duration(vars.timing)
      .attr("opacity",1)
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Bind "edges" data to lines in the "edges" group
  //----------------------------------------------------------------------------
  var strokeBuckets = typeof vars.edges.size == "string"
                    ? d3plus.util.buckets(vars.edges.scale.domain(),4)
                    : null
    , direction = vars.edges.arrows.direction.value

  var line_data = edges.filter(function(l){

    if (!l.d3plus || (l.d3plus && !("spline" in l.d3plus))) {

      if (!l.d3plus) {
        l.d3plus = {}
      }

      if (strokeBuckets) {
        var size = l[vars.edges.size]
        l.d3plus.bucket = size < strokeBuckets[1] ? 0
                        : size < strokeBuckets[2] ? 1 : 2
        var marker = markerSize[l.d3plus.bucket]*.85/scale
      }
      else {
        delete l.d3plus.bucket
        var marker = markerSize*.85/scale
      }

      var source = l[vars.edges.source]
        , target = l[vars.edges.target]
        , angle = Math.atan2( source.d3plus.y - target.d3plus.y
                            , source.d3plus.x - target.d3plus.x )
        , sourceRadius = direction == "source" && vars.edges.arrows.value
                       ? source.d3plus.r + marker
                       : source.d3plus.r
        , targetRadius = direction == "target" && vars.edges.arrows.value
                       ? target.d3plus.r + marker
                       : target.d3plus.r
        , sourceOffset = d3plus.util.offset( angle
                                           , sourceRadius
                                           , vars.shape.value )
        , targetOffset = d3plus.util.offset( angle
                                           , targetRadius
                                           , vars.shape.value )

      source.d3plus.dx = source.d3plus.x - sourceOffset.x
      source.d3plus.dy = source.d3plus.y - sourceOffset.y
      target.d3plus.dx = target.d3plus.x + targetOffset.x
      target.d3plus.dy = target.d3plus.y + targetOffset.y

      return true
    }

    return false

  })

  var lines = vars.g.edges.selectAll("g.d3plus_edge_line")
    .data(line_data,function(d){

      if (!d.d3plus) {
        d.d3plus = {}
      }

      d.d3plus.id = d[vars.edges.source][vars.id.key]+"_"+d[vars.edges.target][vars.id.key]

      return d.d3plus.id

    })

  var spline_data = edges.filter(function(l){

    if (l.d3plus && l.d3plus.spline) {

      if (!l.d3plus) {
        l.d3plus = {}
      }

      if (strokeBuckets) {
        var size = l[vars.edges.size]
        l.d3plus.bucket = size < strokeBuckets[1] ? 0
                        : size < strokeBuckets[2] ? 1 : 2
        var marker = markerSize[l.d3plus.bucket]*.85/scale
      }
      else {
        delete l.d3plus.bucket
        var marker = markerSize*.85/scale
      }

      var source = l[vars.edges.source]
        , target = l[vars.edges.target]
        , sourceMod = source.d3plus.depth == 2 ? -marker : marker
        , targetMod = target.d3plus.depth == 2 ? -marker : marker
        , sourceRadius = direction == "source" && vars.edges.arrows.value
                       ? source.d3plus.r + sourceMod
                       : source.d3plus.r
        , targetRadius = direction == "target" && vars.edges.arrows.value
                       ? target.d3plus.r + targetMod
                       : target.d3plus.r

      source.d3plus.dr = sourceRadius
      target.d3plus.dr = targetRadius
      console.log(target.id,target.d3plus)

      return true

    }

    return false

  })

  var splines = vars.g.edges.selectAll("g.d3plus_edge_path")
    .data(spline_data,function(d){

      if (!d.d3plus) {
        d.d3plus = {}
      }

      d.d3plus.id = d[vars.edges.source][vars.id.key]+"_"+d[vars.edges.target][vars.id.key]

      return d.d3plus.id

    })

  if (vars.timing) {

    lines.exit().transition().duration(vars.timing)
      .attr("opacity",0)
      .remove()

    splines.exit().transition().duration(vars.timing)
      .attr("opacity",0)
      .remove()

    lines.selectAll("text.d3plus_label, rect.d3plus_label_bg")
      .transition().duration(vars.timing/2)
      .attr("opacity",0)
      .remove()

    splines.selectAll("text.d3plus_label, rect.d3plus_label_bg")
      .transition().duration(vars.timing/2)
      .attr("opacity",0)
      .remove()

    lines.selectAll("line").transition().duration(vars.timing)
      .call(line)
      .call(style)
      .each("end",label)

    splines.selectAll("path").transition().duration(vars.timing)
      .call(spline)
      .call(style)
      .each("end",label)

    lines.enter().append("g")
      .attr("class","d3plus_edge_line")
      .append("line")
      .call(line)
      .call(init)
      .transition().duration(vars.timing)
        .call(style)
        .each("end",label)

    splines.enter().append("g")
      .attr("class","d3plus_edge_path")
      .append("path")
      .call(spline)
      .call(init)
      .transition().duration(vars.timing)
        .call(style)
        .each("end",label)

  }
  else {

    lines.exit().remove()

    splines.exit().remove()

    lines.selectAll("text.d3plus_label, rect.d3plus_label_bg")
      .remove()

    splines.selectAll("text.d3plus_label, rect.d3plus_label_bg")
      .remove()

    lines.selectAll("line")
      .call(line)
      .call(style)
      .call(label)

    splines.selectAll("path")
      .call(spline)
      .call(style)
      .call(label)

    lines.enter().append("g")
      .attr("class","d3plus_edge_line")
      .append("line")
      .call(line)
      .call(init)
      .call(style)
      .call(label)

    splines.enter().append("g")
      .attr("class","d3plus_edge_path")
      .append("path")
      .call(spline)
      .call(init)
      .call(style)
      .call(label)

  }

  vars.g.edges.selectAll("g")
    .sort(function(a,b){
      var a = vars.connected(a),
          b = vars.connected(b)
      return a - b
    })

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Draws "square" and "circle" shapes using svg:rect
//------------------------------------------------------------------------------
d3plus.shape.fill = function(vars,selection,enter,exit) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // The position and size of each rectangle on enter and exit.
  //----------------------------------------------------------------------------
  function init(nodes) {

    nodes
      .attr("x",0)
      .attr("y",0)
      .attr("width",0)
      .attr("height",0)

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // The position and size of each rectangle on update.
  //----------------------------------------------------------------------------
  function update(nodes,mod) {
    if (!mod) var mod = 0
    nodes
      .attr("x",function(d){
        var w = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.width
        return (-w/2)-(mod/2)
      })
      .attr("y",function(d){
        var h = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.height
        return (-h/2)-(mod/2)
      })
      .attr("width",function(d){
        var w = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.width
        return w+mod
      })
      .attr("height",function(d){
        var h = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.height
        return h+mod
      })
      .attr("rx",function(d){
        var w = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.width
        var rounded = ["circle","donut"].indexOf(vars.shape.value) >= 0
        return rounded ? (w+mod)/2 : 0
      })
      .attr("ry",function(d){
        var h = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.height
        var rounded = ["circle","donut"].indexOf(vars.shape.value) >= 0
        return rounded ? (h+mod)/2 : 0
      })
      .attr("shape-rendering",function(d){
        if (["square"].indexOf(vars.shape.value) >= 0) {
          return vars.style.rendering
        }
        else {
          return "auto"
        }
      })
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // In order to correctly animate each donut's size and arcs, we need to store
  // it's previous values in a lookup object that does not get destroyed when
  // redrawing the visualization.
  //----------------------------------------------------------------------------
  if (!vars.arcs) {
    vars.arcs = {
      "donut": {},
      "active": {},
      "temp": {}
    }
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // This is the main arc function that determines what values to use for each
  // arc angle and radius.
  //----------------------------------------------------------------------------
  var arc = d3.svg.arc()
    .startAngle(0)
    .endAngle(function(d){
      var a = vars.arcs[d.d3plus.shapeType][d.d3plus.id].a
      return a > Math.PI*2 ? Math.PI*2 : a;
    })
    .innerRadius(function(d){
      if (shape == "donut" && !d.d3plus.static) {
        var r = vars.arcs[d.d3plus.shapeType][d.d3plus.id].r
        return r * vars.style.data.donut.size
      }
      else {
        return 0
      }
    })
    .outerRadius(function(d){
      var r = vars.arcs[d.d3plus.shapeType][d.d3plus.id].r
      if (d.d3plus.shapeType != "donut") return r*2
      else return r
    })

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // This is the main "arcTween" function where all of the animation happens
  // for each arc.
  //----------------------------------------------------------------------------
  function size(path,mod,rad,ang) {
    if (!mod) var mod = 0
    if (typeof rad != "number") var rad = undefined
    if (typeof ang != "number") var ang = undefined
    path.attrTween("d", function(d){
      if (rad == undefined) var r = d.d3plus.r ? d.d3plus.r : d3.max([d.d3plus.width,d.d3plus.height])
      else var r = rad
      if (ang == undefined) var a = d.d3plus.a[d.d3plus.shapeType]
      else var a = ang
      if (!vars.arcs[d.d3plus.shapeType][d.d3plus.id]) {
        vars.arcs[d.d3plus.shapeType][d.d3plus.id] = {"r": 0}
        vars.arcs[d.d3plus.shapeType][d.d3plus.id].a = d.d3plus.shapeType == "donut" ? Math.PI * 2 : 0
      }
      var radius = d3.interpolate(vars.arcs[d.d3plus.shapeType][d.d3plus.id].r,r+mod),
          angle = d3.interpolate(vars.arcs[d.d3plus.shapeType][d.d3plus.id].a,a)

      return function(t) {
        vars.arcs[d.d3plus.shapeType][d.d3plus.id].r = radius(t)
        vars.arcs[d.d3plus.shapeType][d.d3plus.id].a = angle(t)
        return arc(d)
      }
    })
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Check each data point for active and temp data
  //----------------------------------------------------------------------------
  selection.each(function(d){

    var active = vars.active.key ? d.d3plus[vars.active.key] : d.d3plus.active,
        temp = vars.temp.key ? d.d3plus[vars.temp.key] : d.d3plus.temp,
        total = vars.total.key ? d.d3plus[vars.total.key] : d.d3plus.total,
        group = d3.select(this),
        color = d3plus.variable.color(vars,d)

    var fill_data = [], hatch_data = []

    if (total && d3plus.apps[vars.type.value].fill) {

      if (temp) {
        var copy = d3plus.util.copy(d)
        copy.d3plus.shapeType = "temp"
        fill_data.push(copy)
        hatch_data = ["temp"]
      }

      if (active && (active < total || temp)) {
        var copy = d3plus.util.copy(d)
        copy.d3plus.shapeType = "active"
        fill_data.push(copy)
      }

    }

    function hatch_lines(l) {
      l
        .attr("stroke",color)
        .attr("stroke-width",1)
        .attr("shape-rendering",vars.style.rendering)
    }

    var pattern = vars.defs.selectAll("pattern#d3plus_hatch_"+d.d3plus.id)
      .data(hatch_data)

    if (vars.timing) {

      pattern.selectAll("rect")
        .transition().duration(vars.timing)
        .style("fill",color)

      pattern.selectAll("line")
        .transition().duration(vars.timing)
        .style("stroke",color)

    }
    else {

      pattern.selectAll("rect").style("fill",color)

      pattern.selectAll("line").style("stroke",color)

    }

    var pattern_enter = pattern.enter().append("pattern")
      .attr("id","d3plus_hatch_"+d.d3plus.id)
      .attr("patternUnits","userSpaceOnUse")
      .attr("x","0")
      .attr("y","0")
      .attr("width","10")
      .attr("height","10")
      .append("g")

    pattern_enter.append("rect")
      .attr("x","0")
      .attr("y","0")
      .attr("width","10")
      .attr("height","10")
      .attr("fill",color)
      .attr("fill-opacity",0.25)

    pattern_enter.append("line")
      .attr("x1","0")
      .attr("x2","10")
      .attr("y1","0")
      .attr("y2","10")
      .call(hatch_lines)

    pattern_enter.append("line")
      .attr("x1","-1")
      .attr("x2","1")
      .attr("y1","9")
      .attr("y2","11")
      .call(hatch_lines)

    pattern_enter.append("line")
      .attr("x1","9")
      .attr("x2","11")
      .attr("y1","-1")
      .attr("y2","1")
      .call(hatch_lines)

    var clip_data = fill_data.length ? [d] : []

    var clip = group.selectAll("#d3plus_clip_"+d.d3plus.id)
      .data(clip_data)

    clip.enter().insert("clipPath",".d3plus_mouse")
      .attr("id","d3plus_clip_"+d.d3plus.id)
      .append("rect")
      .attr("class","d3plus_clipping")
      .call(init)

    if (vars.timing) {
      
      clip.selectAll("rect").transition().duration(vars.timing)
        .call(update)

      clip.exit().transition().delay(vars.timing)
        .remove()

    }
    else {

      clip.selectAll("rect").call(update)

      clip.exit().remove()

    }

    var fills = group.selectAll("path.d3plus_fill")
      .data(fill_data)

    fills.transition().duration(vars.timing)
      .call(d3plus.shape.style,vars)
      .call(size)

    fills.enter().insert("path","rect.d3plus_mouse")
      .attr("class","d3plus_fill")
      .attr("clip-path","url(#d3plus_clip_"+d.d3plus.id+")")
      .transition().duration(0)
        .call(size,0,undefined,0)
        .call(d3plus.shape.style,vars)
        .transition().duration(vars.timing)
          .call(size)

    fills.exit().transition().duration(vars.timing)
      .call(size,0,undefined,0)
      .remove()

  })

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Draws "labels" using svg:text and d3plus.util.wordwrap
//------------------------------------------------------------------------------
d3plus.shape.labels = function(vars,selection) {

  var scale = vars.zoom_behavior.scaleExtent()

  var opacity = function(elem) {

    elem
      .attr("opacity",function(d){
        if (!d) var d = {"scale": scale[1]}
        var size = parseFloat(d3.select(this).attr("font-size"),10)
        d.visible = size/d.scale*vars.zoom.scale >= 7
        return d.visible ? 1 : 0
      })

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Label Exiting
  //----------------------------------------------------------------------------
  remove = function(text) {

    if (vars.timing) {
      text
        .transition().duration(vars.timing)
        .attr("opacity",0)
        .remove()
    }
    else {
      text.remove()
    }

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Label Styling
  //----------------------------------------------------------------------------
  style = function(text,wrap) {

    function x_pos(t) {

      var align = t.anchor || vars.style.labels.align,
          tspan = this.tagName == "tspan",
          share = tspan ? this.parentNode.className.baseVal == "d3plus_share" : this.className.baseVal == "d3plus_share",
          width = d3.select(this).node().getComputedTextLength()/scale[1]

      if (align == "middle" || share) {
        var pos = t.x-width/2
      }
      else if ((align == "end" && !d3plus.rtl) || (align == "start" && d3plus.rtl)) {
        var pos = t.x+(t.w-t.padding)/2-width
      }
      else {
        var pos = t.x-(t.w-t.padding)/2
      }

      if (tspan) {
        var t_width = this.getComputedTextLength()/scale[1]
        if (align == "middle") {
          if (d3plus.rtl) {
            pos -= (width-t_width)/2
          }
          else {
            pos += (width-t_width)/2
          }
        }
        else if (align == "end") {
          if (d3plus.rtl) {
            pos -= (width-t_width)
          }
          else {
            pos += (width-t_width)
          }
        }
      }

      if (d3plus.rtl) {
        pos += width
      }

      return pos*scale[1]

    }

    function y_pos(t) {

      if (d3.select(this).select("tspan").empty()) {
        return 0
      }
      else {

        var align = vars.style.labels.align,
            height = d3.select(this).node().getBBox().height/scale[1],
            diff = (parseFloat(d3.select(this).style("font-size"),10)/5)/scale[1]

        if (this.className.baseVal == "d3plus_share") {
          var data = d3.select(this.parentNode).datum()
          var pheight = data.d3plus.r ? data.d3plus.r*2 : data.d3plus.height
          pheight = pheight/scale[1]
          if (align == "end") {
            var y = t.y-pheight/2+diff/2
          }
          else {
            var y = t.y+pheight/2-height-diff/2
          }
        }
        else {

          if (align == "middle" || t.valign == "center") {
            var y = t.y-height/2-diff/2
          }
          else if (align == "end") {
            var y = t.y+(t.h-t.padding)/2-height+diff/2
          }
          else {
            var y = t.y-(t.h-t.padding)/2-diff
          }

        }

        return y*scale[1]

      }
    }

    text
      .attr("font-weight",vars.style.labels.font.weight)
      .attr("font-family",vars.style.labels.font.family)
      .attr("text-anchor","start")
      .attr("pointer-events",function(t){
        return t.mouse ? "auto": "none"
      })
      .attr("fill", function(t){
        if (t.color) {
          return t.color
        }
        else {
          return d3plus.color.text(d3plus.shape.color(t.parent,vars))
        }
      })
      .attr("x",x_pos)
      .attr("y",y_pos)

    if (wrap) {

      text
        .each(function(t){

          if (t.resize instanceof Array) {
            var min = t.resize[0]
              , max = t.resize[1]
          }

          if (t.text) {


            if (!(t.resize instanceof Array)) {
              var min = 8
                , max = 70
            }

            d3plus.util.wordwrap({
              "text": vars.format(t.text*100,"share")+"%",
              "parent": this,
              "width": t.w*t.scale-t.padding,
              "height": t.h*t.scale-t.padding,
              "resize": t.resize,
              "font_min": min/t.scale,
              "font_max": max*t.scale
            })

          }
          else {

            if (vars.style.labels.align != "middle") {
              var height = t.h-t.share
            }
            else {
              var height = t.h
            }

            if (!(t.resize instanceof Array)) {
              var min = 8
                , max = 40
            }

            d3plus.util.wordwrap({
              "text": t.names,
              "parent": this,
              "width": t.w*t.scale-t.padding,
              "height": height*t.scale-t.padding,
              "resize": t.resize,
              "font_min": min/t.scale,
              "font_max": max*t.scale
            })

          }

        })
        .attr("x",x_pos)
        .attr("y",y_pos)

    }

    text
      .attr("transform",function(t){
        var a = t.angle || 0,
            x = t.translate && t.translate.x || 0,
            y = t.translate && t.translate.y || 0

        return "rotate("+a+","+x+","+y+")scale("+1/scale[1]+")"
      })
      .selectAll("tspan")
        .attr("x",x_pos)
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Loop through each selection and analyze the labels
  //----------------------------------------------------------------------------
  if (vars.labels.value) {

    selection.each(function(d){

      var disabled = d.d3plus && "label" in d.d3plus && !d.d3plus.label,
          stat = d.d3plus && "static" in d.d3plus && d.d3plus.static
          label = d.d3plus_label ? d.d3plus_label : vars.zoom.labels ? vars.zoom.labels[d.d3plus.id] : null,
          share = d.d3plus_share,
          names = label && label.names ? label.names : d3plus.variable.text(vars,d),
          group = label && "group" in label ? label.group : d3.select(this),
          share_size = 0,
          fill = d3plus.apps[vars.type.value].fill

      if (label) {

        if (["line","area"].indexOf(vars.shape.value) >= 0) {
          var background = true
        }
        else if (d && "d3plus" in d) {
          var active = vars.active.key ? d.d3plus[vars.active.key] : d.d3plus.active,
              temp = vars.temp.key ? d.d3plus[vars.temp.key] : d.d3plus.temp,
              total = vars.total.key ? d.d3plus[vars.total.key] : d.d3plus.total,
              background = (!temp && !active) || (active == total)
        }

      }

      if (!disabled && (background || !fill) && !stat) {

        if (share && d.d3plus.share && vars.style.labels.align != "middle") {

          share.resize = vars.labels.resize.value === false ? false :
            share && "resize" in share ? share.resize : true

          share.scale = share.resize ? scale[1] : scale[0]

          share.padding = (vars.style.labels.padding/share.scale)*2

          share.text = d.d3plus.share
          share.parent = d

          var text = group.selectAll("text#d3plus_share_"+d.d3plus.id)
            .data([share],function(t){
              return t.w+""+t.h+""+t.text
            })

          if (vars.timing) {

            text
              .transition().duration(vars.timing/2)
              .call(style)

            text.enter().append("text")
              .attr("font-size",vars.style.labels.font.size*share.scale)
              .attr("id","d3plus_share_"+d.d3plus.id)
              .attr("class","d3plus_share")
              .attr("opacity",0)
              .call(style,true)
              .transition().duration(vars.timing/2)
              .delay(vars.timing/2)
              .attr("opacity",0.5)

          }
          else {

            text
              .attr("opacity",0.5)
              .call(style)

            text.enter().append("text")
              .attr("font-size",vars.style.labels.font.size*share.scale)
              .attr("id","d3plus_share_"+d.d3plus.id)
              .attr("class","d3plus_share")
              .attr("opacity",0.5)
              .call(style,true)

          }

          share_size = text.node().getBBox().height

          text.exit().call(remove)

        }
        else {
          group.selectAll("text.d3plus_share")
            .call(remove)
        }

        if (label) {

          label.resize = vars.labels.resize.value === false ? false :
            label && "resize" in label ? label.resize : true

          label.scale = label.resize ? scale[1] : scale[0]

          label.padding = (vars.style.labels.padding/label.scale)*2

        }

        if (label && label.w*label.scale-label.padding >= 20 && label.h*label.scale-label.padding >= 10 && names.length) {

          label.names = names

          label.share = share_size
          label.parent = d

          var text = group.selectAll("text#d3plus_label_"+d.d3plus.id)
            .data([label],function(t){
              if (!t) return false
              return t.w+"_"+t.h+"_"+t.x+"_"+t.y+"_"+t.names.join("_")
            })

          if (vars.timing) {

            text
              .transition().duration(vars.timing/2)
              .call(style)

            text.enter().append("text")
              .attr("font-size",vars.style.labels.font.size*label.scale)
              .attr("id","d3plus_label_"+d.d3plus.id)
              .attr("class","d3plus_label")
              .attr("opacity",0)
              .call(style,true)
              .transition().duration(vars.timing/2)
              .delay(vars.timing/2)
              .call(opacity)

          }
          else {

            text
              .attr("opacity",1)
              .call(style)

            text.enter().append("text")
              .attr("font-size",vars.style.labels.font.size*label.scale)
              .attr("id","d3plus_label_"+d.d3plus.id)
              .attr("class","d3plus_label")
              .call(style,true)
              .call(opacity)

          }

          text.exit().call(remove)

          if (text.size() == 0 || text.html() == "") {
            delete d.d3plus_label
            group.selectAll("text.d3plus_label, rect.d3plus_label_bg")
              .call(remove)
          }
          else {

            if (label.background) {

              var background_data = ["background"]

              var bounds = text.node().getBBox()

              bounds.width += vars.style.labels.padding*scale[0]
              bounds.height += vars.style.labels.padding*scale[0]
              bounds.x -= (vars.style.labels.padding*scale[0])/2
              bounds.y -= (vars.style.labels.padding*scale[0])/2

            }
            else {
              var background_data = [],
                  bounds = {}
            }

            var bg = group.selectAll("rect#d3plus_label_bg_"+d.d3plus.id)
                       .data(background_data)
              , bg_opacity = typeof label.background == "number"
                        ? label.background : 0.6

            function bg_style(elem) {

              var color = vars.style.background == "transparent"
                        ? "#ffffff" : vars.style.background
                , fill = typeof label.background == "string"
                       ? label.background : color
                , a = label.angle || 0
                , x = label.translate ? bounds.x+bounds.width/2 : 0
                , y = label.translate ? bounds.y+bounds.height/2 : 0
                , transform = "scale("+1/scale[1]+")rotate("+a+","+x+","+y+")"

              elem
                .attr("fill",fill)
                .attr(bounds)
                .attr("transform",transform)

            }

            if (vars.timing) {

              bg.exit().transition().duration(vars.timing)
                .attr("opacity",0)
                .remove()

              bg.transition().duration(vars.timing)
                .attr("opacity",bg_opacity)
                .call(bg_style)

              bg.enter().insert("rect",".d3plus_label")
                .attr("id","d3plus_label_bg_"+d.d3plus.id)
                .attr("class","d3plus_label_bg")
                .attr("opacity",0)
                .call(bg_style)
                .transition().duration(vars.timing)
                  .attr("opacity",bg_opacity)

            }
            else {

              bg.exit().remove()

              bg.enter().insert("rect",".d3plus_label")
                .attr("id","d3plus_label_bg_"+d.d3plus.id)
                .attr("class","d3plus_label_bg")

              bg.attr("opacity",bg_opacity)
                .call(bg_style)

            }

          }

        }
        else {
          delete d.d3plus_label
          group.selectAll("text#d3plus_label_"+d.d3plus.id+", rect#d3plus_label_bg_"+d.d3plus.id)
            .call(remove)
        }

      }
      else {
        delete d.d3plus_label
        group.selectAll("text#d3plus_label_"+d.d3plus.id+", rect#d3plus_label_bg_"+d.d3plus.id)
          .call(remove)
      }
    })

  }
  else {

    selection.selectAll("text.d3plus_label, rect.d3plus_label_bg")
      .call(remove)

    vars.g.labels.selectAll("text.d3plus_label, rect.d3plus_label_bg")
      .call(remove)

  }

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Draws "line" shapes using svg:line
//------------------------------------------------------------------------------
d3plus.shape.line = function(vars,selection,enter,exit) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // The D3 line function that determines what variables to use for x and y
  // positioning, as well as line interpolation defined by the user.
  //----------------------------------------------------------------------------
  var line = d3.svg.line()
    .x(function(d){ return d.d3plus.x; })
    .y(function(d){ return d.d3plus.y; })
    .interpolate(vars.shape.interpolate.value)

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Divide each line into it's segments. We do this so that there can be gaps
  // in the line and mouseover.
  //
  // Then, create new data group from values to become small nodes at each
  // point on the line.
  //----------------------------------------------------------------------------

  var hitarea = vars.style.data.stroke.width
  if (hitarea < 30) {
    hitarea = 30
  }

  selection.each(function(d){

    var step = false,
        segments = [],
        nodes = [],
        temp = d3plus.util.copy(d),
        group = d3.select(this)

    temp.values = []
    d.values.forEach(function(v,i,arr){
      nodes.push(v)
      var k = v[vars[vars.continuous_axis].key],
          index = vars.tickValues[vars.continuous_axis].indexOf(k)

      if (step === false) {
        step = index
      }

      if (i+step == index) {
        temp.values.push(v)
        temp.key += "_"+segments.length
      }
      else {
        if (i > 0) {
          segments.push(temp)
          temp = d3plus.util.copy(d)
          temp.values = []
        }
        temp.values.push(v)
        temp.key += "_"+segments.length
        step++
      }
      if (i == arr.length-1) {
        segments.push(temp)
      }
    })

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Bind segment data to "paths"
    //--------------------------------------------------------------------------
    var paths = group.selectAll("path.d3plus_line")
      .data(segments, function(d){
        return d.key
      })

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Bind node data to "rects"
    //--------------------------------------------------------------------------
    var rects = group.selectAll("rect.d3plus_anchor")
      .data(nodes, function(d){
        return d.d3plus.id
      })

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // "paths" and "rects" Enter/Update
    //--------------------------------------------------------------------------
    if (vars.timing) {

      paths.transition().duration(vars.timing)
        .attr("d",function(d){ return line(d.values) })
        .call(d3plus.shape.style,vars)

      paths.enter().append("path")
        .attr("class","d3plus_line")
        .attr("d",function(d){ return line(d.values) })
        .call(d3plus.shape.style,vars)

      rects.enter().append("rect")
        .attr("class","d3plus_anchor")
        .attr("id",function(d){
          return d.d3plus.id
        })
        .call(init)
        .call(d3plus.shape.style,vars)

      rects.transition().duration(vars.timing)
        .call(update)
        .call(d3plus.shape.style,vars)

      rects.exit().transition().duration(vars.timing)
        .call(init)
        .remove()

    }
    else {

      paths.enter().append("path")
        .attr("class","d3plus_line")

      paths
        .attr("d",function(d){ return line(d.values) })
        .call(d3plus.shape.style,vars)

      rects.enter().append("rect")
        .attr("class","d3plus_anchor")
        .attr("id",function(d){
          return d.d3plus.id
        })

      rects.call(update)
        .call(d3plus.shape.style,vars)

    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Create mouse event lines
    //--------------------------------------------------------------------------
    var mouse = group.selectAll("path.d3plus_mouse")
      .data(segments, function(d){
        return d.key
      })

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Mouse "paths" Enter
    //--------------------------------------------------------------------------
    mouse.enter().append("path")
      .attr("class","d3plus_mouse")
      .attr("d",function(l){ return line(l.values) })
      .style("stroke","black")
      .style("stroke-width",hitarea)
      .style("fill","none")
      .style("stroke-linecap","round")
      .attr("opacity",0)

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Mouse "paths" Update
    //--------------------------------------------------------------------------
    mouse
      .on(d3plus.evt.over,function(m){

        if (!vars.frozen) {

          var mouse = d3.event[vars.continuous_axis]
              positions = d3plus.util.uniques(d.values,function(x){return x.d3plus[vars.continuous_axis]}),
              closest = d3plus.util.closest(positions,mouse)

          var parent_data = d3.select(this.parentNode).datum()
          parent_data.data = d.values[positions.indexOf(closest)]
          parent_data.d3plus = d.values[positions.indexOf(closest)].d3plus

          d3.select(this.parentNode).selectAll("path.d3plus_line")
            .transition().duration(vars.style.timing.mouseevents)
            .style("stroke-width",vars.style.data.stroke.width*2)

          d3.select(this.parentNode).selectAll("rect")
            .transition().duration(vars.style.timing.mouseevents)
            .style("stroke-width",vars.style.data.stroke.width*2)
            .call(update,2)

        }

      })
      .on(d3plus.evt.move,function(d){

        if (!vars.frozen) {

          var mouse = d3.event.x,
              positions = d3plus.util.uniques(d.values,function(x){return x.d3plus.x}),
              closest = d3plus.util.closest(positions,mouse)

          var parent_data = d3.select(this.parentNode).datum()
          parent_data.data = d.values[positions.indexOf(closest)]
          parent_data.d3plus = d.values[positions.indexOf(closest)].d3plus

        }

      })
      .on(d3plus.evt.out,function(d){

        if (!vars.frozen) {

          d3.select(this.parentNode).selectAll("path.d3plus_line")
            .transition().duration(vars.style.timing.mouseevents)
            .style("stroke-width",vars.style.data.stroke.width)

          d3.select(this.parentNode).selectAll("rect")
            .transition().duration(vars.style.timing.mouseevents)
            .style("stroke-width",vars.style.data.stroke.width)
            .call(update)

          var parent_data = d3.select(this.parentNode).datum()
          delete parent_data.data
          delete parent_data.d3plus

        }

      })

    if (vars.timing) {

      mouse.transition().duration(vars.timing)
        .attr("d",function(l){ return line(l.values) })
        .style("stroke-width",hitarea)

    }
    else {

      mouse.attr("d",function(l){ return line(l.values) })
        .style("stroke-width",hitarea)

    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Mouse "paths" Exit
    //--------------------------------------------------------------------------
    mouse.exit().remove()

  })

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // The position and size of each anchor point on enter and exit.
  //----------------------------------------------------------------------------
  function init(n) {

    n
      .attr("x",function(d){
        return d.d3plus.x
      })
      .attr("y",function(d){
        return d.d3plus.y
      })
      .attr("width",0)
      .attr("height",0)

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // The position and size of each anchor point on update.
  //----------------------------------------------------------------------------
  function update(n,mod) {

    if (!mod) var mod = 0

    n
      .attr("x",function(d){
        var w = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.width
        return d.d3plus.x - ((w/2)+(mod/2))
      })
      .attr("y",function(d){
        var h = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.height
        return d.d3plus.y - ((h/2)+(mod/2))
      })
      .attr("width",function(d){
        var w = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.width
        return w+mod
      })
      .attr("height",function(d){
        var h = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.height
        return h+mod
      })
      .attr("rx",function(d){
        var w = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.width
        return (w+mod)/2
      })
      .attr("ry",function(d){
        var h = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.height
        return (h+mod)/2
      })

  }

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Draws "square" and "circle" shapes using svg:rect
//------------------------------------------------------------------------------
d3plus.shape.rect = function(vars,selection,enter,exit) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Calculate label position and pass data from parent.
  //----------------------------------------------------------------------------
  function data(d) {

    if (vars.labels.value && !d.d3plus.label) {

      d.d3plus_label = {
        "w": 0,
        "h": 0,
        "x": 0,
        "y": 0
      }

      var w = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.width,
          h = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.height

      // Square bounds
      if (vars.shape.value == "square") {

        d.d3plus_share = {
          "w": w,
          "h": h/4,
          "x": 0,
          "y": 0
        }

        d.d3plus_label.w = w
        d.d3plus_label.h = h

      }
      // Circle bounds
      else {
        d.d3plus_label.w = Math.sqrt(Math.pow(w,2)*.8)
        d.d3plus_label.h = Math.sqrt(Math.pow(h,2)*.8)
      }

    }
    else if (d.d3plus.label) {
      d.d3plus_label = d.d3plus.label
    }

    return [d];

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // The position and size of each rectangle on enter and exit.
  //----------------------------------------------------------------------------
  function init(nodes) {

    nodes
      .attr("x",0)
      .attr("y",0)
      .attr("width",0)
      .attr("height",0)

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // The position and size of each rectangle on update.
  //----------------------------------------------------------------------------
  function update(nodes) {

    nodes
      .attr("x",function(d){
        var w = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.width
        return -w/2
      })
      .attr("y",function(d){
        var h = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.height
        return -h/2
      })
      .attr("width",function(d){
        var w = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.width
        return w
      })
      .attr("height",function(d){
        var h = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.height
        return h
      })
      .attr("rx",function(d){
        var rounded = vars.shape.value == "circle"
        var w = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.width
        return rounded ? (w+2)/2 : 0
      })
      .attr("ry",function(d){
        var rounded = vars.shape.value == "circle"
        var h = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.height
        return rounded ? (h+2)/2 : 0
      })
      .attr("transform",function(d){
        if ("rotate" in d.d3plus) {
          return "rotate("+d.d3plus.rotate+")"
        }
        return ""
      })
      .attr("shape-rendering",function(d){
        if (vars.shape.value == "square" && !("rotate" in d.d3plus)) {
          return vars.style.rendering
        }
        else {
          return "auto"
        }
      })

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // "rects" Enter
  //----------------------------------------------------------------------------
  if (vars.timing) {
    enter.append("rect")
      .attr("class","d3plus_data")
      .call(init)
      .call(d3plus.shape.style,vars)
  }
  else {
    enter.append("rect")
      .attr("class","d3plus_data")
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // "rects" Update
  //----------------------------------------------------------------------------
  if (vars.timing) {
    selection.selectAll("rect.d3plus_data")
      .data(data)
      .transition().duration(vars.timing)
        .call(update)
        .call(d3plus.shape.style,vars)
  }
  else {
    selection.selectAll("rect.d3plus_data")
      .data(data)
      .call(update)
      .call(d3plus.shape.style,vars)
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // "rects" Exit
  //----------------------------------------------------------------------------
  if (vars.timing) {
    exit.selectAll("rect.d3plus_data")
      .transition().duration(vars.timing)
      .call(init)
  }

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Fill style for all shapes
//-------------------------------------------------------------------
d3plus.shape.style = function(nodes,vars) {

  nodes
    .attr("fill",function(d){

      if (d.d3plus && d.d3plus.spline) {
        return "none"
      }
      else {
        return d3plus.shape.color(d,vars)
      }

    })
    .style("stroke", function(d){
      if (d.values) {
        var color = d3plus.shape.color(d.values[0],vars)
      }
      else {
        var color = d3plus.shape.color(d,vars)
      }
      return d3plus.color.legible(color)
    })
    .style("stroke-width",vars.style.data.stroke.width)
    .attr("opacity",vars.style.data.opacity)
    .attr("vector-effect","non-scaling-stroke")

}

d3plus.styles.default = {
  "background": "#ffffff",
  "color": {
    "heatmap": ["#27366C", "#7B91D3", "#9ED3E3", "#F3D261", "#C9853A", "#D74B03"],
    "missing": "#eeeeee",
    "range": ["#D74B03","#eeeeee","#94B153"]
  },
  "data": {
    "donut": {
      "size": 0.35
    },
    "opacity": 0.9,
    "stroke": {
      "width": 1
    }
  },
  "edges": {
    "arrows": 8,
    "color": "#d0d0d0",
    "opacity": 1,
    "width": 1
  },
  "footer": {
    "font": {
      "align": "center",
      "color": "#444",
      "decoration": "none",
      "family": ["Helvetica Neue", "HelveticaNeue", "Helvetica", "Arial", "sans-serif"],
      "size": 10,
      "transform": "none",
      "weight": 200
    },
    "padding": 5,
    "position": "bottom"
  },
  "font": {
    "color": "#444",
    "decoration": "none",
    "family": ["Helvetica Neue", "HelveticaNeue", "Helvetica", "Arial", "sans-serif"],
    "transform": "none",
    "weight": 200
  },
  "group": {
    "background": true,
  },
  "highlight": {
    "focus": "#444444",
    "primary": "#D74B03",
    "secondary": "#E5B3BB"
  },
  "labels": {
    "align": "middle",
    "padding": 7,
    "segments": 2,
    "font": {
      "decoration": "none",
      "family": ["Helvetica Neue", "HelveticaNeue", "Helvetica", "Arial", "sans-serif"],
      "size": 12,
      "transform": "none",
      "weight": 200
    }
  },
  "legend": {
    "align": "middle",
    "gradient": {
      "height": 10
    },
    "label": {
      "color": "#444",
      "family": ["Helvetica Neue", "HelveticaNeue", "Helvetica", "Arial", "sans-serif"],
      "weight": 200,
      "size": 12
    },
    "size": [10,30],
    "tick": {
      "align": "middle",
      "color": "#444",
      "family": ["Helvetica Neue", "HelveticaNeue", "Helvetica", "Arial", "sans-serif"],
      "weight": 200,
      "size": 10
    }
  },
  "link": {
    "font": {
      "color": "#444",
      "decoration": "none",
      "family": ["Helvetica Neue", "HelveticaNeue", "Helvetica", "Arial", "sans-serif"],
      "transform": "none",
      "weight": 200
    },
    "hover": {
      "font": {
        "color": "#444",
        "decoration": "underline",
        "family": ["Helvetica Neue", "HelveticaNeue", "Helvetica", "Arial", "sans-serif"],
        "transform": "none",
        "weight": 200
      },
    }
  },
  "message": {
    "font": {
      "color": "#444",
      "decoration": "none",
      "family": ["Helvetica Neue", "HelveticaNeue", "Helvetica", "Arial", "sans-serif"],
      "size": 18,
      "transform": "none",
      "weight": 200
    },
    "opacity": 0.75,
    "padding": 10
  },
  "rendering": "crispEdges",
  "ticks": {
    "color": "#ccc",
    "font": {
      "color": "#888",
      "decoration": "none",
      "family": ["Helvetica Neue", "HelveticaNeue", "Helvetica", "Arial", "sans-serif"],
      "size": 12,
      "transform": "none",
      "weight": 200
    },
    "size": 10,
    "width": 1
  },
  "timeline": {
    "align": "middle",
    "background": "#eeeeee",
    "brush": {
      "color": "#fff",
      "opacity": 1
    },
    "handles": {
      "color": "#E5E5E5",
      "hover": "#fff",
      "opacity": 1,
      "size": 3,
      "stroke": "#ccc"
    },
    "height": 20,
    "label": {
      "color": "#444",
      "family": ["Helvetica Neue", "HelveticaNeue", "Helvetica", "Arial", "sans-serif"],
      "weight": 200,
      "size": 12
    },
    "tick": {
      "align": "middle",
      "color": "#E5E5E5",
      "family": ["Helvetica Neue", "HelveticaNeue", "Helvetica", "Arial", "sans-serif"],
      "weight": 200,
      "size": 10
    }
  },
  "timing": {
    "mouseevents": 60,
    "transitions": 600
  },
  "title": {
    "font": {
      "align": "center",
      "color": "#444",
      "decoration": "none",
      "family": ["Helvetica Neue", "HelveticaNeue", "Helvetica", "Arial", "sans-serif"],
      "size": 18,
      "transform": "none",
      "weight": 200
    },
    "height": null,
    "padding": 2,
    "position": "top",
    "sub": {
      "font": {
        "align": "center",
        "color": "#444",
        "decoration": "none",
        "family": ["Helvetica Neue", "HelveticaNeue", "Helvetica", "Arial", "sans-serif"],
        "size": 13,
        "transform": "none",
        "weight": 200
      },
      "padding": 1,
      "position": "top"
    },
    "total": {
      "font": {
        "align": "center",
        "color": "#444",
        "decoration": "none",
        "family": ["Helvetica Neue", "HelveticaNeue", "Helvetica", "Arial", "sans-serif"],
        "size": 13,
        "transform": "none",
        "weight": 200
      },
      "padding": 1,
      "position": "top"
    },
    "width": null
  },
  "tooltip": {
    "anchor": "top center",
    "background": "white",
    "curtain": {
      "color": "#ffffff",
      "opacity": 0.8
    },
    "font": {
      "color": "#444",
      "family": ["Helvetica Neue", "HelveticaNeue", "Helvetica", "Arial", "sans-serif"],
      "size": 12,
      "transform": "none",
      "weight": 200
    },
    "large": 250,
    "small": 200
  },
  "ui": {
    "padding": 5
  }
}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates correctly formatted tooltip for Apps
//-------------------------------------------------------------------
d3plus.tooltip.app = function(params) {

  var vars = params.vars,
      d = params.data,
      ex = params.ex,
      mouse = params.mouseevents ? params.mouseevents : false,
      arrow = "arrow" in params ? params.arrow : true,
      id = d3plus.variable.value(vars,d,vars.id.key),
      tooltip_id = params.id || vars.type.value

  if ((d3.event && d3.event.type == "click") && (vars.html.value || vars.tooltip.value.long) && !("fullscreen" in params)) {
    var fullscreen = true,
        arrow = false,
        mouse = true,
        length = "long",
        footer = vars.footer.value

    vars.covered = true
  }
  else {
    var fullscreen = false,
        align = params.anchor || vars.style.tooltip.anchor,
        length = params.length || "short",
        zoom = vars.zoom_direction()

    if (zoom === -1) {
      var key = vars.id.nesting[vars.depth.value-1],
          parent = d3plus.variable.value(vars,id,key),
          solo = vars.id.solo.value.indexOf(parent) >= 0
    }

    if (zoom === 1 && vars.zoom.value) {
      var text = vars.format("Click to Expand")
    }
    else if (zoom === -1 && vars.zoom.value && solo) {
      var text = vars.format("Click to Collapse")
    }
    else if (length == "short" && (vars.html.value || vars.tooltip.value.long) && vars.focus.value != id) {
      var text = "Click for More Info"
    }
    else {
      var text = vars.footer.value || ""
    }

    var footer = text.length ? vars.format(text,"footer") : false

  }

  if ("x" in params) {
    var x = params.x
  }
  else if (d3plus.apps[vars.type.value].tooltip == "follow") {
    var x = d3.mouse(vars.parent.node())[0]
  }
  else {
    var x = d.d3plus.x
    if (vars.zoom.translate && vars.zoom.scale) {
      x = vars.zoom.translate[0]+x*vars.zoom.scale
    }
    x += vars.margin.left
  }

  if ("y" in params) {
    var y = params.y
  }
  else if (d3plus.apps[vars.type.value].tooltip == "follow") {
    var y = d3.mouse(vars.parent.node())[1]
  }
  else {
    var y = d.d3plus.y
    if (vars.zoom.translate && vars.zoom.scale) {
      y = vars.zoom.translate[1]+y*vars.zoom.scale
    }
    y += vars.margin.top
  }

  if ("offset" in params) {
    var offset = params.offset
  }
  else if (d3plus.apps[vars.type.value].tooltip == "follow") {
    var offset = 3
  }
  else {
    var offset = d.d3plus.r ? d.d3plus.r : d.d3plus.height/2
    if (vars.zoom.scale) {
      offset = offset * vars.zoom.scale
    }
  }

  function make_tooltip(html) {

    if (d.d3plus) {

      if (d.d3plus.merged) {
        if (!ex) ex = {}
        ex.items = d.d3plus.merged.length
      }

      var active = vars.active.key ? d3plus.variable.value(vars,d,vars.active.key) : d.d3plus.active,
          temp = vars.temp.key ? d3plus.variable.value(vars,d,vars.temp.key) : d.d3plus.temp,
          total = vars.total.key ? d3plus.variable.value(vars,d,vars.total.key) : d.d3plus.total

      if (typeof active == "number" && active > 0 && total) {
        if (!ex) ex = {}
        var label = vars.active.key || "active"
        ex[label] = active+"/"+total+" ("+vars.format((active/total)*100,"share")+"%)"
      }

      if (typeof temp == "number" && temp > 0 && total) {
        if (!ex) ex = {}
        var label = vars.temp.key || "temp"
        ex[label] = temp+"/"+total+" ("+vars.format((temp/total)*100,"share")+"%)"
      }

      if (d.d3plus.share) {
        if (!ex) ex = {}
        ex.share = vars.format(d.d3plus.share*100,"share")+"%"
      }

    }

    var depth = "depth" in params ? params.depth : vars.depth.value,
        title = d3plus.variable.text(vars,d,depth)[0],
        icon = d3plus.variable.value(vars,d,vars.icon.key,vars.id.nesting[depth]),
        tooltip_data = d3plus.tooltip.data(vars,d,length,ex,depth)

    if ((tooltip_data.length > 0 || footer) || ((!d.d3plus_label && length == "short") || (d.d3plus_label && "visible" in d.d3plus_label && !d.d3plus_label.visible))) {

      if (!title) {
        title = id
      }

      var depth = d.d3plus && "depth" in d.d3plus ? vars.id.nesting[d.d3plus.depth] : vars.id.key

      if (typeof vars.icon.style.value == "string") {
        var icon_style = vars.icon.style.value
      }
      else if (typeof vars.icon.style.value == "object" && vars.icon.style.value[depth]) {
        var icon_style = vars.icon.style.value[depth]
      }
      else {
        var icon_style = "default"
      }

      if (params.width) {
        var width = params.width
      }
      else if (!fullscreen && tooltip_data.length == 0) {
        var width = "auto"
      }
      else {
        var width = vars.style.tooltip.small
      }

      d3plus.tooltip.create({
        "align": align,
        "arrow": arrow,
        "background": vars.style.tooltip.background,
        "curtain": vars.style.tooltip.curtain.color,
        "curtainopacity": vars.style.tooltip.curtain.opacity,
        "fontcolor": vars.style.tooltip.font.color,
        "fontfamily": vars.style.tooltip.font.family,
        "fontsize": vars.style.tooltip.font.size,
        "fontweight": vars.style.tooltip.font.weight,
        "data": tooltip_data,
        "color": d3plus.variable.color(vars,d),
        "footer": footer,
        "fullscreen": fullscreen,
        "html": html,
        "icon": icon,
        "id": tooltip_id,
        "max_height": params.maxheight,
        "max_width": vars.style.tooltip.small,
        "mouseevents": mouse,
        "offset": offset,
        "parent": vars.parent,
        "style": icon_style,
        "title": title,
        "width": width,
        "x": x,
        "y": y
      })

    }

  }

  if (fullscreen) {

    if (typeof vars.html.value == "string") {
      make_tooltip(vars.html.value)
    }
    else if (typeof vars.html.value == "function") {
      make_tooltip(vars.html.value(id))
    }
    else if (vars.html.value && typeof vars.html.value == "object" && vars.html.value.url) {
      d3.json(vars.html.value.url,function(data){
        var html = vars.html.value.callback ? vars.html.value.callback(data) : data
        make_tooltip(html)
      })
    }
    else {
      make_tooltip("")
    }

  }
  else {
    make_tooltip("")
  }

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Correctly positions the tooltip's arrow
//-------------------------------------------------------------------
d3plus.tooltip.arrow = function(arrow) {
  arrow
    .style("bottom", function(d){
      if (d.anchor.y != "center" && !d.flip) return "-5px"
      else return "auto"
    })
    .style("top", function(d){
      if (d.anchor.y != "center" && d.flip) return "-5px"
      else if (d.anchor.y == "center") return "50%"
      else return "auto"
    })
    .style("left", function(d){
      if (d.anchor.y == "center" && d.flip) return "-5px"
      else if (d.anchor.y != "center") return "50%"
      else return "auto"
    })
    .style("right", function(d){
      if (d.anchor.y == "center" && !d.flip) return "-5px"
      else return "auto"
    })
    .style("margin-left", function(d){
      if (d.anchor.y == "center") {
        return "auto"
      }
      else {
        if (d.anchor.x == "right") {
          var arrow_x = -d.width/2+d.arrow_offset/2
        }
        else if (d.anchor.x == "left") {
          var arrow_x = d.width/2-d.arrow_offset*2 - 5
        }
        else {
          var arrow_x = -5
        }
        if (d.cx-d.width/2-5 < arrow_x) {
          arrow_x = d.cx-d.width/2-5
          if (arrow_x < 2-d.width/2) arrow_x = 2-d.width/2
        }
        else if (-(d.limit[0]-d.cx-d.width/2+5) > arrow_x) {
          var arrow_x = -(d.limit[0]-d.cx-d.width/2+5)
          if (arrow_x > d.width/2-11) arrow_x = d.width/2-11
        }
        return arrow_x+"px"
      }
    })
    .style("margin-top", function(d){
      if (d.anchor.y != "center") {
        return "auto"
      }
      else {
        if (d.anchor.y == "bottom") {
          var arrow_y = -d.height/2+d.arrow_offset/2 - 1
        }
        else if (d.anchor.y == "top") {
          var arrow_y = d.height/2-d.arrow_offset*2 - 2
        }
        else {
          var arrow_y = -9
        }
        if (d.cy-d.height/2-d.arrow_offset < arrow_y) {
          arrow_y = d.cy-d.height/2-d.arrow_offset
          if (arrow_y < 4-d.height/2) arrow_y = 4-d.height/2
        }
        else if (-(d.limit[1]-d.cy-d.height/2+d.arrow_offset) > arrow_y) {
          var arrow_y = -(d.limit[1]-d.cy-d.height/2+d.arrow_offset)
          if (arrow_y > d.height/2-22) arrow_y = d.height/2-22
        }
        return arrow_y+"px"
      }
    })
}
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Create a Tooltip
//-------------------------------------------------------------------
d3plus.tooltip.create = function(params) {

  var default_width = params.fullscreen ? 250 : 200
  params.width = params.width || default_width
  params.max_width = params.max_width || 386
  params.id = params.id || "default"
  params.size = params.fullscreen || params.html ? "large" : "small"
  params.offset = params.offset || 0
  params.arrow_offset = params.arrow ? 8 : 0
  params.x = params.x || 0
  params.y = params.y || 0
  params.color = params.color || "#333"
  params.parent = params.parent || d3.select("body")
  params.curtain = params.curtain || "#fff"
  params.curtainopacity = params.curtainopacity || 0.8
  params.background = params.background || "#fff"
  params.fontcolor = params.fontcolor || "#333"
  params.fontfamily = params.fontfamily || "sans-serif"
  params.fontweight = params.fontweight || "normal"
  params.fontsize = params.fontsize || "12px"
  params.style = params.style || "default"
  params.zindex = params.size == "small" ? 2000 : 500
  if (!params.iconsize) {
    params.iconsize = params.size == "small" ? 22 : 50
  }

  params.limit = [
    parseFloat(params.parent.style("width"),10),
    parseFloat(params.parent.style("height"),10)
  ]

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Function that closes ALL Descriptions
  //-------------------------------------------------------------------
  var close_descriptions = function() {
    d3.selectAll("div.d3plus_tooltip_data_desc").style("height","0px")
    d3.selectAll("div.d3plus_tooltip_data_help").style("background-color","#ccc")
  }

  d3plus.tooltip.remove(params.id)

  params.anchor = {}
  if (params.fullscreen) {
    params.anchor.x = "center"
    params.anchor.y = "center"
    params.x = params.parent ? params.parent.node().offsetWidth/2 : window.innerWidth/2
    params.y = params.parent ? params.parent.node().offsetHeight/2 : window.innerHeight/2
  }
  else if (params.align) {
    var a = params.align.split(" ")
    params.anchor.y = a[0]
    if (a[1]) params.anchor.x = a[1]
    else params.anchor.x = "center"
  }
  else {
    params.anchor.x = "center"
    params.anchor.y = "top"
  }

  var title_width = params.width - 30

  if (params.fullscreen) {
    var curtain = params.parent.append("div")
      .attr("id","d3plus_tooltip_curtain_"+params.id)
      .attr("class","d3plus_tooltip_curtain")
      .style("background-color",params.curtain)
      .style("opacity",params.curtainopacity)
      .style("position","absolute")
      .style("z-index",499)
      .style("top","0px")
      .style("right","0px")
      .style("bottom","0px")
      .style("left","0px")
      .on(d3plus.evt.click,function(){
        d3plus.tooltip.remove(params.id)
      })
  }

  var tooltip = params.parent.append("div")
    .datum(params)
    .attr("id","d3plus_tooltip_id_"+params.id)
    .attr("class","d3plus_tooltip d3plus_tooltip_"+params.size)
    .style("color",params.fontcolor)
    .style("font-family",params.fontfamily)
    .style("font-weight",params.fontweight)
    .style("font-size",params.fontsize+"px")
    .style("position","absolute")
    .style("z-index",params.zindex)
    .on(d3plus.evt.out,function(){
      close_descriptions()
    })

  if (params.max_height) {
    tooltip.style("max-height",params.max_height+"px")
  }

  if (params.fixed) {
    tooltip.style("z-index",500)
    params.mouseevents = true
  }
  else {
    tooltip.style("z-index",2000)
  }

  var container = tooltip.append("div")
    .datum(params)
    .attr("class","d3plus_tooltip_container")
    .style("background-color",params.background)

  if (params.fullscreen && params.html) {

    w = params.parent ? params.parent.node().offsetWidth*0.75 : window.innerWidth*0.75
    h = params.parent ? params.parent.node().offsetHeight*0.75 : window.innerHeight*0.75

    container
      .style("width",w+"px")
      .style("height",h+"px")

    var body = container.append("div")
      .attr("class","d3plus_tooltip_body")
      .style("display","inline-block")
      .style("z-index",1)
      .style("width",params.width+"px")

  }
  else {

    if (params.width == "auto") {
      var w = "auto"
      container.style("max-width",params.max_width+"px")
    }
    else var w = params.width-14+"px"

    var body = container
      .style("width",w)

  }

  if (params.title || params.icon) {
    var header = body.append("div")
      .attr("class","d3plus_tooltip_header")
      .style("position","relative")
      .style("z-index",1)
  }

  if (params.fullscreen) {
    var close = tooltip.append("div")
      .attr("class","d3plus_tooltip_close")
      .style("background-color",params.color)
      .style("color",d3plus.color.text(params.color))
      .style("position","absolute")
      .html("\&times;")
      .on(d3plus.evt.click,function(){
        d3plus.tooltip.remove(params.id)
      })
  }

  if (!params.mouseevents) {
    tooltip.style("pointer-events","none")
  }
  else if (params.mouseevents !== true) {

    var oldout = d3.select(params.mouseevents).on(d3plus.evt.out)

    var newout = function() {

      var target = d3.event.toElement || d3.event.relatedTarget
      if (target) {
        var c = typeof target.className == "string" ? target.className : target.className.baseVal
        var istooltip = c.indexOf("d3plus_tooltip") == 0
      }
      else {
        var istooltip = false
      }
      if (!target || (!ischild(tooltip.node(),target) && !ischild(params.mouseevents,target) && !istooltip)) {
        oldout(d3.select(params.mouseevents).datum())
        close_descriptions()
        d3.select(params.mouseevents).on(d3plus.evt.out,oldout)
      }
    }

    var ischild = function(parent, child) {
       var node = child.parentNode;
       while (node != null) {
         if (node == parent) {
           return true;
         }
         node = node.parentNode;
       }
       return false;
    }

    d3.select(params.mouseevents).on(d3plus.evt.out,newout)
    tooltip.on(d3plus.evt.out,newout)

    var move_event = d3.select(params.mouseevents).on(d3plus.evt.move)
    if (move_event) {
      tooltip.on(d3plus.evt.move,move_event)
    }

  }

  if (params.arrow) {
    var arrow = tooltip.append("div")
      .attr("class","d3plus_tooltip_arrow")
      .style("background-color",params.background)
      .style("position","absolute")
  }

  if (params.icon) {
    var title_icon = header.append("div")
      .attr("class","d3plus_tooltip_icon")
      .style("width",params.iconsize+"px")
      .style("height",params.iconsize+"px")
      .style("z-index",1)
      .style("background-position","50%")
      .style("background-size","100%")
      .style("background-image","url("+params.icon+")")
      .style("display","inline-block")

    if (params.style == "knockout") {
      title_icon.style("background-color",params.color)
    }

    title_width -= title_icon.node().offsetWidth
  }
  
  if (params.title) {
    var mw = params.max_width-6
    if (params.icon) mw -= (params.iconsize+6)
    mw += "px"
    var title = header.append("div")
      .attr("class","d3plus_tooltip_title")
      .style("max-width",mw)
      .style("vertical-align","top")
      .style("width",title_width+"px")
      .style("display","inline-block")
      .style("overflow","hidden")
      .style("text-overflow","ellipsis")
      .style("word-wrap","break-word")
      .style("z-index",1)
      .text(params.title)
  }

  if (params.description) {
    var description = body.append("div")
      .attr("class","d3plus_tooltip_description")
      .text(params.description)
  }

  if (params.data || params.html && !params.fullscreen) {

    var data_container = body.append("div")
      .attr("class","d3plus_tooltip_data_container")
  }

  if (params.data) {

    var val_width = 0, val_heights = {}

    var last_group = null
    params.data.forEach(function(d,i){

      if (d.group) {
        if (last_group != d.group) {
          last_group = d.group
          data_container.append("div")
            .attr("class","d3plus_tooltip_data_title")
            .text(d.group)
        }
      }

      var block = data_container.append("div")
        .attr("class","d3plus_tooltip_data_block")
        .datum(d)

      if (d.highlight) {
        block.style("color",d3plus.color.legible(params.color))
      }

      var name = block.append("div")
          .attr("class","d3plus_tooltip_data_name")
          .html(d.name)
          .on(d3plus.evt.out,function(){
            d3.event.stopPropagation()
          })

      var val = block.append("div")
          .attr("class","d3plus_tooltip_data_value")
          .text(d.value)
          .on(d3plus.evt.out,function(){
            d3.event.stopPropagation()
          })

      if (d3plus.rtl) {
        val.style("left","6px")
      }
      else {
        val.style("right","6px")
      }

      if (params.mouseevents && d.desc) {
        var desc = block.append("div")
          .attr("class","d3plus_tooltip_data_desc")
          .text(d.desc)
          .on(d3plus.evt.out,function(){
            d3.event.stopPropagation()
          })

        var dh = desc.node().offsetHeight

        desc.style("height","0px")

        var help = name.append("div")
          .attr("class","d3plus_tooltip_data_help")
          .text("?")
          .on(d3plus.evt.over,function(){
            var c = d3.select(this.parentNode.parentNode).style("color")
            d3.select(this).style("background-color",c)
            desc.style("height",dh+"px")
          })
          .on(d3plus.evt.out,function(){
            d3.event.stopPropagation()
          })

        name
          .style("cursor","pointer")
          .on(d3plus.evt.over,function(){
            close_descriptions()
            var c = d3.select(this.parentNode).style("color")
            help.style("background-color",c)
            desc.style("height",dh+"px")
          })

        block.on(d3plus.evt.out,function(){
          d3.event.stopPropagation()
          close_descriptions()
        })
      }

      var w = parseFloat(val.style("width"),10)
      if (w > params.width/2) w = params.width/2
      if (w > val_width) val_width = w

      if (i != params.data.length-1) {
        if ((d.group && d.group == params.data[i+1].group) || !d.group && !params.data[i+1].group)
        data_container.append("div")
          .attr("class","d3plus_tooltip_data_seperator")
      }

    })

    data_container.selectAll(".d3plus_tooltip_data_name")
      .style("width",function(){
        var w = parseFloat(d3.select(this.parentNode).style("width"),10)
        return (w-val_width-30)+"px"
      })

    data_container.selectAll(".d3plus_tooltip_data_value")
      .style("width",val_width+"px")
      .each(function(d){
        var h = parseFloat(d3.select(this).style("height"),10)
        val_heights[d.name] = h
      })

    data_container.selectAll(".d3plus_tooltip_data_name")
      .style("min-height",function(d){
        return val_heights[d.name]+"px"
      })

  }

  if (params.html && !params.fullscreen) {
    data_container.append("div")
      .html(params.html)
  }

  var footer = body.append("div")
    .attr("class","d3plus_tooltip_footer")

  if (params.footer) {
    footer.html(params.footer)
  }

  params.height = tooltip.node().offsetHeight

  if (params.html && params.fullscreen) {
    var h = params.height-12
    var w = tooltip.node().offsetWidth-params.width-44
    container.append("div")
      .attr("class","d3plus_tooltip_html")
      .style("width",w+"px")
      .style("height",h+"px")
      .html(params.html)
  }

  params.width = tooltip.node().offsetWidth

  if (params.anchor.y != "center") params.height += params.arrow_offset
  else params.width += params.arrow_offset

  if (params.data || (!params.fullscreen && params.html)) {

    if (!params.fullscreen) {
      var parent_height = params.parent.node().offsetHeight
      var limit = params.fixed ? parent_height-params.y-10 : parent_height-10
      var h = params.height < limit ? params.height : limit
    }
    else {
      var h = params.height
    }
    h -= parseFloat(container.style("padding-top"),10)
    h -= parseFloat(container.style("padding-bottom"),10)
    if (header) {
      h -= header.node().offsetHeight
      h -= parseFloat(header.style("padding-top"),10)
      h -= parseFloat(header.style("padding-bottom"),10)
    }
    if (footer) {
      h -= footer.node().offsetHeight
      h -= parseFloat(footer.style("padding-top"),10)
      h -= parseFloat(footer.style("padding-bottom"),10)
    }

    data_container
      .style("max-height",h+"px")
  }

  params.height = tooltip.node().offsetHeight

  d3plus.tooltip.move(params.x,params.y,params.id);

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates a data object for the Tooltip
//------------------------------------------------------------------------------
d3plus.tooltip.data = function(vars,id,length,extras,depth) {

  if (vars.small) {
    return []
  }

  if (!length) var length = "long"
  if (length == "long") {
    var other_length = "short"
  }
  else {
    var other_length = "long"
  }

  var extra_data = {}
  if (extras && typeof extras == "string") extras = [extras]
  else if (extras && typeof extras == "object") {
    extra_data = d3plus.util.merge(extra_data,extras)
    var extras = []
    for (k in extra_data) {
      extras.push(k)
    }
  }
  else if (!extras) var extras = []

  var tooltip_highlights = []

  if (vars.tooltip.value instanceof Array) {
    var a = vars.tooltip.value
  }
  else if (typeof vars.tooltip.value == "string") {
    var a = [vars.tooltip.value]
  }
  else {

    if (vars.tooltip.value[vars.id.nesting[depth]]) {
      var a = vars.tooltip.value[vars.id.nesting[depth]]
    }
    else {
      var a = vars.tooltip.value
    }

    if (!(a instanceof Array)) {

      if (a[length]) {
        a = a[length]
      }
      else if (a[other_length]) {
        a = []
      }
      else {
        a = d3plus.util.merge({"":[]},a)
      }

    }

    if (typeof a == "string") {
      a = [a]
    }
    else if (!(a instanceof Array)) {
      a = d3plus.util.merge({"":[]},a)
    }

  }

  function format_key(key,group) {
    if (vars.attrs.value[group]) var id_var = group
    else var id_var = null

    if (group) group = vars.format(group)

    var value = extra_data[key] || d3plus.variable.value(vars,id,key,id_var)

    if (value !== false && value !== null) {
      var name = vars.format(key),
          h = tooltip_highlights.indexOf(key) >= 0

      var val = vars.format(value,key)

      var obj = {"name": name, "value": val, "highlight": h, "group": group}

      if (vars.descs.value[key]) obj.desc = vars.descs.value[key]
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

    if (vars.id.nesting.length && depth < vars.id.nesting.length-1) {
      var a = d3plus.util.copy(a)
      vars.id.nesting.forEach(function(n,i){
        if (i > depth && a[n]) delete a[n]
      })
    }

    if (vars.tooltip.value.long && typeof vars.tooltip.value.long == "object") {
      var placed = []
      for (group in vars.tooltip.value.long) {

        extras.forEach(function(e){
          if (vars.tooltip.value.long[group].indexOf(e) >= 0 && ((a[group] && a[group].indexOf(e) < 0) || !a[group])) {
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
          if (a[group] instanceof Array && a[group].indexOf(e) >= 0) {
            present.push(e)
          }
          else if (typeof a[group] == "string" && a[group] == e) {
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

  if (length == "long") {

    var connections = vars.connections(id[vars.id.key],true)
    if (connections.length) {
      connections.forEach(function(c){
        var name = d3plus.variable.text(vars,c)[0],
            color = d3plus.variable.color(vars,c),
            size = vars.style.tooltip.font.size,
            radius = vars.shape.value == "square" ? 0 : size
            styles = [
              "background-color: "+color,
              "border-color: "+d3plus.color.legible(color),
              "border-style: solid",
              "border-width: "+vars.style.data.stroke.width+"px",
              "display: inline-block",
              "height: "+size+"px",
              "left: 0px",
              "position: absolute",
              "width: "+size+"px",
              "top: 0px",
              d3plus.prefix()+"border-radius: "+radius+"px",
            ]
            node = "<div style='"+styles.join("; ")+";'></div>"
        tooltip_data.push({
          "group": vars.format("Primary Connections"),
          "highlight": false,
          "name": "<div style='position:relative;padding-left:"+size*1.5+"px;'>"+node+name+"</div>",
          "value": ""
        })
      })
    }

  }

  return tooltip_data

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Set X and Y position for Tooltip
//-------------------------------------------------------------------

d3plus.tooltip.move = function(x,y,id) {
  
  if (!id) var tooltip = d3.select("div#d3plus_tooltip_id_default")
  else var tooltip = d3.select("div#d3plus_tooltip_id_"+id)
  
  if (tooltip.node()) {
    
    var d = tooltip.datum()
  
    d.cx = x
    d.cy = y
    
    if (!d.fixed) {

      // Set initial values, based off of anchor
      if (d.anchor.y != "center") {

        if (d.anchor.x == "right") {
          d.x = d.cx - d.arrow_offset - 4
        }
        else if (d.anchor.x == "center") {
          d.x = d.cx - d.width/2
        }
        else if (d.anchor.x == "left") {
          d.x = d.cx - d.width + d.arrow_offset + 2
        }

        // Determine whether or not to flip the tooltip
        if (d.anchor.y == "bottom") {
          d.flip = d.cy + d.height + d.offset <= d.limit[1]
        }
        else if (d.anchor.y == "top") {
          d.flip = d.cy - d.height - d.offset < 0
        }
        
        if (d.flip) {
          d.y = d.cy + d.offset + d.arrow_offset
        }
        else {
          d.y = d.cy - d.height - d.offset - d.arrow_offset
        }
    
      }
      else {

        d.y = d.cy - d.height/2
        
        // Determine whether or not to flip the tooltip
        if (d.anchor.x == "right") {
          d.flip = d.cx + d.width + d.offset <= d.limit[0]
        }
        else if (d.anchor.x == "left") {
          d.flip = d.cx - d.width - d.offset < 0
        }
    
        if (d.anchor.x == "center") {
          d.flip = false
          d.x = d.cx - d.width/2
        }
        else if (d.flip) {
          d.x = d.cx + d.offset + d.arrow_offset
        }
        else {
          d.x = d.cx - d.width - d.offset
        }
      }
  
      // Limit X to the bounds of the screen
      if (d.x < 0) {
        d.x = 0
      }
      else if (d.x + d.width > d.limit[0]) {
        d.x = d.limit[0] - d.width
      }
  
      // Limit Y to the bounds of the screen
      if (d.y < 0) {
        d.y = 0
      }
      else if (d.y + d.height > d.limit[1]) {
        d.y = d.limit[1] - d.height
      }
      
    }
    
    tooltip
      .style("top",d.y+"px")
      .style("left",d.x+"px")
  
    if (d.arrow) {
      tooltip.selectAll(".d3plus_tooltip_arrow")
        .call(d3plus.tooltip.arrow)
    }
    
  }
    
}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Destroy Tooltips
//-------------------------------------------------------------------

d3plus.tooltip.remove = function(id) {

  // If an ID is specified, only remove that tooltip
  if (id) {
    
    // First remove the background curtain, if the tooltip has one
    d3.selectAll("div#d3plus_tooltip_curtain_"+id).remove()
    // Finally, remove the tooltip itself
    d3.selectAll("div#d3plus_tooltip_id_"+id).remove()
    
  }
  // If no ID is given, remove ALL d3plus tooltips
  else {
    
    // First remove all background curtains on the page
    d3.selectAll("div#d3plus_tooltip_curtain").remove()
    // Finally, remove all tooltip
    d3.selectAll("div.d3plus_tooltip").remove()
    
  }

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates focus tooltip, if applicable
//-------------------------------------------------------------------

d3plus.ui.focus = function(vars) {

  if (!vars.internal_error && vars.focus.value && !vars.small && vars.focus.tooltip.value) {

    var data = vars.data.pool.filter(function(d){
      return d3plus.variable.value(vars,d,vars.id.key) == vars.focus.value
    })

    if (data.length >= 1) {
      data = data[0]
    }
    else {
      data = {}
      data[vars.id.key] = vars.focus.value
    }

    var offset = vars.style.labels.padding

    d3plus.tooltip.app({
      "anchor": "top left",
      "arrow": false,
      "data": data,
      "length": "long",
      "fullscreen": false,
      "id": vars.type.value+"_focus",
      "maxheight": vars.app_height-offset*2,
      "mouseevents": true,
      "offset": 0,
      "vars": vars,
      "x": vars.width.value-vars.margin.right-offset,
      "y": vars.margin.top+offset,
      "width": vars.style.tooltip.large
    })

    if(!d3.select("div#d3plus_tooltip_id_"+vars.type.value+"_focus").empty()) {
      vars.app_width -= (vars.style.tooltip.large+offset*2)
    }

  }
  else {
    d3plus.tooltip.remove(vars.type.value+"_focus")
  }

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates "back" button, if applicable
//------------------------------------------------------------------------------
d3plus.ui.history = function(vars) {

  if (!vars.small && vars.history.states.length > 0) {

    var button = vars.parent.selectAll("div#d3plus_back_button")
      .data(["d3plus_back_button"])

    var size = vars.title.value
      ? vars.style.title.font.size : vars.style.title.sub.font.size

    var color = vars.title.sub.value
      ? vars.style.title.sub.font.color : vars.style.title.font.color

    var family = vars.title.sub.value
      ? vars.style.title.sub.font.family : vars.style.title.font.family

    var weight = vars.title.sub.value
      ? vars.style.title.sub.font.weight : vars.style.title.font.weight

    var padding = vars.title.sub.value
      ? vars.style.title.sub["padding"] : vars.style.title["padding"]

    function style(elem) {

        elem
          .style("position","absolute")
          .style("left",vars.style.ui.padding+"px")
          .style("top",vars.margin.top/2-size/2+"px")
          .style("color", color)
          .style("font-family", family)
          .style("font-weight", weight)
          .style("font-size",size+"px")
          .style("z-index",2000)

    }

    var min_height = size + padding*2
    if (vars.margin.top < min_height) {
      vars.margin.top = min_height
    }

    var enter = button.enter().append("div")
      .attr("id","d3plus_back_button")
      .style("opacity",0)
      .call(style)
      .html(function(){

        if (d3plus.font.awesome) {
          var arrow = "<span style='font-family:FontAwesome;margin-right:5px;'>&#xf104</span>"
        }
        else {
          var arrow = "&laquo; "
        }

        return arrow+vars.format("Back")

      })

    button
      .on(d3plus.evt.over,function(){

        if (!vars.small && vars.history.states.length > 0) {

          d3.select(this)
            .style("cursor","pointer")
            .transition().duration(vars.style.timing.mouseevents)
              .style("color",d3plus.color.lighter(color))

        }

      })
      .on(d3plus.evt.out,function(){

        if (!vars.small && vars.history.states.length > 0) {

          d3.select(this)
            .style("cursor","auto")
            .transition().duration(vars.style.timing.mouseevents)
              .style("color",color)

        }

      })
      .on(d3plus.evt.click,function(){

        vars.back()

      })
      .transition().duration(vars.style.timing.transitions)
        .style("opacity",1)
        .call(style)

  }
  else {
    vars.parent.selectAll("div#d3plus_back_button")
      .transition().duration(vars.style.timing.transitions)
      .style("opacity",0)
      .remove()
  }

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates color key
//------------------------------------------------------------------------------
d3plus.ui.legend = function(vars) {

  var key_display = true,
      square_size = 0,
      key = vars.color.key || vars.id.key

  if (!vars.small && vars.legend.value && key) {

    if (vars.dev.value) d3plus.console.group("Calculating Legend")

    if (vars.data.keys && key in vars.data.keys) {
      var color_type = vars.data.keys[key]
    }
    else if (vars.attrs.keys && key in vars.attrs.keys) {
      var color_type = vars.attrs.keys[key]
    }
    else {
      var color_type = undefined
    }

    if (!vars.color.scale) {

      if (vars.dev.value) d3plus.console.time("determining color groups")

      var color_groups = {},
          placed = [],
          data = vars.nodes.restricted ? vars.nodes.restricted :
            vars.nodes.value ? vars.nodes.value : vars.data.pool

      data.forEach(function(d){
        if (placed.indexOf(d[vars.id.key]) < 0) {

          var color = d3plus.variable.color(vars,d[vars.id.key])
          if (!color_groups[color]) {
            color_groups[color] = []
          }
          color_groups[color].push(d)
          placed.push(d[vars.id.key])
        }
      })

      if (vars.dev.value) d3plus.console.timeEnd("determining color groups")

      if (vars.dev.value) d3plus.console.time("grouping colors")

      var colors = []
      for (color in color_groups) {

        var obj = {
          "color": color,
          "icon_depth": vars.id.nesting[vars.depth.value],
          "name": []
        }

        if (vars.depth.value > 0) {

          for (var i = vars.depth.value-1; i >= 0; i--) {
            var parents = []
            color_groups[color].forEach(function(c){
              var val = d3plus.variable.value(vars,c,vars.id.nesting[i])
              // console.log(c,val,vars.id.nesting[i])
              if (val && parents.indexOf(val) < 0) parents.push(val)
            })

            if (parents.length == 1) {

              var name = d3plus.variable.text(vars,parents[0],i)

              if (name && obj.name.indexOf(name) < 0) {
                obj.name.push(name)
              }

              if (!obj.icon) {
                var icon = d3plus.variable.value(vars,parents[0],vars.icon.key,vars.id.nesting[i])
                if (icon) {
                  obj.icon = icon
                  obj.icon_depth = vars.id.nesting[i]
                }
              }
            }
            if (obj.name.length > 0 && obj.icon) {
              break;
            }
          }

        }
        else {

          for (d in color_groups[color]) {

            var name = d3plus.variable.text(vars,color_groups[color][d],vars.depth.value)
            if (name && obj.name.indexOf(name) < 0) {
              obj.name.push(name)
            }

            if (!obj.icon) {
              var icon = d3plus.variable.value(vars,color_groups[color][d],vars.icon.key)
              if (icon) {
                obj.icon = icon
              }
            }
            if (obj.name.length > 0 && obj.icon) {
              break;
            }
          }

        }
        obj.name.sort()
        colors.push(obj)

      }

      if (vars.dev.value) d3plus.console.timeEnd("grouping colors")

      var available_width = vars.width.value

      square_size = vars.style.legend.size

      var key_width = square_size*colors.length+vars.style.ui.padding*(colors.length+1)

      if (square_size instanceof Array) {

        if (vars.dev.value) d3plus.console.time("calculating size")

        for (var i = square_size[1]; i >= square_size[0]; i--) {
          key_width = i*colors.length+vars.style.ui.padding*(colors.length+1)
          if (available_width >= key_width) {
            square_size = i
            break;
          }
        }

        if (vars.dev.value) d3plus.console.timeEnd("calculating size")

      }
      else if (typeof square_size != "number" && square_size !== false) {
        square_size = 30
      }

      if (available_width < key_width || colors.length == 1) {
        key_display = false
      }
      else {

        key_width -= vars.style.ui.padding*2

        if (vars.dev.value) d3plus.console.time("sorting colors")

        var sort = vars.legend.order.sort.value

        colors.sort(function(a,b){

          if (vars.legend.order.value == "color") {

            var a_value = a.color,
                b_value = b.color

            a_value = d3.rgb(a_value).hsl()
            b_value = d3.rgb(b_value).hsl()

            if (a_value.s == 0) a_value = 361
            else a_value = a_value.h
            if (b_value.s == 0) b_value = 361
            else b_value = b_value.h

          }
          else if (vars.legend.order.value == "alpha") {

            var a_value = a.name[0],
                b_value = b.name[0]

          }

          if(a_value < b_value) return sort == "asc" ? -1 : 1;
          if(a_value > b_value) return sort == "asc" ? 1 : -1;

        })

        if (vars.dev.value) d3plus.console.timeEnd("sorting colors")

        if (vars.style.legend.align == "start") {
          var start_x = vars.style.ui.padding
        }
        else if (vars.style.legend.align == "end") {
          var start_x = available_width - vars.style.ui.padding - key_width
        }
        else {
          var start_x = available_width/2 - key_width/2
        }

        vars.g.legend.selectAll("g.d3plus_scale")
          .transition().duration(vars.style.timing.transitions)
          .attr("opacity",0)
          .remove()

        var keys = vars.g.legend.selectAll("g.d3plus_color")
          .data(colors,function(d){
            return d.url ? d.color+"_"+d.url : d.color
          })

        function position(group) {

          group
            .attr("transform",function(g,i){
              var x = start_x + (i*(vars.style.ui.padding+square_size))
              return "translate("+x+","+vars.style.ui.padding+")"
            })

        }

        var key_enter = keys.enter().append("g")
          .attr("class","d3plus_color")
          .attr("opacity",0)
          .call(position)

        function style(rect) {

          rect
            .attr("width",square_size)
            .attr("height",square_size)
            .attr("fill",function(g){

              d3.select(this.parentNode).selectAll("text")
                .remove()

              if (g.icon) {

                var short_url = d3plus.util.strip(g.icon+"_"+g.color)

                var pattern = vars.defs.selectAll("pattern#"+short_url)
                  .data([short_url])

                if (typeof vars.icon.style.value == "string") {
                  var icon_style = vars.icon.style.value
                }
                else if (typeof vars.icon.style.value == "object" && vars.icon.style.value[g.icon_depth]) {
                  var icon_style = vars.icon.style.value[g.icon_depth]
                }
                else {
                  var icon_style = "default"
                }

                var color = icon_style == "knockout" ? g.color : "none"

                pattern.select("rect").transition().duration(vars.style.timing.transitions)
                  .attr("fill",color)
                  .attr("width",square_size)
                  .attr("height",square_size)

                pattern.select("image").transition().duration(vars.style.timing.transitions)
                  .attr("width",square_size)
                  .attr("height",square_size)

                var pattern_enter = pattern.enter().append("pattern")
                  .attr("id",short_url)
                  .attr("width",square_size)
                  .attr("height",square_size)

                pattern_enter.append("rect")
                  .attr("fill",color)
                  .attr("width",square_size)
                  .attr("height",square_size)

                pattern_enter.append("image")
                  .attr("xlink:href",g.icon)
                  .attr("width",square_size)
                  .attr("height",square_size)
                  .each(function(d){

                    if (g.icon.indexOf("/") == 0 || g.icon.indexOf(window.location.hostname) >= 0) {

                      d3plus.util.dataurl(g.icon,function(base64){

                        pattern.select("image")
                          .attr("xlink:href",base64)

                      })

                    }
                    else {

                      pattern.select("image")
                        .attr("xlink:href",g.icon)

                    }

                  })

                return "url(#"+short_url+")"
              }
              else {

                d3.select(this.parentNode).append("text")
                  .attr("font-size",vars.style.labels.font.size)
                  .attr("font-weight",vars.style.font.weight)
                  .attr("font-family",vars.style.font.family)
                  .attr("text-anchor","start")
                  .attr("fill",d3plus.color.text(g.color))
                  .attr("x",0)
                  .attr("y",0)
                  .each(function(t){

                    if (g.name.length == 1) {

                      d3plus.util.wordwrap({
                        "text": g.name[0],
                        "parent": this,
                        "width": square_size-vars.style.ui.padding*2,
                        "height": square_size-vars.style.ui.padding*2,
                        "resize": vars.labels.resize.value
                      })

                    }

                  })
                  .attr("y",function(t){
                    var h = this.getBBox().height,
                        diff = parseFloat(d3.select(this).style("font-size"),10)/5
                    return square_size/2 - h/2 - diff/2
                  })
                  .selectAll("tspan")
                    .attr("x",function(t){
                      var w = this.getComputedTextLength()
                      return square_size/2 - w/2
                    })

                return g.color
              }

            })

        }

        key_enter
          .append("rect")
            .attr("class","d3plus_color")
            .call(style)

        if (!d3plus.touch) {
          
          keys
            .on(d3plus.evt.over,function(d,i){

              d3.select(this).style("cursor","pointer")

              if (d.name.length) {

                d3.select(this).style("cursor","pointer")

                var x = start_x + (i*(vars.style.ui.padding+square_size)),
                    y = d3.transform(d3.select(this.parentNode).attr("transform")).translate[1]

                x += square_size/2
                y += vars.style.ui.padding+square_size/2

                if (typeof vars.icon.style.value == "string") {
                  var icon_style = vars.icon.style.value
                }
                else if (typeof vars.icon.style.value == "object" && vars.icon.style.value[d.icon_depth]) {
                  var icon_style = vars.icon.style.value[d.icon_depth]
                }
                else {
                  var icon_style = "default"
                }

                var names = []
                d.name.forEach(function(d){
                  if (d instanceof Array) {
                    names.push(d[0])
                  }
                  else {
                    names.push(d)
                  }
                })

                if (names.length == 1) {
                  var title = names[0],
                      description = null
                }
                else {
                  var title = null

                  if (names.length > 4) {
                    var more = names.length-4
                    names = names.slice(0,4)
                    names[4] = vars.format(more+" more")
                  }

                  if (names.length == 2) {
                    var description = names.join(" "+vars.format("and")+" ")
                  }
                  else {
                    names[names.length-1] = vars.format("and")+" "+names[names.length-1]
                    var description = names.join(", ")
                  }

                }

                d3plus.tooltip.create({
                  "align": "top center",
                  "arrow": true,
                  "background": vars.style.tooltip.background,
                  "description": description,
                  "fontcolor": vars.style.tooltip.font.color,
                  "fontfamily": vars.style.tooltip.font.family,
                  "fontweight": vars.style.tooltip.font.weight,
                  // "data": tooltip_data,
                  "color": d.color,
                  "icon": d.icon,
                  "id": "legend",
                  // "mouseevents": mouse,
                  "offset": square_size/2-vars.style.ui.padding,
                  "parent": vars.parent,
                  "style": icon_style,
                  "title": title,
                  "x": x,
                  "y": y,
                  "max_width": 200,
                  "width": "auto"
                })

              }

            })
            .on(d3plus.evt.out,function(d){
              d3plus.tooltip.remove("legend")
            })

        }

        keys.order()
          .transition().duration(vars.style.timing.transitions)
          .attr("opacity",1)
          .call(position)

        keys.selectAll("rect.d3plus_color").transition().duration(vars.style.timing.transitions)
          .call(style)

        keys.exit()
          .transition().duration(vars.style.timing.transitions)
          .attr("opacity",0)
          .remove()

      }

    }
    else if (vars.color.scale) {

      if (vars.dev.value) d3plus.console.time("drawing color scale")

      vars.g.legend.selectAll("g.d3plus_color")
        .transition().duration(vars.style.timing.transitions)
        .attr("opacity",0)
        .remove()

      var values = vars.color.scale.domain(),
          colors = vars.color.scale.range()

      if (values.length <= 2) {
        values = d3plus.util.buckets(values,6)
      }

      var scale = vars.g.legend.selectAll("g.d3plus_scale")
        .data(["scale"])

      scale.enter().append("g")
        .attr("class","d3plus_scale")
        .attr("opacity",0)

      var heatmap = scale.selectAll("#d3plus_legend_heatmap")
        .data(["heatmap"])

      heatmap.enter().append("linearGradient")
        .attr("id", "d3plus_legend_heatmap")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%")
        .attr("spreadMethod", "pad");

      var stops = heatmap.selectAll("stop")
        .data(d3.range(0,colors.length))

      stops.enter().append("stop")
        .attr("stop-opacity",1)

      stops
        .attr("offset",function(i){
          return Math.round((i/(colors.length-1))*100)+"%"
        })
        .attr("stop-color",function(i){
          return colors[i]
        })

      stops.exit().remove()

      var gradient = scale.selectAll("rect#gradient")
        .data(["gradient"])

      gradient.enter().append("rect")
        .attr("id","gradient")
        .attr("x",function(d){
          if (vars.style.legend.align == "middle") {
            return vars.width.value/2
          }
          else if (vars.style.legend.align == "end") {
            return vars.width.value
          }
          else {
            return 0
          }
        })
        .attr("y",vars.style.ui.padding)
        .attr("width", 0)
        .attr("height", vars.style.legend.gradient.height)
        .attr("stroke",vars.style.legend.tick.color)
        .attr("stroke-width",1)
        .style("fill", "url(#d3plus_legend_heatmap)")

      var text = scale.selectAll("text.d3plus_tick")
        .data(d3.range(0,values.length))

      text.enter().append("text")
        .attr("class","d3plus_tick")
        .attr("x",function(d){
          if (vars.style.legend.align == "middle") {
            return vars.width.value/2
          }
          else if (vars.style.legend.align == "end") {
            return vars.width.value
          }
          else {
            return 0
          }
        })
        .attr("y",function(d){
          return this.getBBox().height+vars.style.legend.gradient.height+vars.style.ui.padding*2
        })

      var label_width = 0

      text
        .order()
        .attr("font-weight",vars.style.legend.tick.weight)
        .attr("font-family",vars.style.legend.tick.family)
        .attr("font-size",vars.style.legend.tick.size)
        .attr("text-anchor",vars.style.legend.tick.align)
        .attr("fill",vars.style.legend.tick.color)
        .text(function(d){
          return vars.format(values[d],key)
        })
        .attr("y",function(d){
          return this.getBBox().height+vars.style.legend.gradient.height+vars.style.ui.padding*2
        })
        .each(function(d){
          var w = this.offsetWidth
          if (w > label_width) label_width = w
        })

      label_width += vars.style.labels.padding*2

      var key_width = label_width * (values.length-1)

      if (key_width+label_width < vars.width.value) {

        if (key_width+label_width < vars.width.value/2) {
          key_width = vars.width.value/2
          label_width = key_width/values.length
          key_width -= label_width
        }

        if (vars.style.legend.align == "start") {
          var start_x = vars.style.ui.padding
        }
        else if (vars.style.legend.align == "end") {
          var start_x = vars.width.value - vars.style.ui.padding - key_width
        }
        else {
          var start_x = vars.width.value/2 - key_width/2
        }

        text.transition().duration(vars.style.timing.transitions)
          .attr("x",function(d){
            return start_x + (label_width*d)
          })

        text.exit().transition().duration(vars.style.timing.transitions)
          .attr("opacity",0)
          .remove()

        var ticks = scale.selectAll("rect.d3plus_tick")
          .data(d3.range(0,values.length))

        ticks.enter().append("rect")
          .attr("class","d3plus_tick")
          .attr("x",function(d){
            if (vars.style.legend.align == "middle") {
              return vars.width.value/2
            }
            else if (vars.style.legend.align == "end") {
              return vars.width.value
            }
            else {
              return 0
            }
          })
          .attr("y",vars.style.ui.padding)
          .attr("width",0)
          .attr("height",vars.style.ui.padding+vars.style.legend.gradient.height)
          .attr("fill",vars.style.legend.tick.color)

        ticks.transition().duration(vars.style.timing.transitions)
          .attr("x",function(d){
            var mod = d == 0 ? 1 : 0
            return start_x + (label_width*d) - mod
          })
          .attr("y",vars.style.ui.padding)
          .attr("width",1)
          .attr("height",vars.style.ui.padding+vars.style.legend.gradient.height)
          .attr("fill",vars.style.legend.tick.color)

        ticks.exit().transition().duration(vars.style.timing.transitions)
          .attr("width",0)
          .remove()

        gradient.transition().duration(vars.style.timing.transitions)
          .attr("x",function(d){
            if (vars.style.legend.align == "middle") {
              return vars.width.value/2 - key_width/2
            }
            else if (vars.style.legend.align == "end") {
              return vars.width.value - key_width - vars.style.ui.padding
            }
            else {
              return vars.style.ui.padding
            }
          })
          .attr("y",vars.style.ui.padding)
          .attr("width", key_width)
          .attr("height", vars.style.legend.gradient.height)

        scale.transition().duration(vars.style.timing.transitions)
          .attr("opacity",1)

        if (vars.dev.value) d3plus.console.timeEnd("drawing color scale")

      }
      else {
        key_display = false
      }

    }
    else {
      key_display = false
    }

  }
  else {
    key_display = false
  }
  if (vars.legend.value && key && key_display) {

    if (vars.dev.value) d3plus.console.time("positioning legend")

    if (square_size) {
      var key_height = square_size
    }
    else {
      var key_box = vars.g.legend.node().getBBox(),
          key_height = key_box.height+key_box.y
    }

    if (!vars.g.timeline.node().getBBox().height) {
      vars.margin.bottom += vars.style.ui.padding
    }
    vars.margin.bottom += key_height+vars.style.ui.padding

    vars.g.legend.transition().duration(vars.style.timing.transitions)
      .attr("transform","translate(0,"+(vars.height.value-vars.margin.bottom)+")")

    if (vars.dev.value) d3plus.console.timeEnd("positioning legend")

  }
  else {

    if (vars.dev.value) d3plus.console.time("hiding legend")

    vars.g.legend.transition().duration(vars.style.timing.transitions)
      .attr("transform","translate(0,"+vars.height.value+")")

    if (vars.dev.value) d3plus.console.timeEnd("hiding legend")

  }

  if (vars.legend.value && key && vars.dev.value) {
    d3plus.console.groupEnd()
  }

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates Centered Server Message
//------------------------------------------------------------------------------
d3plus.ui.message = function(vars,message) {

  var message = vars.messages.value ? message : null,
      size = message == vars.internal_error ? "large" : vars.messages.style

  if (size == "large") {
    var font = vars.style.message,
        position = "center"
  }
  else {

    if (vars.footer.value) {
      var font = vars.style.footer
    }
    else if (vars.title.value) {
      var font = vars.style.title
    }
    else if (vars.title.sub.value) {
      var font = vars.style.title.sub
    }
    else if (vars.title.total.value) {
      var font = vars.style.title.total
    }
    else {
      var font = vars.style.title.sub
    }

    var position = font.position

  }

  var font = {
    "color": font.font.color,
    "font-family": font.font.family,
    "font-weight": font.font.weight,
    "font-size": font.font.size+"px",
    "padding": font.padding+"px"
  }

  var background = vars.style.background != "none" ? vars.style.background : "white"

  function style(elem) {

    elem
      .style(font)
      .style("position","absolute")
      .style("background",background)
      .style("text-align","center")
      .style("left",function(){
        return position == "center" ? "50%" : "0px"
      })
      .style("width",function(){
        return position == "center" ? "auto" : vars.width.value+"px"
      })
      .style("margin-left",function(){
        var offset = vars.width.value-vars.app_width
        return position == "center" ? -(this.offsetWidth/2+offset/2)+"px" : "0px"
      })
      .style("top",function(){
        if (position == "center") {
          return "50%";
        }
        else if (position == "top") {
          return "0px"
        }
        else {
          return "auto"
        }
      })
      .style("bottom",function(){
        if (position == "bottom") {
          return "0px"
        }
        else {
          return "auto"
        }
      })
      .style("margin-top",function(){
        if (size == "large") {
          var height = this.offsetHeight
          return -height/2+"px"
        }
        return "0px"
      })

  }

  // Enter Message Group
  vars.g.message = vars.parent.selectAll("div#d3plus_message")
    .data(["message"])

  vars.g.message.enter().append("div")
    .attr("id","d3plus_message")
    .attr("opacity",0)

  var opacity = message ? 1 : 0,
      text = message ? message : vars.g.message.text(),
      display = message ? "inline-block" : "none"

  vars.g.message
    .text(text)
    .call(style)
    // .transition().duration(vars.style.timing.mouseevents)
    .style("opacity",opacity)
    .style("display",display)

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates color key
//-------------------------------------------------------------------

d3plus.ui.timeline = function(vars) {

  var years = vars.data.time

  if (!vars.small && years && years.length > 1 && vars.timeline.value) {

    if ((vars.time.key == vars.x.key && vars.x.scale.value == "continuous") || (vars.time.key == vars.y.key && vars.y.scale.value == "continuous")) {
      var min_required = 2
    }
    else {
      var min_required = 1
    }

    if (vars.time.solo.value.length) {
      var init = d3.extent(vars.time.solo.value)
    }
    else {
      var init = d3.extent(years)
    }

    var min = years[0],
        max = years[years.length-1],
        start = init[0],
        end = init[1],
        year_ticks = [],
        steps = []

    years.forEach(function(y,i){
      if (i != 0) steps.push(y-years[i-1])
    })
    var step = d3.min(steps),
        total = step*years.length
    years = []
    for (var i = min; i <= max; i += step) {
      years.push(i)
      year_ticks.push(d3.time.year(new Date(parseInt(i), 0, 1)))
    }
    year_ticks.push(d3.time.year(new Date(parseInt(max+step), 0, 1)))

    var brushend = function() {

      if (d3.event.sourceEvent !== null) {

        var extent0 = brush.extent(),
            min_val = d3plus.util.closest(year_ticks,d3.time.year.round(extent0[0])),
            max_val = d3plus.util.closest(year_ticks,d3.time.year.round(extent0[1]))

        if (min_val == max_val) {
          min_val = d3plus.util.closest(year_ticks,d3.time.year.floor(extent0[0]))
        }

        var min_index = year_ticks.indexOf(min_val),
            max_index = year_ticks.indexOf(max_val)

        if (max_index-min_index >= min_required) {
          var extent = [min_val,max_val]
        }
        else if (min_index+min_required <= years.length) {
          var extent = [min_val,year_ticks[min_index+min_required]]
        }
        else {

          var extent = [min_val]
          for (var i = 1; i <= min_required; i++) {
            if (min_index+i <= years.length) {
              extent.push(year_ticks[min_index+i])
            }
            else {
              extent.unshift(year_ticks[min_index-((min_index+i)-(years.length))])
            }
          }
          extent = [extent[0],extent[extent.length-1]]
        }

        d3.select(this).transition()
          .call(brush.extent(extent))
          // .call(brush.event)
          .each("end",function(d){

            var new_years = d3.range(extent[0].getFullYear(),extent[1].getFullYear())

            new_years = new_years.filter(function(d){
              return years.indexOf(d) >= 0
            })

            vars.viz.time({"solo": new_years}).draw()

          })

      }
      else {
        return;
      }

    }

    var background = vars.g.timeline.selectAll("rect.d3plus_timeline_background")
      .data(["background"])

    background.enter().append("rect")
      .attr("class","d3plus_timeline_background")

    var ticks = vars.g.timeline.selectAll("g#ticks")
      .data(["ticks"])

    ticks.enter().append("g")
      .attr("id","ticks")
      .attr("transform","translate("+vars.width.value/2+","+vars.style.ui.padding+")")

    var brush_group = vars.g.timeline.selectAll("g#brush")
      .data(["brush"])

    brush_group.enter().append("g")
      .attr("id","brush")

    var labels = vars.g.timeline.selectAll("g#labels")
      .data(["labels"])

    labels.enter().append("g")
      .attr("id","labels")

    var text = labels.selectAll("text")
      .data(years,function(d,i){
        return i
      })

    text.enter().append("text")
      .attr("y",0)
      .attr("dy",0)
      .attr("x",function(d){
        if (vars.style.timeline.align == "middle") {
          return vars.width.value/2
        }
        else if (vars.style.timeline.align == "end") {
          return vars.width.value
        }
        else {
          return 0
        }
      })
      .attr("y",function(d){
        var diff = diff = parseFloat(d3.select(this).style("font-size"),10)/5
        var y = vars.style.ui.padding+vars.style.timeline.height/2+this.getBBox().height/2 - diff
        return y
      })

    var year_width = 0,
        year_height = 0,
        height = vars.style.timeline.height+vars.style.ui.padding

    text
      .order()
      .attr("font-weight",vars.style.timeline.tick.weight)
      .attr("font-family",vars.style.timeline.tick.family)
      .attr("font-size",vars.style.timeline.tick.size)
      .attr("text-anchor",vars.style.timeline.tick.align)
      .attr("opacity",0)
      .text(function(d){
        return d
      })
      .each(function(d){
        var w = this.getBBox().width,
            h = this.getBBox().height
        if (w > year_width) year_width = w
        if (h > year_height) year_height = h
      })

    var label_width = year_width+vars.style.ui.padding*2,
        timeline_width = label_width*years.length,
        available_width = vars.width.value-vars.style.ui.padding*2,
        step = 1

    if (timeline_width > available_width) {
      timeline_width = available_width
      step = Math.ceil(label_width/(timeline_width/years.length))
      label_width = timeline_width/years.length
      for (step; step < years.length-1; step++) {
        if ((years.length-1)%step == 0) {
          break;
        }
      }
      height += year_height
    }

    if (vars.style.timeline.align == "start") {
      var start_x = vars.style.ui.padding
    }
    else if (vars.style.timeline.align == "end") {
      var start_x = vars.width.value - vars.style.ui.padding - timeline_width
    }
    else {
      var start_x = vars.width.value/2 - timeline_width/2
    }

    text
      .text(function(d,i){
        return i%step == 0 ? d : ""
      })
      .attr("opacity",1)

    text.transition().duration(vars.style.timing.transitions)
      .attr("fill",function(d){

        if (d >= init[0] && d <= init[1]) {
          var color1 = vars.style.timeline.background,
              color2 = vars.style.timeline.brush.color,
              opacity = vars.style.timeline.brush.opacity
              mixed = d3plus.color.mix(color2,color1,opacity)

          return d3plus.color.text(mixed)
        }
        return d3plus.color.text(vars.style.timeline.background)
      })
      .attr("x",function(d,i){
        return start_x + (label_width*i) + label_width/2
      })
      .attr("y",function(d){
        var diff = diff = parseFloat(d3.select(this).style("font-size"),10)/5
        var y = vars.style.ui.padding+vars.style.timeline.height/2+this.getBBox().height/2 - diff
        if (step > 1) {
          y += year_height+vars.style.ui.padding
        }
        return y
      })

    text.exit().transition().duration(vars.style.timing.transitions)
      .attr("opacity",0)
      .remove()

    background.transition().duration(vars.style.timing.transitions)
      .attr("width",timeline_width)
      .attr("height",vars.style.timeline.height)
      .attr("x",start_x)
      .attr("y",vars.style.ui.padding)
      .attr("fill",vars.style.timeline.background)

    var x = d3.time.scale()
      .domain(d3.extent(year_ticks))
      .range([0,timeline_width])

    var brush = d3.svg.brush()
      .x(x)
      .extent([year_ticks[years.indexOf(start)], year_ticks[years.indexOf(end)+1]])
      .on("brushend", brushend)

    ticks.transition().duration(vars.style.timing.transitions)
      .attr("transform","translate("+start_x+","+vars.style.ui.padding+")")
      .call(d3.svg.axis()
        .scale(x)
        .orient("top")
        .ticks(function(){
          return year_ticks
        })
        .tickFormat("")
        .tickSize(-vars.style.timeline.height)
        .tickPadding(0))
        .selectAll("path").attr("fill","none")

    ticks.selectAll("line").transition().duration(vars.style.timing.transitions)
      .attr("stroke",vars.style.timeline.tick.color)
      .attr("shape-rendering",vars.style.rendering)

    brush_group
      .attr("transform","translate("+start_x+","+vars.style.ui.padding+")")
      .attr("opacity",1)
      .call(brush)

    text.attr("pointer-events","none")

    brush_group.selectAll("rect.background, rect.extent")
      .attr("height",vars.style.timeline.height)

    brush_group.selectAll("rect.background")
      .transition().duration(vars.style.timing.transitions)
      .attr("stroke",vars.style.timeline.tick.color)
      .attr("stroke-width",1)
      .style("visibility","visible")
      .attr("fill","none")
      .attr("shape-rendering",vars.style.rendering)

    brush_group.selectAll("rect.extent")
      .transition().duration(vars.style.timing.transitions)
      .attr("fill",vars.style.timeline.brush.color)
      .attr("fill-opacity",vars.style.timeline.brush.opacity)
      .attr("stroke",vars.style.timeline.tick.color)
      .attr("stroke-width",1)
      .attr("shape-rendering",vars.style.rendering)

    if (vars.timeline.handles.value) {

      brush_group.selectAll("g.resize")
        .select("rect")
        .attr("fill",vars.style.timeline.handles.color)
        .attr("stroke",vars.style.timeline.handles.stroke)
        .attr("stroke-width",1)
        .attr("x",-vars.style.timeline.handles.size/2)
        .attr("width",vars.style.timeline.handles.size)
        .attr("height",vars.style.timeline.height)
        .style("visibility","visible")
        .attr("shape-rendering",vars.style.rendering)
        .attr("opacity",vars.style.timeline.handles.opacity)

    }
    else {

      brush_group.selectAll("g.resize")
        .remove()

    }

    if (vars.style.timeline.handles.opacity) {

      brush_group.selectAll("g.resize")
        .on(d3plus.evt.over,function(){
          d3.select(this).select("rect")
            .transition().duration(vars.style.timing.mouseevents)
            .attr("fill",vars.style.timeline.handles.hover)
        })
        .on(d3plus.evt.out,function(){
          d3.select(this).select("rect")
            .transition().duration(vars.style.timing.mouseevents)
            .attr("fill",vars.style.timeline.handles.color)
        })

    }

    vars.margin.bottom += (vars.style.ui.padding*2)+height

    vars.g.timeline.transition().duration(vars.style.timing.transitions)
      .attr("transform","translate(0,"+(vars.height.value-vars.margin.bottom)+")")

  }
  else {

    vars.g.timeline.transition().duration(vars.style.timing.transitions)
      .attr("transform","translate(0,"+vars.height.value+")")

  }

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Draws appropriate titles
//------------------------------------------------------------------------------
d3plus.ui.titles = function(vars) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // If there is no data or the title bar is not needed,
  // set the total value to 'null'
  //----------------------------------------------------------------------------
  if (!vars.data.app || !vars.title.total.value || vars.small) {
    var total = null
  }
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Otherwise, let's calculate it!
  //----------------------------------------------------------------------------
  else {

    if (vars.dev.value) {
      d3plus.console.group("Calculating Total Value")
      d3plus.console.time(vars.size.key)
    }

    var total_key = vars.size.key ? vars.size.key
      : vars.color.type == "number" ? vars.color.key : null

    if (vars.focus.value) {
      var total = vars.data.app.filter(function(d){
        return d[vars.id.key] == vars.focus.value
      })
      total = d3.sum(total,function(d){
        return d3plus.variable.value(vars,d,total_key)
      })
    }
    else if (total_key) {
      var total = d3.sum(vars.data.pool,function(d){
        return d3plus.variable.value(vars,d,total_key)
      })
    }

    if (total === 0) {
      total = false
    }

    if (typeof total == "number") {

      var pct = ""

      if (vars.mute.length || vars.solo.length || vars.focus.value) {

        var overall_total = d3.sum(vars.data.filtered.all, function(d){
          if (vars.time.solo.value.length > 0) {
            var match = vars.time.solo.value.indexOf(d3plus.variable.value(vars,d,vars.time.key)) >= 0
          }
          else if (vars.time.mute.value.length > 0) {
            var match = vars.time.solo.value.indexOf(d3plus.variable.value(vars,d,vars.time.key)) < 0
          }
          else {
            var match = true
          }
          if (match) {
            return d3plus.variable.value(vars,d,total_key)
          }
        })

        if (overall_total > total) {

          var pct = (total/overall_total)*100,
              ot = vars.format(overall_total,vars.size.key)

          var pct = " ("+vars.format(pct,"share")+"% of "+ot+")"

        }
      }

      total = vars.format(total,vars.size.key)
      var obj = vars.title.total.value
        , prefix = obj.prefix || vars.format("Total")+": "
      total = prefix + total
      obj.suffix ? total = total + obj.suffix : null
      total += pct

    }

    if (vars.dev.value) {
      d3plus.console.timeEnd(vars.size.key)
      d3plus.console.groupEnd()
    }

  }


  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Initialize titles and detect footer
  //----------------------------------------------------------------------------
  var title_data = []

  if (vars.footer.value) {
    title_data.push({
      "link": vars.footer.link,
      "style": vars.style.footer,
      "type": "footer",
      "value": vars.footer.value
    })
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // If not in "small" mode, detect titles available
  //----------------------------------------------------------------------------
  if (!vars.small) {

    if (vars.title.value) {
      title_data.push({
        "link": vars.title.link,
        "style": vars.style.title,
        "type": "title",
        "value": vars.title.value
      })
    }
    if (vars.title.sub.value) {
      title_data.push({
        "link": vars.title.sub.link,
        "style": vars.style.title.sub,
        "type": "sub",
        "value": vars.title.sub.value
      })
    }
    if (vars.title.total.value && total) {
      title_data.push({
        "link": vars.title.total.link,
        "style": vars.style.title.total,
        "type": "total",
        "value": total
      })
    }

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Title positioning
  //----------------------------------------------------------------------------
  function position(title) {

    title
      .attr("text-anchor",function(t){

        var align = t.style.font.align

        if (align == "center") {
          return "middle"
        }
        else if ((align == "left" && !d3plus.rtl) || (align == "right" && d3plus.rtl)) {
          return "start"
        }
        else if ((align == "left" && d3plus.rtl) || (align == "right" && !d3plus.rtl)) {
          return "end"
        }

      })
      .attr("x",function(t){

        var align = t.style.font.align

        if (align == "center") {
          return vars.width.value/2
        }
        else if ((align == "left" && !d3plus.rtl) || (align == "right" && d3plus.rtl)) {
          return vars.style.padding
        }
        else if ((align == "left" && d3plus.rtl) || (align == "right" && !d3plus.rtl)) {
          return vars.width.value-vars.style.padding
        }

      })
      .attr("y",0)

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Enter Titles
  //----------------------------------------------------------------------------
  function style(title) {

    title
      .attr("font-size",function(t){
        return t.style.font.size
      })
      .attr("fill",function(t){
        return t.link ? vars.style.link.font.color : t.style.font.color
      })
      .attr("font-family",function(t){
        return t.link ? vars.style.link.font.family : t.style.font.family
      })
      .attr("font-weight",function(t){
        return t.link ? vars.style.link.font.weight : t.style.font.weight
      })
      .style("text-decoration",function(t){
        return t.link ? vars.style.link.font.decoration : t.style.font.decoration
      })
      .style("text-transform",function(t){
        return t.link ? vars.style.link.font.transform : t.style.font.transform
      })

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Enter Titles
  //----------------------------------------------------------------------------
  if (vars.dev.value) d3plus.console.log("Drawing Titles")
  var titles = vars.svg.selectAll("g.d3plus_title")
    .data(title_data,function(t){
      return t.type
    })

  var title_width = vars.style.title.width || vars.width.value

  titles.enter().append("g")
    .attr("class","d3plus_title")
    .attr("opacity",0)
    .attr("transform",function(t){
      var y = t.style.position == "top" ? 0 : vars.height.value
      return "translate(0,"+y+")"
    })
    .append("text")
      .call(position)
      .call(style)

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Wrap text and calculate positions, then transition style and opacity
  //----------------------------------------------------------------------------
  titles
    .each(function(d){

      d3plus.util.wordwrap({
        "text": d.value,
        "parent": d3.select(this).select("text").node(),
        "width": title_width,
        "height": vars.height.value/8,
        "resize": false
      })

      d.y = vars.margin[d.style.position]
      vars.margin[d.style.position] += this.getBBox().height + d.style.padding*2

    })
    .on(d3plus.evt.over,function(t){
      if (t.link) {
        d3.select(this)
          .transition().duration(vars.style.timing.mouseevents)
          .style("cursor","pointer")
          .select("text")
            .attr("fill",vars.style.link.hover.font.color)
            .attr("font-family",vars.style.link.hover.font.family)
            .attr("font-weight",vars.style.link.hover.font.weight)
            .style("text-decoration",vars.style.link.hover.font.decoration)
            .style("text-transform",vars.style.link.hover.font.transform)
      }
    })
    .on(d3plus.evt.out,function(t){
      if (t.link) {
        d3.select(this)
          .transition().duration(vars.style.timing.mouseevents)
          .style("cursor","auto")
          .select("text")
            .call(style)
      }
    })
    .on(d3plus.evt.click,function(t){
      if (t.link) {
        var target = t.link.charAt(0) != "/" ? "_blank" : "_self"
        window.open(t.link,target)
      }
    })
    .transition().duration(vars.timing)
      .attr("opacity",1)
      .attr("transform",function(t){
        var pos = t.style.position,
            y = pos == "top" ? 0+t.y : vars.height.value-t.y
        if (pos == "bottom") {
          y -= this.getBBox().height+t.style.padding
        }
        else {
          y += t.style.padding
        }
        return "translate(0,"+y+")"
      })
      .select("text")
        .call(position)
        .call(style)

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Exit unused titles
  //----------------------------------------------------------------------------
  titles.exit().transition().duration(vars.timing)
    .attr("opacity",0)
    .remove()

  var min = vars.style.title.height
  if (min && vars.margin[vars.style.title.position] < min) {
    vars.margin[vars.style.title.position] = min
  }

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Expands a min/max into a specified number of buckets
//------------------------------------------------------------------------------
d3plus.util.buckets = function(arr, buckets) {
  var return_arr = [], step = 1/(buckets-1)*(arr[1]-arr[0]), i = step

  for (var i = arr[0]; i <= arr[1]; i = i + step) {
    return_arr.push(i)
  }
  if (return_arr.length < buckets) {
    return_arr[buckets-1] = arr[1]
  }
  if (return_arr[return_arr.length-1] < arr[1]) {
    return_arr[return_arr.length-1] = arr[1]
  }
  return return_arr
}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Checks to see if element is inside of another elemebt
//------------------------------------------------------------------------------
d3plus.util.child = function(parent,child) {

  if (!parent || !child) {
    return false;
  }

  if (d3plus.util.d3selection(parent)) {
    parent = parent.node()
  }

  if (d3plus.util.d3selection(parent)) {
    child = child.node()
  }

  var node = child.parentNode;
  while (node != null) {
    if (node == parent) {
      return true;
    }
    node = node.parentNode;
  }

  return false;

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Finds closest numeric value in array
//------------------------------------------------------------------------------
d3plus.util.closest = function(arr,value) {
  var closest = arr[0]
  arr.forEach(function(p){
    if (Math.abs(value-p) < Math.abs(value-closest)) {
      closest = p
    }
  })
  return closest
}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Clones an object, removing any edges to the original
//------------------------------------------------------------------------------
d3plus.util.copy = function(obj) {
  return d3plus.util.merge(obj)
}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Cross-browser detect for D3 element
//------------------------------------------------------------------------------
d3plus.util.d3selection = function(selection) {
  return d3plus.ie ?
    typeof selection == "object" && selection instanceof Array
    : selection instanceof d3.selection
}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates a Base-64 Data URL from and Image URL
//------------------------------------------------------------------------------
d3plus.util.dataurl = function(url,callback) {

  var img = new Image();
  img.src = url;
  img.crossOrigin = "Anonymous";
  img.onload = function () {

    var canvas = document.createElement("canvas");
    canvas.width = this.width;
    canvas.height = this.height;

    var ctx = canvas.getContext("2d");
    ctx.drawImage(this, 0, 0);

    callback.call(this,canvas.toDataURL("image/png"))

    canvas = null

  }

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Returns distances of all objects in array
//------------------------------------------------------------------------------
d3plus.util.distances = function(arr,accessor) {

  var distances = [], checked = []
  arr.forEach(function(node1){
    var n1 = accessor ? accessor(node1) : [node1.x,node1.y]
    checked.push(node1)
    arr.forEach(function(node2){
      if (checked.indexOf(node2) < 0) {
        var n2 = accessor ? accessor(node2) : [node2.x,node2.y]
          , xx = Math.abs(n1[0]-n2[0])
          , yy = Math.abs(n1[1]-n2[1])
        distances.push(Math.sqrt((xx*xx)+(yy*yy)))
      }
    })

  })

  distances.sort(function(a,b){
    return a - b
  })

  return distances
}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Merge two objects to create a new one with the properties of both
//------------------------------------------------------------------------------
d3plus.util.merge = function(obj1, obj2) {
  var obj3 = {};
  function copy_object(obj,ret) {
    for (var a in obj) {
      if (typeof obj[a] != "undefined") {
        if (typeof obj[a] == "object" && !(obj[a] instanceof Array) && obj[a] !== null) {
          if (typeof ret[a] != "object") ret[a] = {}
          copy_object(obj[a],ret[a])
        }
        else if (obj[a] instanceof Array) {
          ret[a] = obj[a].slice(0)
        }
        else {
          ret[a] = obj[a]
        }
      }
    }
  }
  if (obj1) copy_object(obj1,obj3)
  if (obj2) copy_object(obj2,obj3)
  return obj3;
}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Gives X and Y offset based off angle and shape
//------------------------------------------------------------------------------
d3plus.util.offset = function(radians, distance, shape) {

  var coords = {"x": 0, "y": 0}

  if (radians < 0) {
    radians = Math.PI*2+radians
  }

  if (shape == "square") {

    var diagonal = 45*(Math.PI/180)

    if (radians <= Math.PI) {

      if (radians < (Math.PI / 2)) {

        if (radians < diagonal) {

          coords.x += distance;
          var oppositeLegLength = Math.tan(radians) * distance;
          coords.y += oppositeLegLength;

        } else {

          coords.y += distance;
          var adjacentLegLength = distance / Math.tan(radians);
          coords.x += adjacentLegLength;

        }

      } else {

        if (radians < (Math.PI - diagonal)) {

          coords.y += distance;
          var adjacentLegLength = distance / Math.tan(Math.PI - radians);
          coords.x -= adjacentLegLength;

        } else {

          coords.x -= distance;
          var oppositeLegLength = Math.tan(Math.PI - radians) * distance;
          coords.y += oppositeLegLength;
        }

      }
    } else {

      if (radians < (3 * Math.PI / 2)) {

        if (radians < (diagonal + Math.PI)) {

          coords.x -= distance;
          var oppositeLegLength = Math.tan(radians - Math.PI) * distance;
          coords.y -= oppositeLegLength;

        } else {

          coords.y -= distance;
          var adjacentLegLength = distance / Math.tan(radians - Math.PI);
          coords.x -= adjacentLegLength;

        }

      } else {

        if (radians < (2 * Math.PI - diagonal)) {

          coords.y -= distance;
          var adjacentLegLength = distance / Math.tan(2 * Math.PI - radians);
          coords.x += adjacentLegLength;

        } else {

          coords.x += distance;
          var oppositeLegLength = Math.tan(2 * Math.PI - radians) * distance;
          coords.y -= oppositeLegLength;

        }

      }
    }

  }
  else {

    coords.x += distance * Math.cos(radians)
    coords.y += distance * Math.sin(radians)

  }

  return coords;

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Removes all non ASCII characters
//------------------------------------------------------------------------------
d3plus.util.strip = function(str) {

  var removed = [ "!","@","#","$","%","^","&","*","(",")",
                  "[","]","{","}",".",",","/","\\","|",
                  "'","\"",";",":","<",">","?","=","+"]

  return str.replace(/[^A-Za-z0-9\-_]/g, function(chr) {

    if (" " == chr) {
      return "_"
    }
    else if (removed.indexOf(chr) >= 0) {
      return ""
    }

    var diacritics = [
        [/[\300-\306]/g, "A"],
        [/[\340-\346]/g, "a"],
        [/[\310-\313]/g, "E"],
        [/[\350-\353]/g, "e"],
        [/[\314-\317]/g, "I"],
        [/[\354-\357]/g, "i"],
        [/[\322-\330]/g, "O"],
        [/[\362-\370]/g, "o"],
        [/[\331-\334]/g, "U"],
        [/[\371-\374]/g, "u"],
        [/[\321]/g, "N"],
        [/[\361]/g, "n"],
        [/[\307]/g, "C"],
        [/[\347]/g, "c"],
    ];

    var ret = ""

    for (d in diacritics) {

      if (diacritics[d][0].test(chr)) {
        ret = diacritics[d][1]
        break;
      }

    }

    return ret;

  });

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Returns list of unique values
//------------------------------------------------------------------------------
d3plus.util.uniques = function(data,value) {
  var type = null
  return d3.nest().key(function(d) {
      if (typeof value == "string") {
        if (!type && typeof d[value] !== "undefined") type = typeof d[value]
        return d[value]
      }
      else if (typeof value == "function") {
        if (!type && typeof value(d) !== "undefined") type = typeof value(d)
        return value(d)
      }
      else {
        return d
      }
    })
    .entries(data)
    .reduce(function(a,b){
      if (type) {
        var val = b.key
        if (type == "number") val = parseFloat(val)
        return a.concat(val)
      }
      return a
    },[]).sort(function(a,b){
      return a - b
    })
}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// function that will wrap and resize SVG text
//-------------------------------------------------------------------
d3plus.util.wordwrap = function(params) {

  var parent = params.parent,
      width = params.width ? params.width : 20000,
      height = params.height ? params.height : 20000,
      resize = params.resize,
      font_max = params.font_max ? params.font_max : 40,
      font_min = params.font_min ? params.font_min : 9,
      text_array = params.text,
      split = ["-","/",";",":","&"],
      regex = new RegExp("[^\\s\\"+split.join("\\")+"]+\\"+split.join("?\\")+"?","g"),
      current_text = ""

  if (!d3.select(parent).attr("font-size")) {
    d3.select(parent).attr("font-size",font_min)
  }

  if (text_array instanceof Array) {
    text_array = text_array.filter(function(t){
      return ["string","number"].indexOf(typeof t) >= 0
    })
    current_text = String(text_array.shift())
  }
  else {
    current_text = String(text_array)
  }

  wrap()

  function wrap() {

    var words = current_text.match(regex)

    if (resize) {

      // Start by trying the largest font size
      var size = font_max
      size = Math.floor(size)
      d3.select(parent).attr("font-size",size)

      // Add each word to it's own line (to test for longest word)
      d3.select(parent).selectAll("tspan").remove()
      for(var i=0; i<words.length; i++) {
        if (words.length == 1) var t = words[i]
        else var t = words[i]+"..."
        d3.select(parent).append("tspan").attr("x",0).text(t)
      }

      // If the longest word is too wide, make the text proportionately smaller
      if (parent.getBBox().width > width) size = size*(width/parent.getBBox().width)

      // If the new size is too small, return NOTHING
      if (size < font_min) {
        d3.select(parent).selectAll("tspan").remove();
        if (typeof text_array == "string" || text_array.length == 0) return;
        else {
          current_text = String(text_array.shift())
          wrap()
        }
        return;
      }

      // Use new text size
      size = Math.floor(size)
      d3.select(parent).attr("font-size",size);

      // Flow text into box
      flow();

      // If text doesn't fit height-wise, shrink it!
      if (parent.childNodes.length*parent.getBBox().height > height) {
        var temp_size = size*(height/(parent.childNodes.length*parent.getBBox().height))
        if (temp_size < font_min) size = font_min
        else size = temp_size
        size = Math.floor(size)
        d3.select(parent).attr("font-size",size)
      } else finish();

    }

    flow();
    truncate();
    finish();

    function flow() {

      d3.select(parent).selectAll("tspan").remove()

      var x_pos = parent.getAttribute("x")

      var tspan = d3.select(parent).append("tspan")
        .attr("x",x_pos)
        .text(words[0])

      for (var i=1; i < words.length; i++) {

        var current = tspan.text(),
            last_char = current.slice(-1),
            next_char = current_text.charAt(current_text.indexOf(current)+current.length)
            joiner = next_char == " " ? " " : ""

        tspan.text(current+joiner+words[i])

        if (tspan.node().getComputedTextLength() > width) {

          tspan.text(current)

          tspan = d3.select(parent).append("tspan")
            .attr("x",x_pos)
            .text(words[i])

        }
      }

    }

    function truncate() {
      var cut = false
      while (parent.childNodes.length*parent.getBBox().height > height && parent.lastChild && !cut) {
        parent.removeChild(parent.lastChild)
        if (parent.childNodes.length*parent.getBBox().height < height && parent.lastChild) cut = true
      }
      if (cut) {

        tspan = parent.lastChild
        words = d3.select(tspan).text().match(/[^\s-]+-?/g)

        function ellipsis() {

          if (words.length) {

            var last_word = words[words.length-1],
                last_char = last_word.charAt(last_word.length-1)

            if (last_word.length == 1 && split.indexOf(last_word) >= 0) {

              words.pop()
              ellipsis()

            }
            else {

              if (split.indexOf(last_char) >= 0) {
                last_word = last_word.substr(0,last_word.length-1)
              }

              d3.select(tspan).text(words.join(" ")+"...")
              if (tspan.getComputedTextLength() > width) {
                words.pop()
                ellipsis()
              }

            }

          }
          else {

            d3.select(tspan).remove()

          }

        }

        ellipsis()

      }
    }
  }

  function finish() {
    d3.select(parent).selectAll("tspan").attr("dy", d3.select(parent).style("font-size"));
    return;
  }

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Finds an object's color and returns random if it cannot be found
//------------------------------------------------------------------------------
d3plus.variable.color = function(vars,id,level) {

  function get_random(c) {
    if (typeof c == "object") {
      c = c[vars.id.key]
    }
    return d3plus.color.random(c)
  }

  function validate_color(c) {
    if (typeof c == "string" && c.indexOf("#") == 0 && [4,7].indexOf(c.length) >= 0) return true
    else return false
  }

  if (!vars.color.key) {
    return get_random(id);
  }
  else {

    var color = d3plus.variable.value(vars,id,vars.color.key,level)

    if (!color) {
      if (typeof vars.color.scale == "function") {
        return vars.style.color.missing
      }
      return get_random(id)
    }
    else if (!vars.color.scale) {
      var true_color = validate_color(color)
      return true_color ? color : get_random(color)
    }
    else {
      return vars.color.scale(color)
    }

  }
}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Get array of available text values
//------------------------------------------------------------------------------
d3plus.variable.text = function(vars,obj,depth) {

  if (typeof depth != "number") var depth = vars.depth.value

  if (vars.text.array && typeof vars.text.array == "object") {
    if (vars.text.array[vars.id.nesting[depth]]) {
      var text_keys = vars.text.array[vars.id.nesting[depth]]
    }
    else {
      var text_keys = vars.text.array[Object.keys(vars.text.array)[0]]
    }
  }
  else {
    var text_keys = []
    if (vars.text.key) text_keys.push(vars.text.key)
    text_keys.push(vars.id.nesting[depth])
  }
  if (typeof text_keys == "string") {
    text_keys = [text_keys]
  }

  var names = []
  text_keys.forEach(function(t){
    var name = d3plus.variable.value(vars,obj,t,vars.id.nesting[depth])
    if (name) names.push(vars.format(name))
  })

  return names

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Finds a given variable by searching through the data and attrs
//------------------------------------------------------------------------------
d3plus.variable.value = function(vars,id,variable,id_var,agg) {

  if (!id_var) {
    if (variable && typeof variable == "object") {
      if (variable[vars.id.key]) {
        var id_var = vars.id.key
      }
      else {
        var id_var = Object.keys(variable)[0]
      }
      variable = variable[id_var]
    }
    else {
      var id_var = vars.id.key
    }
  }

  if (variable && typeof variable == "function") {
    return variable(id)
  }

  function filter_array(arr) {
    return arr.filter(function(d){
      return d[id_var] == id
    })[0]
  }

  var value_array = []
  function check_children(obj) {
    if (obj.children) {
      obj.children.forEach(function(c){
        check_children(c)
      })
    }
    else if (obj[variable]) {
      value_array.push(obj[variable])
    }
  }

  if (typeof id == "object" && typeof id[variable] != "undefined") {
    return id[variable]
  }
  else if (typeof id == "object" && id.children) {

    if (!agg) {
      var agg = "sum"
      if (typeof vars.aggs.value == "string") {
        agg = vars.aggs.value
      }
      else if (vars.aggs.value[variable]) {
        agg = vars.aggs.value[variable]
      }
    }
    check_children(id)
    if (value_array.length) {
      if (typeof agg == "string") {
        return d3[agg](value_array)
      }
      else if (typeof agg == "function") {
        return agg(value_array)
      }
    }

    var dat = id
    id = dat[id_var]

  }
  else {

    if (typeof id == "object") {
      var dat = id
      id = id[id_var]
    }

    if (vars.data.app instanceof Array) {
      var dat = filter_array(vars.data.app)
    }

    if (dat && typeof dat[variable] != "undefined") return dat[variable]
  }

  if (vars.attrs.value instanceof Array) {
    var attr = filter_array(vars.attrs.value)
  }
  else if (vars.attrs.value[id_var]) {
    if (vars.attrs.value[id_var] instanceof Array) {
      var attr = filter_array(vars.attrs.value[id_var])
    }
    else {
      var attr = vars.attrs.value[id_var][id]
    }
  }
  else {
    var attr = vars.attrs.value[id]
  }

  if (attr && typeof attr[variable] != "undefined") return attr[variable]

  return null

}

d3plus.zoom.bounds = function(vars,b,timing) {

  if (!b) {
    var b = vars.zoom.bounds
  }

  if (typeof timing != "number") {
    var timing = vars.style.timing.transitions
  }

  vars.zoom.size = {
    "height": b[1][1]-b[0][1],
    "width": b[1][0]-b[0][0]
  }

  var fit = vars.coords.fit.value
  if (fit == "auto" || d3plus.apps[vars.type.value].requirements.indexOf("coords") < 0) {
    var aspect = d3.max([vars.zoom.size.width/vars.app_width,vars.zoom.size.height/vars.app_height])
  }
  else {
    var aspect = vars.zoom.size[fit]/vars["app_"+fit]
  }

  var min = d3.min([vars.app_width,vars.app_height])

  var scale = ((min-(vars.coords.padding*2)) / min) / aspect

  var extent = vars.zoom_behavior.scaleExtent()

  if (extent[0] == extent[1] || b == vars.zoom.bounds) {
    vars.zoom_behavior.scaleExtent([scale,scale*16])
  }

  var max_scale = vars.zoom_behavior.scaleExtent()[1]
  if (scale > max_scale) {
    scale = max_scale
  }
  vars.zoom.scale = scale

  var translate = []

  translate[0] = vars.app_width/2-(vars.zoom.size.width*scale)/2-(b[0][0]*scale)
  translate[1] = vars.app_height/2-(vars.zoom.size.height*scale)/2-(b[0][1]*scale)

  vars.zoom.translate = translate
  vars.zoom_behavior.translate(translate).scale(scale)

  vars.zoom.size = {
    "height": vars.zoom.bounds[1][1]-vars.zoom.bounds[0][1],
    "width": vars.zoom.bounds[1][0]-vars.zoom.bounds[0][0]
  }

  d3plus.zoom.transform(vars,timing)

}

d3plus.zoom.controls = function() {
  d3.select("#d3plus.utilsts.zoom_controls").remove()
  if (!vars.small) {
    // Create Zoom Controls
    var zoom_enter = vars.parent.append("div")
      .attr("id","d3plus.utilsts.zoom_controls")
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

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Sets label opacity based on zoom
//------------------------------------------------------------------------------
d3plus.zoom.labels = function(vars) {

  var max_scale = vars.zoom_behavior.scaleExtent()[1]

  if (vars.dev.value) d3plus.console.time("determining label visibility")

  if (vars.timing) {

    vars.g.viz.selectAll("text.d3plus_label")
      .transition().duration(vars.timing)
      .attr("opacity",function(d){
        if (!d) var d = {"scale": max_scale}
        var size = parseFloat(d3.select(this).attr("font-size"),10)
        d.visible = size/d.scale*vars.zoom.scale >= 7
        return d.visible ? 1 : 0
      })

  }
  else {

    vars.g.viz.selectAll("text.d3plus_label")
      .attr("opacity",function(d){
        if (!d) var d = {"scale": max_scale}
        var size = parseFloat(d3.select(this).attr("font-size"),10)
        d.visible = size/d.scale*vars.zoom.scale >= 7
        return d.visible ? 1 : 0
      })

  }

  if (vars.dev.value) d3plus.console.timeEnd("determining label visibility")

}

d3plus.zoom.mouse = function(vars) {

  var translate = d3.event.translate,
      scale = d3.event.scale,
      limits = vars.zoom.bounds,
      xoffset = (vars.app_width-(vars.zoom.size.width*scale))/2,
      xmin = xoffset > 0 ? xoffset : 0,
      xmax = xoffset > 0 ? vars.app_width-xoffset : vars.app_width,
      yoffset = (vars.app_height-(vars.zoom.size.height*scale))/2,
      ymin = yoffset > 0 ? yoffset : 0,
      ymax = yoffset > 0 ? vars.app_height-yoffset : vars.app_height

  // Auto center visualization
  if (translate[0]+limits[0][0]*scale > xmin) {
    translate[0] = -limits[0][0]*scale+xmin
  }
  else if (translate[0]+limits[1][0]*scale < xmax) {
    translate[0] = xmax-(limits[1][0]*scale)
  }

  if (translate[1]+limits[0][1]*scale > ymin) {
    translate[1] = -limits[0][1]*scale+ymin
  }
  else if (translate[1]+limits[1][1]*scale < ymax) {
    translate[1] = ymax-(limits[1][1]*scale)
  }

  vars.zoom_behavior.translate(translate).scale(scale)

  vars.zoom.translate = translate
  vars.zoom.scale = scale

  if (d3.event.sourceEvent.type == "wheel") {
    var delay = vars.timing ? 100 : 500
    clearTimeout(vars.zoom.wheel)
    vars.zoom.wheel = setTimeout(function(){
      d3plus.zoom.labels(vars)
    },delay)
  }
  else {
    d3plus.zoom.labels(vars)
  }

  if (d3.event.sourceEvent.type == "dblclick") {
    d3plus.zoom.transform(vars,vars.style.timing.transitions)
  }
  else {
    d3plus.zoom.transform(vars,0)
  }

}

d3plus.zoom.transform = function(vars,timing) {

  if (typeof timing != "number") {
    var timing = vars.timing
  }

  var translate = vars.zoom.translate
    , scale = vars.zoom.scale

  if (timing) {
    vars.g.viz.transition().duration(timing)
      .attr("transform","translate("+translate+")scale("+scale+")")

  }
  else {

    vars.g.viz
      .attr("transform","translate("+translate+")scale("+scale+")")

  }

}
