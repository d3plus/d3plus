//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Restricts data based on Solo/Mute filters
//------------------------------------------------------------------------------
d3plus.data.filter = function( vars , data ) {

  if ( vars.dev.value ) d3plus.console.time("filtering data")

  vars.data.filters.forEach( function( key ) {

    data = data.filter( function( d ) {

      var val = d3plus.variable.value(vars,d,vars[key].value)
      if ( key === "size" ) {
        return typeof val === "number" && val > 0
      }
      else {
        return val !== null
      }

    })

  })

  // if "solo", only check against "solo" (disregard "mute")
  var key = vars.data.solo.length ? "solo" : "mute"

  vars.data[key].forEach( function( v ) {

    function test_value( val ) {

      var arr = vars[v][key].value

      if ( v === "id" && key === "solo" && vars.focus.value
      && arr.indexOf(vars.focus.value) < 0) {
        arr.push( vars.focus.value )
      }

      var match = false
      arr.forEach(function(f){
        if (typeof f === "function") {
          match = f(val)
        }
        else if ( f === val ) {
          match = true
        }

      })

      return match
    }

    function nest_check( d ) {

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

      return key === "solo" ? match : !match

    }

    data = data.filter(nest_check)

    if ( v === "id" ) {

      if (vars.nodes.value) {
        if ( vars.dev.value ) d3plus.console.log("Filtering Nodes")
        vars.nodes.restricted = vars.nodes.value.filter(nest_check)
      }

      if (vars.edges.value) {
        if ( vars.dev.value ) d3plus.console.log("Filtering Connections")
        vars.edges.restricted = vars.edges.value.filter(function(d){
          var first_match = nest_check(d[vars.edges.source]),
              second_match = nest_check(d[vars.edges.target])
          return first_match && second_match
        })
      }

    }

  })

  if ( vars.dev.value ) d3plus.console.timeEnd("filtering data")

  return data

}
