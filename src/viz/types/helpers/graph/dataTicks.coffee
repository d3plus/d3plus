color   = require "../../../../core/fetch/color.coffee"
legible = require "../../../../color/legible.coffee"
print   = require "../../../../core/console/print.coffee"

module.exports = (vars) ->

  axes = vars.axes
  margin = vars.axes.margin.viz
  data = if axes.stacked or not axes.ticks.value then [] else vars.data.viz
  timing = if data.length * 2 > vars.data.large then 0 else vars.draw.timing

  style = (line, axis) ->
    if axis.indexOf("y") is 0
      line
        .attr "x1", -2
        .attr "x2", -8
        .attr "y1", (d) -> d.d3plus.y - margin.top
        .attr "y2", (d) -> d.d3plus.y - margin.top
    else
      line
        .attr "x1", (d) -> d.d3plus.x - margin.left
        .attr "x2", (d) -> d.d3plus.x - margin.left
        .attr "y1", axes.height + 2
        .attr "y2", axes.height + 8
    line
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

  for axis in ["x", "y"]

    print.time "creating " + axis + " ticks" if vars.dev.value and timing

    axisData = if timing and axis isnt axes.discrete then data else []

    tick = ticks.selectAll "line.d3plus_data_"+axis
      .data axisData, (d) ->
        "tick_" + d[vars.id.value] + "_" + d.d3plus.depth

    print.timeEnd "creating " + axis + " ticks" if vars.dev.value and timing

    print.time "styling " + axis + " ticks" if vars.dev.value and timing

    if timing > 0
      tick.transition().duration timing
        .call style, axis
    else
      tick.call style, axis

    tick.enter().append("line")
      .attr "class","d3plus_data_"+axis
      .call style, axis

    print.timeEnd "styling " + axis + " ticks" if vars.dev.value and timing

  if timing > 0

    ticks.transition().duration timing
      .attr("opacity",1)

    ticks.exit().transition().duration timing
      .attr("opacity",0).remove()

  else
    ticks.attr("opacity",1)
    ticks.exit().remove()

  return
