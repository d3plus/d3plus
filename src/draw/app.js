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
  // Call the app's draw function, returning formatted data

  if (!vars.internal_error) {

    if (vars.dev.value) d3plus.console.group("Calculating \"" + vars.type.value + "\"")
    var returned = d3plus.apps[vars.type.value].draw(vars)
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

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Check for Errors
  //-------------------------------------------------------------------
  if (!vars.internal_error) {
    if (!vars.data.app || !vars.returned.nodes.length) {
      vars.internal_error = "No Data Available"
    }
    else {
      vars.internal_error = null
    }
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Hide the previous app, if applicable
  //-------------------------------------------------------------------
  var prev = vars.type.previous
  if (prev && vars.type.value != prev && vars.g.apps[prev]) {
    if (vars.dev.value) d3plus.console.group("Hiding \"" + prev + "\"")
    if (vars.timing) {
      vars.g.apps[prev].transition().duration(vars.timing)
        .attr("opacity",0)
    }
    else {
      vars.g.apps[prev].attr("opacity",0)
    }
    if (vars.dev.value) d3plus.console.groupEnd();
  }

  // Make the group visible if there is data
  var opacity = vars.data.app.length == 0 || vars.internal_error ? 0 : 1
  if (vars.timing) {
    vars.group.transition().duration(vars.timing)
      .attr("opacity",opacity)
  }
  else {
    vars.group.attr("opacity",opacity)
  }

}
