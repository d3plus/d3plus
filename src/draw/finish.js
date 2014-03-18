//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Finalize Visualization
//------------------------------------------------------------------------------
d3plus.draw.finish = function(vars) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Zoom to fit bounds, if applicable
  //----------------------------------------------------------------------------
  if (d3plus.apps[vars.type.value].zoom) {

    if (vars.focus.changed && vars.zoom.viewport) {
      d3plus.zoom.bounds(vars,vars.zoom.viewport)
    }
    else if (!vars.zoom.viewport) {
      d3plus.zoom.bounds(vars,vars.zoom.bounds,0)
    }

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Resize/Reposition Overlay Rect for Mouse events
  //----------------------------------------------------------------------------
  var w = vars.zoom.size ? vars.zoom.size.width : vars.app_width,
      h = vars.zoom.size ? vars.zoom.size.height : vars.app_height,
      x = vars.zoom.bounds ? vars.zoom.bounds[0][0] : 0,
      y = vars.zoom.bounds ? vars.zoom.bounds[0][1] : 0

  vars.g.overlay
    .attr("width",w)
    .attr("height",h)
    .attr("x",x)
    .attr("y",y)

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Create labels
  //----------------------------------------------------------------------------
  if (vars.dev.value) d3plus.console.time("labels")
  d3plus.shape.labels(vars,vars.g.data.selectAll("g"))
  if (vars.dev.value) d3plus.console.timeEnd("labels")

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Check for Errors
  //----------------------------------------------------------------------------
  if (!vars.internal_error) {
    if (!vars.data.app || !vars.returned.nodes.length) {
      vars.internal_error = "No Data Available"
    }
    else {
      vars.internal_error = null
    }
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Hide the previous app, if applicable
  //----------------------------------------------------------------------------
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

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Show the current app, data, and edges groups
  //----------------------------------------------------------------------------
  var new_opacity = vars.data.app.length == 0 || vars.internal_error ? 0 : 1,
      old_opacity = vars.group.attr("opacity")
  if (new_opacity != old_opacity) {

    vars.timing = vars.style.timing.transitions

    vars.group.transition().duration(vars.timing)
      .attr("opacity",new_opacity)
    vars.g.data.transition().duration(vars.timing)
      .attr("opacity",new_opacity)
    vars.g.edges.transition().duration(vars.timing)
      .attr("opacity",new_opacity)

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Reset all "change" values to false
  //------------------------------------------------------------------------
  function reset_change(obj) {
    
    if (obj.changed) obj.changed = false

    for (o in obj) {
      if (obj[o] != null && typeof obj[o] == "object" && !(obj[o] instanceof Array)) {
        reset_change(obj[o])
      }
    }

  }
  reset_change(vars)

  setTimeout(function(){
    vars.frozen = false

    // Call zoom on zoom group if applicable
    if (d3plus.apps[vars.type.value].zoom) {
      vars.g.zoom
        .datum(vars)
        .call(vars.zoom_behavior.on("zoom",d3plus.zoom.mouse))
    }
    else {
      vars.g.zoom
        .call(vars.zoom_behavior.on("zoom",null))
    }

  },vars.style.timing.transitions)

  if (vars.internal_error) {
    d3plus.ui.message(vars,vars.internal_error)
    vars.internal_error = null
  }
  else {
    d3plus.ui.message(vars)
  }

}
