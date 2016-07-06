copy       = require "../../../../../util/copy.coffee"
events     = require "../../../../../client/pointer.coffee"
fetchColor = require "../../../../../core/fetch/color.coffee"
fetchValue = require "../../../../../core/fetch/value.coffee"
legible    = require "../../../../../color/legible.coffee"
textColor  = require "../../../../../color/text.coffee"

module.exports = (node, vars) ->

  clickRemove = d3.event.type is events.click and
                (vars.tooltip.value.long or vars.tooltip.html.value)
  create = [events.over, events.move].indexOf(d3.event.type) >= 0
  x      = node.d3plus.x
  y      = node.d3plus.y
  r      = node.d3plus.r or 0
  s      = vars.types[vars.type.value].scale or 1
  r      = r * s
  graph  = vars.axes
  margin = vars.axes.margin.viz
  timing = if vars.draw.timing then vars.timing.mouseevents else 0

  if not clickRemove and create
    color    = legible fetchColor vars, node
    lineData = ["x", "y", "x2", "y2"].filter (axis) ->
      val = fetchValue vars, node, vars[axis].value
      val and !(val instanceof Array) and axis isnt vars.axes.stacked and
      vars[axis].mouse.value
  else
    lineData = []

  lineInit = (line) ->
    line
      .attr "x1", (d) -> if d.indexOf("x") is 0 then x else x - r
      .attr "y1", (d) -> if d.indexOf("y") is 0 then y else y + r
      .attr "x2", (d) -> if d.indexOf("x") is 0 then x else x - r
      .attr "y2", (d) -> if d.indexOf("y") is 0 then y else y + r
      .attr "opacity", 0

  lineStyle = (line) ->
    line
      .style "stroke", (d) ->
        if vars.shape.value is "area" then "white" else color
      .attr "stroke-dasharray", (d) -> vars[d].mouse.dasharray.value
      .attr "shape-rendering", (d) -> vars[d].mouse.rendering.value
      .style "stroke-width", (d) -> vars[d].mouse.width

  lineUpdate = (line) ->
    line
      .attr "x1", (d) -> if d.indexOf("x") is 0 then x else x - r
      .attr "y1", (d) -> if d.indexOf("y") is 0 then y else y + r
      .attr "x2", (d) ->
        if d.indexOf("x") is 0
          x
        else if node.d3plus.x0
          node.d3plus.x0
        else if d is "y"
          margin.left - vars[d].ticks.size
        else
          margin.left + graph.width + vars[d].ticks.size
      .attr "y2", (d) ->
        if d.indexOf("y") is 0
          y
        else if node.d3plus.y0
          node.d3plus.y0
        else if d is "x"
          graph.height + margin.top + vars[d].ticks.size
        else
          margin.top - vars[d].ticks.size
      .style "opacity", 1

  lines = vars.g.labels.selectAll("line.d3plus_mouse_axis_label").data lineData

  if timing

    lines.enter().append "line"
      .attr "class","d3plus_mouse_axis_label"
      .attr "pointer-events", "none"
      .call lineInit
      .call lineStyle

    lines.transition().duration timing
      .call lineUpdate
      .call lineStyle

    lines.exit().transition().duration timing
      .call(lineInit).remove()

  else

    lines
      .call lineUpdate
      .call lineStyle

    lines.enter().append "line"
      .attr "class","d3plus_mouse_axis_label"
      .attr "pointer-events", "none"
      .call lineInit
      .call lineStyle

    lines.exit().remove()

  textStyle = (text) ->
    text
      .attr "font-size",   (d) -> vars[d].ticks.font.size+"px"
      .attr "font-family", (d) -> vars[d].ticks.font.family.value
      .attr "font-weight", (d) -> vars[d].ticks.font.weight
      .attr "x", (d) ->
        if d.indexOf("x") is 0
          x
        else if d is "y"
          margin.left - 5 - vars[d].ticks.size
        else
          margin.left + graph.width + 5 + vars[d].ticks.size
      .attr "y", (d) ->
        if d.indexOf("y") is 0
          y
        else if node.d3plus.y0
          node.d3plus.y + (node.d3plus.y0 - node.d3plus.y)/2 +
          margin.top - 6
        else if d is "x"
          graph.height + margin.top + 5 + vars[d].ticks.size
        else
          margin.top - 5 - vars[d].ticks.size - (vars[d].ticks.font.size * 1.35)
      .attr "fill",
        if vars.shape.value is "area"
          "white"
        else
          textColor color

  texts = vars.g.labels.selectAll("text.d3plus_mouse_axis_label").data lineData

  texts.enter().append "text"
    .attr "class", "d3plus_mouse_axis_label"
    .attr "id", (d) -> d+"_d3plusmouseaxislabel"
    .attr "dy", (d) ->
      if d.indexOf("y") is 0
        vars[d].ticks.font.size * 0.35
      else
        vars[d].ticks.font.size
    .style "text-anchor", (d) ->
      if d is "y"
        "end"
      else if d is "y2"
        "start"
      else
        "middle"
    .attr "opacity", 0
    .attr "pointer-events", "none"
    .call textStyle

  texts
    .text (d) ->
      axis = vars.axes.stacked or d
      val  = fetchValue vars, node, vars[axis].value
      vars.format.value val,
        key: vars[axis].value, vars: vars, labels: vars[axis].affixes.value

  if timing
    texts.transition().duration(timing).delay timing
      .attr "opacity", 1
      .call textStyle

    texts.exit().transition().duration timing
      .attr("opacity", 0).remove()

  else
    texts.attr "opacity", 1
      .call textStyle

    texts.exit().remove()

  rectStyle = (rect) ->
    getText = (axis) ->
      l = d3.select("text#"+axis+"_d3plusmouseaxislabel")
      if l.size()
        l.node().getBBox()
      else
        {"width": 0, "height": 0}
    rect
      .attr "x", (d) ->
        width = getText(d).width
        if d.indexOf("x") is 0
          x - width/2 - 5
        else if d is "y"
          margin.left - vars[d].ticks.size - width - 10
        else
          margin.left + graph.width + vars[d].ticks.size
      .attr "y", (d) ->
        height = getText(d).height
        if d.indexOf("y") is 0
          y-(height/2 + 5)
        else if node.d3plus.y0
          node.d3plus.y + (node.d3plus.y0 - node.d3plus.y)/2 +
          margin.top - (height/2 + 5)
        else if d is "x"
          graph.height + margin.top + vars[d].ticks.size
        else
          margin.top - vars[d].ticks.size - height - 10
      .attr "width", (d) -> getText(d).width + 10
      .attr "height", (d) -> getText(d).height + 10
      .style "stroke",
        if vars.shape.value is "area" then "transparent" else color
      .attr "fill", color
      .attr "shape-rendering", (d) -> vars[d].mouse.rendering.value
      .style "stroke-width", (d) -> vars[d].mouse.width

  rects = vars.g.labels.selectAll("rect.d3plus_mouse_axis_label").data lineData

  if timing

    rects.enter().insert("rect", "text.d3plus_mouse_axis_label")
      .attr "class", "d3plus_mouse_axis_label"
      .attr "pointer-events", "none"
      .attr("opacity", 0).call rectStyle

    rects.transition().duration(timing).delay timing
      .attr("opacity", 1).call rectStyle

    rects.exit().transition().duration timing
      .attr("opacity", 0).remove()
  else

    rects.attr("opacity", 1).call rectStyle

    rects.enter().insert("rect", "text.d3plus_mouse_axis_label")
      .attr "class", "d3plus_mouse_axis_label"
      .attr "pointer-events", "none"
      .call rectStyle

    rects.exit().remove()
