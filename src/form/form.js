var arraySort = require("../array/sort.coffee"),
    attach      = require("../core/methods/attach.coffee"),
    dataFormat  = require("../core/data/format.js"),
    dataKeys    = require("../core/data/keys.js"),
    dataLoad    = require("../core/data/load.coffee"),
    fetchData   = require("../core/fetch/data.js"),
    ie          = require("../client/ie.js"),
    methodReset = require("../core/methods/reset.coffee"),
    print       = require("../core/console/print.coffee")
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
    }
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

    vars.draw.timing = vars.draw.first || large || ie
                     ? 0 : vars.timing.ui

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Create/update the UI element
    //--------------------------------------------------------------------------
    if ( vars.data.value instanceof Array ) {

      if ( vars.dev.value ) print.groupCollapsed("drawing \""+vars.type.value+"\"")

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

        arraySort( vars.data.app , vars.order.value || vars.text.value
                         , vars.order.sort.value , vars.color.value , vars )

      }

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Set first element in data as focus if there is no focus set.
      //------------------------------------------------------------------------
      if ( !vars.focus.value ) {

        var element = vars.data.element.value

        if ( element && element.node().tagName.toLowerCase() === "select" ) {
          var i = element.property("selectedIndex")
          i = i < 0 ? 0 : i
          var option = element.selectAll("option")[0][i]
            , val = option.getAttribute("data-"+vars.id.value) || option.getAttribute(vars.id.value)
          if (val) vars.focus.value = val
        }

        if ( !vars.focus.value && vars.data.app.length ) {
          vars.focus.value = vars.data.app[0][vars.id.value]
        }

        if ( vars.dev.value && vars.focus.value ) print.log("\"value\" set to \""+vars.focus+"\"")

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
            if ( vars.dev.value ) print.log("Search enabled.")
          }
          else {
            vars.search.enabled = false
            if ( vars.dev.value ) print.log("Search disabled.")
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
              var level = d ? getLevel(d) : false
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

              if (d[level] === vars.focus.value) {
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
              if (d[level] === vars.focus.value) {
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
        if ( vars.dev.value ) print.time("drawing "+ app)
        vars.types[vars.type.value]( vars )
        if ( vars.dev.value ) print.timeEnd("drawing "+ app)

      }
      else if ( vars.data.url && (!vars.data.loaded || vars.data.stream) ) {

        dataLoad( vars , "data" , vars.self.draw )

      }

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Initialization complete
      //------------------------------------------------------------------------
      methodReset( vars )
      vars.methodGroup = false

      if ( vars.dev.value ) print.groupEnd()

    }

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Define methods and expose public variables.
  //----------------------------------------------------------------------------
  attach(vars, {
    "active":    require("./methods/active.coffee"),
    "aggs":      require("./methods/aggs.coffee"),
    "alt":       require("./methods/alt.coffee"),
    "color":     require("./methods/color.coffee"),
    "container": require("./methods/container.coffee"),
    "data":      require("./methods/data.js"),
    "depth":     require("./methods/depth.coffee"),
    "dev":       require("./methods/dev.coffee"),
    "draw":      require("./methods/draw.js"),
    "focus":     require("./methods/focus.coffee"),
    "font":      require("./methods/font.coffee"),
    "format":    require("./methods/format.coffee"),
    "height":    require("./methods/height.coffee"),
    "history":   require("./methods/history.coffee"),
    "hover":     require("./methods/hover.coffee"),
    "icon":      require("./methods/icon.coffee"),
    "id":        require("./methods/id.coffee"),
    "keywords":  require("./methods/keywords.coffee"),
    "margin":    require("./methods/margin.coffee"),
    "open":      require("./methods/open.coffee"),
    "order":     require("./methods/order.coffee"),
    "remove":    require("./methods/remove.coffee"),
    "search":    require("./methods/search.coffee"),
    "select":    require("./methods/select.coffee"),
    "selectAll": require("./methods/selectAll.coffee"),
    "text":      require("./methods/text.coffee"),
    "timing":    require("./methods/timing.coffee"),
    "title":     require("./methods/title.coffee"),
    "type":      require("./methods/type.coffee"),
    "ui":        require("./methods/ui.coffee"),
    "width":     require("./methods/width.coffee")
  })

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Finally, return the main UI function to the user
  //----------------------------------------------------------------------------
  return vars.self

}
