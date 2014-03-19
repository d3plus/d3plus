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
    "max-height": 600,
    "max-width": 600,
    "parent": d3.select("body"),
    "previous": false,
    "propagation": true,
    "selected": false,
    "text": "text",
    "timing": 400
  }

  var styles = {
    "align": "left",
    "border": "all",
    "color": "#ffffff",
    "corners": 0,
    "display": "inline-block",
    "font-family": "'HelveticaNeue-Light', 'Helvetica Neue Light', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'",
    "font-size": 12,
    "font-spacing": 0,
    "font-weight": "lighter",
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
  styles.icon = d3plus.fonts.awesome ? "fa-angle-down" : "&#x27A4;"

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Overwrite vars if vars have been passed
  //----------------------------------------------------------------------------
  if (passed) {
    styles = d3plus.utils.merge(styles,passed)
  }
  vars.forms = function(selection,timing) {

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Set timing to 0 if it's the first time running this function
    //--------------------------------------------------------------------------
    if (typeof timing != "number") {
      var timing = vars.init ? vars.timing : 0
    }

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

      var d3selection = d3plus.ie ? typeof vars.data.select == "function" : vars.data instanceof d3.selection

      if (typeof vars.data == "string" && !d3.select(vars.data).empty()) {
        vars.element = d3.selectAll(vars.data)
        if (vars.data.charAt(0) == "#") {
          vars.before = vars.data
        }
      }
      else if (d3selection) {
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

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Select container DIV for UI element
      //------------------------------------------------------------------------
      vars.container = vars.parent.selectAll("div#d3plus_"+vars.type+"_"+vars.id)
        .data(["container"])

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Create container DIV for UI element
      //------------------------------------------------------------------------
      vars.container.enter()
        .insert("div",vars.before)
        .attr("id","d3plus_"+vars.type+"_"+vars.id)
        .style("display","inline-block")
        .style("position","relative")
        .style("overflow","visible")
        .style("vertical-align","top")

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

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Select testing DIV
      //------------------------------------------------------------------------
      vars.tester = d3.select("body").selectAll("div.d3plus_tester")
        .data(["tester"])

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Create testing DIV
      //------------------------------------------------------------------------
      vars.tester.enter().append("div")
        .attr("class","d3plus_tester")
        .style("position","absolute")
        .style("left","-9999px")
        .style("top","-9999px")
        .style("visibility","hidden")
        .style("display","block")

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Call specific UI element type
      //------------------------------------------------------------------------
      if (vars.dev) d3plus.console.group("drawing \""+vars.type+"\"")
      d3plus.forms[vars.type](vars,styles,timing)
      if (vars.dev) d3plus.console.groupEnd()

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Initialization complete
      //------------------------------------------------------------------------
      if (!vars.init) {
        vars.init = true
      }
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
    "id",
    "parent",
    "previous",
    "propagation",
    "search",
    "selected",
    "timing",
    "text",
    "type"
  ]

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Create simple set/retrieve methods
  //----------------------------------------------------------------------------
  variables.forEach(function(v){

    vars.forms[v] = (function(key) {

      return function(value) {

        if (vars.dev) {

          var text = value.toString()
          if (text.length > 50) {
            var text = ""
          }
          else {
            var text = " to \""+text+"\""
          }

        }

        if (!arguments.length) return vars[key]

        if (["element","parent"].indexOf(key) >= 0) {
          var d3selection = d3plus.ie ? typeof value == "object" && value instanceof Array : value instanceof d3.selection
          if (typeof value == "string" && !d3.select(value).empty()) {
            if (vars.dev) d3plus.console.log("\""+key+"\" set"+text)
            vars[key] = d3.selectAll(value)
          }
          else if (d3selection) {
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

        if (!arguments.length) return styles[key]

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
          if (typeof value == "string") {
            if (vars.dev) d3plus.console.log("\"font-family\" set"+text)
            styles["font-family"] = value
          }
          if (typeof value == "number") {
            if (vars.dev) d3plus.console.log("\"font-size\" set"+text)
            styles["font-size"] = value
          }
          else if (typeof value == "object") {
            for (style in value) {
              if (style == "align" && d3plus.rtl) {
                if (value[style] == "left") {
                  value[style] = "right"
                }
                else if (value[style] == "right") {
                  value[style] = "left"
                }
              }
              if (vars.dev) {

                var text = value[style].toString()
                if (text.length > 50) {
                  var text = ""
                }
                else {
                  var text = " to \""+text+"\""
                }

                d3plus.console.log("\"font-"+style+"\" set"+text)
              }
              styles["font-"+style] = value[style]
            }
          }
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
