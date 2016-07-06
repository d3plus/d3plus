buckets    = require "../../util/buckets.coffee"
fetchValue = require "../../core/fetch/value.coffee"
graph      = require "./helpers/graph/draw.coffee"
nest       = require "./helpers/graph/nest.coffee"
stack      = require "./helpers/graph/stack.coffee"
uniques    = require "../../util/uniques.coffee"

# Line Plot
bar = (vars) ->

  discrete = vars.axes.discrete
  h        = if discrete is "x" then "height" else "width"
  w        = if discrete is "x" then "width" else "height"
  opposite = vars.axes.opposite
  cMargin  = if discrete is "x" then "left" else "top"
  oMargin  = if discrete is "x" then "top" else "left"

  graph vars,
    buffer: true
    zero:   opposite

  domains = vars.x.domain.viz.concat vars.y.domain.viz
  return [] if domains.indexOf(undefined) >= 0

  nested = vars.data.viz

  if vars.axes.stacked
    for point in nested
      stack vars, point.values

  space = vars.axes[w] / vars[vars.axes.discrete].ticks.values.length

  # Fetches the discrete axis padding to use in between each group of bars.
  padding = vars[vars.axes.discrete].padding.value

  # Uses the padding as a percentage if it is less than 1.
  padding *= space if padding < 1

  # Resets the padding to 10% of the overall space if the specified padding does
  # not leave enough room for the bars.
  padding = space * 0.1 if padding * 2 > space

  maxSize = space - padding * 2

  unless vars.axes.stacked

    if vars[discrete].persist.position.value

      if vars[discrete].value in vars.id.nesting
        divisions = d3.max nested, (b) -> b.values.length
      else
        divisions = uniques(nested, vars.id.value, fetchValue, vars).length

      maxSize /= divisions
      offset   = space/2 - maxSize/2 - padding

      x = d3.scale.ordinal()

      if divisions is 1
        x.domain([0]).range([0])
      else
        x
          .domain [0, divisions-1]
          .range [-offset, offset]

    else
      x = d3.scale.linear()

  data = []
  oppMethod = vars[opposite]
  oppDomain = oppMethod.scale.viz.domain().slice()
  oppDomain = oppDomain.reverse() if opposite.indexOf("y") is 0
  if oppDomain[0] <= 0 and oppDomain[1] >= 0
    zero = 0
  else if oppDomain[0] < 0
    zero d3.max oppDomain
  else
    zero = d3.min oppDomain

  if vars[discrete].persist.position.value and not vars.axes.stacked
    ids = uniques d3.merge(nested.map (d) -> d.values), vars.id.value, fetchValue, vars, vars.id.value, false
    x.domain(ids)
    if ids.length is 1
      x.range([0])
    else
      x.range(buckets(x.range(), ids.length))

  maxBars = d3.max nested, (b) -> b.values.length
  for p in nested

    if vars.axes.stacked
      bars = 1
      newSize = maxSize
    else if vars[discrete].persist.position.value
      bars = divisions
      newSize = maxSize

    else
      bars = p.values.length
      if vars[discrete].persist.size.value
        newSize = maxSize / maxBars
        offset  = space/2 - ((maxBars-bars)*(newSize/2)) - newSize/2 - padding
      else
        newSize = maxSize / bars
        offset  = space/2 - newSize/2 - padding
      x.domain [0, bars - 1]
      x.range [-offset, offset]

    for d, i in p.values

      if vars.axes.stacked
        mod = 0
      else if vars[discrete].persist.position.value
        mod = x fetchValue(vars, d, vars.id.value)
      else
        mod = x(i % bars)

      if vars.axes.stacked
        value  = d.d3plus[opposite]
        base   = d.d3plus[opposite+"0"]
      else
        oppVal = fetchValue(vars, d, oppMethod.value)
        if oppVal is null
          oppMethod = vars[opposite + "2"]
          oppVal = fetchValue(vars, d, oppMethod.value)
        continue if oppVal is 0
        if oppMethod.scale.value is "log"
          zero = if oppVal < 0 then -1 else 1
        value  = oppMethod.scale.viz oppVal
        base   = oppMethod.scale.viz zero

      discreteVal = fetchValue(vars, d, vars[discrete].value)
      d.d3plus[discrete]  = vars[discrete].scale.viz discreteVal
      d.d3plus[discrete] += vars.axes.margin.viz[cMargin] + mod

      length = base - value

      d.d3plus[opposite]  = base - length/2
      d.d3plus[opposite] += vars.axes.margin.viz[oMargin] unless vars.axes.stacked

      delete d.d3plus.r
      d.d3plus[w]     = newSize
      d.d3plus[h]     = Math.abs length
      d.d3plus.init   = {}

      d.d3plus.init[opposite]  = oppMethod.scale.viz zero
      d.d3plus.init[opposite] -= d.d3plus[opposite]
      d.d3plus.init[opposite] += vars.axes.margin.viz[oMargin]

      d.d3plus.init[w]         = d.d3plus[w]

      if vars.text.value
        delete d.d3plus.label
      else
        d.d3plus.label = false

      data.push d

  data

# Visualization Settings and Helper Functions
bar.filter = (vars, data) ->
  nest vars, data, vars[vars.axes.discrete].value
bar.requirements = ["data", "x", "y"]
bar.setup        = (vars) ->
  unless vars.axes.discrete
    axis = if vars.time.value is vars.y.value then "y" else "x"
    vars.self[axis] scale: "discrete"

  y    = vars[vars.axes.opposite]
  size = vars.size

  if (not y.value and size.value) or
     (size.changed and size.previous is y.value)
    vars.self[vars.axes.opposite] size.value
  else if (not size.value and y.value) or
          (y.changed and y.previous is size.value)
    vars.self.size y.value

bar.shapes       = ["square"]

module.exports = bar
