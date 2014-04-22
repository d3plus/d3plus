d3plus.viz = function() {

  var vars = { "g": {"apps": {} } }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Main drawing function
  //----------------------------------------------------------------------------
  vars.self = function(selection) {
    selection.each(function() {

      vars.draw.frozen = true
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

            if (!same && vars.draw.update && (!vars.timing.transitions || vars.draw.first)) {

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
  d3plus.method( vars )

  return vars.self

}
