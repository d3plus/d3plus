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
    zero:   vars.axes.opposite

  domains = vars.x.domain.viz.concat vars.y.domain.viz
  return [] if domains.indexOf(undefined) >= 0

  nested = vars.data.viz

  stack vars, nested if vars.axes.stacked

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

    if vars[discrete].value in vars.id.nesting
      bars = d3.nest()
        .key (d) ->
          fetchValue vars, d, vars[discrete].value
        .entries nested
      divisions = d3.max bars, (b) -> b.values.length
    else
      bars = uniques nested, vars.id.value, fetchValue, vars
      divisions = bars.length
    maxSize /= divisions
    offset   = space/2 - maxSize/2 - padding

    x = d3.scale.linear()
      .domain [0, divisions-1]
      .range [-offset, offset]

  data = []
  zero = 0

  for point, i in nested
    mod = if vars.axes.stacked then 0 else x(i % divisions)
    for d in point.values

      if vars.axes.stacked
        value  = d.d3plus[opposite]
        base   = d.d3plus[opposite+"0"]
      else
        oppVal = fetchValue(vars, d, vars[opposite].value)
        continue if oppVal is 0
        if vars[opposite].scale.value is "log"
          zero = if oppVal < 0 then -1 else 1
        value  = vars[opposite].scale.viz oppVal
        base   = vars[opposite].scale.viz zero

      discreteVal = fetchValue(vars, d, vars[discrete].value)
      d.d3plus[discrete]  = vars[discrete].scale.viz discreteVal
      d.d3plus[discrete] += vars.axes.margin[cMargin] + mod

      length = base - value

      d.d3plus[opposite]  = base - length/2
      d.d3plus[opposite] += vars.axes.margin[oMargin] unless vars.axes.stacked

      d.d3plus[w]     = maxSize
      d.d3plus[h]     = Math.abs length
      d.d3plus.init   = {}

      d.d3plus.init[opposite]  = vars[opposite].scale.viz zero
      d.d3plus.init[opposite] -= d.d3plus[opposite]
      d.d3plus.init[opposite] += vars.axes.margin[oMargin]

      d.d3plus.init[w]         = d.d3plus[w]

      d.d3plus.label = false

      data.push d

  data

# Visualization Settings and Helper Functions
bar.filter = (vars, data) ->
  nest vars, data
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
