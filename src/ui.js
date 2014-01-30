//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// UI Element shell
//------------------------------------------------------------------------------
d3plus.ui = function(passed) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Create global ui variable object
  //----------------------------------------------------------------------------
  var vars = {
    "data": [],
    "enabled": false,
    "highlight": false,
    "hover": false,
    "id": "default",
    "init": false,
    "max-height": 600,
    "max-width": 600,
    "parent": d3.select("body"),
    "timing": 400
  }
  
  var styles = {
    "border": "all",
    "color": "red",
    "display": "inline-block",
    "font-color": false,
    "font-family": "sans-serif",
    "font-size": 10,
    "font-weight": "lighter",
    "letter-spacing": 0,
    "margin": 0,
    "padding": 5,
    "stroke": 1,
    "width": false
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Set default arrow based on whether or not font-awesome is present
  //----------------------------------------------------------------------------
  styles.arrow = d3plus.fontawesome ? "fa-angle-down" : "^"

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Overwrite vars if vars have been passed
  //----------------------------------------------------------------------------
  if (passed) {
    styles = d3plus.utils.merge(styles,passed)
  }
  vars.ui = function() {
    
    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Set timing to 0 if it's the first time running this function
    //--------------------------------------------------------------------------
    var timing = vars.init ? vars.timing : 0
    
    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // If it data is a string, extract data from the element associated with it
    //--------------------------------------------------------------------------
    if (vars.data && typeof vars.data == "string" && !d3.select(vars.data).empty()) {
      vars.element = d3.select(vars.data).style("display","none")
      vars.data = []
      vars.parent = d3.select(vars.element.node().parentNode)
      d3plus.forms.data(vars)
    }
    
    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Get ID from element, if available
    //--------------------------------------------------------------------------
    if (vars.element && vars.element.node().id && vars.id == "default") {
      vars.id = vars.element.node().id
    }
    
    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // If there is no data, throw error message
    //--------------------------------------------------------------------------
    if (!vars.data) {
      d3plus.console.warning("Cannot create UI element, no data found.")
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
      // Determine if container should be inserted before form element
      //------------------------------------------------------------------------
      if (vars.element && vars.element.node().id) {
        var before = "#"+vars.id
      }
      else {
        var before = null
      }

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Create container DIV for UI element
      //------------------------------------------------------------------------
      vars.container.enter()
        .insert("div",before)
        .attr("id","d3plus_"+vars.type+"_"+vars.id)
        .style("display","inline-block")
        .style("position","relative")
        .style("overflow","visible")
        
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
        .style("top","0px")
        .style("visibility","hidden")

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
    "id",
    "parent",
    "timing",
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
        
        if (vars.init) {
          vars.parent.call(vars.ui)
        }
        
        return vars.ui
        
      }
      
    })(v)
    
  })
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // List of simple style methods
  //----------------------------------------------------------------------------
  var style_variables = [
    "arrow",
    "border",
    "color",
    "display",
    "font-color",
    "font-family",
    "font-size",
    "font-weight",
    "margin",
    "padding",
    "width"
  ]

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Create simple style methods
  //----------------------------------------------------------------------------
  style_variables.forEach(function(v){
    
    vars.ui[v] = (function(key) {
      
      return function(value) {

        if (!arguments.length) return styles[key]
        
        styles[key] = value
        
        if (vars.init) {
          vars.parent.call(vars.ui)
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
    vars.parent.call(vars.ui)
    return vars.ui
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Enables the UI element
  //----------------------------------------------------------------------------
  vars.ui.enable = function() {
    vars.enabled = true
    vars.parent.call(vars.ui)
    return vars.ui
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Draws the UI element
  //----------------------------------------------------------------------------
  vars.ui.draw = function() {
    vars.parent.call(vars.ui)
    return vars.ui
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Returns UI element's current height
  //----------------------------------------------------------------------------
  vars.ui.height = function() {
    return vars.container[0][0].offsetHeight
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
    
    if (typeof value == "string") {
      value = vars.data.filter(function(d){
        return d.value == value
      })[0]
    }

    if (vars.tag == "select") {

      var index = false
      vars.data.forEach(function(d,i){
        if (d.value == value.value) {
          index = i
        }
      })
    
      if (typeof index == "number") {
        vars.element.node().selectedIndex = index
      }
      
    }
    
    vars.focus = value
    vars.enabled = false
    vars.parent.call(vars.ui)
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
    if (!arguments.length) return vars.container[0][0].offsetWidth
    vars.width = x
    return vars.ui
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Finally, return the main UI function to the user
  //----------------------------------------------------------------------------
  return vars.ui
  
}
