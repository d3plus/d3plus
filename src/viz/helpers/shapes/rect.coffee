shapeStyle = require("./style.coffee")

module.exports = (vars, selection, enter, exit) ->

  # Calculate label position and pass data from parent.
  data = (d) ->
    if vars.labels.value and not d.d3plus.label
      d.d3plus_label =
        w: 0
        h: 0
        x: 0
        y: 0

      w = (if d.d3plus.r then d.d3plus.r * 2 else d.d3plus.width)
      h = (if d.d3plus.r then d.d3plus.r * 2 else d.d3plus.height)
      d.d3plus_share =
        w: w
        h: d3.max([25, h / 3])
        x: 0
        y: 0

      d.d3plus_label.w = w
      d.d3plus_label.h = h
      d.d3plus_label.shape = (if d.d3plus.shape is "circle" then "circle" else "square")
    else d.d3plus_label = d.d3plus.label  if d.d3plus.label
    [d]

  #^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  # The position and size of each rectangle on enter and exit.
  #----------------------------------------------------------------------------
  init = (nodes) ->
    nodes.attr("x", 0).attr("y", 0).attr("width", 0).attr "height", 0
    return

  #^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  # The position and size of each rectangle on update.
  #----------------------------------------------------------------------------
  update = (nodes) ->
    nodes.attr("x", (d) ->
      w = (if d.d3plus.r then d.d3plus.r * 2 else d.d3plus.width)
      -w / 2
    ).attr("y", (d) ->
      h = (if d.d3plus.r then d.d3plus.r * 2 else d.d3plus.height)
      -h / 2
    ).attr("width", (d) ->
      w = (if d.d3plus.r then d.d3plus.r * 2 else d.d3plus.width)
      w
    ).attr("height", (d) ->
      h = (if d.d3plus.r then d.d3plus.r * 2 else d.d3plus.height)
      h
    ).attr("rx", (d) ->
      rounded = d.d3plus.shape is "circle"
      w = (if d.d3plus.r then d.d3plus.r * 2 else d.d3plus.width)
      (if rounded then (w + 2) / 2 else 0)
    ).attr("ry", (d) ->
      rounded = d.d3plus.shape is "circle"
      h = (if d.d3plus.r then d.d3plus.r * 2 else d.d3plus.height)
      (if rounded then (h + 2) / 2 else 0)
    ).attr("transform", (d) ->
      return "rotate(" + d.d3plus.rotate + ")"  if "rotate" of d.d3plus
      ""
    ).attr "shape-rendering", (d) ->
      if d.d3plus.shape is "square" and ("rotate" not of d.d3plus)
        vars.shape.rendering.value
      else
        "auto"

    return

  # "rects" Enter
  if vars.draw.timing
    enter.append("rect").attr("class", "d3plus_data").call(init).call shapeStyle, vars
  else
    enter.append("rect").attr "class", "d3plus_data"

  # "rects" Update
  if vars.draw.timing
    selection.selectAll("rect.d3plus_data").data(data).transition().duration(vars.draw.timing).call(update).call shapeStyle, vars
  else
    selection.selectAll("rect.d3plus_data").data(data).call(update).call shapeStyle, vars

  # "rects" Exit
  exit.selectAll("rect.d3plus_data").transition().duration(vars.draw.timing).call init if vars.draw.timing
  return
