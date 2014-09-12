module.exports = (vars) ->

  graphSize =
    width:  vars.axes.width
    height: vars.axes.height

  tickPosition = (tick, axis) ->
    tick
      .attr "x1", (d) ->
        if axis is "x" then vars.x.scale.viz(d) else 0
      .attr "x2", (d) ->
        if axis is "x" then vars.x.scale.viz(d) else vars.axes.width
      .attr "y1", (d) ->
        if axis is "y" then vars.y.scale.viz(d) else 0
      .attr "y2", (d) ->
        if axis is "y" then vars.y.scale.viz(d) else vars.axes.height

  tickStyle = (tick, axis) ->

    logScale = vars[axis].scale.value is "log"

    tick
       .attr "stroke"         , vars.axes.ticks.color
       .attr "stroke-width"   , vars.axes.ticks.width
       .attr "shape-rendering", vars.shape.rendering.value
       .style "opacity"       , (d) ->
         lighter = logScale and d.toString().charAt(0) isnt "1"
         if lighter then 0.25 else 1

  # Draw Plane Group
  planeTrans = "translate(" + vars.axes.margin.left + "," + vars.axes.margin.top + ")"
  plane = vars.group.selectAll("g#d3plus_graph_plane").data [0]
  plane.transition().duration vars.draw.timing
    .attr "transform", planeTrans
  plane.enter().append "g"
    .attr "id", "d3plus_graph_plane"
    .attr "transform", planeTrans

  # Draw Background Rectangle
  bg = plane.selectAll("rect#d3plus_graph_background").data [0]
  bg.transition().duration vars.draw.timing
    .attr graphSize
  bg.enter().append "rect"
    .attr "id", "d3plus_graph_background"
    .attr "x", 0
    .attr "y", 0
    .attr "fill","#fafafa"
    .attr "stroke-width", 1
    .attr "stroke", "#ccc"
    .attr "shape-rendering", vars.shape.rendering.value
    .attr graphSize

  # Draw Triangular Axes Mirror
  mirror = plane.selectAll("path#d3plus_graph_mirror").data [0]
  mirror.enter().append "path"
    .attr "id", "d3plus_graph_mirror"
    .attr "fill", "#000"
    .attr "fill-opacity", 0.03
    .attr "stroke-width", 1
    .attr "stroke", "#ccc"
    .attr "stroke-dasharray", "10,10"
    .attr "opacity", 0
  mirror.transition().duration vars.draw.timing
    .attr "opacity", () -> if vars.axes.mirror.value then 1 else 0
    .attr "d", () ->
      w = graphSize.width
      h = graphSize.height
      "M "+w+" "+h+" L 0 "+h+" L "+w+" 0 Z"

  # Draw X Axis Tick Marks
  xStyle = (axis) ->
    axis
      .attr "transform", "translate(0," + vars.axes.height + ")"
      .call vars.x.axis.scale(vars.x.scale.viz)
      .selectAll("g.tick").select("text")
        .attr vars.axes.ticks.attrs
        .style "text-anchor", vars.x.ticks.anchor
        .attr "dy", vars.x.ticks.dy
        .attr "transform", vars.x.ticks.transform
  xAxis = plane.selectAll("g#d3plus_graph_xticks").data [0]
  xAxis.transition().duration(vars.draw.timing).call xStyle
  xAxis.selectAll("line").transition().duration vars.draw.timing
    .call tickStyle, "x"
  xEnter = xAxis.enter().append "g"
    .attr "id", "d3plus_graph_xticks"
    .call xStyle
  xEnter.selectAll("path").attr "fill", "none"
  xEnter.selectAll("line").call tickStyle, "x"

  # Draw Y Axis Tick Marks
  yStyle = (axis) ->
    axis
      .call vars.y.axis.scale(vars.y.scale.viz)
      .selectAll("g.tick").select("text")
        .attr vars.axes.ticks.attrs
  yAxis = plane.selectAll("g#d3plus_graph_yticks").data [0]
  yAxis.transition().duration(vars.draw.timing).call yStyle
  yAxis.selectAll("line").transition().duration vars.draw.timing
    .call tickStyle, "y"
  yEnter = yAxis.enter().append "g"
    .attr "id", "d3plus_graph_yticks"
    .call yStyle
  yEnter.selectAll("path").attr "fill", "none"
  yEnter.selectAll("line").call tickStyle, "y"

  # Style for both axes text labels
  labelStyle = (label, axis) ->
    label
      .attr "x", if axis is "x" then vars.width.viz/2 else -(vars.axes.height/2+vars.axes.margin.top)
      .attr "y", if axis is "x" then vars.height.viz-10 else 15
      .attr "transform", if axis is "y" then "rotate(-90)" else null
      .attr "font-family", vars.labels.font.family.value
      .attr "font-weight", vars.labels.font.weight
      .attr "font-size", vars.labels.font.size
      .attr "fill", vars.labels.font.color
      .style "text-anchor", vars.labels.font.align

  for axis in ["x","y"]

    # Draw Axis Grid Lines
    grid = plane.selectAll("g#d3plus_graph_"+axis+"grid").data [0]
    grid.enter().append "g"
      .attr "id", "d3plus_graph_"+axis+"grid"
    lines = grid.selectAll("line").data vars[axis].ticks.values
    lines.enter().append "line"
      .style "opacity", 0
      .call tickPosition, axis
      .call tickStyle, axis
    lines.transition().duration vars.draw.timing
      .call tickPosition, axis
      .call tickStyle, axis
    lines.exit().transition().duration vars.draw.timing
      .style "opacity", 0
      .remove()

    # Draw Axis Text Label
    visible = if vars.small then [] else [0]
    label = vars.group.selectAll("text#d3plus_graph_"+axis+"label").data visible
    label.text vars.format.value(vars[axis].value)
      .transition().duration vars.draw.timing
        .call labelStyle, axis
    label.enter().append("text")
      .attr "id", "d3plus_graph_"+axis+"label"
      .text vars.format.value(vars[axis].value)
      .call labelStyle, axis
    label.exit().remove()

    # Draw Axis Lines
    if vars[axis].lines instanceof Array

      max      = if axis is "x" then "height" else "width"
      opp      = if axis is "x" then "y" else "x"
      domain   = vars[axis].scale.viz.domain()
      textData = []
      lineData = []
      for line in vars[axis].lines
        d = if typeof line is "object" then line[d3.keys(line)[0]] else line
        unless isNaN(d)
          d = parseFloat(d)
          if d > domain[1] and d < domain[0]
            lineData.push d
            textData.push line if typeof line is "object"

      lines = plane.selectAll "line.d3plus_graph_"+axis+"line"
        .data lineData

      lines.enter().append "line"
        .attr "class", "d3plus_graph_"+axis+"line"
        .attr opp+"1", 0
        .attr opp+"2", vars.axes[max]
        .attr "stroke", "#ccc"
        .attr "stroke-width", 2
        .attr "stroke-dasharray", "10,10"
        .attr "opacity", 0

      lines.transition().duration vars.draw.timing
        .attr axis+"1", (d) -> vars[axis].scale.viz(d)
        .attr axis+"2", (d) -> vars[axis].scale.viz(d)
        .attr "opacity", 1

      lines.exit().transition().duration vars.draw.timing
        .attr "opacity", 0
        .remove()

      textPos = if axis is "x" then (vars.axes.height-8)+"px" else "10px"
      textPad = if axis is "x" then 10 else 20

      linetexts = plane.selectAll "text.d3plus_graph_"+axis+"linetext"
        .data textData

      linetexts.enter().append "text"
        .attr "class", "d3plus_graph_"+axis+"linetext"
        .attr "font-size", vars.axes.ticks.font.size
        .attr "fill", vars.axes.ticks.font.color
        .attr "text-align", "start"
        .attr opp, textPos
        .attr "opacity", 0
        .attr axis, (d) -> (vars[axis].scale.viz(d[d3.keys(d)[0]])+textPad)+"px"

      linetexts
        .text (d) -> d3.keys(d)[0]
        .transition().duration vars.draw.timing
        .attr "opacity", 1
        .attr axis, (d) -> (vars[axis].scale.viz(d[d3.keys(d)[0]])+textPad)+"px"

      linetexts.exit().transition().duration vars.draw.timing
        .attr "opacity", 0
        .remove()

  return
