fetchValue = require "../../core/fetch/value.coffee"
graph      = require "./helpers/graph/draw.coffee"
print      = require "../../core/console/print.coffee"
sort       = require "../../array/sort.coffee"
ticks      = require "./helpers/graph/dataTicks.coffee"

# Scatterplot
scatter = (vars) ->

  # Calculate X and Y domains, using "size" as a buffer
  graph vars,
    buffer: "size"
    mouse:  true

  domains = vars.x.domain.viz.concat vars.y.domain.viz
  return [] if domains.indexOf(undefined) >= 0

  # Assign x, y, and radius to each data point
  for d in vars.data.viz

    d.d3plus.x  = vars.x.scale.viz fetchValue(vars, d, vars.x.value)
    d.d3plus.x += vars.axes.margin.viz.left

    d.d3plus.y  = vars.y.scale.viz fetchValue(vars, d, vars.y.value)
    d.d3plus.y += vars.axes.margin.viz.top

    if typeof vars.size.value is "number" or !vars.size.value
      d.d3plus.r = vars.axes.scale 0
    else
      d.d3plus.r = vars.axes.scale fetchValue(vars, d, vars.size.value)

  # Create data ticks
  ticks vars

  # Return the data, sorted
  sort vars.data.viz, vars.order.value or vars.size.value or vars.id.value,
       if vars.order.sort.value is "desc" then "asc" else "desc",
       vars.color.value or [], vars

# Visualization Settings and Helper Functions
scatter.fill = true
scatter.requirements = ["data", "x", "y"]
scatter.scale = 1.1
scatter.setup = (vars) ->
  if vars.time.value and !vars.axes.discrete
    vars.self.x scale: "discrete" if vars.time.value is vars.x.value
    vars.self.y scale: "discrete" if vars.time.value is vars.y.value
scatter.shapes = ["circle", "square", "donut"]
scatter.tooltip = "static"

module.exports = scatter
