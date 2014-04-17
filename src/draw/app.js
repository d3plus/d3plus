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

    if (vars.dev.value) d3plus.console.group("Calculating \"" + vars.type.value + "\"")
    var returned = d3plus.visualization[vars.type.value].draw(vars)
    if (vars.dev.value) d3plus.console.groupEnd();

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

  var nodes = vars.returned.nodes
  if (!nodes || !(nodes instanceof Array) || !nodes.length) {
    if (vars.dev.value) d3plus.console.log("No data returned by app.")
    vars.returned.nodes = []
  }

}
