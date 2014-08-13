var fetchValue = require("../fetch/value.js")
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Restricts data based on Solo/Mute filters
//------------------------------------------------------------------------------
module.exports = function( vars , data ) {

  if ( vars.dev.value ) d3plus.console.time("filtering data")

  var availableKeys = d3.keys(vars.data.keys || {})

  if ( "attrs" in vars ) {
    availableKeys = availableKeys.concat(d3.keys(vars.attrs.keys || {}))
  }

  data = data.filter(function(d){
    return vars.id.value in d
  })

  vars.data.filters.forEach( function( key ) {

    if ( availableKeys.indexOf(vars[key].value) >= 0 ) {

      data = data.filter( function( d ) {

        var val = fetchValue(vars,d,vars[key].value)
        if ( key === "size" ) {
          return typeof val === "number"
        }
        else {
          return val !== null
        }

      })

    }

  })

  // if "solo", only check against "solo" (disregard "mute")
  var key = vars.data.solo.length ? "solo" : "mute"

  vars.data[key].forEach( function( v ) {

    function test_value( val ) {

      var arr = vars[v][key].value

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
        var nesting = vars[v].nesting
        if (d3plus.object.validate(nesting)) {
          nesting = d3.keys(nesting)
        }
        nesting.forEach(function(n){
          if (!match) {
            match = test_value(fetchValue(vars,d,n))
          }
        })
      }
      else {
        match = test_value(fetchValue(vars,d,vars[v].value))
      }

      return key === "solo" ? match : !match

    }

    data = data.filter(nest_check)

    if ( v === "id" ) {

      if ("nodes" in vars && vars.nodes.value) {
        if ( vars.dev.value ) d3plus.console.log("Filtering Nodes")
        vars.nodes.restricted = vars.nodes.value.filter(nest_check)
      }

      if ("edges" in vars && vars.edges.value) {
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
