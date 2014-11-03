color   = require "../../../../core/fetch/color.coffee"
legible = require "../../../../color/legible.coffee"
print   = require "../../../../core/console/print.coffee"

module.exports = (vars) ->

  axes = vars.axes
  data = if axes.stacked then [] else vars.data.viz

  style = (line, axis) ->
    line
      .attr "x1", (d) ->
        if axis is "y" then -2 else d.d3plus.x - axes.margin.left
      .attr "x2", (d) ->
        if axis is "y" then -8 else d.d3plus.x - axes.margin.left
      .attr "y1", (d) ->
        if axis is "x" then axes.height + 2 else d.d3plus.y - axes.margin.top
      .attr "y2", (d) ->
        if axis is "x" then axes.height + 8 else d.d3plus.y - axes.margin.top
      .style "stroke", (d) -> legible color vars, d
      .style "stroke-width", vars.data.stroke.width
      .attr "shape-rendering", vars.shape.rendering.value

  print.time "creating axis tick groups" if vars.dev.value

  ticks = vars.group.select("g#d3plus_graph_plane")
    .selectAll "g.d3plus_data_tick"
    .data data, (d) ->
      mod = if axes.discrete then "_"+d.d3plus[axes.discrete] else ""
      "tick_" + d[vars.id.value] + "_" + d.d3plus.depth + mod

  ticks.enter().append "g"
    .attr "class", "d3plus_data_tick"
    .attr "opacity", 0

  print.timeEnd "creating axis tick groups" if vars.dev.value

  for axis in ["x","y"]

    print.time "creating " + axis + " ticks" if vars.dev.value

    axisData = if axis isnt axes.discrete then data else []

    tick = ticks.selectAll "line.d3plus_data_"+axis
      .data axisData, (d) ->
        "tick_" + d[vars.id.value] + "_" + d.d3plus.depth

    print.timeEnd "creating " + axis + " ticks" if vars.dev.value

    print.time "styling " + axis + " ticks" if vars.dev.value

    if vars.draw.timing > 0
      tick.transition().duration vars.draw.timing
        .call style, axis
    else
      tick.call style, axis

    tick.enter().append("line")
      .attr "class","d3plus_data_"+axis
      .call style, axis

    print.timeEnd "styling " + axis + " ticks" if vars.dev.value

  if vars.draw.timing > 0

    ticks.transition().duration vars.draw.timing
      .attr("opacity",1)

    ticks.exit().transition().duration vars.draw.timing
      .attr("opacity",0).remove()

  else
    ticks.attr("opacity",1)
    ticks.exit().remove()

  return
