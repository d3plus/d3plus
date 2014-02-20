//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// UI Element shell
//------------------------------------------------------------------------------
d3plus.ui = function(passed) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Create global ui variable object
  //----------------------------------------------------------------------------
  var vars = {
    "before": null,
    "callback": false,
    "data": [],
    "enabled": false,
    "filter": "",
    "format": d3plus.public.text_format.value,
    "highlight": false,
    "hover": false,
    "id": "default",
    "init": false,
    "max-height": 600,
    "max-width": 600,
    "parent": d3.select("body"),
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
    "secondary": d3plus.color.darker("#ffffff",.1),
    "shadow": 5,
    "stroke": 1,
    "width": false
  }
  
  styles["font-align"] = d3plus.rtl ? "right" : "left"
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Set default icon based on whether or not font-awesome is present
  //----------------------------------------------------------------------------
  styles.icon = d3plus.fontawesome ? "fa-angle-down" : "&#x27A4;"

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Overwrite vars if vars have been passed
  //----------------------------------------------------------------------------
  if (passed) {
    styles = d3plus.utils.merge(styles,passed)
  }
  vars.ui = function(selection,timing) {
    
    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Set timing to 0 if it's the first time running this function
    //--------------------------------------------------------------------------
    if (typeof timing != "number") {
      var timing = vars.init ? vars.timing : 0
    }
    
    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // If it data is a string, extract data from the element associated with it
    //--------------------------------------------------------------------------
    if (vars.data && (!(vars.data instanceof Array) || vars.data instanceof d3.selection)) {
      if (typeof vars.data == "string" && !d3.select(vars.data).empty()) {
        vars.before = vars.data
        vars.element = d3.selectAll(vars.data)
      }
      else if (vars.data instanceof d3.selection) {
        vars.element = vars.data
        if (vars.data.node().id) {
          vars.before = "#"+vars.data.node().id
        }
      }
      
      if (vars.element) {

        vars.data = []
        
        vars.element
          .style("position","absolute")
          .style("overflow","hidden")
          .style("clip","rect(0 0 0 0)")
          .style("width","1px")
          .style("height","1px")
          .style("margin","-1px")
          .style("padding","0")
          .style("border","0")
          
        vars.parent = d3.select(vars.element.node().parentNode)
        d3plus.forms.data(vars)
      }
      
    }
    
    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // If there is no data, throw error message
    //--------------------------------------------------------------------------
    if (!(vars.data instanceof Array)) {
      d3plus.console.warning("Cannot create UI element for \""+vars.data+"\", no data found.")
    }
    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Else, create/update the UI element
    //--------------------------------------------------------------------------
    else {
      
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
      d3plus.forms[vars.type](vars,styles,timing)

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Initialization complete
      //------------------------------------------------------------------------
      if (!vars.init) {
        vars.init = true
      }
      
    }
    
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // List of simple set/retrieve methods
  //----------------------------------------------------------------------------
  var variables = [
    "callback",
    "data",
    "element",
    "highlight",
    "hover",
    "id",
    "parent",
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
    
    vars.ui[v] = (function(key) {
      
      return function(value) {

        if (!arguments.length) return vars[key]
        
        vars[key] = value
        
        return vars.ui
        
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
    
    vars.ui[v] = (function(key) {
      
      return function(value) {
        
        if (!arguments.length) return styles[key]
        
        if (key == "font") {
          if (typeof value == "string") {
            styles["font-family"] = value
          }
          if (typeof value == "number") {
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
              styles["font-"+style] = value[style]
            }
          }
        }
        else {
          if (key == "color" && styles.secondary == d3plus.color.darker(styles.color,0.1)) {
            styles.secondary = d3plus.color.darker(value,0.1)
          }
          styles[key] = value
        }
        
        return vars.ui
        
      }
      
    })(v)
    
  })
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Disables the UI element
  //----------------------------------------------------------------------------
  vars.ui.disable = function() {
    vars.enabled = false
    if (vars.init) {
      vars.parent.call(vars.ui)
    }
    return vars.ui
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Enables the UI element
  //----------------------------------------------------------------------------
  vars.ui.enable = function() {
    vars.enabled = true
    if (vars.init) {
      vars.parent.call(vars.ui)
    }
    return vars.ui
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Draws the UI element
  //----------------------------------------------------------------------------
  vars.ui.draw = function(timing) {
    vars.parent.call(vars.ui,timing)
    return vars.ui
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Returns UI element's current height
  //----------------------------------------------------------------------------
  vars.ui.height = function(value) {
    
    if (!arguments.length) return vars.container[0][0].offsetHeight
    
    styles.height = value
    
    return vars.ui
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Destroys UI element
  //----------------------------------------------------------------------------
  vars.ui.remove = function(x) {
    vars.container.remove()
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Selects something inside of the container
  //----------------------------------------------------------------------------
  vars.ui.select = function(selection) {
    return vars.container.select(selection)
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Sets value of the UI element
  //----------------------------------------------------------------------------
  vars.ui.value = function(value) {
    
    if (!arguments.length) return vars.focus
      
    if (typeof value == "string") {
      value = vars.data.filter(function(d){
        return d.value == value
      })[0]
    }
    
    if (value.value != vars.focus) {

      var index = false
      vars.data.forEach(function(d,i){
        if (d.value == value.value) {
          index = i
        }
      })

      if (vars.tag == "select") {
        
        vars.element.node().selectedIndex = index
      
      }
      else if (vars.tag == "input" && vars.element.attr("type") == "radio") {
        vars.element
          .each(function(e,i){
            if (index == i) {
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
    
      vars.focus = value.value
      
    }
    
    vars.enabled = false
    vars.highlight = false
    
    if (vars.init) {
      vars.parent.call(vars.ui)
    }
    
    return vars.ui
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Toggles the UI element menu open/close
  //----------------------------------------------------------------------------
  vars.ui.toggle = function() {
    
    if (vars.enabled) {
      vars.ui.disable()
    }
    else {
      vars.ui.enable()
    }
    
    return vars.ui
    
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Returns UI element's current width
  //----------------------------------------------------------------------------
  vars.ui.width = function(x) {
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
    styles.width = x
    return vars.ui
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Finally, return the main UI function to the user
  //----------------------------------------------------------------------------
  return vars.ui
  
}
