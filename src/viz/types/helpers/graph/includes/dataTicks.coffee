color   = require "../../../../../core/fetch/color.js"
legible = require "../../../../../color/legible.coffee"

module.exports = (vars) ->

  data = if vars.axes.stacked then [] else vars.data.viz

  style = (line, axis) ->
    line
      .attr "x1", (d) ->
        if axis is "y" then 0 else d.d3plus.x - vars.axes.margin.left
      .attr "x2", (d) ->
        if axis is "y" then -5 else d.d3plus.x - vars.axes.margin.left
      .attr "y1", (d) ->
        if axis is "x" then vars.axes.height else d.d3plus.y - vars.axes.margin.top
      .attr "y2", (d) ->
        if axis is "x" then vars.axes.height + 5 else d.d3plus.y - vars.axes.margin.top
      .style "stroke", (d) -> legible color vars, d
      .style "stroke-width", vars.data.stroke.width
      .attr "shape-rendering", vars.shape.rendering.value

  ticks = vars.group.select("g#d3plus_graph_plane").selectAll "g.d3plus_data_tick"
    .data data, (d) ->
      mod = if vars.axes.continuous then "_"+d.d3plus[vars.axes.continuous] else ""
      "tick_" + d[vars.id.value] + "_" + d.d3plus.depth + mod

  ticks.enter().append "g"
    .attr "class", "d3plus_data_tick"
    .attr "opacity", 0

  for axis in ["x","y"]

    axisData = if axis isnt vars.axes.continuous then data else []

    tick = ticks.selectAll "line.d3plus_data_"+axis
      .data axisData, (d) ->
        mod = if vars.axes.continuous then "_"+d.d3plus[vars.axes.continuous] else ""
        "tick_" + d[vars.id.value] + "_" + d.d3plus.depth + mod

    tick.enter().append("line")
      .attr "class","d3plus_data_"+axis
      .call style, axis

    tick.transition().duration vars.draw.timing
      .call style, axis

  ticks.transition().duration vars.draw.timing
    .attr("opacity",1)

  ticks.exit().transition().duration vars.draw.timing
    .attr("opacity",0).remove()

  return
