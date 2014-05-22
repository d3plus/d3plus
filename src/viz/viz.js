d3plus.viz = function() {

  var vars = {
    "g"     : {"apps": {} },
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

      if (vars.error.value) {
        vars.messages.style = "large"
        var message = vars.error.value === true
                    ? vars.format.value(vars.format.locale.value.ui.error)
                    : vars.error.value
        if (vars.dev.value) d3plus.console.warning(message)
        d3plus.ui.message(vars,message)
      }
      else {

        var steps = d3plus.draw.steps(vars)

        vars.container.value.style("cursor","wait")
        vars.messages.style = vars.data.app ? "small" : "large"
        function check_next() {

          if (steps.length) {
            run_steps()
          }
          else {
            if (vars.dev.value) d3plus.console.groupEnd()
            vars.container.value.style("cursor","auto")
          }

        }

        function run_steps() {

          var step = steps.shift(),
              same = vars.g.message && vars.g.message.text() == step.message,
              run = "check" in step ? step.check(vars) : true

          if (run) {

            if ( !same && vars.draw.update ) {

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
