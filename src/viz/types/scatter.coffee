fetchValue = require "../../core/fetch/value.js"
print      = require "../../core/console/print.coffee"
sort       = require "../../array/sort.coffee"

axes  = require "./helpers/graph/includes/axes.coffee"
draw  = require "./helpers/graph/includes/svg.coffee"
mouse = require "./helpers/graph/includes/mouse.coffee"
plot  = require "./helpers/graph/includes/plot.coffee"
ticks = require "./helpers/graph/includes/dataTicks.coffee"

# Scatterplot
scatter = (vars) ->

  # Calculate X and Y domains
  axes vars

  # Calculate node size
  minRadius = 2
  maxRadius = Math.floor d3.max [d3.min([vars.width.viz,vars.height.viz])/15, minRadius]

  if typeof vars.size.value is "number"
    maxRadius = vars.size.value if vars.size.value
  else if vars.size.value
    print.time "calculating size scale" if vars.dev.value
    sizeDomain = d3.extent vars.axes.dataset, (d) ->
      val = fetchValue vars, d, vars.size.value
      (if !val then 0 else val)
    minRadius = maxRadius if sizeDomain[0] is sizeDomain[1]
    radius = vars.size.scale.value
      .domain sizeDomain
      .rangeRound [minRadius,maxRadius]
    print.timeEnd "calculating size scale" if vars.dev.value

  # Calculate X and Y buffers
  for axis in ["x","y"]

    rangeMax = vars[axis].scale.viz.range()[1]

    domainHigh = vars[axis].scale.viz.invert -maxRadius * 2
    domainLow  = vars[axis].scale.viz.invert rangeMax + maxRadius * 2

    vars[axis].scale.viz.domain([domainHigh,domainLow])

  # Create X/Y Plot
  plot vars

  # Draw X/Y Plot
  draw vars

  # Assign x, y, and radius to each data point
  for d in vars.data.viz
    d.d3plus.x  = vars.x.scale.viz fetchValue(vars, d, vars.x.value)
    d.d3plus.x += vars.axes.margin.left

    d.d3plus.y  = vars.y.scale.viz fetchValue(vars, d, vars.y.value)
    d.d3plus.y += vars.axes.margin.top

    if typeof vars.size.value is "number" or !vars.size.value
      d.d3plus.r = maxRadius
    else
      d.d3plus.r = radius fetchValue(vars, d, vars.size.value)

  # Create data ticks
  ticks vars

  # Set mouse events
  vars.mouse = mouse

  # Return the data, sorted
  sort vars.data.viz, vars.order.value or vars.size.value or vars.id.value,
       if vars.order.sort.value is "desc" then "asc" else "desc",
       vars.color.value or [], vars

# Visualization Settings and Helper Functions
scatter.fill = true
scatter.requirements = ["data", "x", "y"]
scatter.scale = 1.1
scatter.setup = (vars) ->
  vars.self.x scale: "continuous" if vars.x.value is vars.time.value
  vars.self.y scale: "continuous" if vars.y.value is vars.time.value
scatter.shapes = ["circle", "square", "donut"]
scatter.tooltip = "static"

module.exports = scatter
