shapeStyle = require("./style.coffee")

module.exports = (vars, selection, enter, exit) ->

  # Calculate label position and pass data from parent.
  data = (d) ->

    if vars.labels.value and not d.d3plus.label

      w = (if d.d3plus.r then d.d3plus.r * 2 else d.d3plus.width)
      h = (if d.d3plus.r then d.d3plus.r * 2 else d.d3plus.height)

      d.d3plus_label =
        w: w
        h: h
        x: 0
        y: 0

      d.d3plus_share =
        w: w
        h: h
        x: 0
        y: 0

      d.d3plus_label.shape = (if d.d3plus.shape is "circle" then "circle" else "square")

    else if d.d3plus.label
      d.d3plus_label = d.d3plus.label
    else
      delete d.d3plus_label

    [d]

  #^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  # The position and size of each rectangle on enter and exit.
  #----------------------------------------------------------------------------
  init = (nodes) ->
    nodes
      .attr "x", (d) ->
        if d.d3plus.init and "x" of d.d3plus.init
          d.d3plus.init.x
        else
          if d.d3plus.init and "width" of d.d3plus.init then -d.d3plus.width/2 else 0
      .attr "y", (d) ->
        if d.d3plus.init and "y" of d.d3plus.init
          d.d3plus.init.y
        else
          if d.d3plus.init and "height" of d.d3plus.init then -d.d3plus.height/2 else 0
      .attr "width", (d) ->
        if d.d3plus.init and "width" of d.d3plus.init then d.d3plus.init.width else 0
      .attr "height", (d) ->
        if d.d3plus.init and "height" of d.d3plus.init then d.d3plus.init.height else 0

  #^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  # The position and size of each rectangle on update.
  #----------------------------------------------------------------------------
  update = (nodes) ->
    nodes
      .attr "x", (d) ->
        w = if d.d3plus.r then d.d3plus.r * 2 else d.d3plus.width
        -w / 2
      .attr "y", (d) ->
        h = if d.d3plus.r then d.d3plus.r * 2 else d.d3plus.height
        -h / 2
      .attr "width", (d) ->
        if d.d3plus.r then d.d3plus.r * 2 else d.d3plus.width
      .attr "height", (d) ->
        if d.d3plus.r then d.d3plus.r * 2 else d.d3plus.height
      .attr "rx", (d) ->
        rounded = d.d3plus.shape is "circle"
        w = if d.d3plus.r then d.d3plus.r * 2 else d.d3plus.width
        if rounded then (w + 2) / 2 else 0
      .attr "ry", (d) ->
        rounded = d.d3plus.shape is "circle"
        h = if d.d3plus.r then d.d3plus.r * 2 else d.d3plus.height
        if rounded then (h + 2) / 2 else 0
      .attr "transform", (d) ->
        if "rotate" of d.d3plus then "rotate(" + d.d3plus.rotate + ")" else ""
      .attr "shape-rendering", (d) ->
        if d.d3plus.shape is "square" and ("rotate" not of d.d3plus)
          vars.shape.rendering.value
        else
          "auto"

  if vars.draw.timing
    enter.append("rect")
      .attr("class", "d3plus_data")
      .call(init)
      .call shapeStyle, vars

    selection.selectAll("rect.d3plus_data")
      .data(data).transition().duration vars.draw.timing
      .call(update).call shapeStyle, vars

    exit.selectAll("rect.d3plus_data")
      .transition().duration vars.draw.timing
      .call init
  else
    enter.append("rect")
      .attr "class", "d3plus_data"

    selection.selectAll("rect.d3plus_data")
      .data(data).call(update).call shapeStyle, vars
