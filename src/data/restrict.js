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
          match = test_value(d3plus.variable.value(vars,d,vars[v].value))
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
