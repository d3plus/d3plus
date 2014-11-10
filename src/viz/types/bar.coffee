fetchValue = require "../../core/fetch/value.js"
graph      = require "./helpers/graph/draw.coffee"
nest       = require "./helpers/graph/nest.coffee"
stack      = require "./helpers/graph/stack.coffee"

# Line Plot
bar = (vars) ->

  discrete = vars.axes.discrete
  h        = if discrete is "x" then "height" else "width"
  w        = if discrete is "x" then "width" else "height"
  opposite = vars.axes.opposite
  cMargin  = if discrete is "x" then "left" else "top"
  oMargin  = if discrete is "x" then "top" else "left"

  data = vars.data.viz.filter (d) -> fetchValue vars, d, vars[opposite].value

  return [] unless data.length

  graph vars,
    buffer: true
    zero:   vars.axes.opposite

  nested = nest vars, data

  stack vars, nested if vars.axes.stacked

  space   = vars.axes[w] / vars[vars.axes.discrete].ticks.values.length

  # Fetches the discrete axis padding to use in between each group of bars.
  padding = vars[vars.axes.discrete].padding.value

  # Uses the padding as a percentage if it is less than 1.
  padding *= space if padding < 1

  # Resets the padding to 10% of the overall space if the specified padding does
  # not leave enough room for the bars.
  padding = space * 0.1 if padding * 2 > space

  maxSize = space - padding * 2

  unless vars.axes.stacked
    maxSize /= nested.length
    offset   = space/2 - maxSize/2 - padding

    x = d3.scale.linear()
      .domain [0, nested.length-1]
      .range [-offset, offset]

  for point, i in nested
    mod = if vars.axes.stacked then 0 else x(i)
    for d in point.values

      discreteVal = fetchValue(vars, d, vars[discrete].value)
      d.d3plus[discrete]  = vars[discrete].scale.viz discreteVal
      d.d3plus[discrete] += vars.axes.margin[cMargin] + mod

      if vars.axes.stacked
        base   = d.d3plus[opposite+"0"]
        value  = d.d3plus[opposite]
        length = base - value
      else
        base   = vars[opposite].scale.viz(0)
        oppVal = fetchValue(vars, d, vars[opposite].value)
        value  = vars[opposite].scale.viz oppVal
        length = base - value

      d.d3plus[opposite]  = base - length/2
      d.d3plus[opposite] += vars.axes.margin[oMargin] unless vars.axes.stacked

      d.d3plus[w]              = maxSize
      d.d3plus[h]              = Math.abs length
      d.d3plus.init            = {}

      d.d3plus.init[opposite]  = vars[opposite].scale.viz(0)
      d.d3plus.init[opposite] -= d.d3plus[opposite]
      d.d3plus.init[opposite] += vars.axes.margin[oMargin]

      d.d3plus.init[w]         = d.d3plus[w]

      d.d3plus.label = false

  data

# Visualization Settings and Helper Functions
bar.requirements = ["data", "x", "y"]
bar.setup        = (vars) ->
  unless vars.axes.discrete
    axis = if vars.time.value is vars.y.value then "y" else "x"
    vars.self[axis] scale: "discrete"
bar.shapes       = ["square"]

module.exports = bar
