buffer    = require "./buffer.coffee"
fontSizes = require "../../../../../font/sizes.coffee"

module.exports = (vars, opts) ->

  # Reset margins
  vars.axes.margin = resetMargins vars

  # Set ticks, if not previously set
  for axis in ["x","y"]
    vars[axis].ticks.values = vars[axis].scale.viz.ticks() if vars[axis].ticks.values is false
    opp = if axis is "x" then "y" else "x"
    if opts.buffer and (opts.buffer isnt opp or vars[axis].ticks.values.length is 1) and axis is vars.axes.discrete and vars[axis].reset is true
      buffer vars, axis, opts.buffer
    vars[axis].reset = false

  # Calculate padding for tick labels
  labelPadding vars

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
    bottom: 45
    left:   40

labelPadding = (vars) ->

  # Calculate Y axis padding
  yAttrs =
    "font-size":   vars.y.ticks.font.size+"px"
    "font-family": vars.y.ticks.font.family.value
    "font-weight": vars.y.ticks.font.weight
  yText                  = vars.y.ticks.values.map (d) -> vars.format.value(d,vars.y.value, vars)
  yAxisWidth             = d3.max fontSizes(yText,yAttrs), (d) -> d.width
  yAxisWidth             = Math.round yAxisWidth + vars.labels.padding
  vars.axes.margin.left += yAxisWidth
  vars.axes.width        = vars.width.viz - vars.axes.margin.left - vars.axes.margin.right

  # Calculate X axis padding
  xAttrs =
    "font-size":   vars.x.ticks.font.size+"px"
    "font-family": vars.x.ticks.font.family.value
    "font-weight": vars.x.ticks.font.weight
  xText       = vars.x.ticks.values.map (d) -> vars.format.value(d,vars.x.value, vars)
  xSizes      = fontSizes(xText,xAttrs)
  xAxisWidth  = d3.max xSizes, (d) -> d.width
  xAxisHeight = d3.max xSizes, (d) -> d.height
  xMaxWidth   = d3.min([vars.axes.width/(xText.length+1),vars.axes.margin.left*2]) - vars.labels.padding*2

  if xAxisWidth < xMaxWidth
    xAxisWidth             += vars.labels.padding
    vars.x.ticks.rotate     = false
    vars.x.ticks.anchor     = "middle"
    vars.x.ticks.transform  = "translate(0,0)"
  else
    xAxisWidth             = xAxisHeight + vars.labels.padding
    xAxisHeight            = d3.max xSizes, (d) -> d.width
    vars.x.ticks.rotate    = true
    vars.x.ticks.anchor    = "start"
    vars.x.ticks.transform = "translate("+xAxisWidth+",15)rotate(90)"

  xAxisHeight              = Math.round xAxisHeight
  xAxisWidth               = Math.round xAxisWidth
  vars.axes.margin.bottom += xAxisHeight
  vars.axes.height         = vars.height.viz - vars.axes.margin.top - vars.axes.margin.bottom
  vars.axes.width         -= Math.round xAxisWidth/2

  vars.x.scale.viz.rangeRound [0,vars.axes.width]
  vars.y.scale.viz.rangeRound [0,vars.axes.height]

createAxis = (vars, axis) ->

  d3.svg.axis()
    .tickSize vars[axis].ticks.size
    .tickPadding 5
    .orient if axis is "x" then "bottom" else "left"
    .scale vars[axis].scale.viz
    .tickValues vars[axis].ticks.values
    .tickFormat (d, i) ->

      scale      = vars[axis].scale.value
      hiddenTime = vars[axis].value is vars.time.value and d % 1 isnt 0
      majorLog   = scale is "log" and d.toString().charAt(0) is "1"

      if !hiddenTime and (majorLog or scale isnt "log")
        if scale is "share"
          d * 100 + "%"
        else if d.constructor is Date
          vars.data.time.multiFormat(d)
        else
          vars.format.value(d, vars[axis].value, vars)
      else
        null
