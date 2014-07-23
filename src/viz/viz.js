d3plus.viz = function() {

  var vars = {
    "g"     : {"apps": {} },
    "types" : {
      "bubbles":  require("./types/bubbles.js"),
      "chart":    require("./types/chart.js"),
      "geo_map":  require("./types/geo_map.js"),
      "line":     require("./types/line.js"),
      "network":  require("./types/network.js"),
      "paths":    require("./types/paths.coffee"),
      "rings":    require("./types/rings.js"),
      "scatter":  require("./types/scatter.js"),
      "stacked":  require("./types/stacked.js"),
      "tree_map": require("./types/tree_map.js")
    },
    "shell" : "viz"
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Main drawing function
  //----------------------------------------------------------------------------
  vars.self = function(selection) {
    selection.each(function() {

      vars.draw.frozen = true
      vars.internal_error = null
      d3plus.draw.container(vars)

      if ( !("timing" in vars.draw) ) {
        vars.draw.timing = vars.timing.transitions
      }

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Determine if in "small" mode
      //------------------------------------------------------------------------
      var small_width = vars.width.value <= vars.width.small,
          small_height = vars.height.value <= vars.height.small
      vars.small = small_width || small_height

      var lastMessage = false

      if (vars.error.value) {

        var timing = vars.draw.timing

        vars.group.transition().duration(timing)
          .attr("opacity",0)
        vars.g.data.transition().duration(timing)
          .attr("opacity",0)
        vars.g.edges.transition().duration(timing)
          .attr("opacity",0)

        vars.messages.style = "large"
        var message = vars.error.value === true
                    ? vars.format.value(vars.format.locale.value.ui.error)
                    : vars.error.value

        lastMessage = message
        d3plus.ui.message(vars,message)

      }
      else {

        var steps = d3plus.draw.steps( vars )
          , step  = false

        vars.container.value.style("cursor","wait")
        vars.messages.style = vars.group && vars.group.attr("opacity") === "1"
                            ? "small" : "large"

        var nextStep = function() {

          if ( steps.length ) {
            runStep()
          }
          else {

            vars.methodGroup = false
            if ( vars.dev.value ) {
              d3plus.console.timeEnd("total draw time")
              d3plus.console.groupEnd()
              d3plus.console.log("\n")
            }
            vars.container.value.style("cursor","auto")

          }

        }

        var runFunction = function( name ) {

          var name = name || "function"

          if ( step[name] instanceof Array ) {
            step[name].forEach(function(f){
              f( vars , nextStep )
            })
          }
          else if ( typeof step[name] == "function" ) {
            step[name]( vars , nextStep )
          }

          if ( !step.wait ) {
            nextStep()
          }

        }

        function runStep() {

          step = steps.shift()

          var same = vars.g.message && lastMessage === step.message,
              run = "check" in step ? step.check : true

          if ( typeof run === "function" ) {
            run = run( vars )
          }

          if ( run ) {

            if ( !same && vars.draw.update ) {

              if ( vars.dev.value ) {
                if ( lastMessage !== false ) {
                  d3plus.console.groupEnd()
                }
                d3plus.console.groupCollapsed(step.message)
              }

              lastMessage = typeof vars.messages.value === "string"
                          ? vars.messages.value
                          : step.message

              var message = typeof vars.messages.value === "string"
                          ? vars.messages.value
                          : vars.format.value(step.message)

              d3plus.ui.message(vars,message)

              setTimeout( runFunction , 10 )

            }
            else {

              runFunction()

            }

          }
          else {

            if ( "otherwise" in step ) {

              setTimeout(function(){

                runFunction( "otherwise" )

              },10)

            }
            else {

              nextStep()

            }

          }

        }

        runStep()

      }

    })

    return vars.self
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Define methods and expose public variables.
  //----------------------------------------------------------------------------
  var methods = [ "active" , "aggs" , "attrs" , "axes" , "color" , "container"
                , "coords" , "csv" , "data" , "depth" , "descs" , "dev"
                , "draw" , "edges" , "error" , "focus" , "footer" , "format"
                , "height" , "history" , "icon" , "id" , "labels"
                , "legend" , "margin" , "messages" , "nodes" , "order"
                , "shape" , "size" , "style" , "temp" , "text" , "time"
                , "timeline" , "title" , "tooltip" , "total" , "type" , "ui"
                , "width" , "x" , "y" , "zoom" ]
    , styles  = [ "axes" , "background" , "color" , "coords" , "data" , "edges"
                , "font" , "footer" , "height" , "labels" , "legend" , "links"
                , "messages" , "nodes" , "shape" , "timeline" , "timing"
                , "title" , "tooltip" , "ui" , "width "]
  d3plus.method( vars , methods , styles )

  return vars.self

}
