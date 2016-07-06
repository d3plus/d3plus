buckets    = require "../../../../../util/buckets.coffee"
buffer     = require "./buffer.coffee"
fetchValue = require "../../../../../core/fetch/value.coffee"
fontSizes  = require "../../../../../font/sizes.coffee"
textwrap   = require "../../../../../textwrap/textwrap.coffee"
timeDetect = require "../../../../../core/data/time.coffee"
uniques    = require "../../../../../util/uniques.coffee"

module.exports = (vars, opts) ->

  # Reset margins
  vars.axes.margin.viz =
    top:    vars.axes.margin.top
    right:  vars.axes.margin.right
    bottom: vars.axes.margin.bottom
    left:   vars.axes.margin.left
  vars.axes.height = vars.height.viz
  vars.axes.width  = vars.width.viz
  axes = if vars.width.viz > vars.height.viz then ["y", "y2", "x", "x2"] else ["x", "x2", "y", "y2"]

  # Set ticks, if not previously set
  for axis in axes

    if vars[axis].value

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
          if axis.indexOf("2") is 1
            otherScale = vars[axis.slice(0,1)].scale.viz
            scale = vars[axis].scale.viz
            ticks = vars[axis.slice(0,1)].scale.ticks
            vars[axis].ticks.values = otherScale.ticks(ticks).map (t) ->
              parseFloat(d3.format(".5f")(scale.invert(otherScale(t))))
          else
            vars[axis].ticks.values = vars[axis].scale.viz.ticks(vars[axis].scale.ticks)

      unless vars[axis].ticks.values.length
        values = fetchValue vars, vars.data.viz, vars[axis].value
        values = [values] unless values instanceof Array
        vars[axis].ticks.values = values

      opp = if axis.indexOf("x") is 0 then "y" else "x"
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
          "text-transform": vars[axis].ticks.font.transform.value
          "letter-spacing": vars[axis].ticks.font.spacing + "px"

        timeReturn = timeDetect vars,
          values: vars[axis].ticks.values
          limit:  vars.width.viz
          style:  axisStyle

        if vars[axis].ticks.value
          vars[axis].ticks.visible = vars[axis].ticks.value.map Number
        else if vars[axis].ticks.labels.value.constructor is Array
          vars[axis].ticks.visible = vars[axis].ticks.labels.value.map Number
        else
          vars[axis].ticks.visible = timeReturn.values.map Number
        vars[axis].ticks.format  = timeReturn.format

      else if vars[axis].ticks.value
        vars[axis].ticks.values = vars[axis].ticks.value
        if vars[axis].ticks.labels.value.constructor is Array
          vars[axis].ticks.visible = vars[axis].ticks.labels.value
        else
          vars[axis].ticks.visible = vars[axis].ticks.value

      else if vars[axis].ticks.labels.value.constructor is Array
        vars[axis].ticks.visible = vars[axis].ticks.labels.value

      else if vars[axis].scale.value is "log"
        ticks = vars[axis].ticks.values
        tens = ticks.filter (t) -> Math.abs(t).toString().charAt(0) is "1"
        if tens.length < 3
          vars[axis].ticks.visible = ticks
        else
          vars[axis].ticks.visible = tens
      else
        vars[axis].ticks.visible = vars[axis].ticks.values

      if vars[axis].value is vars.time.value
        vars[axis].ticks.visible = vars[axis].ticks.visible.map (d) ->
          return d if d.constructor is Number and ("" + d).length > 4
          d += ""
          d += "/01/01" if d.length is 4 and parseInt(d)+"" is d
          new Date(d).getTime()

  # Calculate padding for tick labels
  if vars.small
    vars.axes.width -= (vars.axes.margin.viz.left + vars.axes.margin.viz.right)
    vars.axes.height -= (vars.axes.margin.viz.top + vars.axes.margin.viz.bottom)
    for axis in axes
      vars[axis].label.height = 0
  else
    labelPadding vars unless vars.small

  # Create SVG Axes
  for axis in axes
    vars[axis].axis.svg = createAxis(vars, axis)

  return

