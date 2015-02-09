fetchValue = require "../../core/fetch/value.coffee"
graph      = require "./helpers/graph/draw.coffee"
nest       = require "./helpers/graph/nest.coffee"
stack      = require "./helpers/graph/stack.coffee"

# Line Plot
line = (vars) ->

  graph vars,
    buffer: vars.axes.opposite
    mouse:  true

  domains = vars.x.domain.viz.concat vars.y.domain.viz
  return [] if domains.indexOf(undefined) >= 0

  # data = nest vars
  data = vars.data.viz

  # Assign x and y to each data point
  for point in data
    for d in point.values
      d.d3plus.x  = vars.x.scale.viz fetchValue(vars, d, vars.x.value)
      d.d3plus.x += vars.axes.margin.left
      d.d3plus.y  = vars.y.scale.viz fetchValue(vars, d, vars.y.value)
      d.d3plus.y += vars.axes.margin.top

  if vars.axes.stacked then stack vars, data else data

# Visualization Settings and Helper Functions
line.filter = (vars, data) ->
  nest vars, data
line.requirements = ["data", "x", "y"]
line.setup        = (vars) ->

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
  return
line.shapes  = ["line"]
line.tooltip = "static"

module.exports = line
