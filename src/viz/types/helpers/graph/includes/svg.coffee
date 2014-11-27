mix = require "../../../../../color/mix.coffee"

module.exports = (vars) ->

  domains = vars.x.domain.viz.concat vars.y.domain.viz
  return null if domains.indexOf(undefined) >= 0

  bgStyle =
    width:  vars.axes.width
    height: vars.axes.height
    fill:   vars.axes.background.color
    stroke:            vars.axes.background.stroke.color
    "stroke-width":    vars.axes.background.stroke.width
    "shape-rendering": vars.axes.background.rendering.value

  alignMap =
    left:   "start"
    center: "middle"
    right:  "end"

  axisData = if vars.small then [] else [0]

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

  tickStyle = (tick, axis, grid) ->

    logScale = vars[axis].scale.value is "log"

    tick
      .attr "stroke"         , (d) ->
        log = logScale and d.toString().charAt(0) isnt "1"
        if d is 0
          vars[axis].axis.color
        else if !grid
          vars[axis].ticks.color
        else if log
          mix(vars[axis].grid.color, vars.axes.background.color, 0.5, 1)
        else
          vars[axis].grid.color
      .attr "stroke-width"   , vars[axis].ticks.width
      .attr "shape-rendering", vars[axis].ticks.rendering.value

  tickFont = (tick, axis) ->
    tick
      .attr "font-size"  , (d) ->
        type = if d is 0 then "axis" else "ticks"
        vars[axis][type].font.size+"px"
      .attr "fill"       , (d) ->
        type = if d is 0 then "axis" else "ticks"
        vars[axis][type].font.color
      .attr "font-family", (d) ->
        type = if d is 0 then "axis" else "ticks"
        vars[axis][type].font.family.value
      .attr "font-weight", (d) ->
        type = if d is 0 then "axis" else "ticks"
        vars[axis][type].font.weight

  lineStyle = (line, axis) ->

    max = if axis is "x" then "height" else "width"
    opp = if axis is "x" then "y" else "x"

    line
      .attr opp+"1", 0
      .attr opp+"2", vars.axes[max]
      .attr axis+"1", (d) -> d.coords.line
      .attr axis+"2", (d) -> d.coords.line
      .attr "stroke"          , (d) -> d.color or vars[axis].lines.color
      .attr "stroke-width"    , vars[axis].lines.width
      .attr "shape-rendering" , vars[axis].lines.rendering.value
      .attr "stroke-dasharray", vars[axis].lines.dasharray.value

  lineFont = (text, axis) ->

    opp = if axis is "x" then "y" else "x"

    text
      .attr opp          , (d) -> d.coords.text[opp] + "px"
      .attr axis         , (d) -> d.coords.text[axis]+"px"
      .attr "dy"         , vars[axis].lines.font.position.value
      .attr "text-anchor", alignMap[vars[axis].lines.font.align.value]
      .attr "transform"  , (d) -> d.transform
      .attr "font-size"  , vars[axis].lines.font.size+"px"
      .attr "fill"       , (d) -> d.color or vars[axis].lines.color
      .attr "font-family", vars[axis].lines.font.family.value
      .attr "font-weight", vars[axis].lines.font.weight

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
    .attr bgStyle
  bg.enter().append "rect"
    .attr "id", "d3plus_graph_background"
    .attr "x", 0
    .attr "y", 0
    .attr bgStyle

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
      w = bgStyle.width
      h = bgStyle.height
      "M "+w+" "+h+" L 0 "+h+" L "+w+" 0 Z"

  # Draw X Axis Tick Marks
  xStyle = (axis) ->

    axis
      .attr "transform", "translate(0," + vars.axes.height + ")"
      .call vars.x.axis.svg.scale(vars.x.scale.viz)
      .selectAll("g.tick").select("text")
        .style "text-anchor", vars.x.ticks.anchor
        .attr "transform", vars.x.ticks.transform
        .call tickFont, "x"
  xAxis = plane.selectAll("g#d3plus_graph_xticks").data axisData
  xAxis.transition().duration(vars.draw.timing).call xStyle
  xAxis.selectAll("line").transition().duration vars.draw.timing
    .call tickStyle, "x"
  xEnter = xAxis.enter().append "g"
    .attr "id", "d3plus_graph_xticks"
    .call xStyle
  xEnter.selectAll("path").attr "fill", "none"
  xEnter.selectAll("line").call tickStyle, "x"
  xAxis.exit().transition().duration vars.data.timing
    .attr "opacity", 0
    .remove()

  # Draw Y Axis Tick Marks
  yStyle = (axis) ->
    axis
      .call vars.y.axis.svg.scale(vars.y.scale.viz)
      .selectAll("g.tick").select("text")
        .call tickFont, "y"
  yAxis = plane.selectAll("g#d3plus_graph_yticks").data axisData
  yAxis.transition().duration(vars.draw.timing).call yStyle
  yAxis.selectAll("line").transition().duration vars.draw.timing
    .call tickStyle, "y"
  yEnter = yAxis.enter().append "g"
    .attr "id", "d3plus_graph_yticks"
    .call yStyle
  yEnter.selectAll("path").attr "fill", "none"
  yEnter.selectAll("line").call tickStyle, "y"
  yAxis.exit().transition().duration vars.data.timing
    .attr "opacity", 0
    .remove()

  # Style for both axes text labels
  labelStyle = (label, axis) ->
    label
      .attr "x",
        if axis is "x"
          vars.width.viz/2
        else
          -(vars.axes.height/2+vars.axes.margin.top)
      .attr "y", if axis is "x" then vars.height.viz-10 else 15
      .attr "transform", if axis is "y" then "rotate(-90)" else null
      .attr "font-family", vars[axis].label.family.value
      .attr "font-weight", vars[axis].label.weight
      .attr "font-size", vars[axis].label.size+"px"
      .attr "fill", vars[axis].label.color
      .style "text-anchor", "middle"

  for axis in ["x","y"]

    gridData = if vars[axis].grid.value then vars[axis].ticks.values else []

    # Draw Axis Grid Lines
    grid = plane.selectAll("g#d3plus_graph_"+axis+"grid").data [0]
    grid.enter().append "g"
      .attr "id", "d3plus_graph_"+axis+"grid"
    lines = grid.selectAll("line")
      .data gridData, (d) -> d
    lines.transition().duration vars.draw.timing
      .call tickPosition, axis
      .call tickStyle, axis, true
    lines.enter().append "line"
      .style "opacity", 0
      .call tickPosition, axis
      .call tickStyle, axis, true
      .transition().duration vars.draw.timing
        .delay vars.draw.timing/2
        .style "opacity", 1
    lines.exit().transition().duration vars.draw.timing/2
      .style "opacity", 0
      .remove()

    # Draw Axis Text Label
    label = vars.group.selectAll("text#d3plus_graph_"+axis+"label")
      .data axisData
    label.text vars.format.value(vars[axis].value, undefined, vars)
      .transition().duration vars.draw.timing
        .call labelStyle, axis
    label.enter().append("text")
      .attr "id", "d3plus_graph_"+axis+"label"
      .text vars.format.value(vars[axis].value, undefined, vars)
      .call labelStyle, axis
    label.exit().transition().duration vars.data.timing
      .attr "opacity", 0
      .remove()

  for axis in ["x","y"]

    lineGroup = plane.selectAll("g#d3plus_graph_"+axis+"_userlines").data [0]

    lineGroup.enter().append "g"
      .attr "id", "d3plus_graph_"+axis+"_userlines"

    # Draw Axis Lines
    if vars[axis].lines.value.length

      domain   = vars[axis].scale.viz.domain()
      domain   = domain.slice().reverse() if axis is "y"
      textData = []
      lineData = []

      for line in vars[axis].lines.value
        d = if typeof line is "object" then line.position else line
        unless isNaN(d)
          d = parseFloat(d)
          if d > domain[0] and d < domain[1]
            d = unless typeof line is "object" then {"position": d} else line
            d.coords =
              line: vars[axis].scale.viz(d.position)
            lineData.push d
            if d.text

              d.axis    = axis
              d.padding = vars[axis].lines.font.padding.value * 0.5
              d.align   = vars[axis].lines.font.align.value

              position = vars[axis].lines.font.position.text
              textPad  = if position is "middle" then 0 else d.padding * 2
              textPad  = -textPad if position is "top"

              if axis is "x"
                textPos  = if d.align is "left" then vars.axes.height else if d.align is "center" then vars.axes.height/2 else 0
                textPos -= d.padding * 2 if d.align is "left"
                textPos += d.padding * 2 if d.align is "right"
              else
                textPos  = if d.align is "left" then 0 else if d.align is "center" then vars.axes.width/2 else vars.axes.width
                textPos -= d.padding * 2 if d.align is "right"
                textPos += d.padding * 2 if d.align is "left"

              d.coords.text = {}
              d.coords.text[if axis is "x" then "y" else "x"] = textPos
              d.coords.text[axis] = vars[axis].scale.viz(d.position)+textPad

              d.transform = if axis is "x" then "rotate(-90,"+d.coords.text.x+","+d.coords.text.y+")" else null

              textData.push d

      lines = lineGroup.selectAll "line.d3plus_graph_"+axis+"line"
        .data lineData, (d) -> d.position

      lines.enter().append "line"
        .attr "class", "d3plus_graph_"+axis+"line"
        .attr "opacity", 0
        .call lineStyle, axis

      lines.transition().duration vars.draw.timing
        .attr "opacity", 1
        .call lineStyle, axis

      lines.exit().transition().duration vars.draw.timing
        .attr "opacity", 0
        .remove()

      linetexts = lineGroup.selectAll "text.d3plus_graph_"+axis+"line_text"
        .data textData, (d) -> d.position

      linetexts.enter().append "text"
        .attr "class", "d3plus_graph_"+axis+"line_text"
        .attr "id", (d) -> "d3plus_graph_"+axis+"line_text_"+d.position
        .attr "opacity", 0
        .call lineFont, axis

      linetexts
        .text (d) -> d.text
        .transition().duration vars.draw.timing
        .attr "opacity", 1
        .call lineFont, axis

      linetexts.exit().transition().duration vars.draw.timing
        .attr "opacity", 0
        .remove()

      rectStyle = (rect) ->

        getText  = (d) -> plane.select("text#d3plus_graph_"+d.axis+"line_text_"+d.position).node().getBBox()

        rect
          .attr "x", (d) -> getText(d).x - d.padding
          .attr "y", (d) -> getText(d).y - d.padding
          .attr "transform"  , (d) -> d.transform
          .attr "width", (d) -> getText(d).width + (d.padding * 2)
          .attr "height", (d) -> getText(d).height + (d.padding * 2)
          .attr "fill", vars.axes.background.color

      rectData = if vars[axis].lines.font.background.value then textData else []

      lineRects = lineGroup.selectAll "rect.d3plus_graph_"+axis+"line_rect"
        .data rectData, (d) -> d.position

      lineRects.enter().insert("rect", "text.d3plus_graph_"+axis+"line_text")
        .attr "class", "d3plus_graph_"+axis+"line_rect"
        .attr "pointer-events", "none"
        .attr("opacity", 0).call rectStyle

      lineRects.transition().delay vars.draw.timing
        .each "end", (d) ->
          d3.select(this).transition().duration vars.draw.timing
            .attr("opacity", 1).call rectStyle

      lineRects.exit().transition().duration vars.draw.timing
        .attr("opacity", 0).remove()

  return
