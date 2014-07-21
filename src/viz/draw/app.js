//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Miscellaneous Error Checks
//------------------------------------------------------------------------------
d3plus.draw.app = function(vars) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Draw the specified app
  //-------------------------------------------------------------------
  // Set vars.group to the app's specific group element
  vars.group = vars.g.apps[vars.type.value]
  // Reset mouse events for the app to use
  vars.mouse = {}

  if (!vars.internal_error) {

    var app = vars.format.locale.value.visualization[vars.type.value]
    if ( vars.dev.value ) d3plus.console.time("running "+ app)
    var returned = vars.types[vars.type.value](vars)
    if ( vars.dev.value ) d3plus.console.timeEnd("running "+ app)

  }
  else {
    var returned = null
  }

  vars.returned = {
      "nodes": null,
      "edges": null
    }

  if (returned instanceof Array) {
    vars.returned.nodes = returned
  }
  else if (returned) {
    if (returned.nodes) {
      vars.returned.nodes = returned.nodes
    }
    if (returned.edges) {
      vars.returned.edges = returned.edges
    }
  }

  vars.returned.nodes = vars.returned.nodes.filter(function(n){
    return n.d3plus && "x" in n.d3plus && "y" in n.d3plus
  })

  var nodes = vars.returned.nodes
  if (!nodes || !(nodes instanceof Array) || !nodes.length) {
    vars.returned.nodes = []
  }

}
