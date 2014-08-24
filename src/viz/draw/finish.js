var methodReset = require("../../core/method/reset.js")
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Finalize Visualization
//------------------------------------------------------------------------------
d3plus.draw.finish = function(vars) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Zoom to fit bounds, if applicable
  //----------------------------------------------------------------------------
  var zoom = vars.zoom.viewport || vars.zoom.bounds
  if (vars.types[vars.type.value].zoom && vars.zoom.value && zoom) {

    if ( vars.dev.value ) d3plus.console.time("calculating zoom")

    if (vars.draw.first) {
      d3plus.zoom.bounds(vars,zoom,0)
    }
    else if (vars.type.changed || vars.focus.changed || vars.height.changed || vars.width.changed || vars.nodes.changed) {
      d3plus.zoom.bounds(vars,zoom)
    }

    if ( vars.dev.value ) d3plus.console.timeEnd("calculating zoom")

  }
  else {
    vars.zoom.bounds = [[0,0],[vars.width.viz,vars.height.viz]]
    vars.zoom.scale = 1
    d3plus.zoom.bounds(vars)
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Resize/Reposition Overlay Rect for Mouse events
  //----------------------------------------------------------------------------
  var w = vars.zoom.size ? vars.zoom.size.width : vars.width.viz,
      h = vars.zoom.size ? vars.zoom.size.height : vars.height.viz,
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
    if (vars.draw.timing || (!vars.types[vars.type.value].zoom && !vars.draw.timing)) {
      d3plus.shape.labels( vars , "data" )
      if (vars.edges.label) {

        setTimeout(function(){
          d3plus.shape.labels( vars , "edges" )
        },vars.draw.timing+200)

      }
    }
  }
  else if (vars.types[vars.type.value].zoom && vars.zoom.value && vars.draw.timing) {
    setTimeout(function(){
      d3plus.zoom.labels(vars)
    },vars.draw.timing)
  }

  if (vars.types[vars.type.value].zoom && vars.zoom.value && vars.focus.value.length && !vars.draw.timing) {
    if ( vars.dev.value ) d3plus.console.time("focus labels")
    d3plus.shape.labels( vars , "data_focus" )
    if (vars.edges.label) {

      setTimeout(function(){
        d3plus.shape.labels( vars , "edge_focus" )
      },vars.draw.timing+200)

    }
    if ( vars.dev.value ) d3plus.console.timeEnd("focus labels")
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Check for Errors
  //----------------------------------------------------------------------------
  var reqs = vars.types[vars.type.value].requirements || []
  if (!(reqs instanceof Array)) reqs = [reqs]
  var data_req = reqs.indexOf("data") >= 0
  if (!vars.internal_error) {
    if ((!vars.data.app || !vars.returned.nodes.length) && data_req) {
      vars.internal_error = vars.format.locale.value.error.data
    }
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Hide the previous app, if applicable
  //----------------------------------------------------------------------------
  var prev = vars.type.previous
  if (prev && vars.type.value != prev && vars.g.apps[prev]) {
    if ( vars.dev.value ) d3plus.console.time("hiding \"" + prev + "\"")
    if (vars.draw.timing) {
      vars.g.apps[prev].transition().duration(vars.draw.timing)
        .attr("opacity",0)
    }
    else {
      vars.g.apps[prev].attr("opacity",0)
    }
    if ( vars.dev.value ) d3plus.console.timeEnd()
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Show the current app, data, and edges groups
  //----------------------------------------------------------------------------
  var new_opacity = (data_req && vars.data.app.length == 0) || vars.internal_error
        ? 0 : vars.focus.value.length && vars.types[vars.type.value].zoom && vars.zoom.value ? 0.4 : 1,
      old_opacity = vars.group.attr("opacity")

  if (new_opacity != old_opacity) {

    var timing = vars.draw.timing

    vars.group.transition().duration(timing)
      .attr("opacity",new_opacity)
    vars.g.data.transition().duration(timing)
      .attr("opacity",new_opacity)
    vars.g.edges.transition().duration(timing)
      .attr("opacity",new_opacity)

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Display and reset internal_error, if applicable
  //----------------------------------------------------------------------------
  if (vars.internal_error) {
    vars.internal_error = d3plus.string.title( vars.internal_error )
    d3plus.console.warning(vars.internal_error)
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

    methodReset( vars )

    if (vars.types[vars.type.value].zoom && vars.zoom.value) {
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

  },vars.draw.timing)

}
