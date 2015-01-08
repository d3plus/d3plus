buckets    = require "../../../../../util/buckets.coffee"
buffer     = require "./buffer.coffee"
fetchValue = require "../../../../../core/fetch/value.coffee"
fontSizes  = require "../../../../../font/sizes.coffee"
textwrap   = require "../../../../../textwrap/textwrap.coffee"
uniques    = require "../../../../../util/uniques.coffee"

module.exports = (vars, opts) ->

  # Reset margins
  vars.axes.margin = resetMargins vars
  vars.axes.height = vars.height.viz
  vars.axes.width  = vars.width.viz

  # Set ticks, if not previously set
  for axis in ["x","y"]

    if vars[axis].ticks.values is false
      if vars[axis].value is vars.time.value

        ticks = vars.time.solo.value
        if ticks.length
          ticks = ticks.map (d) ->
            if d.constructor isnt Date
              d = new Date(t.toString())
              d.setTime( d.getTime() + d.getTimezoneOffset() * 60 * 1000 )
            d
        else
          ticks = vars.data.time.values

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
      ticks = vars[axis].ticks.values
      formatted = ticks.map (t) -> vars.data.time.multiFormat(t)
      lengths = uniques formatted.map (f) -> f.length
      lengths.sort (a, b) -> b - a
      while lengths.length
        l = lengths.pop()
        t = formatted.filter (f) -> f.length >= l
        if t.length > 0 and t.length < vars.width.viz/40
          ticks = vars[axis].ticks.values.filter (t) ->
            vars.data.time.multiFormat(t).length >= l
          break
      vars[axis].ticks.visible = ticks
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
  if vars.y.scale.value is "log"
    yText = vars.y.ticks.visible.map (d) -> formatPower d
  else if vars.y.scale.value is "share"
    yText = vars.y.ticks.visible.map (d) -> d * 100 + "%"
  else
    yText = vars.y.ticks.visible.map (d) ->
      vars.format.value(d, vars.y.value, vars)

  yAxisWidth             = d3.max fontSizes(yText,yAttrs), (d) -> d.width
  yAxisWidth             = Math.round yAxisWidth + vars.labels.padding
  vars.axes.margin.left += yAxisWidth

  yLabel = vars.format.value(vars.y.value, undefined, vars)
  yLabelAttrs =
    "font-family": vars.y.label.font.family.value
    "font-weight": vars.y.label.font.weight
    "font-size":   vars.y.label.font.size+"px"
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
  xValues = vars.x.ticks.visible
  if vars.x.scale.value is "log"
    xText = xValues.map (d) -> formatPower d
  else if vars.x.scale.value is "share"
    xText = vars.x.ticks.visible.map (d) -> d * 100 + "%"
  else
    if typeof xValues[0] is "string"
      xValues = vars.x.scale.viz.domain().filter (d) ->
        d.indexOf("d3plus_buffer_") != 0
    xText = xValues.map (d) ->
      vars.format.value(d, vars.x.value, vars)

  xSizes      = fontSizes(xText,xAttrs)
  xAxisWidth  = d3.max xSizes, (d) -> d.width
  xAxisHeight = d3.max xSizes, (d) -> d.height

  if xValues.length is 1
    xMaxWidth = vars.axes.width
  else
    xMaxWidth   = vars.x.scale.viz(xValues[1]) - vars.x.scale.viz(xValues[0])
    xMaxWidth -= vars.labels.padding * 2

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
    xAxisWidth             += vars.labels.padding
    vars.x.ticks.rotate    = 0
  else if xAxisWidth < vars.axes.height/2
    xAxisWidth             = xAxisHeight
    xAxisHeight            = d3.max xSizes, (d) -> d.width
    vars.x.ticks.rotate    = -90
  else
    vars.x.ticks.hidden    = true
    vars.x.ticks.rotate    = 0
    xAxisWidth             = 0
    xAxisHeight            = 0

  xAxisHeight = Math.round xAxisHeight
  xAxisWidth  = Math.round xAxisWidth
  vars.axes.margin.bottom += xAxisHeight
  vars.axes.margin.bottom += vars.x.ticks.size
  lastTick = vars.x.ticks.values[vars.x.ticks.values.length - 1]
  rightLabel = vars.x.scale.viz lastTick
  rightPadding = vars.axes.width - rightLabel
  if rightPadding < xAxisWidth
    vars.axes.width -= (xAxisWidth/2 - rightPadding)

  xLabel = vars.format.value(vars.x.value, undefined, vars)
  xLabelAttrs =
    "font-family": vars.x.label.font.family.value
    "font-weight": vars.x.label.font.weight
    "font-size":   vars.x.label.font.size+"px"
  vars.x.label.height   = fontSizes([xLabel], xLabelAttrs)[0].height
  vars.x.ticks.maxWidth = xMaxWidth
  vars.x.ticks.maxHeight = xAxisHeight
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

      if vars[axis].ticks.visible.indexOf(d) >= 0
        if scale is "share"
          d * 100 + "%"
        else if d.constructor is Date
          vars.data.time.multiFormat(d)
        else if scale is "log"
          formatPower d
        else
          vars.format.value d, vars[axis].value, vars
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
