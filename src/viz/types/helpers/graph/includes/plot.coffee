buckets    = require "../../../../../util/buckets.coffee"
buffer     = require "./buffer.coffee"
fetchValue = require "../../../../../core/fetch/value.coffee"
fontSizes  = require "../../../../../font/sizes.coffee"
textwrap   = require "../../../../../textwrap/textwrap.coffee"

module.exports = (vars, opts) ->

  # Reset margins
  vars.axes.margin = resetMargins vars
  vars.axes.height = vars.height.viz
  vars.axes.width  = vars.width.viz

  # Set ticks, if not previously set
  for axis in ["x","y"]

    if vars[axis].ticks.values is false
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
  if vars.y.scale.value is "log"
    yText = vars.y.ticks.values.filter (d) ->
      d.toString().charAt(0) is "1"
    yText = yText.map (d) ->
      10 + " " + formatPower Math.round(Math.log(d) / Math.LN10)
  else
    yText = vars.y.ticks.values.map (d) ->
      vars.format.value(d, vars.y.value, vars)
  yAxisWidth             = d3.max fontSizes(yText,yAttrs), (d) -> d.width
  yAxisWidth             = Math.round yAxisWidth + vars.labels.padding
  vars.axes.margin.left += yAxisWidth

  yLabel = vars.format.value(vars.y.value, undefined, vars)
  yLabelAttrs =
    "font-family": vars.y.label.family.value
    "font-weight": vars.y.label.weight
    "font-size":   vars.y.label.size+"px"
  vars.y.label.height = fontSizes([yLabel], yLabelAttrs)[0].height
  vars.axes.margin.left += vars.y.label.height
  vars.axes.margin.left += vars.y.label.padding * 2

  vars.axes.width -= (vars.axes.margin.left + vars.axes.margin.right)
  vars.x.scale.viz.range buckets([0,vars.axes.width], xDomain.length)

  # Calculate X axis padding
  xAttrs =
    "font-size":   vars.x.ticks.font.size+"px"
    "font-family": vars.x.ticks.font.family.value
    "font-weight": vars.x.ticks.font.weight
  if vars.x.scale.value is "log"
    xValues = vars.x.ticks.values.filter (d) -> d.toString().charAt(0) is "1"
    xText = xValues.map (d) ->
      10 + " " + formatPower Math.round(Math.log(d) / Math.LN10)
  else
    xValues = vars.x.ticks.values
    xText = xValues.map (d) ->
      vars.format.value(d, vars.x.value, vars)

  xSizes      = fontSizes(xText,xAttrs)
  xAxisWidth  = d3.max xSizes, (d) -> d.width
  xAxisHeight = d3.max xSizes, (d) -> d.height
  xMaxWidth   = vars.x.scale.viz(xValues[1]) - vars.x.scale.viz(xValues[0])
  xMaxWidth -= vars.labels.padding * 2

  if xAxisWidth > xMaxWidth and xText.join("").indexOf(" ") > 0
    wrapped = true
    xSizes = fontSizes xText, xAttrs,
      mod: (elem) ->
        textwrap().container d3.select(elem)
          .width(xMaxWidth).draw()
    xAxisWidth  = d3.max xSizes, (d) -> d.width
    xAxisHeight = d3.max xSizes, (d) -> d.height
  else
    wrapped = false

  vars.x.ticks.hidden = false
  if xAxisWidth <= xMaxWidth
    xAxisWidth             += vars.labels.padding
    vars.x.ticks.rotate    = false
    vars.x.ticks.anchor    = "middle"
    vars.x.ticks.baseline  = "auto"
    yOffset                = if wrapped then -vars.labels.padding else 0
    vars.x.ticks.transform = "translate(0,"+yOffset+")"
    vars.x.ticks.wrap      = wrapped
  else if xAxisWidth < vars.axes.height/2
    xAxisWidth             = xAxisHeight
    xAxisHeight            = d3.max xSizes, (d) -> d.width
    vars.x.ticks.rotate    = true
    vars.x.ticks.anchor    = "start"
    vars.x.ticks.baseline  = "central"
    vars.x.ticks.transform = "translate("+xAxisWidth+","+vars.x.ticks.size+")rotate(90)"
    vars.x.ticks.wrap      = false
  else
    vars.x.ticks.hidden = true
    vars.x.ticks.wrap   = false
    xAxisWidth          = 0
    xAxisHeight         = 0

  xAxisHeight = Math.round xAxisHeight
  xAxisWidth  = Math.round xAxisWidth
  vars.axes.margin.bottom += xAxisHeight
  lastTick = vars.x.ticks.values[vars.x.ticks.values.length - 1]
  rightLabel = vars.x.scale.viz lastTick
  rightPadding = vars.axes.width - rightLabel
  if rightPadding < xAxisWidth
    vars.axes.width -= (xAxisWidth/2 - rightPadding)

  xLabel = vars.format.value(vars.x.value, undefined, vars)
  xLabelAttrs =
    "font-family": vars.x.label.family.value
    "font-weight": vars.x.label.weight
    "font-size":   vars.x.label.size+"px"
  vars.x.label.height   = fontSizes([xLabel], xLabelAttrs)[0].height
  vars.x.ticks.maxWidth = xMaxWidth
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
      scale      = vars[axis].scale.value
      hiddenTime = vars[axis].value is vars.time.value and d % 1 isnt 0
      majorLog   = scale is "log" and d.toString().charAt(0) is "1"

      if !hiddenTime and (majorLog or scale isnt "log")
        if scale is "share"
          d * 100 + "%"
        else if d.constructor is Date
          vars.data.time.multiFormat(d)
        else if scale is "log"
          10 + " " + formatPower Math.round(Math.log(d) / Math.LN10)
        else
          vars.format.value d, vars[axis].value, vars
      else
        null

superscript = "⁰¹²³⁴⁵⁶⁷⁸⁹"
formatPower = (d) -> (d + "").split("").map((c) -> superscript[c]).join("")
