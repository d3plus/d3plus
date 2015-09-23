buckets    = require "../../../../../util/buckets.coffee"
buffer     = require "./buffer.coffee"
fetchValue = require "../../../../../core/fetch/value.coffee"
fontSizes  = require "../../../../../font/sizes.coffee"
textwrap   = require "../../../../../textwrap/textwrap.coffee"
timeDetect = require "../../../../../core/data/time.coffee"
uniques    = require "../../../../../util/uniques.coffee"

module.exports = (vars, opts) ->

  # Reset margins
  vars.axes.margin = resetMargins vars
  vars.axes.height = vars.height.viz
  vars.axes.width  = vars.width.viz
  axes = if vars.width.viz > vars.height.viz then ["y", "x"] else ["x", "y"]

  # Set ticks, if not previously set
  for axis in axes

    if vars[axis].ticks.values is false
      if vars[axis].value is vars.time.value
        ticks = vars.time.solo.value
        if ticks.length
          ticks = ticks.map (d) ->
            if d.constructor isnt Date
              d = d + ""
              d += "/01/01" if d.length is 4 and parseInt(d)+"" is d
              d = new Date d
              # d.setTime( d.getTime() + d.getTimezoneOffset() * 60 * 1000 )
            d
        else
          ticks = vars.data.time.values

        extent = d3.extent ticks
        step = vars.data.time.stepType
        ticks = [extent[0]]
        tick = extent[0]
        while tick < extent[1]
          newtick = new Date tick
          tick = new Date newtick["set"+step](newtick["get"+step]()+1)
          ticks.push tick

        vars[axis].ticks.values = ticks

      else
        vars[axis].ticks.values = vars[axis].scale.viz.ticks()

    unless vars[axis].ticks.values.length
      values = fetchValue vars, vars.data.viz, vars[axis].value
      values = [values] unless values instanceof Array
      vars[axis].ticks.values = values

    opp = if axis is "x" then "y" else "x"
    if vars[axis].ticks.values.length is 1 or
       (opts.buffer and opts.buffer isnt opp and
       axis is vars.axes.discrete and vars[axis].reset is true)
      buffer vars, axis, opts.buffer
    vars[axis].reset = false

    if vars[axis].value is vars.time.value

      axisStyle =
        "font-family": vars[axis].ticks.font.family.value
        "font-weight": vars[axis].ticks.font.weight
        "font-size":   vars[axis].ticks.font.size+"px"

      timeReturn = timeDetect vars,
        values: vars[axis].ticks.values
        limit:  vars.width.viz
        style:  axisStyle

      if vars[axis].ticks.value
        vars[axis].ticks.visible = vars[axis].ticks.value.map Number
      else
        vars[axis].ticks.visible = timeReturn.values.map Number
      vars[axis].ticks.format  = timeReturn.format

    else if vars[axis].ticks.value
      vars[axis].ticks.values = vars[axis].ticks.value
      vars[axis].ticks.visible = vars[axis].ticks.value

    else if vars[axis].scale.value is "log"
      ticks = vars[axis].ticks.values
      tens = ticks.filter (t) -> Math.abs(t).toString().charAt(0) is "1"
      if tens.length < 3
        vars[axis].ticks.visible = ticks
      else
        vars[axis].ticks.visible = tens
    else
      vars[axis].ticks.visible = vars[axis].ticks.values



  # Calculate padding for tick labels
  labelPadding vars unless vars.small

  # Create SVG Axes
  for axis in ["x","y"]
    vars[axis].axis.svg = createAxis(vars, axis)

  return

resetMargins = (vars) ->
  if vars.small
    # return
    top:    0
    right:  0
    bottom: 0
    left:   0
  else
    # return
    top:    10
    right:  10
    bottom: 10
    left:   10

