copy       = require "../../../../../util/copy.coffee"
events     = require "../../../../../general/events.coffee"
fetchColor = require "../../../../../core/fetch/color.js"
fetchValue = require "../../../../../core/fetch/value.js"
legible    = require "../../../../../color/legible.coffee"

module.exports = (node, vars) ->

  clickRemove = d3.event.type is events.click and (vars.tooltip.value.long or vars.tooltip.html.value)
  create      = [events.over, events.move].indexOf(d3.event.type) >= 0
  x           = node.d3plus.x
  y           = node.d3plus.y
  r           = node.d3plus.r or 0
  graph       = vars.axes
  timing      = vars.timing.mouseevents

  if not clickRemove and create
    color    = legible fetchColor vars, node
    lineData = ["x","y"].filter (axis) -> axis isnt vars.axes.stacked
  else
    lineData = []

  lineInit = (line) ->
    line
      .attr "x2", (d) -> if d is "x" then x else x - r
      .attr "y2", (d) -> if d is "y" then y else y + r
      .style "stroke-width", 0
      .attr "opacity", 0

  lineStyle = (line) ->
    line
      .attr "x1", (d) -> if d is "x" then x else x - r
      .attr "y1", (d) -> if d is "y" then y else y + r
      .style "stroke", (d) -> if vars.shape.value is "area" then "white" else color
      .attr "stroke-dasharray", "5,5"

  lines = vars.g.labels.selectAll("line.d3plus_mouse_axis_label").data lineData

  lines.enter().append "line"
    .attr "class","d3plus_mouse_axis_label"
    .attr "shape-rendering", vars.shape.rendering.value
    .attr "pointer-events", "none"
    .call lineInit
    .call lineStyle

  lines.transition().duration timing
    .attr "x2", (d) -> if d is "x" then x else node.d3plus.x0 or graph.margin.left - graph.ticks.size
    .attr "y2", (d) -> if d is "y" then y else node.d3plus.y0 or graph.height + graph.margin.top + graph.ticks.size
    .style "stroke-width", vars.data.stroke.width
    .style "opacity", 1
    .call lineStyle

  lines.exit().transition().duration timing
    .call(lineInit).remove()

  textStyle = (text) ->
    text
      .attr graph.ticks.attrs
      .attr "x", (d) -> if d is "x" then x else graph.margin.left - 5 - graph.ticks.size
      .attr "y", (d) ->
        if d is "y" then y else
          if node.d3plus.y0
            node.d3plus.y + (node.d3plus.y0 - node.d3plus.y)/2 + graph.margin.top - 6
          else graph.height + graph.margin.top + 5 + graph.ticks.size
      .attr "fill", if vars.shape.value is "area" then "white" else color

  texts = vars.g.labels.selectAll("text.d3plus_mouse_axis_label").data lineData

  texts.enter().append "text"
    .attr "class", "d3plus_mouse_axis_label"
    .attr "id", (d) -> d+"_d3plusmouseaxislabel"
    .attr "dy", (d) -> if d is "y" then graph.ticks.font.size * 0.35 else graph.ticks.font.size
    .style "text-anchor", (d) -> if d is "y" then "end" else "middle"
    .attr "opacity", 0
    .attr "pointer-events", "none"
    .call textStyle

  texts
    .text (d) ->
      axis = vars.axes.stacked or d
      val  = fetchValue vars, node, vars[axis].value
      vars.format.value val, vars[axis].value
    .transition().duration(timing).delay timing
      .attr "opacity", 1
      .call textStyle

  texts.exit().transition().duration timing
    .attr("opacity", 0).remove()

  rectStyle = (rect) ->
    getText = (axis) -> d3.select("text#"+axis+"_d3plusmouseaxislabel").node().getBBox()
    rect
      .attr "x", (d) ->
        width = getText(d).width
        if d is "x" then x - width/2 - 5 else graph.margin.left - graph.ticks.size - width - 10
      .attr "y", (d) ->
        mod = getText(d).height/2 + 5
        if d is "y" then y-mod else
          if node.d3plus.y0
            node.d3plus.y + (node.d3plus.y0 - node.d3plus.y)/2 + graph.margin.top - mod
          else graph.height + graph.margin.top + graph.ticks.size
      .attr "width", (d) -> getText(d).width + 10
      .attr "height", (d) -> getText(d).height + 10
      .style "stroke", if vars.shape.value is "area" then "transparent" else color
      .attr "fill", if vars.shape.value is "area" then color else vars.background.value
      .style "stroke-width", vars.data.stroke.width
      .attr "shape-rendering", vars.shape.rendering.value

  rects = vars.g.labels.selectAll("rect.d3plus_mouse_axis_label").data lineData

  rects.enter().insert("rect", "text.d3plus_mouse_axis_label")
    .attr "class", "d3plus_mouse_axis_label"
    .attr "pointer-events", "none"
    .attr("opacity", 0).call rectStyle

  rects.transition().duration(timing).delay timing
    .attr("opacity", 1).call rectStyle

  rects.exit().transition().duration timing
    .attr("opacity", 0).remove()
