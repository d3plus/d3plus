var dataFormat = require("../core/data/format.js"),
    dataKeys = require("../core/data/keys.js"),
    dataLoad = require("../core/data/load.coffee"),
    fetchData  = require("../core/fetch/data.js"),
    methodReset = require("../core/method/reset.js")
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Form Element shell
//------------------------------------------------------------------------------
d3plus.form = function() {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Initialize the global variable object.
  //----------------------------------------------------------------------------
  var vars = {
    "types": {
      "auto": require("./types/auto.js"),
      "button": require("./types/button/button.js"),
      "drop": require("./types/drop/drop.js"),
      "toggle": require("./types/toggle.js")
    },
    "shell": "form"
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Create the main drawing function.
  //----------------------------------------------------------------------------
  vars.self = function( selection ) {

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Set timing to 0 if it's the first time running this function or if the
    // data length is longer than the "large" limit
    //--------------------------------------------------------------------------
    var large = vars.data.value instanceof Array
                && vars.data.value.length > vars.data.large

    vars.draw.timing = vars.draw.first || large || d3plus.ie
                     ? 0 : vars.timing.ui

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Create/update the UI element
    //--------------------------------------------------------------------------
    if ( vars.data.value instanceof Array ) {

      if ( vars.dev.value ) d3plus.console.groupCollapsed("drawing \""+vars.type.value+"\"")

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Analyze new data, if changed.
      //------------------------------------------------------------------------
      if ( vars.data.changed ) {
        vars.data.cache = {}
        dataKeys( vars , "data" )
        dataFormat( vars )
      }

      vars.data.app = fetchData( vars )

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Sort the data, if needed.
      //------------------------------------------------------------------------
      if ( vars.data.changed || vars.order.changed || vars.order.sort.changed ) {

        d3plus.array.sort( vars.data.app , vars.order.value || vars.text.value
                         , vars.order.sort.value , vars.color.value , vars )

      }

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Set first element in data as focus if there is no focus set.
      //------------------------------------------------------------------------
      if ( !vars.focus.value.length ) {

        var element = vars.data.element.value

        if ( element && element.node().tagName.toLowerCase() === "select" ) {
          var i = element.property("selectedIndex")
          i = i < 0 ? 0 : i
          var option = element.selectAll("option")[0][i]
            , val = option.getAttribute("data-"+vars.id.value) || option.getAttribute(vars.id.value)
          if (val) vars.focus.value[0] = val
        }

        if ( !vars.focus.value.length && vars.data.app.length ) {
          vars.focus.value[0] = vars.data.app[0][vars.id.value]
        }

        if ( vars.dev.value && vars.focus.value.length ) d3plus.console.log("\"value\" set to \""+vars.focus+"\"")

      }

      function getLevel(d,depth) {

        var depth = typeof depth !== "number" ? vars.id.nesting.length === 1
                  ? 0 : vars.id.nesting.length-1 : depth
          , level = vars.id.nesting[depth]

        if ( depth > 0 && (!(level in d) || d[level] instanceof Array) ) {
          return getLevel(d,depth-1)
        }
        else {
          return level
        }

      }

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Run these things if the data has changed.
      //------------------------------------------------------------------------
      if ( vars.data.changed ) {

        //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        // Determine if search box is needed.
        //----------------------------------------------------------------------
        if ( vars.search.value === "auto" ) {

          if (vars.data.app.length > 10) {
            vars.search.enabled = true
            if ( vars.dev.value ) d3plus.console.log("Search enabled.")
          }
          else {
            vars.search.enabled = false
            if ( vars.dev.value ) d3plus.console.log("Search disabled.")
          }

        }
        else {

          vars.search.enabled = vars.search.value

        }

        //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        // Update OPTION elements with the new data.
        //----------------------------------------------------------------------
        var elementTag = vars.data.element.value
                       ? vars.data.element.value.node().tagName.toLowerCase() : ""
        if ( vars.data.element.value && elementTag === "select" ) {

          var optionData = []
          for (var level in vars.data.nested.all) {
            optionData = optionData.concat(vars.data.nested.all[level])
          }

          options = vars.data.element.value.selectAll("option")
            .data(optionData,function(d){
              var level = getLevel(d)
              return d && level in d ? d[level] : false
            })

          options.exit().remove()

          options.enter().append("option")

          options
            .each(function(d){

              var level   = getLevel(d)
                , textKey = level === vars.id.value ? vars.text.value || vars.id.value
                          : vars.text.nesting !== true && level in vars.text.nesting
                          ? vars.text.nesting[level] : level

              for ( var k in d ) {

                if ( typeof d[k] !== "object" ) {

                  if ( k === textKey ) {
                    d3.select(this).html(d[k])
                  }

                  if ( ["alt","value"].indexOf(k) >= 0 ) {
                    d3.select(this).attr(k,d[k])
                  }
                  else {
                    d3.select(this).attr("data-"+k,d[k])
                  }

                }

              }

              if (d[level] === vars.focus.value[0]) {
                this.selected = true
              }
              else {
                this.selected = false
              }

            })

        }

      }
      else if (vars.focus.changed && vars.data.element.value) {
        var elementTag = vars.data.element.value.node().tagName.toLowerCase()
        if (elementTag === "select") {
          vars.data.element.value.selectAll("option")
            .each(function(d){
              var level = getLevel(d)
              if (d[level] === vars.focus.value[0]) {
                this.selected = true
              }
              else {
                this.selected = false
              }
            })
        }
      }

      if ( vars.type.value !== "auto" ) {

        if ( !vars.container.ui ) {

          //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
          // Select container DIV for UI element
          //----------------------------------------------------------------------
          vars.container.ui = vars.container.value
            .selectAll("div#d3plus_"+vars.type.value+"_"+vars.container.id)
            .data(["container"])

          //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
          // Create container DIV for UI element
          //----------------------------------------------------------------------
          var before = vars.data.element.value ? vars.data.element.value[0][0] : null

          if ( before ) {

            if ( before.id ) {
              before = "#"+before.id
            }
            else {

              var id = before.getAttribute(vars.id.value)
                     ? vars.id.value : "data-"+vars.id.value

              if ( before.getAttribute(id) ) {
                before = "["+id+"="+before.getAttribute(id)+"]"
              }
              else {
                before = null
              }

            }

          }

          vars.container.ui.enter()
            .insert("div",before)
            .attr("id","d3plus_"+vars.type.value+"_"+vars.container.id)
            .style("position","relative")
            .style("overflow","visible")
            .style("vertical-align","top")

        }

        //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        // Update Container
        //------------------------------------------------------------------------
        vars.container.ui
          .style("display",vars.ui.display.value)

        vars.container.ui.transition().duration(vars.draw.timing)
          .style("margin",vars.ui.margin+"px")

        //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        // Create title, if available.
        //------------------------------------------------------------------------
        var title = vars.container.ui.selectAll("div.d3plus_title")
          .data(vars.title.value ? [vars.title.value] : [])

        title.enter().insert("div","#d3plus_"+vars.type.value+"_"+vars.container.id)
          .attr("class","d3plus_title")
          .style("display","inline-block")

        title
          .style("color",vars.font.color)
          .style("font-family",vars.font.family.value)
          .style("font-size",vars.font.size+"px")
          .style("font-weight",vars.font.weight)
          .style("padding",vars.ui.padding+"px")
          .style("border-color","transparent")
          .style("border-style","solid")
          .style("border-width",vars.ui.border+"px")
          .text(String)
          .each(function(d){
            vars.margin.left = this.offsetWidth
          })

      }

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Call specific UI element type, if there is data.
      //------------------------------------------------------------------------
      if ( vars.data.value.length ) {

        var app = vars.format.locale.value.visualization[vars.type.value]
        if ( vars.dev.value ) d3plus.console.time("drawing "+ app)
        vars.types[vars.type.value]( vars )
        if ( vars.dev.value ) d3plus.console.timeEnd("drawing "+ app)

      }
      else if ( vars.data.url && (!vars.data.loaded || vars.data.stream) ) {

        dataLoad( vars , "data" , vars.self.draw )

      }

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Initialization complete
      //------------------------------------------------------------------------
      methodReset( vars )
      vars.methodGroup = false

      if ( vars.dev.value ) d3plus.console.groupEnd()

    }

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Define methods and expose public variables.
  //----------------------------------------------------------------------------
  var methods = [ "active" , "aggs" , "alt" , "color" , "container" , "depth"
                , "dev" , "data" , "draw" , "focus" , "format" , "height"
                , "history" , "hover" , "icon" , "id" , "keywords" , "margin"
                , "open" , "order" , "remove" , "search" , "select"
                , "selectAll" , "text" , "title" , "type" , "width" ]
    , styles  = [ "data" , "font" , "icon" , "timing" , "title" , "ui" ]

  d3plus.method( vars , methods , styles )

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Finally, return the main UI function to the user
  //----------------------------------------------------------------------------
  return vars.self

}