labelPadding = (vars) ->

  xDomain = vars.x.scale.viz.domain()
  yDomain = vars.y.scale.viz.domain()
  x2Domain = vars.x2.scale.viz.domain() if vars.x2.value
  y2Domain = vars.y2.scale.viz.domain() if vars.y2.value

  for axis in ["y", "y2"]

    if vars[axis].value

      # Calculate Y axis paddings
      margin = if axis is "y" then "left" else "right"
      yAttrs =
        "font-size":   vars[axis].ticks.font.size+"px"
        "font-family": vars[axis].ticks.font.family.value
        "font-weight": vars[axis].ticks.font.weight
        "text-transform": vars[axis].ticks.font.transform.value
        "letter-spacing": vars[axis].ticks.font.spacing + "px"
      yValues = vars[axis].ticks.visible
      if vars[axis].scale.value is "log"
        yText = yValues.map (d) -> formatPower d
      else if vars[axis].scale.value is "share"
        yText = yValues.map (d) -> vars.format.value d * 100,
          key: "share"
          vars: vars
          output: axis
      else if vars[axis].value is vars.time.value
        yText = yValues.map (d, i) ->
          vars[axis].ticks.format new Date(d)
      else
        if typeof yValues[0] is "string"
          yValues = vars[axis].scale.viz.domain().filter (d) ->
            d.indexOf("d3plus_buffer_") isnt 0
        yText = yValues.map (d) ->
          vars.format.value d,
            key:    vars[axis].value
            vars:   vars
            labels: vars[axis].affixes.value
            output: axis

      if vars[axis].ticks.labels.value
        vars[axis].ticks.hidden    = false
        yAxisWidth             = d3.max fontSizes(yText,yAttrs), (d) -> d.width
        if yAxisWidth
          yAxisWidth             = Math.ceil yAxisWidth + vars.labels.padding
          vars.axes.margin.viz[margin] += yAxisWidth

      else
        vars[axis].ticks.hidden = true

      yLabel = vars[axis].label.fetch vars
      if yLabel
        yLabelAttrs =
          "font-family": vars[axis].label.font.family.value
          "font-weight": vars[axis].label.font.weight
          "font-size":   vars[axis].label.font.size+"px"
          "text-transform": vars[axis].label.font.transform.value
          "letter-spacing": vars[axis].label.font.spacing + "px"
        vars[axis].label.height = fontSizes([yLabel], yLabelAttrs)[0].height
      else
        vars[axis].label.height = 0
      if vars[axis].label.value
        vars.axes.margin.viz[margin] += vars[axis].label.height
        vars.axes.margin.viz[margin] += vars[axis].label.padding * 2

  vars.axes.width -= (vars.axes.margin.viz.left + vars.axes.margin.viz.right)
  vars.x.scale.viz.range buckets([0, vars.axes.width], xDomain.length)
  vars.x2.scale.viz.range buckets([0, vars.axes.width], x2Domain.length) if x2Domain

  for axis in ["x", "x2"]

    if vars[axis].value
      margin = if axis is "x" then "bottom" else "top"

      # Calculate X axis paddings
      if vars[axis].ticks.labels.value
        vars[axis].ticks.hidden = false
        xAttrs =
          "font-size":   vars[axis].ticks.font.size+"px"
          "font-family": vars[axis].ticks.font.family.value
          "font-weight": vars[axis].ticks.font.weight
          "text-transform": vars[axis].ticks.font.transform.value
          "letter-spacing": vars[axis].ticks.font.spacing + "px"
        xValues = vars[axis].ticks.visible
        if vars[axis].scale.value is "log"
          xText = xValues.map (d) -> formatPower d
        else if vars[axis].scale.value is "share"
          xText = xValues.map (d) -> vars.format.value d * 100,
            key: "share"
            vars: vars
            output: axis
        else if vars[axis].value is vars.time.value
          xText = xValues.map (d, i) ->
            vars[axis].ticks.format new Date(d)
        else
          if typeof xValues[0] is "string"
            xValues = vars[axis].scale.viz.domain().filter (d) ->
              d.indexOf("d3plus_buffer_") isnt 0
          xText = xValues.map (d) ->
            vars.format.value d,
              key:    vars[axis].value
              vars:   vars
              labels: vars[axis].affixes.value
              output: axis

        xSizes      = fontSizes(xText,xAttrs)
        xAxisWidth  = d3.max xSizes, (d) -> d.width
        xAxisHeight = d3.max xSizes, (d) -> d.height

        if xValues.length is 1
          xMaxWidth = vars.axes.width
        else
          xMaxWidth  = vars[axis].scale.viz(xValues[1]) - vars[axis].scale.viz(xValues[0])
          xMaxWidth  = Math.abs xMaxWidth

        if xAxisWidth > xMaxWidth and xText.join("").indexOf(" ") > 0
          vars[axis].ticks.wrap = true
          xSizes = fontSizes xText, xAttrs,
            mod: (elem) ->
              textwrap().container d3.select(elem)
                .height(vars.axes.height/2)
                .width(xMaxWidth).draw()
          xAxisWidth  = d3.max xSizes, (d) -> d.width
          xAxisHeight = d3.max xSizes, (d) -> d.height
        else
          vars[axis].ticks.wrap = false

        vars[axis].ticks.baseline = "auto"

        if xAxisWidth <= xMaxWidth
          vars[axis].ticks.rotate = 0
        else if xAxisWidth < vars.axes.height/2
          xSizes = fontSizes xText, xAttrs,
            mod: (elem) ->
              textwrap().container d3.select(elem)
                .width(vars.axes.height/2)
                .height(xMaxWidth).draw()
          xAxisHeight         = d3.max xSizes, (d) -> d.width
          xAxisWidth          = d3.max xSizes, (d) -> d.height
          vars[axis].ticks.rotate = -90
        else
          xAxisWidth  = 0
          xAxisHeight = 0

        unless xAxisWidth and xAxisHeight
          vars[axis].ticks.hidden = true
          vars[axis].ticks.rotate = 0

        xAxisWidth  = Math.ceil xAxisWidth
        xAxisHeight = Math.ceil xAxisHeight
        vars[axis].ticks.maxHeight = xAxisHeight
        vars[axis].ticks.maxWidth = xAxisWidth
        if xAxisHeight
          vars.axes.margin.viz[margin] += xAxisHeight + vars.labels.padding
        lastTick = vars[axis].ticks.visible[vars[axis].ticks.visible.length - 1]
        rightLabel = vars[axis].scale.viz lastTick
        rightLabel += xAxisWidth/2 + vars.axes.margin.viz.left
        if rightLabel > vars.width.value
          rightMod = rightLabel - vars.width.value + vars.axes.margin.viz.right
          vars.axes.width -= rightMod
          vars.axes.margin.viz.right += rightMod
      else
        vars[axis].ticks.hidden = true

      xLabel = vars[axis].label.fetch vars
      if xLabel
        xLabelAttrs =
          "font-family": vars[axis].label.font.family.value
          "font-weight": vars[axis].label.font.weight
          "font-size":   vars[axis].label.font.size+"px"
          "text-transform": vars[axis].label.font.transform.value
          "letter-spacing": vars[axis].label.font.spacing + "px"
        vars[axis].label.height = fontSizes([xLabel], xLabelAttrs)[0].height
      else
        vars[axis].label.height = 0
      if vars[axis].label.value
        vars.axes.margin.viz[margin] += vars[axis].label.height
        vars.axes.margin.viz[margin] += vars[axis].label.padding * 2

  vars.axes.height -= (vars.axes.margin.viz.top + vars.axes.margin.viz.bottom)

  vars.x.scale.viz.range buckets([0, vars.axes.width], xDomain.length)
  vars.x2.scale.viz.range buckets([0, vars.axes.width], x2Domain.length) if x2Domain
  vars.y.scale.viz.range buckets([0, vars.axes.height], yDomain.length)
  vars.y2.scale.viz.range buckets([0, vars.axes.height], y2Domain.length) if y2Domain

createAxis = (vars, axis) ->

  d3.svg.axis()
    .tickSize vars[axis].ticks.size
    .tickPadding 5
    .orient vars[axis].orient.value
    .scale vars[axis].scale.viz
    .tickValues vars[axis].ticks.values
    .tickFormat (d, i) ->

      return null if vars[axis].ticks.hidden
      scale = vars[axis].scale.value
      c = if d.constructor is Date then +d else d

      if vars[axis].ticks.visible.indexOf(c) >= 0
        if scale is "share"
          vars.format.value d * 100,
            key: "share", vars: vars, labels: vars[axis].affixes.value, output: axis
        else if d.constructor is Date
          vars[axis].ticks.format d
        else if scale is "log"
          formatPower d
        else
          vars.format.value d,
            key: vars[axis].value, vars: vars, labels: vars[axis].affixes.value, output: axis
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