labelPadding = (vars) ->

  xDomain = vars.x.scale.viz.domain()
  yDomain = vars.y.scale.viz.domain()

  # Calculate Y axis padding
  yAttrs =
    "font-size":   vars.y.ticks.font.size+"px"
    "font-family": vars.y.ticks.font.family.value
    "font-weight": vars.y.ticks.font.weight
  yValues = vars.y.ticks.visible
  if vars.y.scale.value is "log"
    yText = yValues.map (d) -> formatPower d
  else if vars.y.scale.value is "share"
    yText = yValues.map (d) -> vars.format.value d * 100,
      key: "share"
      vars: vars
  else if vars.y.value is vars.time.value
    yText = yValues.map (d, i) ->
      vars.y.ticks.format new Date(d)
  else
    if typeof yValues[0] is "string"
      yValues = vars.y.scale.viz.domain().filter (d) ->
        d.indexOf("d3plus_buffer_") isnt 0
    yText = yValues.map (d) ->
      vars.format.value d,
        key:    vars.y.value
        vars:   vars
        labels: vars.y.affixes.value

  yAxisWidth             = d3.max fontSizes(yText,yAttrs), (d) -> d.width
  yAxisWidth             = Math.ceil yAxisWidth + vars.labels.padding
  vars.axes.margin.left += yAxisWidth

  yLabel = vars.y.label.fetch vars
  if yLabel
    yLabelAttrs =
      "font-family": vars.y.label.font.family.value
      "font-weight": vars.y.label.font.weight
      "font-size":   vars.y.label.font.size+"px"
    vars.y.label.height = fontSizes([yLabel], yLabelAttrs)[0].height
  else
    vars.y.label.height = 0
  if vars.y.label.value
    vars.axes.margin.left += vars.y.label.height
    vars.axes.margin.left += vars.y.label.padding * 2

  vars.axes.width -= (vars.axes.margin.left + vars.axes.margin.right)
  vars.x.scale.viz.range buckets([0,vars.axes.width], xDomain.length)

  # Calculate X axis padding
  xAttrs =
    "font-size":   vars.x.ticks.font.size+"px"
    "font-family": vars.x.ticks.font.family.value
    "font-weight": vars.x.ticks.font.weight
  xValues = vars.x.ticks.visible
  if vars.x.scale.value is "log"
    xText = xValues.map (d) -> formatPower d
  else if vars.x.scale.value is "share"
    xText = xValues.map (d) -> vars.format.value d * 100,
      key: "share"
      vars: vars
  else if vars.x.value is vars.time.value
    xText = xValues.map (d, i) ->
      vars.x.ticks.format new Date(d)
  else
    if typeof xValues[0] is "string"
      xValues = vars.x.scale.viz.domain().filter (d) ->
        d.indexOf("d3plus_buffer_") isnt 0
    xText = xValues.map (d) ->
      vars.format.value d,
        key:    vars.x.value
        vars:   vars
        labels: vars.x.affixes.value

  xSizes      = fontSizes(xText,xAttrs)
  xAxisWidth  = d3.max xSizes, (d) -> d.width
  xAxisHeight = d3.max xSizes, (d) -> d.height

  if xValues.length is 1
    xMaxWidth = vars.axes.width
  else
    xMaxWidth  = vars.x.scale.viz(xValues[1]) - vars.x.scale.viz(xValues[0])
    xMaxWidth  = Math.abs xMaxWidth

  if xAxisWidth > xMaxWidth and xText.join("").indexOf(" ") > 0
    vars.x.ticks.wrap = true
    xSizes = fontSizes xText, xAttrs,
      mod: (elem) ->
        textwrap().container d3.select(elem)
          .height(vars.axes.height/2)
          .width(xMaxWidth).draw()
    xAxisWidth  = d3.max xSizes, (d) -> d.width
    xAxisHeight = d3.max xSizes, (d) -> d.height
  else
    vars.x.ticks.wrap = false

  vars.x.ticks.hidden   = false
  vars.x.ticks.baseline = "auto"

  if xAxisWidth <= xMaxWidth
    vars.x.ticks.rotate = 0
  else if xAxisWidth < vars.axes.height/2
    xSizes = fontSizes xText, xAttrs,
      mod: (elem) ->
        textwrap().container d3.select(elem)
          .width(vars.axes.height/2)
          .height(xMaxWidth).draw()
    xAxisHeight         = d3.max xSizes, (d) -> d.width
    xAxisWidth          = d3.max xSizes, (d) -> d.height
    vars.x.ticks.rotate = -90
  else
    xAxisWidth  = 0
    xAxisHeight = 0

  unless xAxisWidth and xAxisHeight
    vars.x.ticks.hidden = true
    vars.x.ticks.rotate = 0

  xAxisWidth  = Math.ceil xAxisWidth
  xAxisHeight = Math.ceil xAxisHeight
  xAxisWidth++
  xAxisHeight++
  vars.x.ticks.maxHeight = xAxisHeight
  vars.x.ticks.maxWidth = xAxisWidth
  vars.axes.margin.bottom += xAxisHeight + vars.labels.padding
  lastTick = vars.x.ticks.visible[vars.x.ticks.visible.length - 1]
  rightLabel = vars.x.scale.viz lastTick
  rightLabel += xAxisWidth/2 + vars.axes.margin.left
  if rightLabel > vars.width.value
    rightMod = rightLabel - vars.width.value + vars.axes.margin.right
    vars.axes.width -= rightMod
    vars.axes.margin.right += rightMod

  xLabel = vars.x.label.fetch vars
  if xLabel
    xLabelAttrs =
      "font-family": vars.x.label.font.family.value
      "font-weight": vars.x.label.font.weight
      "font-size":   vars.x.label.font.size+"px"
    vars.x.label.height = fontSizes([xLabel], xLabelAttrs)[0].height
  else
    vars.x.label.height = 0
  if vars.x.label.value
    vars.axes.margin.bottom += vars.x.label.height
    vars.axes.margin.bottom += vars.x.label.padding * 2

  vars.axes.height -= (vars.axes.margin.top + vars.axes.margin.bottom)

  vars.x.scale.viz.range buckets([0,vars.axes.width], xDomain.length)
  vars.y.scale.viz.range buckets([0,vars.axes.height], yDomain.length)

createAxis = (vars, axis) ->

  d3.svg.axis()
    .tickSize vars[axis].ticks.size
    .tickPadding 5
    .orient if axis is "x" then "bottom" else "left"
    .scale vars[axis].scale.viz
    .tickValues vars[axis].ticks.values
    .tickFormat (d, i) ->

      return null if vars[axis].ticks.hidden
      scale = vars[axis].scale.value
      c = if d.constructor is Date then +d else d

      if vars[axis].ticks.visible.indexOf(c) >= 0
        if scale is "share"
          vars.format.value d * 100,
            key: "share", vars: vars, labels: vars[axis].affixes.value
        else if d.constructor is Date
          vars[axis].ticks.format d
        else if scale is "log"
          formatPower d
        else
          vars.format.value d,
            key: vars[axis].value, vars: vars, labels: vars[axis].affixes.value
      else
        null

superscript = "⁰¹²³⁴⁵⁶⁷⁸⁹"
formatPower = (d) ->
  p = Math.round(Math.log(Math.abs(d)) / Math.LN10)
  t = Math.abs(d).toString().charAt(0)
  n = 10 + " " + (p + "").split("").map((c) -> superscript[c]).join("")
  if t isnt "1"
    n = t + " x " + n
  if d < 0 then "-"+n else n
