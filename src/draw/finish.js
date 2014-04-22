//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Finalize Visualization
//------------------------------------------------------------------------------
d3plus.draw.finish = function(vars) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Zoom to fit bounds, if applicable
  //----------------------------------------------------------------------------
  if (d3plus.visualization[vars.type.value].zoom && vars.zoom.value) {

    if (vars.dev.value) d3plus.console.time("calculating zoom")

    if (vars.draw.first && vars.zoom.bounds) {
      d3plus.zoom.bounds(vars,vars.zoom.bounds,0)
    }

    if (vars.focus.changed || vars.height.changed || vars.width.changed) {
      if (!vars.zoom.viewport) {
        d3plus.zoom.bounds(vars,vars.zoom.bounds)
      }
      else {
        d3plus.zoom.bounds(vars,vars.zoom.viewport)
      }
    }

    if (vars.dev.value) d3plus.console.timeEnd("calculating zoom")

  }
  else {
    vars.zoom.scale = 1
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
  if (vars.draw.update) {
    d3plus.shape.edges(vars)
    if (vars.timing.transitions || (!d3plus.visualization[vars.type.value].zoom && !vars.timing.transitions)) {
      if (vars.dev.value) d3plus.console.time("data labels")
      d3plus.shape.labels(vars,vars.g.data.selectAll("g"))
      if (vars.dev.value) d3plus.console.timeEnd("data labels")
      if (vars.edges.label) {

        setTimeout(function(){
          if (vars.dev.value) d3plus.console.time("edge labels")
          d3plus.shape.labels(vars,vars.g.edges.selectAll("g"))
          if (vars.dev.value) d3plus.console.timeEnd("edge labels")
        },vars.timing.transitions)

      }
    }
  }
  else if (d3plus.visualization[vars.type.value].zoom && vars.zoom.value && vars.timing.transitions) {
    setTimeout(function(){
      d3plus.zoom.labels(vars)
    },vars.timing.transitions)
  }

  if (d3plus.visualization[vars.type.value].zoom && vars.zoom.value && vars.focus.value && !vars.timing.transitions) {
    if (vars.dev.value) d3plus.console.time("focus labels")
    d3plus.shape.labels(vars,vars.g.data_focus.selectAll("g"))
    if (vars.edges.label) {

      setTimeout(function(){
        d3plus.shape.labels(vars,vars.g.edge_focus.selectAll("g"))
      },vars.timing.transitions)

    }
    if (vars.dev.value) d3plus.console.timeEnd("focus labels")
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Check for Errors
  //----------------------------------------------------------------------------
  if (!vars.internal_error) {
    var data_req = d3plus.visualization[vars.type.value].requirements.indexOf("data") >= 0
    if ((!vars.data.app || !vars.returned.nodes.length) && data_req) {
      vars.internal_error = "No Data Available"
    }
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Hide the previous app, if applicable
  //----------------------------------------------------------------------------
  var prev = vars.type.previous
  if (prev && vars.type.value != prev && vars.g.apps[prev]) {
    if (vars.dev.value) d3plus.console.group("Hiding \"" + prev + "\"")
    if (vars.timing.transitions) {
      vars.g.apps[prev].transition().duration(vars.timing.transitions)
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
  var data_req = d3plus.visualization[vars.type.value].requirements.indexOf("data") >= 0,
      new_opacity = (data_req && vars.data.app.length == 0) || vars.internal_error
        ? 0 : vars.focus.value && d3plus.visualization[vars.type.value].zoom && vars.zoom.value ? 0.4 : 1,
      old_opacity = vars.group.attr("opacity")

  if (new_opacity != old_opacity) {

    var timing = vars.timing.transitions

    vars.group.transition().duration(timing)
      .attr("opacity",new_opacity)
    vars.g.data.transition().duration(timing)
      .attr("opacity",new_opacity)
    vars.g.edges.transition().duration(timing)
      .attr("opacity",new_opacity)

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Reset all "changed" values to false
  //----------------------------------------------------------------------------
  function reset_change(obj) {

    if (obj.changed) obj.changed = false

    for (o in obj) {
      if (obj[o] != null && typeof obj[o] == "object" && !(obj[o] instanceof Array)) {
        reset_change(obj[o])
      }
    }

  }
  reset_change(vars)

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Display and reset internal_error, if applicable
  //----------------------------------------------------------------------------
  if (vars.internal_error) {
    d3plus.ui.message(vars,vars.internal_error)
    vars.internal_error = null
  }
  else {
    d3plus.ui.message(vars)
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Unfreeze controls and apply zoom behavior, if applicable
  //----------------------------------------------------------------------------
  setTimeout(function(){

    vars.draw.frozen = false
    vars.draw.update = true
    vars.draw.first = false

    if (d3plus.visualization[vars.type.value].zoom && vars.zoom.value) {
      vars.g.zoom
        .datum(vars)
        .call(vars.zoom.behavior.on("zoom",d3plus.zoom.mouse))
      if (!vars.zoom.scroll.value) {
        vars.g.zoom.on("wheel.zoom",null)
      }
      if (!vars.zoom.click.value) {
        vars.g.zoom.on("dblclick.zoom",null)
      }
      if (!vars.zoom.pan.value) {
        vars.g.zoom.on("mousemove.zoom",null)
        vars.g.zoom.on("mousedown.zoom",null)
      }
    }
    else {
      vars.g.zoom
        .call(vars.zoom.behavior.on("zoom",null))
    }

  },vars.timing.transitions)

}
