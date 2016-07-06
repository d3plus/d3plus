fetchValue = require "../../core/fetch/value.coffee"
graph      = require "./helpers/graph/draw.coffee"
nest       = require "./helpers/graph/nest.coffee"
sort       = require "../../array/sort.coffee"
stack      = require "./helpers/graph/stack.coffee"

# Line Plot
line = (vars) ->

  graph vars,
    buffer: vars.axes.opposite
    mouse:  true

  domains = vars.x.domain.viz.concat vars.y.domain.viz
  return [] if domains.indexOf(undefined) >= 0

  # sort lines
  data = sort vars.data.viz, null, null, null, vars

  # Assign x and y to each data point
  for point in data
    for d in point.values

      xval = fetchValue(vars, d, vars.x.value)

      if xval isnt null
        d.d3plus.x2 = false
        d.d3plus.x  = vars.x.scale.viz xval
      else
        d.d3plus.x2 = true
        d.d3plus.x = vars.x2.scale.viz fetchValue(vars, d, vars.x2.value)
      d.d3plus.x += vars.axes.margin.viz.left

      yval = fetchValue(vars, d, vars.y.value)

      if yval isnt null
        d.d3plus.y2 = false
        d.d3plus.y  = vars.y.scale.viz yval
      else
        d.d3plus.y2 = true
        d.d3plus.y = vars.y2.scale.viz fetchValue(vars, d, vars.y2.value)
      d.d3plus.y += vars.axes.margin.viz.top

  if vars.axes.stacked then stack vars, data else data

# Visualization Settings and Helper Functions
line.filter = (vars, data) ->
  nest vars, data
line.requirements = ["data", "x", "y"]
line.setup        = (vars) ->

  unless vars.axes.discrete
    axis = if vars.time.value is vars.y.value then "y" else "x"
    vars.self[axis] scale: "discrete"

  return

line.shapes  = ["line"]
line.tooltip = "static"

module.exports = line
